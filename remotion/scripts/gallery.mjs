// Render one still per overlay type (the Doc composition's gallery default
// props) at 16:9 and 9:16, plus a contact sheet per size, for visual QA.
// Usage: node scripts/gallery.mjs [--out ../projects/_gallery] [--style glass|broadcast|liquid|blueprint|cleantech] [--only bar_chart,flow_diagram]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
};
const outDir = resolve(arg("out", "out/gallery"));
const style = arg("style", "glass");
const only = arg("only", "")?.split(",").filter(Boolean);
mkdirSync(outDir, { recursive: true });

console.log("bundling…");
const serveUrl = await bundle({ entryPoint: resolve("src/index.ts") });
const sizes = [
  ["16x9", 1920, 1080],
  ["9x16", 1080, 1920],
];
for (const [key, width, height] of sizes) {
  const base = await selectComposition({ serveUrl, id: "Doc", inputProps: {} });
  const props = { ...base.props, width, height, styleVariant: style };
  const composition = await selectComposition({ serveUrl, id: "Doc", inputProps: props });
  const dir = join(outDir, `${style}-${key}`);
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (const ov of props.overlays) {
    if (only?.length && !only.includes(ov.type)) continue;
    const at = ov.start + Math.min(1.6, ov.duration * 0.55);
    const file = join(dir, `${String(files.length).padStart(2, "0")}-${ov.type}.png`);
    await renderStill({ composition, serveUrl, output: file, inputProps: props, frame: Math.round(at * props.fps) });
    files.push(file);
    process.stdout.write(`\r${key}: ${files.length} stills`);
  }
  process.stdout.write("\n");
  // contact sheet: 4 columns, scaled down, labelled by filename order
  const cols = 4;
  const w = key === "16x9" ? 480 : 270;
  const sheet = join(outDir, `${style}-${key}-sheet.jpg`);
  const inputs = files.flatMap((f) => ["-i", f]);
  const filters = files.map((_, i) => `[${i}:v]scale=${w}:-1[s${i}]`).join(";");
  const rows = Math.ceil(files.length / cols);
  const layout = files.map((_, i) => `${(i % cols) === 0 ? "0" : Array.from({ length: i % cols }, (_, k) => `w${k}`).join("+")}_${Math.floor(i / cols) === 0 ? "0" : Array.from({ length: Math.floor(i / cols) }, (_, k) => `h${k * cols}`).join("+")}`).join("|");
  execFileSync("ffmpeg", [
    "-y", "-v", "error", ...inputs,
    "-filter_complex", `${filters};${files.map((_, i) => `[s${i}]`).join("")}xstack=inputs=${files.length}:layout=${layout}:fill=black[out]`,
    "-map", "[out]", "-frames:v", "1", "-q:v", "3", sheet,
  ]);
  console.log(`${key}: ${files.length} stills → ${dir}\n  sheet → ${sheet} (${rows} rows)`);
}
