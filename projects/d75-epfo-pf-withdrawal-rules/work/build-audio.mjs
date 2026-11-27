import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// terminal look: crisp ticks and soft clicks; sub-band only on chapters.
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let ci = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { add(t, "sub_drop", 3, why); add(t + 0.35, "click", 2, why); }
  else if (o.type === "title_slide") add(t, "impact", 2, why);
  else if (["flow_diagram", "stat_trio", "fact_band"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "big_statement" || o.type === "poll_prompt") add(t, "ding", 1, why);
  else if (o.type === "data_table") { add(t, "reveal", 3, why); (o.rows || []).forEach((r) => add(o.start + r.at, "typing", 2, "row " + r.cells[0])); }
  else if (o.type === "checklist") add(t, "clock_tick", 1, why);
  else if (o.type === "keyword_chip" || o.type === "side_note") { ci++; if (ci % 2 === 0) add(t, "click", 2, why); }
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.6) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
