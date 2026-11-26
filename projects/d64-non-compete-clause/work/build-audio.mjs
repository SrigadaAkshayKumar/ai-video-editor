import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// newsroom look: wipe whooshes + hits on section changes, risers on boards, ticks on chips
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let ci = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { add(t, "whoosh", 1, why); add(t + 0.4, "impact", 2, why); add(t + 0.45, "sub_drop", 3, why); }
  else if (o.type === "title_slide") add(t, "impact", 3, why);
  else if (["flow_diagram", "checklist", "stat_trio", "fact_band", "comparison", "timeline"].includes(o.type)) add(t, "riser", 1, why);
  else if (o.type === "big_statement" || o.type === "quote_pull") add(t, "pop", 1, why);
  else if (o.type === "keyword_chip" || o.type === "side_note") { ci++; if (ci % 2) add(t, "click", 2, why); else add(t, "reveal", 3, why); }
}
for (const s of P.scenes) if (s.kind === "news") add(s.start + 0.05, "whoosh", 2, "news scene");
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.5) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
