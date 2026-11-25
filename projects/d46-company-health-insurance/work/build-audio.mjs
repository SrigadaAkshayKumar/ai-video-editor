import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// liquid look: airy swooshes on chapters/flows, pops on chips, soft reveals on checklists
let n = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "whoosh", 3, why);
  else if (o.type === "title_slide") add(t, "impact", 2, why);
  else if (["flow_diagram", "checklist", "data_table", "timeline", "stat_trio"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "quote_pull") add(t, "ding", 2, why);
  else if (o.type === "keyword_chip" && (n++) % 2 === 0) add(t, "pop", 3, why);
  else if (o.type === "side_note" && (n++) % 2 === 0) add(t, "pop", 3, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
