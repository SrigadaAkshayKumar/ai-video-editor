import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// explainer look: soft, sparse — a soft whoosh on chapters, a reveal on tables/flows/checklists, a ding on quotes, a pop on every other chip
let n = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "whoosh", 3, why);
  else if (o.type === "title_slide") add(t, "impact", 2, why);
  else if (["flow_diagram", "checklist", "data_table"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "quote_pull") add(t, "ding", 2, why);
  else if (o.type === "keyword_chip" && (n++) % 2 === 0) add(t, "pop", 2, why);
}
for (const s of P.scenes) if (s.kind === "news") add(s.start + 0.05, "whoosh", 2, `news cut: ${s.source}`);
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
