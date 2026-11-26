import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// terminal look: crisp digital ticks and soft clicks; sub-band only on chapters
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { add(t, "typing", 3, why); add(t + 0.5, "sub_drop", 4, why); }
  else if (o.type === "title_slide") add(t, "impact", 3, why);
  else if (["flow_diagram", "checklist", "stat_trio", "fact_band", "timeline"].includes(o.type)) add(t, "click", 4, why);
  else if (o.type === "comparison" || o.type === "poll_prompt") add(t, "clock_tick", 2, why);
  else if (o.type === "big_statement" || o.type === "quote_pull") add(t, "pop", 0, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
