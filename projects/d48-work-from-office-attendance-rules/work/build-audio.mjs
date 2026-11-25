import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// terminal look: digital ticks and soft clicks on structure; chips/notes silent
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
for (const o of P.overlays) {
  const t = o.start + 0.08; const why = `${o.type}: ${o.text || ""}`;
  if (o.type === "chapter_open") add(t, "click", 5, why);
  else if (o.type === "title_slide") add(t, "glitch", 3, why);
  else if (["flow_diagram", "checklist", "timeline", "bullet_list", "comparison"].includes(o.type)) add(t, "clock_tick", 4, why);
  else if (o.type === "quote_pull") add(t, "pop", 4, why);
  else if (o.type === "big_statement" && o.start < 150) add(t, "pop", 4, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
