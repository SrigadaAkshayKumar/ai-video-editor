import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// explainer look: soft, sparse. chapters get a quiet sub drop, the data moments a light reveal/ding, nothing on text chips
let ch = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, ch++ % 2 === 0 ? "sub_drop" : "impact", 4, why);
  else if (o.type === "title_slide") add(t, "reveal", 4, why);
  else if (o.type === "flow_diagram") add(t, "reveal", 4, why);
  else if (o.type === "progress_ring") add(t, "pop", 2, why);
  else if (o.type === "number_roll" && o.value > 1000) add(t, "ding", 0, why);
  else if (o.type === "comparison" && o.left?.text === "₹0") add(t, "reveal", 4, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
