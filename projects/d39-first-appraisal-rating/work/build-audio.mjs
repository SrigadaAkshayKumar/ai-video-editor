import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// terminal look: crisp digital ticks / soft clicks; sub-band only on chapters
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "sub_drop", 4, why);
  else if (o.type === "title_slide") add(t, "typing", 4, why);
  else if (o.type === "flow_diagram" || o.type === "timeline") add(t, "click", 4, why);
  else if (o.type === "checklist") add(t, "typing", 4, why);
  else if (o.type === "number_roll") add(t, "clock_tick", 2, why);
  else if (o.type === "comparison") add(t, "reveal", 4, why);
  else if (o.type === "fact_band" || o.type === "quote_pull") add(t, "ding", 0, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
