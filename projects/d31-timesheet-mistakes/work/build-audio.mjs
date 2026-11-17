import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// story look: low sub-band cues on structure only (chapters, quote pulls, dock/takeover arrivals); reveal (mixed) on diagrams
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (t > 19.3 && t < 20.5) continue; // intro splice
  if (o.type === "chapter_open") add(t, "sub_drop", 3, why);
  else if (o.type === "title_slide") add(t, "impact", 2, why);
  else if (o.type === "quote_pull") add(t, "impact", 2, why);
  else if (["timeline", "comparison", "flow_diagram"].includes(o.type) && !(o.start > 137 && o.start < 140)) add(t, "reveal", 3, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.3) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
