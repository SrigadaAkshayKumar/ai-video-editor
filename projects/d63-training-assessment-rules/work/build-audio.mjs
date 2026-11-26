import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync(new URL("./visual-plan.json", import.meta.url), "utf8"));
// story look: low sub-band cues on structure only; cycled so no cue is over a third
const E = []; const add = (t, sfx, gain, reason) => E.push({ time: +t.toFixed(2), sfx, gain, reason });
const cyc = ["impact", "sub_drop", "riser"]; let k = 0;
for (const o of P.overlays) {
  const why = `${o.type}: ${o.text || ""}`;
  if (["title_slide", "chapter_open"].includes(o.type)) add(o.start + (o.type === "title_slide" ? 0.08 : 0), cyc[k++ % 3], 3, why);
  else if (["flow_diagram", "timeline", "checklist", "comparison", "quote_pull", "big_statement"].includes(o.type)) add(o.start + 0.1, cyc[k++ % 3], 2, why);
}
E.sort((a, b) => a.time - b.time);
writeFileSync(new URL("./audio-plan.json", import.meta.url), JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
