import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// story look: low sub-band cues on structure only (title, chapters, timeline/flow/stat reveals, quote pulls). no clicks.
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (t > 22.3 && t < 22.9) continue;
  if (o.type === "chapter_open") add(t, "sub_drop", 2, why);
  else if (o.type === "title_slide") add(t, "impact", 1, why);
  else if (["timeline", "flow_diagram", "stat_trio"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "quote_pull") add(t, "reveal", 3, why);
  else if (o.type === "big_statement") add(t, "sub_drop", 2, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.3) continue; last = e.time; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
