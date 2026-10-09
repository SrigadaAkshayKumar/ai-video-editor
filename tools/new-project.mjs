#!/usr/bin/env node
// Create projects/<name>/ from an inbox file (or any path) and record its properties.
// Usage: node tools/new-project.mjs <file-or-inbox-name> [--script <name-or-path>] [--name slug]
//        [--lang te|hi|en|auto] [--mode talking|faceless] [--formats 16:9,9:16] [--style glass|broadcast|liquid|blueprint|cleantech]
//        [--brief "the user's style instructions"] [--brand slug] [--intro <clip>] [--intro-at <sec>] [--outro <clip>]
//        [--keyterms "Brand,Product"] [--copy]
//
// Names resolve against inbox/ by file name without extension, a leading "/" is fine:
//   npm run new -- video-1                                  (inbox/talking/video-1.mp4)
//   npm run new -- /script-1-audio --script /script-1       (inbox/faceless/…)
// A voiceover named "<x>-audio" is paired with the script "<x>" automatically.
// Mode: talking = a person on camera (default when the file has video); faceless = a voiceover whose
// picture is built from b-roll/news/graphics (default for audio-only files).
import { copyFileSync, existsSync, linkSync, mkdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import {
  DEFAULT_FORMATS,
  PROJECTS,
  aspectFromSize,
  die,
  normalizeAspect,
  parseCli,
  probe,
  projectPaths,
  slugify,
  targetFps,
  writeJson,
  writeText,
} from "./lib/common.mjs";
import { MEDIA_EXT, SCRIPT_EXT, directionScript, pairedScript, readScript, resolveInput } from "./lib/inbox.mjs";
import { scriptKeyterms } from "./lib/script.mjs";

const { flags, positional } = parseCli();
const ref = positional[0];
if (!ref || flags.help) {
  console.log(`Usage: npm run new -- <file|inbox-name> [--script name] [--lang te|hi|en|auto] [--mode talking|faceless] [--formats 16:9,9:16|source] [--style glass|broadcast|liquid|blueprint|cleantech] [--brief "…"] [--brand slug] [--intro clip] [--intro-at sec] [--outro clip] [--keyterms "a,b"] [--copy]`);
  process.exit(ref ? 0 : 1);
}
const rawPath = resolveInput(ref, MEDIA_EXT);
if (!rawPath) die(`no media file "${ref}" — put it in inbox/talking/ (on-camera clips) or inbox/faceless/ (voiceovers), or pass a path`);

const info = probe(rawPath);
if (!info.hasAudio) die("the file has no audio stream — nothing to transcribe/cut on");
const hasVideo = info.width > 0 && info.height > 0;
const mode = flags.mode || (hasVideo && !/[\\/]faceless[\\/]/i.test(rawPath) ? "talking" : "faceless");
if (!["talking", "faceless"].includes(mode)) die("--mode must be talking or faceless");
if (mode === "talking" && !hasVideo) die("talking mode needs a video file; use --mode faceless for a voiceover");

// Script (faceless): explicit --script, else the "<x>" that pairs with "<x>-audio".
let scriptPath = null;
if (flags.script) {
  scriptPath = resolveInput(flags.script, SCRIPT_EXT);
  if (!scriptPath) die(`no script "${flags.script}" in inbox/ — save it as .txt, .md or .docx`);
} else if (mode === "faceless") scriptPath = pairedScript(rawPath);

// "d01_tcs_q2_results_voiceover" → "d01-tcs-q2-results"
const name = slugify(flags.name || (scriptPath ? basename(scriptPath, extname(scriptPath)).replace(/[-_ ](voiceover|vo|script)$/i, "") : basename(rawPath)));
const dir = join(PROJECTS, name);
if (existsSync(join(dir, "project.json"))) die(`project already exists: ${dir} (pass --name to start another)`);

const sourceAspect = hasVideo ? aspectFromSize(info.width, info.height) : null;
const style = flags.style || "glass";
if (!["glass", "broadcast", "liquid", "blueprint", "cleantech"].includes(style)) die("--style must be glass, broadcast, liquid, blueprint or cleantech");
const requested = flags.formats ?? flags.aspect;
const formats = [
  ...new Set(
    (requested ? String(requested).split(",") : DEFAULT_FORMATS).map((f) =>
      f.trim() === "source" ? sourceAspect || die("audio-only source has no aspect — name formats explicitly") : normalizeAspect(f),
    ),
  ),
];

const paths = projectPaths(dir, mode);
for (const d of [paths.source, paths.work, paths.output]) mkdirSync(d, { recursive: true });

// Hard-link inbox files into the project (no duplicate GBs; the inbox can be cleaned freely).
const bring = (src, destName) => {
  const dest = join(paths.source, destName + extname(src).toLowerCase());
  try {
    if (flags.copy) throw new Error("copy requested");
    linkSync(src, dest);
  } catch {
    copyFileSync(src, dest);
  }
  return dest;
};
const sourceFile = bring(rawPath, "raw");

let script = null;
if (scriptPath) {
  const text = readScript(scriptPath);
  const file = join(paths.source, "script.txt");
  writeText(file, text);
  script = { file, original: scriptPath, words: text.split(/\s+/).filter(Boolean).length };
  // A spoken-words file with a scene/screen script beside it: bring that too, for directing.
  const directions = directionScript(scriptPath);
  if (directions) script.directions = bring(directions, "screen-script");
}
const clip = (v, label) => {
  if (!v) return null;
  const p = resolveInput(v, MEDIA_EXT);
  if (!p) die(`${label} clip "${v}" not found (inbox/brand/ or a path)`);
  return bring(p, label);
};

const keyterms = [
  ...(flags.keyterms ? String(flags.keyterms).split(",").map((s) => s.trim()).filter(Boolean) : []),
  ...(script ? scriptKeyterms(readScript(scriptPath)) : []),
];
const lang = flags.lang && flags.lang !== "auto" ? String(flags.lang) : null;
const project = {
  name,
  createdAt: new Date().toISOString(),
  source: { file: sourceFile, original: rawPath, ...info },
  script, // faceless: what the narrator meant to read (drives alignment, direction, captions)
  language: lang, // null = auto-detect (handles code-mixed Telugu/Hindi + English)
  keyterms: [...new Set(keyterms)],
  mode,
  style,
  sourceAspect,
  formats, // each gets its own edit-<WxH>/ and output/final-<WxH>.mp4
  fps: hasVideo ? targetFps(info.fps) : 30,
  brief: flags.brief ? String(flags.brief) : "", // the user's style instructions for THIS video
  brand: flags.brand ? slugify(flags.brand) : null, // only when the user says whose channel/brand it is
  noCaptions: !!flags["no-captions"], // the user asked for no captions: finalize skips the HyperFrames pass
  intro: clip(flags.intro, "intro"),
  // clean-cut second the intro is spliced in at (e.g. after the hook); null = before the first frame
  introAt: flags["intro-at"] ? Number(flags["intro-at"]) : null,
  outro: clip(flags.outro, "outro"),
  stages: {},
};
writeJson(join(dir, "project.json"), project);

console.log(`created ${dir} — ${mode} mode, ${style} style`);
console.log(
  hasVideo
    ? `source: ${basename(rawPath)} ${info.width}x${info.height} (${sourceAspect}) @ ${info.fps}fps${info.vfr ? " (VFR)" : ""}, ${info.duration.toFixed(1)}s`
    : `source: ${basename(rawPath)} audio only, ${info.duration.toFixed(1)}s`,
);
if (script) console.log(`script: ${basename(scriptPath)} (${script.words} words) → source/script.txt`);
if (script?.directions) console.log(`screen directions: ${basename(directionScript(scriptPath))} → source/screen-script.md`);
else if (mode === "faceless") console.log("note: no script found — it helps a lot (alignment, direction, caption spelling). Put <name>.txt next to the audio.");
console.log(`outputs: ${formats.join(" + ")} @ ${project.fps}fps`);
const cropped = hasVideo && mode === "talking" ? formats.filter((f) => f !== sourceAspect) : [];
if (cropped.length) console.log(`note: ${cropped.join(", ")} will be cropped from ${sourceAspect} — set "framing" per format in work/visual-plan.json if the speaker is off-centre`);
console.log(`next: npm run transcribe -- ${name}`);
