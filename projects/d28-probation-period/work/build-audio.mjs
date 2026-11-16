import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// newsroom look: whoosh + impact on section changes, reveal on diagrams, a click on every 3rd chip
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let chips = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { add(t - 0.25 > 0 ? t - 0.25 : t, "whoosh", 2, why); add(t + 0.2, "impact", 3, why); }
  else if (o.type === "title_slide") add(t, "reveal", 2, why);
  else if (o.type === "keyword_chip" || o.type === "side_note") { if (chips++ % 3 === 0) add(t, "click", 2, why); }
  else if (["flow_diagram", "comparison", "step_progress"].includes(o.type)) add(t, "reveal", 3, why);
  else if (["checklist", "big_statement", "quote_pull"].includes(o.type)) add(t, "clock_tick", 2, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time > 21.8 && e.time < 22.9) continue; if (e.time - last < 0.15) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
