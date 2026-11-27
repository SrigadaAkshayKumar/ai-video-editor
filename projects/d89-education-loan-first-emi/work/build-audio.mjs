import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// newsroom look: impact hits on chapters/title/statements, wipe whooshes on news scenes + section changes, reveal ticks on panels.
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const s of P.scenes) if (s.kind === "news") add(s.start + 0.05, "whoosh", 2, `news scene ${s.index}`);
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { add(t - 0.12, "whoosh", 2, why + " (wipe)"); add(t + 0.2, "sub_drop", 4, why); }
  else if (o.type === "title_slide") add(t, "impact", 3, why);
  else if (o.type === "big_statement") add(t, "impact", 2, why);
  else if (["flow_diagram", "timeline", "fact_band", "checklist", "comparison", "stat_trio", "number_roll", "quote_pull"].includes(o.type)) add(t, "reveal", 3, why);
}
E.sort((a, b) => a.time - b.time);
const out = []; for (const e of E) { if (out.length && e.time - out[out.length - 1].time < 0.3) continue; out.push(e); }
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx", JSON.stringify(out.reduce((a, e) => (a[e.sfx] = (a[e.sfx] || 0) + 1, a), {})));
