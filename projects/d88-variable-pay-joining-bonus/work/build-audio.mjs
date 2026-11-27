import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// liquid look: airy whooshes on arrivals, pops on chips, sub-band hits on chapters/title. Vocal-band cues rationed (<1/3 each).
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let chips = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "sub_drop", 4, why);
  else if (o.type === "title_slide") add(t, "impact", 3, why);
  else if (["flow_diagram", "timeline", "fact_band", "checklist", "bar_chart"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "big_statement") add(t, "whoosh", 2, why);
  else if (o.type === "keyword_chip" && chips++ % 2 === 0) add(t, "pop", 2, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.8) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
