import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// terminal look: crisp digital ticks (reveal/typing/click) on graphics, sub drop on chapter openings, soft clicks on checklists
let ch = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, ch++ % 2 === 0 ? "sub_drop" : "impact", 4, why);
  else if (o.type === "title_slide") add(t, "impact", 2, why);
  else if (["flow_diagram", "step_progress", "comparison"].includes(o.type)) add(t, "reveal", 3, why);
  else if (["checklist", "bullet_list"].includes(o.type)) add(t, "typing", 3, why);
  else if (o.type === "quote_pull" || o.type === "big_statement") add(t, "click", 3, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.5) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx", JSON.stringify(out.reduce((a, e) => (a[e.sfx] = (a[e.sfx] || 0) + 1, a), {})));
