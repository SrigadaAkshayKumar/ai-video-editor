#!/usr/bin/env node
// Structural verification of the finished videos (the template's "verify, don't skip" list):
//   - duration matches the cut (+ intro/outro), exactly one audio stream, integrated loudness
//   - a frame at EVERY cut boundary (caption splices across a cut are a content bug no linter sees)
//     plus frames at the planned beats → contact sheet per format to Read
//   - frozen-frame scan (5 fps hashes): a run inside a b-roll window means the clip ran out;
//     runs inside graphic/still scenes are expected
// Usage: node tools/verify.mjs <project> [--format 9:16] [--no-frames]
// It cannot hear the mix: always ask the user to listen (bed level, ducking, transitions, joins).
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { die, openProject, parseCli, probe, readJson, run, selectFormats, ts } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths, data } = project;
const D = data.cleancut?.duration ?? 0;
const timeline = existsSync(join(paths.work, "timeline.json")) ? readJson(join(paths.work, "timeline.json")) : [];
const plan = existsSync(paths.visualPlan) ? readJson(paths.visualPlan) : {};
let problems = 0;
// An intro is spliced in by finalize (at introAt, else before frame 0): clean-cut times after the
// splice sit this much later in the final file.
const OFF = data.intro && existsSync(data.intro) ? probe(data.intro).duration : 0;
const AT = OFF && data.introAt > 0 ? data.introAt : 0;
const toFinal = (t) => (t < AT ? t : t + OFF);
const toClean = (tf) => (tf < AT ? tf : tf < AT + OFF ? -1 : tf - OFF); // -1 = inside the intro

for (const f of selectFormats(project, flags.format)) {
  if (!existsSync(f.final)) die(`${f.final} missing — run finalize first`);
  console.log(`\n[${f.aspect}] ${f.final}`);
  const info = probe(f.final);
  const streams = run("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", f.final]).stdout.trim().split(/\s+/).filter(Boolean);
  const okDur = info.duration + 0.1 >= D;
  console.log(`  size ${info.width}x${info.height} ${okDur ? "ok" : "MISMATCH"} · duration ${ts(info.duration)} (cut ${ts(D)}) · audio streams ${streams.length}`);
  if (info.width !== f.width || info.height !== f.height || !okDur || streams.length !== 1) problems++;
  const lufs = run("ffmpeg", ["-hide_banner", "-nostats", "-i", f.final, "-af", "ebur128", "-f", "null", "-"]).stderr.match(/I:\s+(-?[\d.]+) LUFS/g);
  if (lufs) console.log(`  loudness ${lufs.at(-1).replace(/\s+/g, " ")}`);

  // frozen frames
  const hashes = run("ffmpeg", ["-v", "error", "-i", f.final, "-vf", "fps=5,scale=192:-2", "-f", "framemd5", "-"]).stdout
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.split(",").at(-1).trim());
  const runs = [];
  let startIdx = 0;
  for (let i = 1; i <= hashes.length; i++) {
    if (i < hashes.length && hashes[i] === hashes[i - 1]) continue;
    if (i - startIdx >= 4) runs.push({ start: startIdx / 5, end: i / 5 });
    startIdx = i;
  }
  const inBroll = (tf) => {
    const t = toClean(tf);
    return (
    (plan.brolls || []).some((b) => t >= b.start && t <= b.start + b.duration) ||
    (plan.scenes || []).some((s) => s.kind === "broll" && t >= s.start && t <= s.end));
  };
  const bad = runs.filter((r) => inBroll(r.start + 0.3));
  console.log(`  frozen runs ≥0.8s: ${runs.length} (${bad.length} inside b-roll${bad.length ? ": " + bad.map((r) => `${ts(r.start)}-${ts(r.end)}`).join(", ") : ""})`);
  if (bad.length) problems++;

  if (flags["no-frames"]) continue;
  // frames: every cut boundary (just after the join) + planned beats
  const dir = join(paths.work, `verify-${f.key}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const times = [
    ...timeline.slice(1).map((s) => s.start + 0.25),
    ...(plan.overlays || []).map((o) => o.start + Math.min(1.5, o.duration / 2)),
    ...(plan.brolls || []).map((b) => b.start + b.duration / 2),
  ]
    .map(toFinal)
    .concat(AT ? [AT - 0.3, AT + 0.5, AT + OFF + 0.3] : []) // both sides of the intro splice
    .filter((t) => t < info.duration)
    .sort((a, b) => a - b)
    .filter((t, i, a) => !i || t - a[i - 1] > 0.6)
    .slice(0, 48);
  times.forEach((t, i) =>
    run("ffmpeg", ["-y", "-v", "error", "-ss", t.toFixed(2), "-i", f.final, "-frames:v", "1", "-vf", `scale=${f.portrait ? 360 : 480}:-2,drawtext=text='${ts(t).replace(":", "\\:")}':x=8:y=8:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6`, join(dir, `f${String(i).padStart(3, "0")}.jpg`)]),
  );
  const cols = f.portrait ? 8 : 6;
  run("ffmpeg", ["-y", "-v", "error", "-framerate", "1", "-i", join(dir, "f%03d.jpg"), "-vf", `tile=${cols}x${Math.ceil(times.length / cols)}:padding=4`, "-frames:v", "1", join(dir, "sheet.jpg")]);
  console.log(`  ${times.length} frames (${timeline.length - 1} cut boundaries) → ${join(dir, "sheet.jpg")}  ← Read it: captions at each join must be real fragments, nothing collides`);
}
console.log(problems ? `\n${problems} structural problem(s) — see above` : "\nstructure ok. You cannot hear it: ask the user to listen to the mix and the joins.");
