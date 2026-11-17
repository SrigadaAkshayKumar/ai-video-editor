import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// explainer look: soft, sparse. sub-band cue on chapter openers + title; reveal on charts/diagrams/tables; nothing on chips
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (t > 28.0 && t < 29.3) continue; // intro splice
  if (o.type === "chapter_open") add(t, "sub_drop", 2, why);
  else if (o.type === "title_slide") add(t, "impact", 1, why);
  else if (["timeline", "flow_diagram"].includes(o.type)) add(t, "sub_drop", 2, why);
  else if (["comparison", "bar_chart"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "number_roll") add(t, "reveal", 3, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.3) continue; last = e.time; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
