#!/usr/bin/env node
// Final assembly, per output format:
//   1. lint the captions pass (HyperFrames)            4. render the captions pass → picture only
//   2. mix audio if stale (tools/mix.mjs)              5. mux picture + master, append intro/outro
//   3. loudness-master the mix once (two-pass, -14 LUFS, shared by every format)
// Writes output/final-<fmt>.mp4 and output/credits.md (sources block is mandatory when news is shown).
// Usage: node tools/finalize.mjs <project> [--format 9:16] [--skip-check] [--lufs -14]
//        [--quality draft|looks|delivery] [--no-outro]
// Intro/outro: only when the project has them (npm run new … --intro clip --outro clip, i.e. when the
// user asks for this client's/channel's bumpers). Appended after the mix so music never spills across them.
import { existsSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  HYPERFRAMES_VERSION,
  ROOT,
  die,
  markStage,
  npx,
  openProject,
  parseCli,
  probe,
  readJson,
  run,
  selectFormats,
  ts,
  writeText,
} from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths, data } = project;
const fmts = selectFormats(project, flags.format);
// noCaptions (npm run new … --no-captions): the Remotion picture is final — no HyperFrames pass.
const captionsOn = !data.noCaptions;
for (const f of fmts) {
  if (captionsOn && !existsSync(f.index)) die(`${f.index} missing — run scaffold first`);
  if (!captionsOn && !existsSync(f.visuals)) die(`${f.visuals} missing — run npm run visuals first`);
}
const D = data.cleancut.duration;

// 1. lint before spending minutes on a render
if (captionsOn && !flags["skip-check"]) {
  let failed = false;
  for (const f of fmts) {
    const lint = npx(["--yes", `hyperframes@${HYPERFRAMES_VERSION}`, "lint", ".", "--json"], { cwd: f.edit, allowFail: true });
    const result = safeJson(lint.stdout);
    if (result?.errorCount > 0) {
      failed = true;
      for (const x of result.findings.filter((x) => x.severity === "error")) console.error(`  [${f.aspect}] ✗ ${x.code}: ${x.message}`);
    } else console.log(`[${f.aspect}] lint ok (${result?.warningCount ?? "?"} warnings)`);
  }
  if (failed) die("lint errors — fix them (or pass --skip-check to force)");
}

// 2. mix if missing or older than its inputs
const mtime = (f) => (existsSync(f) ? statSync(f).mtimeMs : 0);
if (!existsSync(paths.mix) || Math.max(mtime(paths.audioPlan), mtime(paths.cleancut)) > mtime(paths.mix)) {
  console.log("mixing audio…");
  run(process.execPath, [join(ROOT, "tools", "mix.mjs"), data.name], { inherit: true });
}

// 3. two-pass loudness master (YouTube + Instagram normalise to about -14 LUFS; -1 dBTP for AAC)
const lufs = Number(flags.lufs || -14);
const master = join(paths.work, "master.wav");
const target = `I=${lufs}:TP=-1.0:LRA=11`;
const pass1 = run("ffmpeg", ["-hide_banner", "-nostats", "-i", paths.mix, "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"]);
const m = JSON.parse(pass1.stderr.match(/\{[^{}]*"input_i"[^{}]*\}/)[0]);
run("ffmpeg", [
  "-y", "-v", "error", "-i", paths.mix,
  "-af", `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`,
  "-ar", "48000", "-c:a", "pcm_s16le", master,
]);
console.log(`master: ${m.input_i} LUFS → ${lufs} LUFS`);

// 4-5. per format
for (const f of fmts) {
  const picture = captionsOn ? join(paths.work, `captioned-${f.key}.mp4`) : f.visuals;
  if (captionsOn) {
    console.log(`\n[${f.aspect}] rendering captions pass ${f.width}x${f.height}…`);
    npx(
      // 2 Chrome workers: the edit laptop has 16 GB and no GPU, and HyperFrames' own low-memory mode only
      // auto-enables at ≤8 GB (a Remotion render with 6 tabs was killed for low memory). HYPERFRAMES_WORKERS overrides.
      ["--yes", `hyperframes@${HYPERFRAMES_VERSION}`, "render", "-o", picture, "--fps", String(f.fps), "--workers", process.env.HYPERFRAMES_WORKERS || "2", ...(flags.quality ? ["--quality", flags.quality] : [])],
      { cwd: f.edit, inherit: true },
    );
  } else console.log(`\n[${f.aspect}] no captions — the Remotion picture is final`);
  const body = join(paths.work, `body-${f.key}.mp4`);
  run("ffmpeg", [
    "-y", "-v", "error", "-i", picture, "-i", master,
    "-map", "0:v:0", "-map", "1:a:0", "-t", D.toFixed(3),
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", body,
  ]);
  if (captionsOn) rmSync(picture, { force: true });

  const intro = !flags["no-outro"] && data.intro && existsSync(data.intro) ? data.intro : null;
  const outro = !flags["no-outro"] && data.outro && existsSync(data.outro) ? data.outro : null;
  if (intro || outro) {
    // Re-encode (never stream-copy): brand clips are often 44.1 kHz / other sizes, and a concat-copy
    // across a sample-rate change drifts progressively instead of erroring.
    // introAt (project.json, clean-cut seconds): splice the intro in mid-body (e.g. after the hook) —
    // the body is fed twice and trimmed either side of the splice point.
    const at = intro && data.introAt > 0 && data.introAt < D ? data.introAt : 0;
    const parts = at
      ? [{ file: body, to: at }, { file: intro }, { file: body, from: at }, { file: outro }]
      : [{ file: intro }, { file: body }, { file: outro }];
    const clips = parts.filter((p) => p.file);
    const norm = `scale=${f.width}:${f.height}:force_original_aspect_ratio=decrease,pad=${f.width}:${f.height}:(ow-iw)/2:(oh-ih)/2,fps=${f.fps},format=yuv420p,setsar=1`;
    const cut = (p, a) => (p.to ? `${a}trim=end=${p.to},` : p.from ? `${a}trim=start=${p.from},` : "") + (p.to || p.from ? `${a ? "a" : ""}setpts=PTS-STARTPTS,` : "");
    const fc =
      clips.map((p, i) => `[${i}:v]${cut(p, "")}${norm}[v${i}];[${i}:a]${cut(p, "a")}aresample=48000,aformat=channel_layouts=stereo[a${i}]`).join(";") +
      `;${clips.map((_, i) => `[v${i}][a${i}]`).join("")}concat=n=${clips.length}:v=1:a=1[v][a]`;
    run("ffmpeg", [
      "-y", "-v", "error", ...clips.flatMap((p) => ["-i", p.file]), "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
      "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", f.final,
    ]);
    rmSync(body, { force: true });
    console.log(`[${f.aspect}] added ${[intro && (at ? `intro at ${ts(at)}` : "intro"), outro && "outro"].filter(Boolean).join(" + ")}`);
  } else {
    rmSync(f.final, { force: true });
    run("ffmpeg", ["-y", "-v", "error", "-i", body, "-c", "copy", f.final]);
    rmSync(body, { force: true });
  }
  const info = probe(f.final);
  markStage(project, "finalize", { file: f.final, duration: info.duration }, f.key);
  console.log(`[${f.aspect}] FINAL: ${f.final}  (${info.width}x${info.height}, ${ts(info.duration)})`);
}

// 6. credits — scoped to what THIS edit uses (the template once credited cached articles it never showed)
const plan = existsSync(paths.visualPlan) ? readJson(paths.visualPlan) : {};
const audio = existsSync(paths.audioPlan) ? readJson(paths.audioPlan) : {};
const used = new Set([
  ...(plan.brolls || []).map((b) => b.src),
  ...(plan.scenes || []).flatMap((s) => [s.src, s.src_portrait]),
  ...(audio.music_cues || []).map((c) => c.file),
]);
const credits = existsSync(paths.credits) ? readJson(paths.credits).filter((c) => used.has(c.file) || c.kind === "sfx") : [];
const news = (plan.scenes || []).filter((s) => s.kind === "news" && s.url);
const lines = [];
if (news.length) {
  lines.push("SOURCES", ...[...new Map(news.map((s) => [s.url, s])).values()].map((s) => `- ${s.source}${s.date ? `, ${s.date}` : ""}: "${s.headline || ""}" ${s.url}`), "");
}
const attrib = credits.filter((c) => c.attribution);
if (attrib.length) lines.push("MUSIC (attribution required — keep in the description)", ...attrib.map((c) => `- ${c.attribution}`), "");
const courtesy = credits.filter((c) => !c.attribution);
if (courtesy.length) lines.push("Stock footage, photos & sound", ...courtesy.map((c) => `- ${c.kind}: ${c.title ? `"${c.title}" ` : ""}by ${c.creator} (${c.source}, ${c.license}) ${c.url || ""}`.trim()), "");
writeText(join(paths.output, "credits.md"), lines.length ? lines.join("\n") : "No third-party assets.\n");
console.log(`\ncredits → ${join(paths.output, "credits.md")}${news.length || attrib.length ? "  (REQUIRED in the YouTube description / Instagram caption)" : ""}`);
console.log(`next: node tools/verify.mjs ${data.name}`);

function safeJson(text) {
  try {
    return JSON.parse(text.slice(text.indexOf("{")));
  } catch {
    return null;
  }
}
