import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// terminal look: crisp digital ticks and soft clicks on arrivals; sub_drop on chapters; chips mostly silent
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let chipN = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "sub_drop", 3, why);
  else if (o.type === "title_slide") add(t, "impact", 2, why);
  else if (o.type === "big_statement") add(t, "impact", 1, why);
  else if (["checklist", "matrix_grid"].includes(o.type)) add(t, "typing", 3, why);
  else if (["flow_diagram", "stat_trio", "number_roll", "timeline", "fact_band", "comparison"].includes(o.type)) add(t, "click", 4, why);
  else if (o.type === "quote_pull") add(t, "reveal", 2, why);
  else if (o.type === "keyword_chip" && chipN++ % 3 === 0) add(t, "clock_tick", 2, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.8) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
