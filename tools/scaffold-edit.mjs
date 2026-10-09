#!/usr/bin/env node
// Captions pass — one HyperFrames composition per output format (edit-16x9/, edit-9x16/ …) that lays
// the word-synced captions over that format's muted Remotion render (work/visuals-<fmt>.mp4).
// Why HyperFrames for captions: browser text shaping renders Telugu/Devanagari conjuncts correctly.
// Why nothing else here: the template's incident log shows embedded <audio> corrupting dialogue, so
// HyperFrames renders PICTURE ONLY; all audio is mixed by tools/mix.mjs.
// Usage: node tools/scaffold-edit.mjs <project> [--format 9:16] [--force]
//   new edit      → full scaffold
//   existing edit → refresh: re-link the latest visuals + words, update durations, regenerate captions
//                   (keeps any extra HTML you added after the @extras marker)
//   --force       → rewrite index.html from scratch
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  HYPERFRAMES_VERSION,
  ROOT,
  die,
  linkOrCopy,
  markStage,
  openProject,
  parseCli,
  readJson,
  run,
  selectFormats,
  writeJson,
  writeText,
} from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths, data } = project;
if (!data.cleancut) die("no clean cut yet — run cut first");
const D = Math.round(data.cleancut.duration * 1000) / 1000;

// Fonts: the render machine is a clean headless Chrome — Indic scripts must ship as woff2.
const FONTS = [
  ["@fontsource/poppins/files/poppins-latin-600-normal.woff2", "poppins-600.woff2"],
  ["@fontsource/poppins/files/poppins-latin-800-normal.woff2", "poppins-800.woff2"],
  ["@fontsource/noto-sans-telugu/files/noto-sans-telugu-telugu-400-normal.woff2", "noto-telugu-400.woff2"],
  ["@fontsource/noto-sans-telugu/files/noto-sans-telugu-telugu-700-normal.woff2", "noto-telugu-700.woff2"],
  ["@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2", "noto-devanagari-400.woff2"],
  ["@fontsource/noto-sans-devanagari/files/noto-sans-devanagari-devanagari-700-normal.woff2", "noto-devanagari-700.woff2"],
];
const fontFace = (family, file, weight) =>
  `      @font-face { font-family: "${family}"; src: url("assets/fonts/${file}") format("woff2"); font-weight: ${weight}; font-display: block; }`;

for (const fmt of selectFormats(project, flags.format)) {
  const { edit, index, aspect, key } = fmt;
  if (!existsSync(fmt.visuals)) die(`[${aspect}] ${fmt.visuals} missing — run npm run visuals first`);
  const refresh = existsSync(index) && !flags.force;

  for (const d of ["assets/fonts", "compositions"]) mkdirSync(join(edit, d), { recursive: true });
  linkOrCopy(fmt.visuals, join(edit, "assets", "visuals.mp4"));
  copyFileSync(paths.cleanWords, fmt.words);

  if (refresh) {
    let html = readFileSync(index, "utf8");
    for (const id of ["root", "visuals", "captions"])
      html = html.replace(new RegExp(`(id="${id}"[^>]*?data-duration=")[\\d.]+(")`), `$1${D}$2`);
    writeFileSync(index, html);
    console.log(`[${aspect}] refreshed visuals (${D}s) in ${edit}`);
  } else {
    for (const [from, to] of FONTS) {
      const src = join(ROOT, "node_modules", from);
      if (!existsSync(src)) die(`font missing: ${src} — run npm install in ${ROOT}`);
      copyFileSync(src, join(edit, "assets", "fonts", to));
    }
    writeJson(join(edit, "hyperframes.json"), {
      $schema: "https://hyperframes.heygen.com/schema/hyperframes.json",
      registry: "https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry",
      paths: { blocks: "compositions", components: "compositions/components", assets: "assets" },
      media: { autoProxy: true },
    });
    writeJson(join(edit, "meta.json"), { id: `${data.name}-${key}`, name: `${data.name} ${aspect}`, createdAt: new Date().toISOString() });
    writeJson(join(edit, "package.json"), {
      name: `${data.name}-${key}`,
      private: true,
      type: "module",
      scripts: {
        dev: `npx --yes hyperframes@${HYPERFRAMES_VERSION} preview`,
        check: `npx --yes hyperframes@${HYPERFRAMES_VERSION} check`,
        render: `npx --yes hyperframes@${HYPERFRAMES_VERSION} render`,
      },
    });
    writeText(index, masterHtml(fmt));
    console.log(`[${aspect}] scaffolded ${edit}`);
  }

  markStage(project, "scaffold", {}, key);
  // Captions sub-composition (regenerate any time with: npm run captions -- <project> [--style …]).
  // The child process updates project.json itself, so reload our copy afterwards.
  run(process.execPath, [join(ROOT, "tools", "captions.mjs"), data.name, "--format", aspect], { inherit: true });
  Object.assign(data, readJson(project.file));
  console.log(`[${aspect}] preview: cd "${edit}" && npm run dev`);
}

function masterHtml({ width: W, height: H, fps, aspect }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${data.name} ${aspect}</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
${fontFace("Poppins", "poppins-600.woff2", 600)}
${fontFace("Poppins", "poppins-800.woff2", 800)}
${fontFace("Noto Sans Telugu", "noto-telugu-400.woff2", 400)}
${fontFace("Noto Sans Telugu", "noto-telugu-700.woff2", "700 900")}
${fontFace("Noto Sans Devanagari", "noto-devanagari-400.woff2", 400)}
${fontFace("Noto Sans Devanagari", "noto-devanagari-700.woff2", "700 900")}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden;
        font-family: "Poppins", "Noto Sans Telugu", "Noto Sans Devanagari", sans-serif; }
      .full { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    </style>
  </head>
  <body>
    <!--
      CAPTIONS PASS ${aspect} — ${W}x${H} @ ${fps}fps, ${D}s, clean-cut timeline.
      The picture (a-roll/scenes, b-roll, motion graphics, camera moves) is the Remotion render in
      assets/visuals.mp4 — change it in work/visual-plan.json and re-run npm run visuals.
      NO <audio> here: dialogue, music and SFX are mixed by tools/mix.mjs (see project.md lessons).
    -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
      <video id="visuals" class="clip full" src="assets/visuals.mp4" muted playsinline
        data-start="0" data-duration="${D}" data-track-index="0"></video>

      <div id="captions" data-composition-id="captions" data-track-kind="captions" data-composition-src="compositions/captions.html"
        data-start="0" data-duration="${D}" data-track-index="4" data-width="${W}" data-height="${H}"></div>

      <!-- @extras: optional HyperFrames-only elements (registry blocks, HTML clips) on tracks 2-3 -->
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
}
