import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// newsroom look: whoosh into each chapter wipe + impact hit on the chapter, hit on title, sub_drop on bands, reveal on flows, ding on checklists.
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let first = true;
for (const o of P.overlays) {
  const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { if (first) first = false; else { add(o.start - 0.4, "whoosh", 3, why); add(o.start + 0.25, "impact", 3, why); } }
  else if (o.type === "title_slide") add(o.start, "impact", 3, why);
  else if (["fact_band", "stat_trio"].includes(o.type)) add(o.start - 0.3, "sub_drop", 3, why);
  else if (["flow_diagram", "timeline", "comparison"].includes(o.type)) add(o.start + 0.1, "reveal", 3, why);
  else if (o.type === "checklist") add(o.start + 0.3, "ding", 4, why);
  else if (o.type === "word_swap") add(o.start + 0.1, "impact", 3, why);
  else if (o.type === "big_statement") add(o.start + 0.1, "sub_drop", 3, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.5) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
