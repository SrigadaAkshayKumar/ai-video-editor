// Shared helpers for the pipeline tools. Zero runtime deps: Node >= 22 only.
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  createWriteStream,
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const PROJECTS = join(ROOT, "projects");
export const REMOTION_DIR = join(ROOT, "remotion");
export const HYPERFRAMES_VERSION = "0.8.120";

// winget installs ffmpeg/ffprobe as links that only shells opened AFTER the install can see.
// Make them reachable for every tool (and every child process) regardless of when the shell started.
if (process.platform === "win32") {
  const links = join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Links");
  const key = Object.keys(process.env).find((k) => k.toLowerCase() === "path") || "Path";
  if (existsSync(join(links, "ffmpeg.exe")) && !(process.env[key] || "").toLowerCase().includes(links.toLowerCase()))
    process.env[key] = `${process.env[key]};${links}`;
}

let envLoaded = false;
export function loadEnv() {
  if (envLoaded) return;
  envLoaded = true;
  const file = join(ROOT, ".env");
  if (existsSync(file)) process.loadEnvFile(file);
}

export function requireEnv(name, hint) {
  loadEnv();
  const value = process.env[name];
  if (!value) die(`${name} is not set. Add it to ${join(ROOT, ".env")} (see .env.example).${hint ? " " + hint : ""}`);
  return value;
}

export function die(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

/** Resolve a project by name or path; returns { dir, file, data, save(), paths }. */
export function openProject(nameOrPath) {
  if (!nameOrPath) die("project name is required (folder under projects/)");
  const dir = existsSync(join(PROJECTS, nameOrPath)) ? join(PROJECTS, nameOrPath) : resolve(nameOrPath);
  const file = join(dir, "project.json");
  if (!existsSync(file)) die(`no project.json in ${dir}. Create one with: npm run new -- <raw-video>`);
  const data = readJson(file);
  if (!data.formats) die(`${file} predates multi-format projects — recreate it with npm run new`);
  return {
    dir,
    file,
    data,
    save() {
      writeJson(file, data);
    },
    paths: projectPaths(dir, data.mode),
  };
}

/** mode: "talking" (a-roll video) | "faceless" (voiceover; picture is a scene track). */
export function projectPaths(dir, mode = "talking") {
  return {
    source: join(dir, "source"),
    work: join(dir, "work"),
    output: join(dir, "output"),
    // Fetched media shared by every format: broll/, stills/, news/, music/, sfx/
    assets: join(dir, "assets"),
    // Hard links to exactly the media a Remotion render needs (its --public-dir).
    render: join(dir, "render"),
    direction: join(dir, "work", "direction.json"),
    visualPlan: join(dir, "work", "visual-plan.json"),
    audioPlan: join(dir, "work", "audio-plan.json"),
    credits: join(dir, "work", "credits.json"),
    news: join(dir, "work", "news.json"),
    mix: join(dir, "work", "mix.wav"),
    levels: join(dir, "work", "levels.json"),
    audio: join(dir, "work", "audio.m4a"),
    transcriptRaw: join(dir, "work", "transcript.raw.json"),
    words: join(dir, "work", "words.json"),
    transcriptMd: join(dir, "work", "transcript.md"),
    silences: join(dir, "work", "silences.json"),
    edl: join(dir, "work", "edl.json"),
    cutReport: join(dir, "work", "cut-report.md"),
    // The clean cut is shared by every output format. Talking head: video; faceless: the cut VO.
    cleancut: join(dir, "work", mode === "faceless" ? "cleancut.wav" : "cleancut.mp4"),
    cleanWords: join(dir, "work", "cleancut.words.json"),
    cleanTranscriptMd: join(dir, "work", "cleancut.transcript.md"),
  };
}

// ---- output formats ------------------------------------------------------------
// One project renders to several aspect ratios (YouTube 16:9 + Instagram 9:16 by default).
// Each format has its own HyperFrames edit: projects/<p>/edit-16x9/, edit-9x16/, …
export const DEFAULT_FORMATS = ["16:9", "9:16"];

export const formatKey = (aspect) => aspect.replace(":", "x");

export function normalizeAspect(value) {
  const a = String(value).trim().replace("x", ":");
  if (!ASPECTS[a]) die(`unknown format "${value}"; use one of ${Object.keys(ASPECTS).join(", ")}`);
  return a;
}

/** Build the per-format view: size, edit dir and file paths. */
export function formatInfo(project, aspect) {
  const key = formatKey(aspect);
  const edit = join(project.dir, `edit-${key}`);
  return {
    aspect,
    key,
    ...ASPECTS[aspect],
    fps: project.data.fps,
    portrait: ASPECTS[aspect].height > ASPECTS[aspect].width,
    edit,
    index: join(edit, "index.html"),
    words: join(edit, "words.json"),
    // Remotion picture pass for this format (muted) and the props that made it.
    visuals: join(project.dir, "work", `visuals-${key}.mp4`),
    props: join(project.dir, "work", `props-${key}.json`),
    final: join(project.dir, "output", `final-${key}.mp4`),
  };
}

/**
 * Formats a command should act on. `--format 9:16` (or 9x16, or a comma list) narrows it;
 * otherwise all project formats, unless `single` is set and the project has several.
 */
export function selectFormats(project, flag, { single = false } = {}) {
  const all = project.data.formats;
  if (flag && flag !== true) {
    const picked = String(flag).split(",").map(normalizeAspect);
    for (const a of picked) if (!all.includes(a)) die(`project has no ${a} format (has ${all.join(", ")})`);
    if (single && picked.length > 1) die("this command takes exactly one --format");
    return picked.map((a) => formatInfo(project, a));
  }
  if (single && all.length > 1) die(`pass --format (${all.join(" | ")}) — this project renders several formats`);
  return all.map((a) => formatInfo(project, a));
}

/** Mark a stage done; per-format stages pass the format key (e.g. "9x16"). */
export function markStage(project, stage, extra = {}, fmtKey = null) {
  project.data.stages ??= {};
  const name = fmtKey ? `${stage}@${fmtKey}` : stage;
  project.data.stages[name] = { done: true, at: new Date().toISOString(), ...extra };
  project.save();
}

export function readJson(file) {
  // Strip a BOM: PowerShell's Out-File writes one and JSON.parse rejects it.
  return JSON.parse(readFileSync(file, "utf8").replace(/^﻿/, ""));
}

export function writeJson(file, value) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

export function writeText(file, text) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, text);
}

/** Run a command synchronously; throws with stderr on failure. */
export function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 256,
    shell: opts.shell ?? false,
    cwd: opts.cwd,
    stdio: opts.inherit ? "inherit" : "pipe",
    env: { ...process.env, ...(opts.env || {}) },
  });
  if (res.error) throw res.error;
  if (res.status !== 0 && !opts.allowFail) {
    const tail = (res.stderr || "").split("\n").slice(-15).join("\n");
    throw new Error(`${cmd} ${args.slice(0, 6).join(" ")} … exited ${res.status}\n${tail}`);
  }
  return res;
}

/** Run npx without a shell (npx.cmd + shell:true breaks on paths with spaces). */
export function npx(args, opts = {}) {
  const cli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
  if (existsSync(cli)) return run(process.execPath, [cli, ...args], opts);
  const isWin = process.platform === "win32";
  return run(isWin ? "npx.cmd" : "npx", args, { ...opts, shell: isWin });
}

export function probe(file) {
  const res = run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file]);
  const info = JSON.parse(res.stdout);
  const v = info.streams.find((s) => s.codec_type === "video");
  const a = info.streams.find((s) => s.codec_type === "audio");
  let width = v ? Number(v.width) : 0;
  let height = v ? Number(v.height) : 0;
  // Phones store portrait video as landscape + a rotation tag.
  const rotation = Number(
    v?.side_data_list?.find((d) => d.rotation != null)?.rotation ?? v?.tags?.rotate ?? 0,
  );
  if (Math.abs(rotation) % 180 === 90) [width, height] = [height, width];
  return {
    duration: Number(info.format.duration),
    width,
    height,
    fps: v ? parseRate(v.avg_frame_rate || v.r_frame_rate) : 0,
    vfr: v ? v.avg_frame_rate !== v.r_frame_rate : false,
    hasAudio: !!a,
    videoCodec: v?.codec_name ?? null,
    audioCodec: a?.codec_name ?? null,
    rotation,
  };
}

function parseRate(rate) {
  const [n, d] = String(rate).split("/").map(Number);
  return d ? Math.round((n / d) * 1000) / 1000 : n;
}

/** Snap odd fps like 29.97/59.94 to an integer the compositor handles cleanly. */
export function targetFps(fps) {
  if (!fps || !Number.isFinite(fps)) return 30;
  if (fps > 49) return 60;
  if (fps > 27) return 30;
  if (fps > 24.5) return 25;
  return 24;
}

export const ASPECTS = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

export function aspectFromSize(width, height) {
  const r = width / height;
  if (r > 1.5) return "16:9";
  if (r < 0.65) return "9:16";
  if (r < 0.9) return "4:5";
  return "1:1";
}

export function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, "")
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "video"
  );
}

export function ts(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(2).padStart(5, "0");
  return `${String(m).padStart(2, "0")}:${rest}`;
}

export const round3 = (n) => Math.round(Number(n) * 1000) / 1000;

/** Minimal flag parser: --key value, --flag, positional args. */
export function parseCli(argv = process.argv.slice(2)) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const [key, inline] = arg.slice(2).split("=", 2);
      if (inline !== undefined) flags[key] = inline;
      else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith("--")) flags[key] = argv[++i];
      else flags[key] = true;
    } else positional.push(arg);
  }
  return { flags, positional };
}

/** Add an attribution entry to the edit's credits.json (deduped by file). */
export function addCredit(creditsFile, entry) {
  const list = existsSync(creditsFile) ? readJson(creditsFile) : [];
  const next = list.filter((c) => c.file !== entry.file);
  next.push(entry);
  writeJson(creditsFile, next);
}

/** Decode any media's audio to mono float32 PCM (for RMS analysis). */
export function decodePcm(file, rate = 16000) {
  const res = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-vn", "-ac", "1", "-ar", String(rate), "-f", "f32le", "-"], {
    maxBuffer: 1024 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`ffmpeg decode failed for ${file}: ${String(res.stderr).slice(-400)}`);
  const buf = res.stdout;
  return { samples: new Float32Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 4)), rate };
}

/** RMS level in dBFS of [t0, t1) seconds. */
export function rmsDb({ samples, rate }, t0, t1) {
  const i0 = Math.max(0, Math.floor(t0 * rate));
  const i1 = Math.min(samples.length, Math.max(i0 + 1, Math.floor(t1 * rate)));
  let sum = 0;
  for (let i = i0; i < i1; i++) sum += samples[i] * samples[i];
  return 10 * Math.log10(sum / Math.max(1, i1 - i0) + 1e-12);
}

/** ffmpeg volumedetect → { mean, peak } in dB. Extra filters run before the measurement. */
export function volumeDetect(file, filters = "") {
  const res = run("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", `${filters ? filters + "," : ""}volumedetect`, "-f", "null", "-"]);
  const mean = res.stderr.match(/mean_volume:\s*(-?[\d.]+) dB/);
  const peak = res.stderr.match(/max_volume:\s*(-?[\d.]+) dB/);
  if (!mean || !peak) throw new Error(`could not measure ${file}`);
  return { mean: Number(mean[1]), peak: Number(peak[1]) };
}

/** Hard-link a file (no extra disk, same volume) or copy it when linking fails. */
export function linkOrCopy(src, dest) {
  mkdirSync(dirname(dest), { recursive: true });
  rmSync(dest, { force: true });
  try {
    linkSync(src, dest);
  } catch {
    copyFileSync(src, dest);
  }
}

/** Stream a URL to disk via a .part file; resumes with Range requests across dropped connections. */
export async function download(url, dest, headers = {}, attempts = 5) {
  mkdirSync(dirname(dest), { recursive: true });
  const part = `${dest}.part`;
  rmSync(part, { force: true });
  for (let attempt = 1; ; attempt++) {
    const have = existsSync(part) ? statSync(part).size : 0;
    try {
      const res = await fetch(url, { headers: { ...headers, ...(have ? { Range: `bytes=${have}-` } : {}) }, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const append = have > 0 && res.status === 206; // server honoured the resume
      await pipeline(Readable.fromWeb(res.body), createWriteStream(part, { flags: append ? "a" : "w" }));
      renameSync(part, dest);
      return dest;
    } catch (err) {
      if (attempt >= attempts) {
        rmSync(part, { force: true });
        throw new Error(`download failed after ${attempts} attempts: ${url} (${err.message})`);
      }
      console.error(`  download interrupted (${err.message}), retrying ${attempt}/${attempts - 1}…`);
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}
