import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// liquid look: airy swooshes (chapter/diagram arrivals) and pops (stat/checklist/chips), reveals on quotes/title
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let n = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "whoosh", 2, why);
  else if (o.type === "title_slide") add(t, "reveal", 1, why);
  else if (o.type === "quote_pull") add(t, "reveal", 1, why);
  else if (["stat_trio", "fact_band"].includes(o.type)) add(t, "pop", 3, why);
  else if (["flow_diagram", "timeline"].includes(o.type)) add(t, "whoosh", 0, why);
  else if (o.type === "checklist") add(t, "click", 3, why);
  else if (o.type === "side_note" && (n++ % 2 === 0)) add(t, "click", 3, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.8) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
