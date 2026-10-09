#!/usr/bin/env node
// Stage 6 â€” generate the captions sub-composition (edit-<fmt>/compositions/captions.html)
// from work/cleancut.words.json (clean-cut timeline). Handles Telugu / Devanagari / Latin text.
// Usage: node tools/captions.mjs <project> [--format 9:16] [--style pop|clean|karaoke] [--max-words N]
//        [--position bottom|middle] [--accent "#FFD400"] [--uppercase]
// Style/accent/uppercase are shared by all formats; max-words/position are remembered per format.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { die, markStage, openProject, parseCli, readJson, selectFormats, writeText } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths } = project;
if (!existsSync(paths.cleanWords)) die("work/cleancut.words.json missing â€” run cut first");

const saved = project.data.captions || {};
const shared = {
  style: flags.style || saved.style || "pop",
  accent: flags.accent || saved.accent || "#FFD400",
  uppercase: flags.uppercase ?? saved.uppercase ?? false,
};
// caption_blackouts (visual-plan.json): spans where a card already shows the words (sample_answer).
// Dropped words leave a hole, and any hole > 0.3s ends a caption group, so no line spans the card.
const blackouts = existsSync(paths.visualPlan) ? readJson(paths.visualPlan).caption_blackouts || [] : [];
const words = readJson(paths.cleanWords).filter(
  (w) => w.type === "word" && !blackouts.some((b) => w.start < b.end && w.end > b.start),
);
if (!words.length) die("no words to caption");
const total = project.data.cleancut?.duration ?? words.at(-1).end;
const r = (n) => Math.round(n * 1000) / 1000;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

project.data.captions = { ...saved, ...shared };
for (const fmt of selectFormats(project, flags.format)) {
  const per = saved[fmt.key] || {};
  const opts = {
    ...shared,
    maxWords: Number(flags["max-words"] || per.maxWords || (fmt.portrait ? 3 : 5)),
    // Bottom band in both formats: the Remotion graphics keep clear of exactly this band.
    position: flags.position || per.position || "bottom",
  };
  const out = join(fmt.edit, "compositions", "captions.html");
  const groups = writeCaptions(fmt, opts, out);
  project.data.captions[fmt.key] = { maxWords: opts.maxWords, position: opts.position };
  markStage(project, "captions", { groups }, fmt.key);
  console.log(`[${fmt.aspect}] wrote ${out} (${groups} groups, style ${opts.style}, ${opts.maxWords} words max, ${opts.position})`);
  if (existsSync(fmt.index) && !readFileSync(fmt.index, "utf8").includes('data-composition-src="compositions/captions.html"'))
    console.log(`[${fmt.aspect}] note: index.html has no captions host clip â€” add it (see captions skill)`);
}

function writeCaptions({ width: W, height: H, portrait }, opts, outFile) {
  const maxChars = portrait ? 22 : 38;

  // ---- grouping --------------------------------------------------------------
  const groups = [];
  let cur = [];
  const textLen = (ws) => ws.reduce((n, w) => n + [...w.text].length + 1, 0);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = words[i - 1];
    if (cur.length && (w.start - prev.end > 0.3 || cur.length >= opts.maxWords || textLen(cur) + [...w.text].length > maxChars)) {
      groups.push(cur);
      cur = [];
    }
    cur.push(w);
    if (/[.?!à¥¤à¥¥,]$/.test(w.text)) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);

  const displayText = (t) => {
    let s = t.replace(/[,.;:à¥¤à¥¥]+$/u, "");
    if (opts.uppercase) s = s.toUpperCase(); // no-op for Indic scripts
    return s;
  };
  const G = groups.map((g, gi) => {
    const next = groups[gi + 1];
    const start = g[0].start;
    // hold through short gaps, never overlap the next group
    const end = next ? Math.min(g.at(-1).end + 0.35, next[0].start) : Math.min(total, g.at(-1).end + 0.5);
    return {
      start: r(start),
      end: r(Math.max(end, start + 0.25)),
      words: g.map((w) => ({ t: displayText(w.text), s: r(w.start), e: r(w.end) })),
    };
  });

  const fontSize = portrait ? 76 : 64;
  // 9:16 positions stay inside Instagram's safe zone (UI covers ~y<250 and y>1500).
  const top = opts.position === "middle" ? Math.round(H * 0.62) : portrait ? Math.round(H * 0.698) + 8 : Math.round(H * 0.833) + 8; // just under CAPTION_SAFE_Y (remotion/src/doc/theme.ts)

  const STYLES = {
    pop: `
        .cap-word { color: #fff; -webkit-text-stroke: ${portrait ? 10 : 8}px #000; paint-order: stroke fill; text-shadow: 0 6px 18px rgba(0,0,0,.55); }`,
    clean: `
        .cap-group { background: rgba(0,0,0,.62); border-radius: 18px; padding: 10px 26px; }
        .cap-word { color: #fff; }`,
    karaoke: `
        .cap-word { color: rgba(255,255,255,.55); -webkit-text-stroke: ${portrait ? 8 : 6}px rgba(0,0,0,.85); paint-order: stroke fill; }`,
  };
  if (!STYLES[opts.style]) die(`unknown --style ${opts.style}; use ${Object.keys(STYLES).join("|")}`);

  const markup = G.map(
    (g, gi) =>
      `        <div id="cap-g${gi}" class="cap-group">${g.words
        .map((w, wi) => `<span id="cap-g${gi}w${wi}" class="cap-word">${esc(w.t)}</span>`)
        .join(" ")}</div>`,
  ).join("\n");

  writeText(
    outFile,
    `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <!-- GENERATED by tools/captions.mjs from work/cleancut.words.json â€” regenerate rather than hand-edit timing.
         style=${opts.style} maxWords=${opts.maxWords} position=${opts.position} -->
  </head>
  <body>
    <template>
      <style>
        @font-face { font-family: "Poppins"; src: url("assets/fonts/poppins-800.woff2") format("woff2"); font-weight: 800; font-display: block; }
        @font-face { font-family: "Noto Sans Telugu"; src: url("assets/fonts/noto-telugu-700.woff2") format("woff2"); font-weight: 700 900; font-display: block; }
        @font-face { font-family: "Noto Sans Devanagari"; src: url("assets/fonts/noto-devanagari-700.woff2") format("woff2"); font-weight: 700 900; font-display: block; }
        #root { position: absolute; inset: 0; pointer-events: none; }
        .cap-group {
          position: absolute; left: 0; right: 0; margin: 0 auto; top: ${top}px;
          width: fit-content; max-width: ${portrait ? W - 160 : W - 360}px;
          text-align: center; line-height: 1.25; opacity: 0; visibility: hidden;
          font-family: "Poppins", "Noto Sans Telugu", "Noto Sans Devanagari", sans-serif;
          font-weight: 800; font-size: ${fontSize}px; overflow: visible;
        }
        .cap-word { display: inline-block; margin: 0 0.1em; }${STYLES[opts.style]}
      </style>
      <div id="root" data-composition-id="captions" data-width="${W}" data-height="${H}" data-duration="${r(total)}">
${markup}
      </div>
      <script>
        (function () {
          var GROUPS = ${JSON.stringify(G.map((g) => ({ s: g.start, e: g.end, w: g.words.map((w) => [w.s, w.e]) })))};
          var STYLE = ${JSON.stringify(opts.style)};
          var ON = STYLE === "karaoke" ? "#ffffff" : ${JSON.stringify(opts.accent)};
          var OFF = "#ffffff";
          var tl = gsap.timeline({ paused: true });
          GROUPS.forEach(function (g, gi) {
            var el = "#cap-g" + gi;
            tl.set(el, { visibility: "visible" }, g.s);
            if (STYLE === "pop") tl.fromTo(el, { opacity: 0, scale: 0.82, y: 18 }, { opacity: 1, scale: 1, y: 0, duration: 0.14, ease: "back.out(2)" }, g.s);
            else tl.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.18, ease: "power2.out" }, g.s);
            g.w.forEach(function (w, wi) {
              var wel = "#cap-g" + gi + "w" + wi;
              tl.set(wel, { color: ON }, w[0]);
              if (STYLE === "pop") tl.fromTo(wel, { scale: 1 }, { scale: 1.08, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.out" }, w[0]);
              var nextStart = wi + 1 < g.w.length ? g.w[wi + 1][0] : g.e;
              if (STYLE !== "karaoke") tl.set(wel, { color: OFF }, nextStart);
            });
            // hard kill â€” exactly one group visible at a time
            tl.to(el, { opacity: 0, duration: 0.08, ease: "power2.in" }, Math.max(g.s, g.e - 0.08));
            tl.set(el, { opacity: 0, visibility: "hidden" }, g.e);
          });
          tl.seek(0);
          window.__timelines["captions"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`,
  );
  return G.length;
}
