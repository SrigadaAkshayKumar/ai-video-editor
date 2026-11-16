import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// liquid look: airy swooshes on layout changes, pops on chips/stats, sub-band hits on structure
const map = { title_slide: ["impact", 4], chapter_open: ["impact", 4], quote_pull: ["sub_drop", 4], big_statement: ["riser", 2],
  keyword_chip: ["pop", 3], number_roll: ["whoosh", 3], stat_trio: ["whoosh", 3], bar_chart: ["whoosh", 3],
  flow_diagram: ["whoosh", 3], checklist: ["reveal", 3], comparison: ["reveal", 3], step_progress: ["reveal", 3] };
const E = []; let last = -9;
for (const o of P.overlays) { const m = map[o.type]; if (!m) continue; const t = +(o.start + 0.05).toFixed(2);
  if (t - last < 1.2) continue; last = t; E.push({ time: t, sfx: m[0], reason: `${o.type}: ${o.text || ""}`, gain: m[1] }); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
const c = {}; E.forEach((e) => (c[e.sfx] = (c[e.sfx] || 0) + 1)); console.log(E.length, "sfx", c);
