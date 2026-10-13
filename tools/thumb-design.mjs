#!/usr/bin/env node
// Designed thumbnails: HTML/CSS templates rendered by headless Chrome. No photos, no AI images: a colour-graded
// background, set type and at most one drawn element. See the youtube-thumbnail skill, section 5c.
// Usage:
//   node tools/thumb-design.mjs <project> <spec.json>      → projects/<p>/output/thumbnails/<name>.png + <name>-feed.png
//   node tools/thumb-design.mjs --demo <out-dir>           → one of each template with sample text
// spec.json: {"accent": "#ffb300", "brand": "CRACK IT", "variants": [
//   {"name": "A", "template": "headline", "kicker": "4 reasons · 2026", "lines": ["Selected.", "*Not* joined."]},
//   {"name": "B", "template": "stat", "kicker": "Cognizant", "number": "25,000", "caption": "hired. Still waiting?", "trend": "down"},
//   {"name": "C", "template": "versus", "kicker": "Freshers 2026", "left": {"label": "Selected", "value": "YES"},
//                                                                    "right": {"label": "Joining date", "value": "?"}}]}
// In `lines`, *word* marks the one highlighted word. Optional on any variant (paths relative to the project):
//   "logo": "assets/logos/cognizant.svg"   company logo on a white plate, top right (tools/logo.mjs fetches it)
//   "badge": "Must watch"                  a small stamp next to the logo
//   "person": "work/thumb/cutout.png"      a cut-out person on the right third (headline / stat only); the text
//                                          narrows to make room (tools/thumbnail.mjs cutout makes the PNG)
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PROJECTS, ROOT, die, parseCli, readJson, run } from "./lib/common.mjs";

const { positional, flags } = parseCli();
const W = 1280;
const H = 720;
const FONTS = join(ROOT, "assets", "fonts");

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const marked = (s) => esc(s).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>');

function findChrome() {
  const c = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
    "/usr/bin/chromium-browser", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    join(process.env["ProgramFiles"] || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe")];
  return c.find((p) => p && existsSync(p)) || die("no Chrome found (set CHROME_PATH)");
}

/** Shared look: one dark base, the accent as light, its cool shadow, fine grain, vignette. Nothing else. */
function page(accent, body, brand) {
  const font = (name, file) => `@font-face{font-family:"${name}";src:url("${pathToFileURL(join(FONTS, file))}") format("woff2");}`;
  const grain = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${font("Display", "InterDisplay-Black.woff2")}${font("DisplayXB", "InterDisplay-ExtraBold.woff2")}${font("UI", "Inter-SemiBold.woff2")}${font("UIB", "Inter-Bold.woff2")}
:root{--a:${accent};--ink:#f4f1ea;--dim:rgba(244,241,234,.55);--bg:#0b0d12}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:var(--bg)}
.frame{position:relative;width:${W}px;height:${H}px;overflow:hidden;font-family:UI;color:var(--ink);
  background:
    radial-gradient(900px 620px at 88% 18%, color-mix(in srgb,var(--a) 34%,transparent), transparent 62%),
    radial-gradient(700px 520px at 6% 105%, color-mix(in srgb,var(--a) 10%,#0f1a2b 90%), transparent 70%),
    linear-gradient(160deg,#121621 0%,#0b0d12 55%,#08090d 100%)}
.frame::before{content:"";position:absolute;inset:0;background:url("data:image/svg+xml,${grain}");opacity:.07;mix-blend-mode:overlay;pointer-events:none}
.frame::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 220px 40px rgba(0,0,0,.65);pointer-events:none}
.kicker{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:14px;font-family:UIB;font-size:26px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--ink);opacity:.92}
.kicker i{width:12px;height:12px;border-radius:50%;background:var(--a);box-shadow:0 0 18px var(--a)}
.brand{position:absolute;left:72px;bottom:58px;display:flex;align-items:center;gap:12px;font-family:UIB;font-size:22px;
  letter-spacing:.22em;color:var(--dim)}
.brand b{width:28px;height:4px;background:var(--a);display:block}
.hl{color:var(--a)}
/* headline */
.headline{position:absolute;left:68px;right:120px;top:50%;transform:translateY(-46%)}
.headline div{font-family:Display;font-size:var(--fs);line-height:1.02;letter-spacing:-.045em;text-transform:uppercase;
  text-shadow:0 18px 60px rgba(0,0,0,.55)}
.headline .hl{color:var(--bg);background:var(--a);padding:0 .12em;margin:0 -.04em;border-radius:.06em;
  box-shadow:0 0 60px color-mix(in srgb,var(--a) 45%,transparent);text-shadow:none}
/* stat */
.stat{position:absolute;left:66px;top:50%;transform:translateY(-50%)}
.num{display:inline-block;padding-right:.1em;font-family:Display;font-size:var(--fs);line-height:.86;letter-spacing:-.055em;
  background:linear-gradient(180deg,#fff 0%,#fff 45%,color-mix(in srgb,var(--a) 85%,#fff) 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 20px 50px rgba(0,0,0,.5))}
.cap{margin-top:22px;font-family:UIB;font-size:46px;line-height:1.08;letter-spacing:-.01em;max-width:760px}
.trend{position:absolute;right:40px;bottom:150px;width:440px;height:260px;opacity:.9}
/* versus */
.vs{position:absolute;left:0;right:0;top:150px;bottom:130px;display:grid;grid-template-columns:1fr 1fr}
.side{display:flex;flex-direction:column;justify-content:center;padding:0 60px 0 72px}
.side + .side{padding:0 72px 0 72px;border-left:2px solid rgba(244,241,234,.12)}
.lab{font-family:UIB;font-size:34px;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.val{font-family:Display;font-size:var(--fs);line-height:.9;letter-spacing:-.05em;text-transform:uppercase;margin-top:10px}
.side.l .val{color:rgba(244,241,234,.92)}
.side.r .val{color:var(--a);text-shadow:0 0 70px color-mix(in srgb,var(--a) 40%,transparent)}
.side.r .lab{color:var(--ink)}
/* extras */
.tr{position:absolute;right:64px;top:52px;display:flex;align-items:center;gap:22px;z-index:3}
.plate{background:#fff;border-radius:16px;padding:14px 22px;box-shadow:0 14px 40px rgba(0,0,0,.45);display:flex;align-items:center}
.plate img{height:52px;max-width:240px;object-fit:contain;display:block}
.badge{font-family:UIB;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:var(--a);padding:10px 18px;
  border:3px solid var(--a);border-radius:10px;transform:rotate(-4deg);background:rgba(11,13,18,.55);
  box-shadow:0 0 30px color-mix(in srgb,var(--a) 30%,transparent),inset 0 0 18px color-mix(in srgb,var(--a) 18%,transparent)}
.person{position:absolute;right:10px;bottom:0;height:540px;z-index:1;
  filter:drop-shadow(-14px 0 26px color-mix(in srgb,var(--a) 35%,transparent)) drop-shadow(0 30px 40px rgba(0,0,0,.6))}
.person-fade{position:absolute;right:0;bottom:0;width:640px;height:200px;z-index:1;background:linear-gradient(0deg,rgba(8,9,13,.85),transparent)}
.headline,.stat,.kicker,.brand{z-index:2}
</style></head><body><div class="frame">${body}${brand ? `<div class="brand"><b></b>${esc(brand)}</div>` : ""}</div></body></html>`;
}

/** Biggest size that keeps the longest line inside `width` px (Inter Display Black ≈ 0.62 em per uppercase char). */
const fit = (text, width, max, k = 0.62) => Math.round(Math.min(max, width / (Math.max(3, text.replace(/\*/g, "").length) * k)));

function variantHtml(v, accent, brand, base) {
  const asset = (p) => {
    const abs = existsSync(p) ? p : join(base || ".", p);
    return existsSync(abs) ? pathToFileURL(abs).href : die(`${v.name}: not found: ${p}`);
  };
  const person = v.person && v.template !== "versus" ? `<img class="person" src="${asset(v.person)}"><div class="person-fade"></div>` : "";
  const textW = person ? 680 : 1060;
  const tr = v.logo || v.badge ? `<div class="tr">${v.badge ? `<div class="badge">${esc(v.badge)}</div>` : ""}${v.logo ? `<div class="plate"><img src="${asset(v.logo)}"></div>` : ""}</div>` : "";
  const kicker = (v.kicker ? `<div class="kicker"><i></i>${esc(v.kicker)}</div>` : "") + tr + person;
  if (v.template === "headline") {
    const lines = v.lines || die(`${v.name}: headline needs "lines"`);
    const fs = Math.min(...lines.map((l) => fit(l, textW, 168)));
    return page(accent, `${kicker}<div class="headline" style="--fs:${fs}px">${lines.map((l) => `<div>${marked(l)}</div>`).join("")}</div>`, brand);
  }
  if (v.template === "stat") {
    const fs = fit(v.number || die(`${v.name}: stat needs "number"`), person ? 640 : 760, 280, 0.66);
    const down = v.trend !== "up";
    const pts = down ? "0,60 90,90 170,70 260,150 340,130 430,230 520,250 610,330" : "0,330 90,280 170,300 260,200 340,220 430,120 520,130 610,40";
    const end = down ? [610, 330] : [610, 40];
    const trend = v.trend && !person ? `<svg class="trend" viewBox="0 0 620 360"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0"/><stop offset="1" stop-color="${accent}" stop-opacity=".9"/></linearGradient></defs><polyline points="${pts}" fill="none" stroke="url(#g)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${end[0]}" cy="${end[1]}" r="11" fill="${accent}"/><circle cx="${end[0]}" cy="${end[1]}" r="26" fill="${accent}" opacity=".18"/></svg>` : "";
    return page(accent, `${trend}${kicker}<div class="stat" style="--fs:${fs}px"><div class="num">${esc(v.number)}</div>${v.caption ? `<div class="cap" style="max-width:${person ? 620 : 760}px">${marked(v.caption)}</div>` : ""}</div>`, brand);
  }
  if (v.template === "versus") {
    const { left, right } = v;
    if (!left || !right) die(`${v.name}: versus needs "left" and "right"`);
    const fs = Math.min(fit(left.value, 520, 190), fit(right.value, 520, 190));
    const side = (s, cls) => `<div class="side ${cls}"><div class="lab">${esc(s.label)}</div><div class="val">${esc(s.value)}</div></div>`;
    return page(accent, `${kicker}<div class="vs" style="--fs:${fs}px">${side(left, "l")}${side(right, "r")}</div>`, brand);
  }
  die(`${v.name}: unknown template "${v.template}" (headline | stat | versus)`);
}

function render(html, out) {
  const dir = mkdtempSync(join(tmpdir(), "thumb-"));
  try {
    const file = join(dir, "t.html");
    writeFileSync(file, html);
    run(findChrome(), ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--force-device-scale-factor=1",
      // headless Chrome's viewport is shorter than --window-size: shoot a taller window and crop the frame
      "--allow-file-access-from-files", "--virtual-time-budget=3000", `--window-size=${W},${H + 200}`, `--screenshot=${join(dir, "shot.png")}`, pathToFileURL(file).href]);
    if (!existsSync(join(dir, "shot.png"))) die(`Chrome made no screenshot for ${out}`);
    run("ffmpeg", ["-y", "-v", "error", "-i", join(dir, "shot.png"), "-vf", `crop=${W}:${H}:0:0`, out]);
    const feed = out.replace(/\.png$/, "-feed.png");
    run("ffmpeg", ["-y", "-v", "error", "-i", out, "-vf", "scale=214:-2", feed]);
    console.log(`${out}\n  feed-size preview → ${feed}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (flags.demo) {
  const outDir = typeof flags.demo === "string" ? flags.demo : "thumb-demo";
  mkdirSync(outDir, { recursive: true });
  const demo = [
    { name: "headline", template: "headline", kicker: "4 reasons · 2026", lines: ["Selected.", "*Not* joined."] },
    { name: "stat", template: "stat", kicker: "Cognizant · 2026", number: "25,000", caption: "freshers hired.<br>*Still waiting?*", trend: "down" },
    { name: "versus", template: "versus", kicker: "Freshers 2026", left: { label: "Selected", value: "Yes" }, right: { label: "Joining date", value: "?" } },
  ];
  for (const v of demo) render(variantHtml({ ...v, caption: v.caption?.replace("<br>", " ") }, "#ffb300", "CRACK IT"), join(outDir, `${v.name}.png`));
} else {
  const [project, specFile] = positional;
  if (!project || !specFile) die("usage: node tools/thumb-design.mjs <project> <spec.json> | --demo <out-dir>");
  const spec = readJson(existsSync(specFile) ? specFile : join(PROJECTS, project, specFile));
  const out = join(PROJECTS, project, "output", "thumbnails");
  mkdirSync(out, { recursive: true });
  for (const v of spec.variants || die("spec has no variants")) {
    render(variantHtml(v, spec.accent || "#ffb300", spec.brand ?? "CRACK IT", join(PROJECTS, project)), join(out, `${v.name}.png`));
  }
  writeFileSync(join(out, "spec.json"), readFileSync(existsSync(specFile) ? specFile : join(PROJECTS, project, specFile)));
}
