import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// newsroom look: wipe whoosh + hit on section changes; ticks on graphic arrivals; chips/notes silent
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { add(o.start, "whoosh", 3, why); add(t + 0.35, "impact", 2, why); }
  else if (o.type === "title_slide") add(t, "impact", 3, why);
  else if (["flow_diagram", "checklist", "timeline", "comparison"].includes(o.type)) add(t, "click", 5, why);
  else if (["number_roll", "quote_pull"].includes(o.type)) add(t, "pop", 4, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
