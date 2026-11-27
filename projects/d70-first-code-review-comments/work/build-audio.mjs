import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// explainer look: soft, sparse. A soft reveal on data cards, a low sub_drop on chapter changes, a pop on every third chip.
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let ci = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "whoosh", 2, why);
  else if (o.type === "title_slide") add(t, "impact", 2, why);
  else if (o.type === "quote_pull") add(t, "sub_drop", 3, why);
  else if (["flow_diagram", "comparison", "bar_chart", "stat_trio"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "keyword_chip") { ci++; if (ci % 3 === 0) add(t, "pop", 1, why); }
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 1.2) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
