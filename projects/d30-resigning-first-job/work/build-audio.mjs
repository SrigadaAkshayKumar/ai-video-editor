import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// terminal look: crisp ticks (clock_tick/typing) on lists and tables, soft clicks on chips, reveal on diagrams, sub_drop on chapters/statements
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let chips = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (t > 22.9 && t < 23.6) continue; // intro splice
  if (o.type === "chapter_open") add(t, "sub_drop", 3, why);
  else if (o.type === "title_slide") add(t, "reveal", 2, why);
  else if (o.type === "keyword_chip" || o.type === "side_note") { const k = chips++; if (k % 2 === 0) add(t, k % 4 === 0 ? "click" : "clock_tick", 2, why); }
  else if (["checklist", "step_progress", "bullet_list"].includes(o.type)) add(t, "typing", 2, why);
  else if (["flow_diagram", "comparison", "quote_pull"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "big_statement") add(t, "clock_tick", 2, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.3) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
