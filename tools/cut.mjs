#!/usr/bin/env node
// Stage 1b — compile work/edl.json into the clean cut.
// Writes work/cleancut.mp4 (talking) or work/cleancut.wav (faceless VO), work/cleancut.words.json
// (words re-timed onto the clean cut), work/timeline.json (raw <-> clean segment map; the previous
// one is kept as timeline.prev.json for tools/retime.mjs), work/cleancut.transcript.md, work/cut-report.md.
// Usage: node tools/cut.mjs <project> [--dry-run] [--jobs 4] [--no-audit]
//
// edl.json shape (see .claude/skills/clean-cut/SKILL.md):
// {
//   "remove": [ { "words": "w12-w30", "reason": "false start, retaken at w31" },
//               { "time": "83.2-85.9", "reason": "cough" } ],
//   "keepPauseMax": 0.35,  // longest pause left between kept words (s)
//   "edgePad": 0.08,       // breathing room kept around each cut (s)
//   "textFixes": { "w24": "This" }, // caption text corrections (ASR misspellings, casing after a cut)
//   "holds": [ { "after": "w88", "max": 0.5 } ], // keep up to 0.5s of pause after w88 (a beat before a reveal)
//   "gaps": [ { "after": "w140", "seconds": 4 } ]  // INSERT 4s of silence after w140 (a "pause and solve"
//                                                  // timer the VO never recorded); split in the measured pause
//                                                  // nearest the word, or at "time" (raw s) when given;
//                                                  // timeline.json marks it gap_after
// }
//
// Boundary audit (on by default): every cut edge is checked on the actual audio. A segment END whose
// last 120ms goes silent and then rises again is catching the attack of the next (removed) take, so it
// is pulled back into the silence. A START that opens on sound, dips to silence, then speaks is carrying
// the tail of a removed word, so it is pushed past the silence. STT word times are routinely 50-80ms
// off, which is why this is measured rather than trusted.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  decodePcm,
  die,
  markStage,
  openProject,
  parseCli,
  probe,
  readJson,
  rmsDb,
  round3,
  run,
  ts,
  writeJson,
  writeText,
} from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths } = project;
if (!existsSync(paths.words)) die("work/words.json missing — run transcribe first");
if (!existsSync(paths.edl)) die(`work/edl.json missing — write the edit decision list first (see clean-cut skill)`);

const words = readJson(paths.words);
const edl = readJson(paths.edl);
const fps = project.data.fps;
const duration = project.data.source.duration;
const keepPauseMax = edl.keepPauseMax ?? 0.35;
const edgePad = edl.edgePad ?? 0.08;
const frame = 1 / fps;
const audioOnly = project.data.mode === "faceless" || !project.data.source.width;
const holds = new Map((edl.holds || []).map((h) => [h.after, Number(h.max ?? 0.5)]));

// ---- 1. Which words survive -------------------------------------------------
const idIndex = new Map(words.map((w, i) => [w.id, i]));
const removed = new Array(words.length).fill(null); // reason or null
const timeCuts = [];
for (const item of edl.remove || []) {
  const reason = item.reason || "unspecified";
  if (item.words) {
    for (const part of String(item.words).split(",")) {
      const [a, b = a] = part.trim().split(/\s*[-–]\s*/);
      const i = idIndex.get(a.trim());
      const j = idIndex.get(b.trim());
      if (i == null || j == null || j < i) die(`bad word range "${part}" in edl.json`);
      for (let k = i; k <= j; k++) removed[k] ??= reason;
    }
  } else if (item.time) {
    const [s, e] = String(item.time).split(/\s*[-–]\s*/).map(Number);
    if (!(e > s)) die(`bad time range "${item.time}" in edl.json`);
    timeCuts.push({ start: s, end: e, reason });
    words.forEach((w, k) => {
      // A word mostly inside a time cut goes with it.
      const overlap = Math.min(e, w.end) - Math.max(s, w.start);
      if (overlap > (w.end - w.start) / 2) removed[k] ??= reason;
    });
  } else die(`edl item needs "words" or "time": ${JSON.stringify(item)}`);
}

// ---- 2. Kept words → source segments ----------------------------------------
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
let segments = [];
let seg = null;
let lastKept = -1;
for (let k = 0; k < words.length; k++) {
  if (removed[k]) continue;
  const w = words[k];
  if (seg && lastKept === k - 1) {
    const gap = w.start - words[lastKept].end;
    const cap = holds.get(words[lastKept].id) ?? keepPauseMax;
    if (gap <= cap) {
      seg.end = w.end;
      lastKept = k;
      continue;
    }
    // natural pause that is too long: keep `cap` of it, split evenly
    seg.end = words[lastKept].end + cap / 2;
    segments.push(seg);
    seg = { start: w.start - cap / 2, end: w.end };
  } else {
    if (seg) {
      // removed material sits between lastKept and k
      const firstRemoved = words[lastKept + 1];
      seg.end = words[lastKept].end + clamp((firstRemoved.start - words[lastKept].end) * 0.5, 0.02, edgePad);
      segments.push(seg);
    }
    const prevRemoved = words[k - 1];
    const lead = prevRemoved ? clamp((w.start - prevRemoved.end) * 0.5, 0.02, edgePad) : edgePad;
    seg = { start: w.start - lead, end: w.end };
  }
  lastKept = k;
}
if (seg) {
  const after = words[lastKept + 1];
  seg.end = words[lastKept].end + (after ? clamp((after.start - words[lastKept].end) * 0.5, 0.02, edgePad) : edgePad * 2);
  segments.push(seg);
}

// Explicit time cuts can also slice through kept material (e.g. a cough mid-sentence).
for (const cut of timeCuts) {
  segments = segments.flatMap((s) => {
    if (cut.end <= s.start || cut.start >= s.end) return [s];
    const parts = [];
    if (cut.start > s.start) parts.push({ start: s.start, end: cut.start });
    if (cut.end < s.end) parts.push({ start: cut.end, end: s.end });
    return parts;
  });
}

// Boundary audit on the real audio (see header).
const audit = [];
if (!flags["no-audit"] && existsSync(paths.audio)) {
  const pcm = decodePcm(paths.audio);
  const STEP = 0.01;
  const WIN = 0.12;
  // Adaptive thresholds: a fixed -60dB "silence" never fires on a noisy room.
  const levels = [];
  for (let t = 0; t + STEP < pcm.samples.length / pcm.rate; t += 0.05) levels.push(rmsDb(pcm, t, t + STEP));
  levels.sort((a, b) => a - b);
  const floor = levels[Math.floor(levels.length * 0.1)] ?? -70;
  const SILENT = Math.max(floor + 6, -62);
  const ONSET = SILENT + 15;
  segments.forEach((s, i) => {
    if (i < segments.length - 1) {
      // END: silence followed by a fresh attack inside the last WIN -> pull back to the silence.
      let lastSilent = null;
      let leak = false;
      for (let t = s.end - WIN; t < s.end - STEP / 2; t += STEP) {
        const db = rmsDb(pcm, t, t + STEP);
        if (db < SILENT) lastSilent = t;
        else if (lastSilent != null && db > ONSET) leak = true;
      }
      if (leak && lastSilent != null && lastSilent - s.start > 0.2) {
        audit.push(`end   ${ts(s.end)} -> ${ts(lastSilent + STEP)} (attack of the next take leaked in)`);
        s.end = lastSilent + STEP;
      }
    }
    if (i > 0) {
      // START: sound, then silence, inside the first WIN -> the tail of a removed word.
      if (rmsDb(pcm, s.start, s.start + STEP) > ONSET) {
        for (let t = s.start + STEP; t < s.start + WIN; t += STEP) {
          if (rmsDb(pcm, t, t + STEP) < SILENT) {
            audit.push(`start ${ts(s.start)} -> ${ts(t)} (tail of a removed word leaked in)`);
            s.start = t;
            break;
          }
        }
      }
    }
  });
}

// Fragile words: a very short (or zero-width) STT word sitting on a cut is how "not everyone"
// silently became "everyone" in the template's history. Flag them for a listen.
const fragile = [];
words.forEach((w, k) => {
  if (removed[k] || w.type !== "word" || w.end - w.start >= 0.06) return;
  const near = segments.some((sg) => Math.abs(w.start - sg.start) < 0.08 || Math.abs(w.end - sg.end) < 0.08);
  if (near) fragile.push(`${w.id} "${w.text}" (${((w.end - w.start) * 1000).toFixed(0)}ms) at ${ts(w.start)}`);
});

// Snap to the output frame grid so video (whole frames) and audio stay in sync across N joins.
const snap = (t) => Math.round(clamp(t, 0, duration) / frame) * frame;
segments = segments
  .map((s) => ({ start: snap(s.start), end: snap(s.end) }))
  .filter((s) => s.end - s.start >= frame * 3)
  .reduce((acc, s) => {
    const prev = acc.at(-1);
    if (prev && s.start <= prev.end + frame) prev.end = Math.max(prev.end, s.end);
    else acc.push({ ...s });
    return acc;
  }, []);
if (!segments.length) die("nothing left after cuts");

// Inserted silences ("gaps"): split the segment in the real pause after the word and pad the clean cut
// there. STT word ends are not trusted at a splice (whisper ran 0.3s early on TTS once): the split goes
// in the middle of the measured silence (10ms RMS under the floor, ≥80ms) nearest the word's end.
const gapPcm = edl.gaps?.length && existsSync(paths.audio) ? decodePcm(paths.audio) : null;
const gapReport = [];
for (const g of edl.gaps || []) {
  const k = idIndex.get(g.after);
  if (k == null || removed[k]) die(`gap after "${g.after}": no such kept word`);
  const w = words[k];
  const next = words.slice(k + 1).find((x) => x.type === "word");
  let at = next ? Math.min(w.end + 0.06, (w.end + next.start) / 2) : w.end + 0.06;
  if (g.time != null) {
    // A split point chosen by hand (measured + re-transcribed): trust it.
    at = Number(g.time);
    gapReport.push(`${g.after} "${w.text}": hand-placed split @${ts(at)}${g.note ? ` (${g.note})` : ""}`);
  } else if (gapPcm) {
    const STEP = 0.01;
    const levels = [];
    for (let t = w.end - 1.5; t < w.end + 1.5; t += STEP) levels.push(rmsDb(gapPcm, t, t + STEP));
    const sorted = levels.slice().sort((a, b) => a - b);
    const SIL = Math.min(-40, sorted[Math.floor(sorted.length * 0.1)] + 8);
    let best = null;
    for (let i = 0; i < levels.length; ) {
      if (levels[i] >= SIL) { i++; continue; }
      let j = i;
      while (j < levels.length && levels[j] < SIL) j++;
      const s = w.end - 1.5 + i * STEP, e = w.end - 1.5 + j * STEP;
      if (e - s >= 0.06 && e > w.end - 0.9 && s < w.end + 0.7) {
        const mid = (s + e) / 2;
        if (!best || Math.abs(mid - w.end) < Math.abs(best.mid - w.end)) best = { mid, len: e - s };
      }
      i = j;
    }
    if (!best) {
      // TTS can run sentences together: fall back to the quietest 30ms inside -0.5/+0.4s, and flag it.
      let q = null;
      for (let t = w.end - 0.5; t < w.end + 0.4; t += STEP) {
        const db = rmsDb(gapPcm, t, t + 0.03);
        if (!q || db < q.db) q = { t: t + 0.015, db };
      }
      at = q.t;
      gapReport.push(`${g.after} "${w.text}": STT end ${ts(w.end)} → NO clean pause, quietest point @${ts(at)} (${q.db.toFixed(0)} dB) — LISTEN`);
    } else {
      at = best.mid;
      gapReport.push(`${g.after} "${w.text}": STT end ${ts(w.end)} → split in a ${(best.len * 1000).toFixed(0)}ms pause @${ts(at)}`);
    }
  }
  at = snap(at);
  let i = segments.findIndex((sg) => at > sg.start && at <= sg.end + frame / 2);
  // In a natural pause the cut already trimmed: pad after the segment that ends before it.
  if (i < 0) i = segments.findIndex((sg, j) => sg.end <= at && (segments[j + 1]?.start ?? Infinity) >= at);
  if (i < 0) die(`gap after "${g.after}": ${ts(at)} is not inside the clean cut`);
  const sg = segments[i];
  // The tail half keeps any gap already scheduled at this segment's end.
  if (at < sg.end - frame) segments.splice(i + 1, 0, { start: at, end: sg.end, gapAfter: sg.gapAfter }), (sg.end = at);
  sg.gapAfter = Math.round(Number(g.seconds) / frame) * frame;
}

// ---- 3. Re-time kept words onto the clean-cut timeline ----------------------
let cursor = 0;
for (const s of segments) {
  s.outStart = round3(cursor);
  cursor += s.end - s.start;
  s.outEnd = round3(cursor);
  cursor += s.gapAfter || 0;
}
const cleanWords = [];
words.forEach((w, k) => {
  if (removed[k]) return;
  let s = segments.find((sg) => w.start >= sg.start - 0.05 && w.end <= sg.end + 0.05);
  // A word straddling an inserted-gap split (STT times are a little off there) goes to the segment
  // holding most of it, not nowhere.
  if (!s && segments.some((sg) => sg.gapAfter)) {
    const ov = (sg) => Math.min(sg.end, w.end) - Math.max(sg.start, w.start);
    const bestSeg = segments.reduce((m, sg) => (ov(sg) > ov(m) ? sg : m), segments[0]);
    if (ov(bestSeg) > 0 && segments.some((sg) => sg.gapAfter && (sg === bestSeg || sg.end === bestSeg.start))) s = bestSeg;
  }
  if (!s) return; // sliced away by a time cut
  const shift = s.outStart - s.start;
  cleanWords.push({
    id: `w${cleanWords.length}`,
    text: edl.textFixes?.[w.id] ?? w.text,
    start: round3(Math.max(s.outStart, w.start + shift)),
    end: round3(Math.min(s.outEnd, w.end + shift)),
    type: w.type,
    src: w.id,
  });
});

// ---- 4. Reports --------------------------------------------------------------
const keptSec = cursor;
const removedGroups = [];
words.forEach((w, k) => {
  if (!removed[k]) return;
  const g = removedGroups.at(-1);
  if (g && g.last === k - 1 && g.reason === removed[k]) {
    g.last = k;
    g.text.push(w.text);
  } else removedGroups.push({ first: k, last: k, reason: removed[k], text: [w.text] });
});
const report = [
  `# Cut report`,
  ``,
  `- source ${ts(duration)} → clean cut ${ts(keptSec)} (${((1 - keptSec / duration) * 100).toFixed(1)}% removed)`,
  ...(edl.gaps?.length ? [`- ${edl.gaps.length} inserted silence gap(s), ${round3(segments.reduce((a, sg) => a + (sg.gapAfter || 0), 0))}s total`] : []),
  `- ${segments.length} segments · keepPauseMax ${keepPauseMax}s · edgePad ${edgePad}s · ${fps}fps grid`,
  ...(gapReport.length ? [``, `## Inserted gaps`, ``, ...gapReport.map((r) => `- ${r}`)] : []),
  ``,
  `## Boundary audit`,
  ``,
  ...(audit.length ? audit.map((a) => `- ${a}`) : ["- no leaks found"]),
  ...(fragile.length
    ? ["", "**Fragile words on a cut (check meaning, negations especially):**", ...fragile.map((f) => `- ${f}`)]
    : []),
  ``,
  `## Removed`,
  ``,
  ...removedGroups.map(
    (g) => `- ${words[g.first].id}–${words[g.last].id} [${ts(words[g.first].start)}] **${g.reason}** — "${g.text.join(" ")}"`,
  ),
  ...timeCuts.map((c) => `- time ${ts(c.start)}–${ts(c.end)} **${c.reason}**`),
  ``,
  `## Clean script (what the viewer will hear)`,
  ``,
  cleanScript(cleanWords),
  ``,
].join("\n");
writeText(paths.cutReport, report);
writeText(paths.cleanTranscriptMd, renderClean(cleanWords));

console.log(
  `${segments.length} segments, ${ts(duration)} → ${ts(keptSec)} (${((1 - keptSec / duration) * 100).toFixed(1)}% removed)`,
);
console.log(`report: ${paths.cutReport}`);
if (audit.length) console.log(`boundary audit moved ${audit.length} edge(s), see report`);
if (fragile.length) console.log(`WARNING: ${fragile.length} fragile word(s) on a cut: ${fragile.join("; ")}`);
if (flags["dry-run"]) {
  console.log("\n" + cleanScript(cleanWords));
  process.exit(0);
}

// ---- 5. Render: per-segment intermediates (PCM audio), then one concat encode -
const src = project.data.source.file;
const tmp = mkdtempSync(join(tmpdir(), "ai-edits-cut-"));
const FADE = 0.012; // tiny audio ramps kill clicks at the joins
try {
  const jobs = Number(flags.jobs) || 4;
  const parts = segments.map((_, i) => join(tmp, `seg-${String(i).padStart(4, "0")}.${audioOnly ? "wav" : "mkv"}`));
  if (!audioOnly && segments.some((sg) => sg.gapAfter)) die("gaps are only supported for faceless (audio-only) cuts");
  const gapPart = (i) => join(tmp, `gap-${String(i).padStart(4, "0")}.wav`);
  for (const [i, sg] of segments.entries())
    if (sg.gapAfter)
      await spawnAsync("ffmpeg", ["-y", "-v", "error", "-nostdin", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
        "-t", sg.gapAfter.toFixed(4), "-c:a", "pcm_s16le", gapPart(i)]);
  let next = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(jobs, segments.length) }, async () => {
      while (next < segments.length) {
        const i = next++;
        const s = segments[i];
        const dur = s.end - s.start;
        const fades = [];
        if (i > 0) fades.push(`afade=t=in:st=0:d=${FADE}`);
        if (i < segments.length - 1) fades.push(`afade=t=out:st=${(dur - FADE).toFixed(4)}:d=${FADE}`);
        await spawnAsync("ffmpeg", [
          "-y", "-v", "error", "-nostdin",
          "-ss", s.start.toFixed(4), "-i", src, "-t", dur.toFixed(4),
          ...(audioOnly ? ["-map", "0:a:0"] : ["-map", "0:v:0", "-map", "0:a:0", "-vf", `fps=${fps},format=yuv420p`]),
          ...(fades.length ? ["-af", fades.join(",")] : []),
          ...(audioOnly ? [] : ["-c:v", "libx264", "-preset", "veryfast", "-crf", "14"]),
          "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2",
          parts[i],
        ]);
        process.stdout.write(`\rencoded ${++done}/${segments.length} segments`);
      }
    }),
  );
  process.stdout.write("\n");
  const list = join(tmp, "list.txt");
  const order = parts.flatMap((p, i) => (segments[i].gapAfter ? [p, gapPart(i)] : [p]));
  writeFileSync(list, order.map((p) => `file '${p.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n") + "\n");
  run("ffmpeg", [
    "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list,
    ...(audioOnly
      ? ["-c:a", "pcm_s16le"]
      : ["-c:v", "libx264", "-preset", "medium", "-crf", "17", "-r", String(fps), "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"]),
    paths.cleancut,
  ]);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const out = probe(paths.cleancut);
writeJson(paths.cleanWords, cleanWords);
const timelineFile = join(paths.work, "timeline.json");
if (existsSync(timelineFile)) renameSync(timelineFile, join(paths.work, "timeline.prev.json"));
writeJson(timelineFile, segments.map((sg) => ({ raw_start: round3(sg.start), raw_end: round3(sg.end), start: sg.outStart, end: sg.outEnd, ...(sg.gapAfter ? { gap_after: round3(sg.gapAfter) } : {}) })));
project.data.cleancut = { file: paths.cleancut, duration: out.duration, width: out.width, height: out.height, fps };
markStage(project, "cut", { segments: segments.length, kept: round3(keptSec) });
console.log(`clean cut: ${paths.cleancut} (${out.duration.toFixed(2)}s, expected ${keptSec.toFixed(2)}s)`);
if (existsSync(paths.visualPlan) || existsSync(paths.audioPlan))
  console.log(`RE-CUT: plans exist, run "node tools/retime.mjs ${project.data.name}" to carry them onto the new timeline`);
else console.log(`next: write work/visual-plan.json, then npm run visuals -- ${project.data.name}`);

function spawnAsync(cmd, args) {
  return new Promise((resolvePromise, reject) => {
    const p = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolvePromise() : reject(new Error(`${cmd} exited ${code}: ${err.slice(-800)}`))));
  });
}

function cleanScript(list) {
  return list.filter((w) => w.type === "word").map((w) => w.text).join(" ");
}

function renderClean(list) {
  const lines = [];
  let cur = [];
  for (const w of list) {
    cur.push(w);
    if (/[.?!।॥]$/.test(w.text) || cur.length >= 14) (lines.push(cur), (cur = []));
  }
  if (cur.length) lines.push(cur);
  return [
    "# Clean-cut transcript (clean-cut timeline — use these times for overlays, SFX, b-roll, captions)",
    "",
    ...lines.map((l) => `[${ts(l[0].start)}–${ts(l.at(-1).end)}] ${l[0].id}–${l.at(-1).id} | ${l.map((w) => w.text).join(" ")}`),
    "",
  ].join("\n");
}
