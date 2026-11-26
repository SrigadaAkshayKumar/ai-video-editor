import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// liquid look: airy swooshes and pops; sub-band only on chapters
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let ci = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { add(t, "whoosh", 1, why); add(t + 0.45, "sub_drop", 3, why); }
  else if (o.type === "title_slide") add(t, "impact", 3, why);
  else if (["flow_diagram", "checklist", "stat_trio", "fact_band", "comparison", "progress_ring"].includes(o.type)) add(t, "riser", 1, why);
  else if (o.type === "keyword_chip" || o.type === "side_note") { ci++; if (ci % 3 === 0) add(t, "pop", 1, why); else if (ci % 3 === 1) add(t, "reveal", 3, why); }
  else if (o.type === "number_roll" || o.type === "poll_prompt") add(t, "whoosh", 0, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.6) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
