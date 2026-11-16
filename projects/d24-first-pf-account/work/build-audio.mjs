import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// newsroom look: wipe whooshes + hits on section changes, a click on list/flow reveals, a pop on the news cards
let ch = 0; const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") { if (ch % 2 === 0) add(t - 0.35, "whoosh", 3, why); add(t + 0.1, ch++ % 2 ? "sub_drop" : "impact", 4, why); }
  else if (o.type === "title_slide") add(t, "impact", 2, why);
  else if (["flow_diagram", "timeline", "checklist", "comparison"].includes(o.type)) add(t, "reveal", 3, why);
  else if (o.type === "number_roll") add(t, "impact", 3, why);
}

E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.3) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
