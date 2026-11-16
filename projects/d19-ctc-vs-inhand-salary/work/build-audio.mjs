import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// newsroom: wipe whoosh + hit on every section change, reveal on each news scene, sub hits on key numbers, sparse pops
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.05;
  if (o.type === "chapter_open") { add(t - 0.1, "whoosh", 3, `wipe → ${o.text}`); add(t + 0.35, "impact", 4, `hit: ${o.text}`); }
  else if (o.type === "number_roll") add(t, "sub_drop", 4, `number: ${o.text}`);
  else if (o.type === "title_slide") add(t, "impact", 4, "title");
  else if (["flow_diagram", "comparison", "bar_chart", "step_progress", "lower_third"].includes(o.type)) add(t, "reveal", 3, `${o.type}: ${o.text}`);
}
for (const s of P.scenes) if (s.kind === "news") add(s.start + 0.05, "whoosh", 3, `news wipe: ${s.source}`);
// a few chips pop (every 4th)
P.overlays.filter((o) => o.type === "keyword_chip").forEach((o, i) => { if (i % 4 === 0) add(o.start + 0.05, "pop", 3, `chip: ${o.text}`); });
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.35) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
const c = {}; out.forEach((e) => (c[e.sfx] = (c[e.sfx] || 0) + 1)); console.log(out.length, "sfx", c);
