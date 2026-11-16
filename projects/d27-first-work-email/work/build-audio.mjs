import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// explainer look: soft, sparse — soft sub-band "sub_drop" on chapters, "reveal" on diagrams/tables, a light click on every 3rd chip
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let chips = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (t > 19.5 && t < 20.4) continue;
  if (o.type === "chapter_open") add(t, "sub_drop", 3, why);
  else if (o.type === "title_slide") add(t, "reveal", 2, why);
  else if (o.type === "keyword_chip" || o.type === "side_note") { if (chips++ % 3 === 0) add(t, "click", 2, why); }
  else if (["flow_diagram", "comparison", "number_roll"].includes(o.type)) add(t, "reveal", 3, why);
  else if (["checklist", "step_progress"].includes(o.type)) add(t, "clock_tick", 2, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.3) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
