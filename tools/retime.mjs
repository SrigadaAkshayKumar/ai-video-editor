#!/usr/bin/env node
// After a re-cut, carry the visual and audio plans onto the new clean-cut timeline:
// old clean time -> raw time (timeline.prev.json) -> new clean time (timeline.json).
// Every beat stays glued to the words it was written for. Anything whose start now falls
// inside removed material is DROPPED AND LISTED (the template learned that a silent drop
// looks identical to a clean shift), and faceless scenes are healed back into a contiguous track.
// Usage: node tools/retime.mjs <project> [--dry-run]
import { existsSync } from "node:fs";
import { join } from "node:path";
import { die, openProject, parseCli, readJson, round3, ts, writeJson } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths } = project;
const prevFile = join(paths.work, "timeline.prev.json");
const curFile = join(paths.work, "timeline.json");
if (!existsSync(prevFile)) die("no work/timeline.prev.json — retime is only needed after a re-cut");
const prev = readJson(prevFile);
const cur = readJson(curFile);

const toRaw = (t) => {
  const s = prev.find((x) => t >= x.start - 1e-6 && t < x.end + 1e-6) ?? (t >= prev.at(-1).end ? prev.at(-1) : null);
  return s ? s.raw_start + (t - s.start) : null;
};
const toNew = (raw) => {
  const s = cur.find((x) => raw >= x.raw_start - 0.03 && raw <= x.raw_end + 0.03);
  return s ? round3(Math.max(s.start, Math.min(s.end, s.start + (raw - s.raw_start)))) : null;
};
// A time inside an inserted silence gap (cut.mjs "gaps") has no raw time: carry it as an offset into
// the gap that follows the same raw segment end on the new timeline.
const inGap = (t) => prev.find((x) => x.gap_after && t >= x.end - 1e-6 && t < x.end + x.gap_after + 1e-6);
const map = (t) => {
  const g = inGap(t);
  if (g) {
    const n = cur.find((x) => x.gap_after && Math.abs(x.raw_end - g.raw_end) < 0.05);
    return n ? round3(n.end + Math.min(t - g.end, n.gap_after)) : null;
  }
  const raw = toRaw(t);
  return raw == null ? null : toNew(raw);
};
const newEnd = cur.at(-1).end;
const dropped = [];
let moved = 0;

function shiftPoint(list, field, label) {
  return (list || []).filter((item) => {
    const t = map(item[field]);
    if (t == null) {
      dropped.push(`${label} at ${ts(item[field])}: ${item.type || item.sfx || item.kind || item.query || ""}`);
      return false;
    }
    if (Math.abs(t - item[field]) > 1e-3) moved++;
    item[field] = t;
    return true;
  });
}

function shiftRange(list, label) {
  return (list || []).filter((item) => {
    const s = map(item.start);
    if (s == null) {
      dropped.push(`${label} ${ts(item.start)}-${ts(item.end)}: ${item.mood || item.kind || ""}`);
      return false;
    }
    let e = map(item.end);
    // end inside removed material: keep the range up to the next surviving time
    if (e == null) e = Math.min(newEnd, s + (item.end - item.start));
    if (Math.abs(s - item.start) > 1e-3) moved++;
    item.start = s;
    item.end = Math.max(s + 0.1, e);
    return true;
  });
}

if (existsSync(paths.visualPlan)) {
  const plan = readJson(paths.visualPlan);
  const before = { overlays: plan.overlays?.length ?? 0, brolls: plan.brolls?.length ?? 0, scenes: plan.scenes?.length ?? 0 };
  plan.overlays = shiftPoint(plan.overlays, "start", "overlay");
  plan.brolls = shiftPoint(plan.brolls, "start", "b-roll");
  plan.camera_moves = shiftPoint(plan.camera_moves, "start", "camera move");
  plan.caption_blackouts = shiftRange(plan.caption_blackouts, "caption blackout");
  if (plan.scenes?.length) {
    plan.scenes = shiftRange(plan.scenes, "scene");
    // heal: contiguous from 0 to the new end; absorb anything a removal shrank under 1.2s
    plan.scenes.sort((a, b) => a.start - b.start);
    plan.scenes = plan.scenes.filter((sc, i) => i === 0 || sc.end - sc.start >= 1.2);
    plan.scenes.forEach((sc, i) => {
      sc.index = i;
      sc.start = i === 0 ? 0 : plan.scenes[i - 1].end;
      if (i === plan.scenes.length - 1) sc.end = newEnd;
      else sc.end = Math.max(sc.start + 0.5, Math.min(sc.end, plan.scenes[i + 1].start));
    });
    for (let i = 0; i < plan.scenes.length - 1; i++) plan.scenes[i].end = plan.scenes[i + 1].start;
  }
  const after = { overlays: plan.overlays.length, brolls: plan.brolls.length, scenes: plan.scenes?.length ?? 0 };
  console.log(`visual plan: overlays ${before.overlays}→${after.overlays}, b-roll ${before.brolls}→${after.brolls}, scenes ${before.scenes}→${after.scenes}`);
  if (!flags["dry-run"]) writeJson(paths.visualPlan, plan);
}

if (existsSync(paths.audioPlan)) {
  const plan = readJson(paths.audioPlan);
  const before = { music: plan.music_cues?.length ?? 0, sfx: plan.sfx_events?.length ?? 0 };
  plan.music_cues = shiftRange(plan.music_cues, "music cue");
  plan.sfx_events = shiftPoint(plan.sfx_events, "time", "sfx");
  console.log(`audio plan: music ${before.music}→${plan.music_cues.length}, sfx ${before.sfx}→${plan.sfx_events.length}`);
  if (!flags["dry-run"]) writeJson(paths.audioPlan, plan);
}

console.log(`${moved} item(s) shifted onto the new timeline (${ts(prev.at(-1).end)} → ${ts(newEnd)})`);
if (dropped.length) {
  console.log(`\nDROPPED ${dropped.length} item(s) — their moment was cut. Re-place them by hand if still wanted:`);
  for (const d of dropped) console.log(`  - ${d}`);
}
console.log(`next: npm run visuals -- ${project.data.name}  (then scaffold refresh + finalize)`);
