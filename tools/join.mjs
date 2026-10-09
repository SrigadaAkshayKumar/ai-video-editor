#!/usr/bin/env node
// Join finished part videos (a long video edited as 3-4 min parts) into one file, losslessly:
// ffmpeg concat with stream copy — no re-encode, ~100 MB RAM, about a minute for 30 minutes of video.
// Every part comes out of finalize with the same codec/size/fps/audio settings, which stream copy needs;
// a mismatch is refused (it would play back wrong) instead of silently re-encoding.
// Usage: node tools/join.mjs <out-name> <project-or-mp4> <project-or-mp4> … [--format 16x9]
//   a project name resolves to projects/<p>/output/final-<format>.mp4
//   → output/<out-name>-<format>.mp4 at the repo root (+ a combined credits file when parts have them)
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { ROOT, die, parseCli, probe, run, ts } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const [outName, ...parts] = positional;
if (!outName || parts.length < 2) die("usage: node tools/join.mjs <out-name> <part1> <part2> … [--format 16x9]");
const fmt = flags.format || "16x9";

const files = parts.map((p) => {
  const asProject = join(ROOT, "projects", p, "output", `final-${fmt}.mp4`);
  const f = existsSync(asProject) ? asProject : resolve(p);
  if (!existsSync(f)) die(`part not found: ${p} (no ${asProject})`);
  return f;
});

// Stream copy only works when every part matches the first one.
const infos = files.map((f) => ({ f, ...probe(f) }));
const key = (i) => `${i.videoCodec} ${i.width}x${i.height} @${i.fps} · ${i.audioCodec}`;
const bad = infos.filter((i) => key(i) !== key(infos[0]));
if (bad.length) die(`parts differ, cannot stream-copy:\n${infos.map((i) => `  ${key(i)}  ${i.f}`).join("\n")}`);

const outDir = join(ROOT, "output");
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${outName}-${fmt}.mp4`);
const tmp = mkdtempSync(join(tmpdir(), "ai-edits-join-"));
try {
  const list = join(tmp, "list.txt");
  writeFileSync(list, files.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n") + "\n");
  run("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", out]);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const want = infos.reduce((a, i) => a + i.duration, 0);
const got = probe(out).duration;
infos.forEach((i, k) => console.log(`part ${k + 1}: ${ts(i.duration)}  ${i.f}`));
console.log(`joined → ${out}  (${ts(got)}, parts sum ${ts(want)})`);
if (Math.abs(got - want) > 0.5) console.log(`WARNING: joined length is off by ${(got - want).toFixed(2)}s — check the joins`);

// One credits file for the description: every part's credits.md, de-duplicated by line.
const credits = files.map((f) => join(f, "..", "credits.md")).filter(existsSync);
if (credits.length) {
  const seen = new Set();
  const lines = credits.flatMap((c) => readFileSync(c, "utf8").split("\n")).filter((l) => !l.trim() || !seen.has(l) && seen.add(l));
  const cf = join(outDir, `${outName}-credits.md`);
  writeFileSync(cf, lines.join("\n").replace(/\n{3,}/g, "\n\n"));
  console.log(`credits → ${cf}  (REQUIRED in the YouTube description)`);
}
