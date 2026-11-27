import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// terminal look: sub-band for structure, crisp ticks (click) on data, soft reveals on diagrams; chips/notes silent
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.1; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "sub_drop", 3, why);
  else if (o.type === "title_slide") add(t, "impact", 0, why);
  else if (o.type === "number_roll") add(t, "click", 2, why);
  else if (["flow_diagram", "timeline", "comparison", "fact_band"].includes(o.type)) add(t, "reveal", 1, why);
  else if (o.type === "checklist") add(t, "clock_tick", 2, why);
  else if (o.type === "quote_pull") add(t, "click", 1, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.8) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
