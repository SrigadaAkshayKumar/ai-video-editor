// Render the Doc composition from a props file (called by tools/render-visuals.mjs).
//   full video: node scripts/render.mjs --props p.json --public-dir <dir> --out visuals.mp4
//   QA stills:  node scripts/render.mjs --props p.json --public-dir <dir> --stills 1.5,12,40 --out-dir <dir>
// The output is MUTED (audio is mixed separately by tools/mix.mjs).
//
// LOW-RAM RENDERING. The edit machine is a 16 GB laptop with no GPU. One long renderMedia() call
// grows (Chrome tabs + frame caches) until the OS or Claude Code's memory reaper kills it -- the
// tcs-2 render died at 40% with 6 tabs, the infosys render at 40% with 3. So a full video is rendered
// as a queue of short CHUNKS (default 40s), each in its own child process that exits and gives all
// of its memory back before the next starts:
//   - the bundle is built once and reused by every chunk (--serve-url);
//   - before each chunk we wait until enough RAM is free, then size the tab count to what is free
//     (1-3 tabs, never more than REMOTION_CONCURRENCY);
//   - finished chunks are kept next to the output (<out>.chunks/), so a killed render resumes where it
//     stopped instead of starting over; a failed chunk is retried once with a single tab;
//   - chunks are joined with ffmpeg stream copy (lossless) and the frame count is checked.
// Env: REMOTION_CONCURRENCY (max tabs, default 3), RENDER_CHUNK_SECONDS (default 40),
//      RENDER_MIN_FREE_GB (wait threshold, default 2.0).
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { freemem } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const propsFile = resolve(arg("props"));
const props = JSON.parse(readFileSync(propsFile, "utf8"));
const publicDir = resolve(arg("public-dir"));
const stills = arg("stills");
const id = arg("composition", "Doc");

// winget's ffmpeg/ffprobe live in a Links dir older shells don't have on PATH (same fix as tools/lib/common.mjs).
if (process.platform === "win32") {
  const links = join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Links");
  const key = Object.keys(process.env).find((k) => k.toLowerCase() === "path") || "Path";
  if (existsSync(join(links, "ffmpeg.exe")) && !(process.env[key] || "").toLowerCase().includes(links.toLowerCase()))
    process.env[key] = `${process.env[key]};${links}`;
}

const MAX_TABS =Math.max(1, Number(process.env.REMOTION_CONCURRENCY || 3));
const CHUNK_S = Math.max(5, Number(process.env.RENDER_CHUNK_SECONDS || 40));
const MIN_FREE_GB = Number(process.env.RENDER_MIN_FREE_GB || 2.0);
const GB = 1024 ** 3;
const freeGb = () => freemem() / GB;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Tabs to use for the RAM that is actually free now (~1.3 GB per tab incl. headroom). */
const tabsForFreeRam = () => Math.max(1, Math.min(MAX_TABS, Math.floor((freeGb() - 1.0) / 1.3)));

/** Block until RAM is free enough to start a chunk (logs while waiting, gives up waiting after 10 min). */
const waitForRam = async () => {
  const t0 = Date.now();
  while (freeGb() < MIN_FREE_GB && Date.now() - t0 < 10 * 60 * 1000) {
    process.stdout.write(`\r  waiting for RAM: ${freeGb().toFixed(1)} GB free, need ${MIN_FREE_GB} GB (close Chrome/VS Code windows)…`);
    await sleep(5000);
  }
};

const frameCount = (file) => {
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-count_packets", "-select_streams", "v:0",
      "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", file], { encoding: "utf8" });
    return parseInt(out, 10) || 0;
  } catch {
    return 0;
  }
};

const progressPrinter = (label) => {
  let last = -1;
  return ({ progress }) => {
    const pct = Math.floor(progress * 100);
    if (pct !== last && pct % 10 === 0) {
      last = pct;
      process.stdout.write(`\r${label} ${pct}%   `);
    }
  };
};

/* ---------- child mode: render one frame range from an existing bundle, then exit ---------- */
const serveUrlArg = arg("serve-url");
const framesArg = arg("frames");
if (serveUrlArg && framesArg) {
  const [a, b] = framesArg.split("-").map(Number);
  const composition = await selectComposition({ serveUrl: serveUrlArg, id, inputProps: props });
  await renderMedia({
    composition,
    serveUrl: serveUrlArg,
    codec: "h264",
    crf: 16,
    imageFormat: "jpeg",
    jpegQuality: 95,
    muted: true,
    inputProps: props,
    outputLocation: resolve(arg("out")),
    frameRange: [a, b],
    chromiumOptions: { gl: "angle" },
    concurrency: Number(arg("tabs", 1)),
    offthreadVideoCacheSizeInBytes: 256 * 1024 * 1024,
    onProgress: progressPrinter(`  frames ${a}-${b}`),
  });
  process.exit(0);
}

/* ---------- parent mode ---------- */
process.stdout.write("bundling… ");
const serveUrl = await bundle({ entryPoint: resolve("src/index.ts"), publicDir });
console.log("done");
const composition = await selectComposition({ serveUrl, id, inputProps: props });

if (stills) {
  const outDir = resolve(arg("out-dir"));
  mkdirSync(outDir, { recursive: true });
  for (const t of stills.split(",").map(Number)) {
    const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(t * composition.fps)));
    const output = join(outDir, `t${t.toFixed(2).padStart(7, "0")}.png`);
    await renderStill({ composition, serveUrl, output, inputProps: props, frame });
    console.log(`still ${t}s → ${output}`);
  }
  process.exit(0);
}

const out = resolve(arg("out"));
const total = composition.durationInFrames;
const per = Math.round(CHUNK_S * composition.fps);
const chunks = [];
for (let a = 0, i = 0; a < total; a += per, i++) chunks.push({ i, a, b: Math.min(total, a + per) - 1 });

// A plan/props change invalidates old chunks: key the chunk dir on the props file's content.
const chunkDir = `${out}.chunks`;
const stamp = JSON.stringify({ props, total, per });
const stampFile = join(chunkDir, "stamp.json");
if (existsSync(chunkDir) && (!existsSync(stampFile) || readFileSync(stampFile, "utf8") !== stamp)) {
  rmSync(chunkDir, { recursive: true, force: true });
}
mkdirSync(chunkDir, { recursive: true });
writeFileSync(stampFile, stamp);

console.log(`${total} frames in ${chunks.length} chunks of ≤${CHUNK_S}s · max ${MAX_TABS} tabs · ${freeGb().toFixed(1)} GB free`);
const self = fileURLToPath(import.meta.url);
for (const c of chunks) {
  const file = join(chunkDir, `chunk-${String(c.i).padStart(3, "0")}.mp4`);
  const want = c.b - c.a + 1;
  if (existsSync(file) && frameCount(file) === want) {
    console.log(`chunk ${c.i + 1}/${chunks.length}: kept (resume)`);
    continue;
  }
  let ok = false;
  for (const attempt of [1, 2]) {
    await waitForRam();
    const tabs = attempt === 1 ? tabsForFreeRam() : 1;
    process.stdout.write(`\rchunk ${c.i + 1}/${chunks.length} (frames ${c.a}-${c.b}, ${tabs} tab${tabs > 1 ? "s" : ""}, ${freeGb().toFixed(1)} GB free)\n`);
    const res = spawnSync(process.execPath, [self, "--props", propsFile, "--public-dir", publicDir,
      "--serve-url", serveUrl, "--frames", `${c.a}-${c.b}`, "--tabs", String(tabs), "--out", file],
      { stdio: "inherit", cwd: process.cwd() });
    if (res.status === 0 && frameCount(file) === want) {
      ok = true;
      break;
    }
    const got = existsSync(file) ? frameCount(file) : "no";
    console.log(`\n  chunk ${c.i + 1} failed (exit ${res.status}, ${got}/${want} frames${res.signal ? `, ${res.signal}` : ""})${attempt === 1 ? " — retrying with 1 tab" : ""}`);
    rmSync(file, { force: true });
  }
  if (!ok) {
    console.error(`chunk ${c.i + 1} failed twice. Finished chunks are kept in ${chunkDir}; re-run to resume.`);
    process.exit(1);
  }
  process.stdout.write("\n");
}

// Lossless join.
const list = join(chunkDir, "list.txt");
const files = readdirSync(chunkDir).filter((f) => /^chunk-\d+\.mp4$/.test(f)).sort();
writeFileSync(list, files.map((f) => `file '${join(chunkDir, f).replace(/\\/g, "/")}'`).join("\n"));
mkdirSync(dirname(out), { recursive: true });
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
const got = frameCount(out);
if (got !== total) {
  console.error(`joined file has ${got} frames, expected ${total} — chunks kept in ${chunkDir}`);
  process.exit(1);
}
rmSync(chunkDir, { recursive: true, force: true });
console.log(`rendered ${out} (${total} frames, ${chunks.length} chunks)`);
