import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// liquid look: airy whooshes on arrivals/sections, soft pops on chips and stat cards, reveal ticks on lists; sub_drop only on statements
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
let chips = 0;
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (t > 23.4 && t < 24.7 && o.type !== "chapter_open") continue;
  if (o.type === "chapter_open") add(Math.max(t - 0.2, 24.7 - 0.0 * 0) < 24.7 && t < 24.7 ? 24.75 : t - 0.2, "whoosh", 2, why);
  else if (o.type === "title_slide") add(t, "whoosh", 1, why);
  else if (o.type === "keyword_chip" || o.type === "side_note") { if (chips++ % 3 === 1) add(t, "pop", 1, why); }
  else if (["stat_trio", "number_roll"].includes(o.type)) add(t, "pop", 2, why);
  else if (["flow_diagram", "timeline", "checklist", "comparison", "bullet_list", "term_card", "step_progress"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "big_statement") add(t, "sub_drop", 3, why);
  else if (o.type === "quote_pull") add(t, "whoosh", 1, why);
}
for (const s of P.scenes) if (s.kind === "news") add(s.start + 0.1, "whoosh", 2, "news card");
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.3) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
