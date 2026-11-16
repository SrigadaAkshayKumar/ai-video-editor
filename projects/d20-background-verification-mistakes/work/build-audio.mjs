import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// story: low sub-band cues on structure only (chapter opens, title, key diagram/timeline reveals)
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.05;
  if (o.type === "chapter_open") add(t, o.section % 2 ? "sub_drop" : "impact", 4, `chapter: ${o.text}`);
  else if (o.type === "title_slide") add(t, "impact", 3, "title");
  else if (o.type === "timeline") add(t, "sub_drop", 3, `timeline: ${o.text}`);
  else if (o.type === "quote_pull") add(t, "impact", 3, `${o.type}: ${o.text}`);
}
E.sort((a, b) => a.time - b.time);
const out = []; let last = -9;
for (const e of E) { if (e.time - last < 0.5) continue; last = e.time; out.push(e); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: out }, null, 1));
console.log(out.length, "sfx");
