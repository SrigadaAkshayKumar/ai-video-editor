import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// liquid look: airy swooshes and pops; sparse enough not to become a tic
let ci = 0, n = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "title_slide") add(o.start + 0.08, "impact", 3, why);
  else if (o.type === "chapter_open") add(o.start + 0.1, (ci++ % 2) ? "impact" : "sub_drop", 3, why);
  else if (["flow_diagram", "timeline", "stat_trio"].includes(o.type)) add(o.start + 0.1, "riser", 2, why);
  else if (o.type === "comparison") add(o.start + 0.1, "whoosh", 0, why);
  else if (o.type === "keyword_chip" && (n++ % 4 === 0)) add(o.start + 0.1, "pop", 1, why);
  else if (o.type === "quote_pull") add(o.start + 0.1, "impact", 2, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
