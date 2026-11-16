import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// terminal look: sub-band cues on chapter/title; crisp "reveal" ticks on diagrams/checklists; soft clicks on chips/cards
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let chip = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08;
  const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "sub_drop", 4, why);
  else if (o.type === "title_slide") add(t, "impact", 3, why);
  else if (o.type === "flow_diagram") add(t, "reveal", 3, why);
  else if (["checklist", "step_progress"].includes(o.type)) add(t, "ding", 2, why);
  else if (["comparison"].includes(o.type)) add(t, "click", 3, why);
  else if (o.type === "keyword_chip" && o.start > 5 && chip++ % 2 === 0) add(t, "click", 3, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.5) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx", JSON.stringify(out.reduce((a, e) => (a[e.sfx] = (a[e.sfx] || 0) + 1, a), {})));
