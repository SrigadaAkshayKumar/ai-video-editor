#!/usr/bin/env node
// Thumbnail building blocks (see the youtube-thumbnail skill for the creative rules).
//   frames <project> [--at 12.3,40.1] [--auto]
//       full-quality frames from the RAW footage at clean-cut times (mapped through work/timeline.json).
//       --auto picks the planned emphasis beats: punch_in camera moves and big_statement starts.
//   cutout <project> <frame.png>
//       transparent PNG of the subject via HyperFrames' local background remover → work/thumb/cutout.png
//   render <project> --big "NOT ENOUGH" [--small "Certificates alone"] [--native "ఉద్యోగం రాదు"]
//          [--cutout work/thumb/cutout.png] [--background path] [--accent "#ffcc00"] [--side right|left]
//          [--small-first] [--format 16:9|9:16] [--bg-pos "50% 20%"]
//       → output/thumbnail-16x9.png (1280x720, YouTube) and/or output/cover-9x16.png (1080x1920, Reels cover)
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { HYPERFRAMES_VERSION, REMOTION_DIR, die, linkOrCopy, npx, openProject, parseCli, readJson, run, ts, writeJson } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const [cmd, projectName, arg] = positional;
const project = openProject(projectName);
const { paths, data } = project;
const thumbDir = join(paths.work, "thumb");
mkdirSync(thumbDir, { recursive: true });

if (cmd === "frames") {
  if (data.mode === "faceless") die("faceless videos have no face footage — use a graphic/background-only thumbnail");
  const timeline = readJson(join(paths.work, "timeline.json"));
  const plan = existsSync(paths.visualPlan) ? readJson(paths.visualPlan) : {};
  let times = flags.at ? String(flags.at).split(",").map(Number) : [];
  if (flags.auto || !times.length) {
    times.push(
      ...(plan.camera_moves || []).filter((m) => m.kind === "punch_in").map((m) => m.start + 0.3),
      ...(plan.overlays || []).filter((o) => o.type === "big_statement").map((o) => Math.max(0, o.start - 0.4)),
    );
    if (!times.length) times = [0.2, 0.4, 0.6, 0.8].map((p) => p * data.cleancut.duration);
  }
  for (const t of times.slice(0, 12)) {
    const seg = timeline.find((s) => t >= s.start && t < s.end);
    if (!seg) continue;
    const raw = seg.raw_start + (t - seg.start);
    const out = join(thumbDir, `face-${t.toFixed(1)}.png`);
    run("ffmpeg", ["-y", "-v", "error", "-ss", raw.toFixed(3), "-i", data.source.file, "-frames:v", "1", out]);
    console.log(`${ts(t)} (raw ${ts(raw)}) → ${out}`);
  }
  console.log("Read them; pick eyes-to-camera, brows up or furrowed, mouth mid-word, hands in frame if gesturing.");
} else if (cmd === "cutout") {
  if (!arg || !existsSync(arg)) die("usage: thumbnail.mjs cutout <project> <frame.png>");
  const out = join(thumbDir, "cutout.png");
  npx(["--yes", `hyperframes@${HYPERFRAMES_VERSION}`, "remove-background", arg, "-o", out], { inherit: true });
  console.log(`cutout → ${out}  (Read it: hair/hands edges intact?)`);
} else if (cmd === "render") {
  if (!flags.big) die('render needs --big "ONE BIG PHRASE"');
  const want = flags.format ? [String(flags.format).replace("x", ":")] : ["16:9", "9:16"];
  // a tiny public dir: only the images this thumbnail uses
  const pub = mkdtempSync(join(tmpdir(), "thumb-"));
  const asset = (p) => {
    if (!p) return undefined;
    const abs = existsSync(p) ? p : join(project.dir, p);
    if (!existsSync(abs)) die(`not found: ${p}`);
    linkOrCopy(abs, join(pub, basename(abs)));
    return basename(abs);
  };
  const base = {
    big: String(flags.big),
    // "" not undefined: an omitted prop falls back to the composition's demo defaults (a Telugu
    // "ఉద్యోగం రాదు" line appeared on an English thumbnail that never asked for one).
    small: flags.small ? String(flags.small) : "",
    native: flags.native ? String(flags.native) : "",
    backgroundPosition: flags["bg-pos"] ? String(flags["bg-pos"]) : "50% 50%", // which part of a cropped photo stays
    accent: flags.accent || "#ffcc00",
    cutout: asset(flags.cutout),
    background: asset(flags.background),
    cutoutSide: flags.side === "left" ? "left" : "right",
    smallFirst: !!flags["small-first"],
  };
  try {
    for (const aspect of want) {
      const [w, h, name] = aspect === "9:16" ? [1080, 1920, "cover-9x16.png"] : [1280, 720, "thumbnail-16x9.png"];
      const propsFile = join(pub, `props-${w}x${h}.json`);
      writeJson(propsFile, { ...base, width: w, height: h });
      const out = join(paths.output, name);
      npx(["remotion", "still", "src/index.ts", "Thumbnail", out, `--props=${propsFile}`, `--public-dir=${pub}`, "--log=error"], {
        cwd: REMOTION_DIR,
        inherit: true,
      });
      // the feed shows thumbnails ~120px wide: check legibility at that size
      const small = join(thumbDir, `preview-120-${name}`);
      run("ffmpeg", ["-y", "-v", "error", "-i", out, "-vf", `scale=${aspect === "9:16" ? 120 : 214}:-2`, small]);
      console.log(`${out}\n  feed-size preview → ${small} (Read it: is the big word readable, the face recognisable?)`);
    }
  } finally {
    rmSync(pub, { recursive: true, force: true });
  }
} else die("usage: thumbnail.mjs frames|cutout|render <project> …");
