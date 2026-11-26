import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// newsroom look: wipe whoosh + hit on every section change, reveals on panels, stings on big statements, sparse pops on chips
let dk = 0, sk = 0, ck = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "title_slide") add(o.start + 0.08, "impact", 2, why);
  else if (o.type === "chapter_open") { add(o.start, "whoosh", 2, why + " (wipe)"); add(o.start + 0.4, "impact", 2, why + " (hit)"); }
  else if (["flow_diagram", "checklist", "timeline", "comparison", "matrix_grid", "term_card", "bullet_list"].includes(o.type)) add(o.start + 0.1, ["reveal", "sub_drop", "click"][dk++ % 3], 2, why);
  else if (o.type === "big_statement" && sk++ % 2 === 0) add(o.start + 0.1, "sub_drop", 2, why);
  else if (o.type === "quote_pull") add(o.start + 0.1, "ding", 2, why);
  else if (o.type === "keyword_chip" && ck++ % 3 === 0) add(o.start + 0.1, "pop", 2, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
