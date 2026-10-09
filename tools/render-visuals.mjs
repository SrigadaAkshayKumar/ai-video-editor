#!/usr/bin/env node
// Picture pass: validate work/visual-plan.json, then render the Remotion `Doc` composition per format
// into work/visuals-<fmt>.mp4 (MUTED — audio is tools/mix.mjs's job).
// Usage: node tools/render-visuals.mjs <project> [--format 9:16] [--check] [--stills 1.5,12.0,40]
//   --check   validate only (fast; run after every plan edit)
//   --stills  render only these clean-cut times as PNGs into work/stills-<fmt>/ (QA before a long render)
//
// visual-plan.json (all times on the CLEAN-CUT timeline):
// {
//   "style": "glass" | "broadcast" | "liquid" | "blueprint" | "cleantech",                    // optional, defaults to project style
//   "framing": { "9:16": "45% 40%" },                    // a-roll object-position per format (talking)
//   "rail": true,                                        // chapter rail on/off
//   "overlays":   [ { "start", "duration", "type", ... , "only": "9:16"? } ],   // see motion-graphics skill
//   "brolls":     [ { "start", "duration", "src": "assets/broll/x.mp4", "media_start", "motion", "grade", "transition", "position" } ],
//   "scenes":     [ { "start", "end", "kind": "broll|still|news|graphic", "src", "src_portrait", ... } ],   // faceless
//   "camera_moves": [ { "start", "duration", "kind": "punch_in|drift_in|pull_out|whip", "scale" } ],
//   "caption_blackouts": [ { "start", "end" } ]          // honoured by tools/captions.mjs
// }
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  REMOTION_DIR,
  die,
  linkOrCopy,
  markStage,
  openProject,
  parseCli,
  probe,
  readJson,
  round3,
  run,
  selectFormats,
  ts,
  writeJson,
} from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths, data } = project;
if (!data.cleancut) die("no clean cut yet — run cut first");
if (!existsSync(paths.visualPlan)) die("work/visual-plan.json missing — write the plan first (motion-graphics skill)");
const plan = readJson(paths.visualPlan);
const D = data.cleancut.duration;
const mode = data.mode || "talking";

// ---- validation ---------------------------------------------------------------------------
const errors = [];
const warns = [];
const num = (v) => typeof v === "number" && Number.isFinite(v);
const items = (ov, min = 1) => Array.isArray(ov.items) && ov.items.length >= min;
const DOCK = ["bar_chart", "line_chart", "donut_chart", "progress_ring", "step_progress", "timeline", "bullet_list", "comparison", "term_card"];
const MARKS = ["keyword_chip", "lower_third", "side_note", "annotation", "marquee_strip", "speed_hint", "sample_answer"];
// Required props per component: the template's most common silent defect was a component drawing
// nothing because a field had the wrong name. Each rule names the exact field the component reads.
const RULES = {
  title_slide: [(o) => Boolean(o.text), "title_slide needs text"],
  speed_hint: [() => true, ""],
  chapter_open: [(o) => Boolean(o.text), "chapter_open needs text (2-5 word title)"],
  big_statement: [(o) => Boolean(o.text), "big_statement needs text"],
  word_swap: [(o) => Boolean((o.to && (o.from || o.text))), "word_swap needs from + to"],
  quote_pull: [(o) => Boolean(o.text), "quote_pull needs text"],
  number_roll: [(o) => Boolean(num(o.value)), "number_roll needs a numeric value (use big_statement for a phrase)"],
  stat_trio: [(o) => Boolean((items(o, 2) && o.items.every((i) => num(i.value)))), "stat_trio items each need a numeric value (else it draws a literal 0)"],
  flow_diagram: [(o) => Boolean(items(o, 2)), "flow_diagram needs ≥2 items [{label, sublabel}]"],
  matrix_grid: [(o) => Boolean(items(o, 2)), "matrix_grid needs items"],
  checklist: [(o) => Boolean((items(o) && o.items.every((i) => i.state === "yes" || i.state === "no"))), 'checklist items need state "yes"|"no"'],
  data_table: [(o) => Array.isArray(o.columns) && o.columns.length >= 2 && Array.isArray(o.rows) && o.rows.length >= 1 && o.rows.every((r) => Array.isArray(r.cells) && r.cells.length === o.columns.length), "data_table needs columns [≥2] and rows [{cells: one per column, at?}]"],
  bar_chart: [(o) => Boolean((items(o, 2) && o.items.every((i) => num(i.value)))), "bar_chart items need numeric values"],
  line_chart: [(o) => Boolean((items(o, 2) && o.items.every((i) => num(i.value)))), "line_chart items need numeric values"],
  donut_chart: [(o) => Boolean((items(o, 2) && o.items.every((i) => num(i.value)))), "donut_chart items need numeric values"],
  progress_ring: [(o) => Boolean(num(o.value)), "progress_ring reads `value` (0-100), not `current`"],
  step_progress: [(o) => Boolean((items(o, 2) && num(o.current_step))), "step_progress needs items + numeric current_step (item values are ignored)"],
  timeline: [(o) => Boolean(items(o, 2)), "timeline needs items [{label, sublabel}]"],
  bullet_list: [(o) => Boolean(items(o)), "bullet_list needs items"],
  comparison: [(o) => Boolean((o.left?.text && o.right?.text)), "comparison reads left/right {label, text} — NOT items (renders blank cards)"],
  term_card: [(o) => Boolean((o.text && o.items?.[0]?.label)), "term_card needs text (term) + items[0].label (definition)"],
  fact_band: [(o) => Boolean((items(o, 2) && o.items.every((i) => i.label))), "fact_band needs 2-3 items {label, sublabel}"],
  keyword_chip: [(o) => Boolean(o.text), "keyword_chip needs text"],
  lower_third: [(o) => Boolean(o.text), "lower_third needs text"],
  side_note: [(o) => Boolean(o.text), "side_note needs text"],
  annotation: [(o) => Boolean(o.text), "annotation needs text"],
  marquee_strip: [(o) => Boolean(o.text), "marquee_strip needs text"],
  poll_prompt: [(o) => Boolean((o.text && items(o, 2))), "poll_prompt needs text + 2-3 items"],
  sample_answer: [(o) => Boolean(o.text), "sample_answer needs text"],
  question_card: [(o) => Boolean(o.text) && (o.timer == null || (num(o.timer) && num(o.timer_at ?? 0))), "question_card needs text (+ numeric timer / timer_at, seconds into the overlay)"],
};

const overlays = (plan.overlays || []).slice().sort((a, b) => a.start - b.start);
overlays.forEach((o, i) => {
  const where = `overlay #${i} ${o.type} @${ts(o.start ?? 0)}`;
  if (!RULES[o.type]) return errors.push(`${where}: unknown type`);
  if (!num(o.start) || !num(o.duration) || o.duration <= 0) return errors.push(`${where}: needs numeric start + duration`);
  const [ok, msg] = RULES[o.type];
  if (!ok(o)) errors.push(`${where}: ${msg}`);
  if (DOCK.includes(o.type) && !o.side) errors.push(`${where}: dock components need "side": "left"|"right"`);
  if (o.start + o.duration > D + 0.05) warns.push(`${where}: runs past the end (${ts(D)})`);
  if (o.type === "chapter_open" && o.duration < 3) warns.push(`${where}: chapter_open needs ≥3s`);
  const chars = (o.text || "").length + (o.items || []).reduce((n, it) => n + (it.label || "").length, 0);
  if (o.type !== "sample_answer" && chars / 15 > o.duration + 0.5) warns.push(`${where}: ~${chars} chars in ${o.duration}s — too fast to read (~15 chars/s)`);
  const next = overlays[i + 1];
  if (next && next.start < o.start + o.duration - 0.05 && !(MARKS.includes(next.type) && MARKS.includes(o.type)))
    warns.push(`${where} overlaps ${next.type} @${ts(next.start)} — overlays should not overlap`);
});
for (const ch of overlays.filter((o) => o.type === "chapter_open"))
  for (const o of overlays)
    if (o !== ch && o.start < ch.start + ch.duration && o.start + o.duration > ch.start)
      errors.push(`${o.type} @${ts(o.start)} inside chapter_open @${ts(ch.start)} — nothing else may share its window`);

const checkMedia = (rel, what, need) => {
  const file = join(project.dir, rel || "");
  if (!rel || !existsSync(file)) return errors.push(`${what}: missing file ${rel || "(no src)"}`);
  if (need && /\.(mp4|mov|webm|mkv)$/i.test(rel)) {
    const len = probe(file).duration;
    if (len + 0.05 < need) warns.push(`${what}: clip is ${len.toFixed(1)}s but needs ${need.toFixed(1)}s — it will freeze on its last frame`);
  }
};
(plan.brolls || []).forEach((b, i) => {
  if (mode !== "talking") return warns.push("brolls[] is for talking-head edits; faceless uses scenes[]");
  checkMedia(b.src, `b-roll #${i} @${ts(b.start)}`, (b.media_start || 0) + b.duration);
  if (b.duration < 2 || b.duration > 5.5) warns.push(`b-roll #${i} @${ts(b.start)}: ${b.duration}s (2.0-4.5s reads best)`);
});
// News scenes take their screenshots from work/news.json (tools/news.mjs) by URL.
const newsManifest = existsSync(paths.news) ? readJson(paths.news) : {};
for (const sc of plan.scenes || []) {
  if (sc.kind !== "news" || !sc.url || !newsManifest[sc.url]) continue;
  sc.src ??= newsManifest[sc.url].path;
  sc.src_portrait ??= newsManifest[sc.url].path_portrait;
}
// A reframing overlay (takeover/corner/dock/band) over a news scene shrinks, dims or blurs the cited
// article into a thumbnail exactly when it matters. Over news, only light full-bleed marks.
const REFRAMING = new Set(["chapter_open", "big_statement", "word_swap", "quote_pull", "poll_prompt", "title_slide", "question_card",
  "number_roll", "stat_trio", "flow_diagram", "matrix_grid", "checklist", "data_table", "fact_band", ...DOCK]);
for (const sc of (plan.scenes || []).filter((x) => x.kind === "news"))
  for (const o of overlays)
    if (REFRAMING.has(o.type) && o.start < sc.end && o.start + o.duration > sc.start)
      errors.push(`${o.type} @${ts(o.start)} reframes the picture over the news scene @${ts(sc.start)} — the article becomes unreadable; use keyword_chip/side_note/annotation there or move it`);
if (mode === "faceless") {
  const scenes = (plan.scenes || []).slice().sort((a, b) => a.start - b.start);
  if (!scenes.length) errors.push("faceless edit needs scenes[] covering the whole timeline");
  let t = 0;
  scenes.forEach((sc, i) => {
    const where = `scene #${i} ${sc.kind} @${ts(sc.start)}`;
    if (Math.abs(sc.start - t) > 0.05) errors.push(`${where}: gap/overlap — scenes must be contiguous (expected start ${ts(t)})`);
    t = sc.end;
    if (!["broll", "still", "news", "graphic"].includes(sc.kind)) errors.push(`${where}: unknown kind`);
    if (sc.kind !== "graphic") checkMedia(sc.src, where, sc.kind === "broll" ? (sc.media_start || 0) + (sc.end - sc.start) : 0);
    if (sc.src_portrait) checkMedia(sc.src_portrait, `${where} (portrait)`);
    if (sc.kind === "news" && !(sc.source && sc.url)) errors.push(`${where}: news scenes need source + url (attribution is not optional)`);
    const len = sc.end - sc.start;
    if (len > 12) warns.push(`${where}: ${len.toFixed(1)}s — over ~12s the picture goes dead`);
  });
  if (Math.abs(t - D) > 0.1) errors.push(`scenes end at ${ts(t)} but the cut is ${ts(D)}`);
  if (scenes.filter((s) => s.transition === "flash").length > 2) warns.push("more than 2 flash transitions — it stops working the third time");
}
for (const m of plan.camera_moves || [])
  if (m.scale < 1.03 || m.scale > 1.2) warns.push(`camera move @${ts(m.start)}: scale ${m.scale} (keep 1.04-1.15)`);

for (const w of warns) console.log(`  warn: ${w}`);
for (const e of errors) console.log(`  ERROR: ${e}`);
console.log(`plan: ${overlays.length} overlays, ${(plan.brolls || []).length} b-roll, ${(plan.scenes || []).length} scenes, ${(plan.camera_moves || []).length} camera moves — ${errors.length} errors, ${warns.length} warnings`);
if (errors.length) die("fix the plan errors above");
if (flags.check) process.exit(0);

// ---- props + render dir ---------------------------------------------------------------------
// The render dir holds hard links to exactly the media the plan uses, and becomes Remotion's
// --public-dir, so bundling never copies the raw footage.
rmSync(paths.render, { recursive: true, force: true });
const linked = new Set();
const link = (rel) => {
  if (!rel || linked.has(rel)) return rel;
  linkOrCopy(join(project.dir, rel), join(paths.render, rel));
  linked.add(rel);
  return rel;
};
const arollRel = mode === "talking" ? "work/cleancut.mp4" : null;
if (arollRel) link(arollRel);

for (const fmt of selectFormats(project, flags.format)) {
  const keep = (o) => !o.only || o.only === fmt.aspect || o.only === fmt.key;
  const props = {
    mode,
    styleVariant: plan.style || data.style || "glass",
    width: fmt.width,
    height: fmt.height,
    fps: fmt.fps,
    durationInSeconds: round3(D),
    rail: plan.rail !== false,
    ...(arollRel ? { aroll: { src: arollRel, position: plan.framing?.[fmt.aspect] || plan.framing?.[fmt.key] } } : {}),
    overlays: overlays.filter(keep).map(({ only, ...o }) => o),
    brolls: (plan.brolls || []).filter(keep).map(({ only, ...b }) => ({ ...b, src: link(b.src) })),
    scenes: (plan.scenes || []).filter(keep).map(({ only, ...sc }, i) => ({
      ...sc,
      index: i,
      src: link(sc.src),
      src_portrait: link(sc.src_portrait),
    })),
    cameraMoves: (plan.camera_moves || []).filter(keep).map(({ only, ...m }) => m),
  };
  writeJson(fmt.props, props);

  const script = join(REMOTION_DIR, "scripts", "render.mjs");
  if (flags.stills) {
    const outDir = join(paths.work, `stills-${fmt.key}`);
    rmSync(outDir, { recursive: true, force: true });
    console.log(`[${fmt.aspect}] stills at ${flags.stills}`);
    run(process.execPath, [script, "--props", fmt.props, "--public-dir", paths.render, "--stills", String(flags.stills), "--out-dir", outDir], {
      cwd: REMOTION_DIR,
      inherit: true,
    });
    continue;
  }
  mkdirSync(dirname(fmt.visuals), { recursive: true });
  console.log(`[${fmt.aspect}] rendering ${fmt.width}x${fmt.height}, ${ts(D)}…`);
  run(process.execPath, [script, "--props", fmt.props, "--public-dir", paths.render, "--out", fmt.visuals], { cwd: REMOTION_DIR, inherit: true });
  const out = probe(fmt.visuals);
  if (Math.abs(out.duration - D) > 0.1) console.log(`  WARNING: visuals are ${out.duration.toFixed(2)}s, cut is ${D.toFixed(2)}s`);
  markStage(project, "visuals", { file: fmt.visuals }, fmt.key);
}
if (!flags.stills) console.log(`next: npm run scaffold -- ${data.name}  (captions over the visuals), then audio plan + finalize`);
