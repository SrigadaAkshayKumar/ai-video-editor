import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// newsroom look: wipe whooshes + hits on section changes, reveals on news cards, sparse ticks on chips
let n = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { add(t, "whoosh", 3, why); add(t + 0.35, "impact", 4, why); }
  else if (o.type === "title_slide") add(t, "impact", 3, why);
  else if (["flow_diagram", "checklist", "fact_band", "timeline", "comparison", "step_progress"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "keyword_chip" || o.type === "side_note") add(t, (n++) % 2 === 0 ? "click" : "pop", 2, why);
  else if (o.type === "big_statement" || o.type === "quote_pull") add(t, o.type === "quote_pull" ? "ding" : "typing", 2, why);
}
for (const s of P.scenes) if (s.kind === "news") add(s.start + 0.05, "whoosh", 2, `news cut: ${s.source}`);
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
