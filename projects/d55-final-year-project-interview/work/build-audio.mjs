import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// explainer look: soft, sparse — sub-band on chapters/title, a gentle reveal on diagrams/lists, a pop on mistake chips
let ck = 0, dk = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "title_slide") add(o.start + 0.08, "sub_drop", 2, why);
  else if (o.type === "chapter_open") add(o.start, ck++ % 2 ? "sub_drop" : "riser", 1, why);
  else if (["flow_diagram", "checklist", "timeline", "comparison"].includes(o.type)) add(o.start + 0.1, ["reveal", "sub_drop", "reveal", "impact"][dk++ % 4], 2, why);
  else if (o.type === "quote_pull" && /Mistake 3/.test(o.eyebrow)) add(o.start + 0.1, "impact", 2, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
