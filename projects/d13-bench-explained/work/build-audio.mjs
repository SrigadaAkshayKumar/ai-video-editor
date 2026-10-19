import { readFileSync, writeFileSync } from "node:fs";
const P = JSON.parse(readFileSync("work/visual-plan.json", "utf8"));
// documentary look: low sub-band cues on structure only (title, chapters, quotes, big statements, the 'why' timeline); no vocal-band ticks
const map = { title_slide: ["impact", 4, "title lands"], chapter_open: ["impact", 4, "section opens"], quote_pull: ["sub_drop", 4, "quote pull"], big_statement: ["riser", 2, "statement"], flow_diagram: ["riser", 2, "path plots"], term_card: ["riser", 2, "definition card"] };
const E = [];
for (const o of P.overlays) { const m = map[o.type]; if (m) E.push({ time: +(o.start + 0.05).toFixed(2), sfx: m[0], reason: `${m[2]}: ${o.text}`, gain: m[1] }); }
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_policy: { rmsBelowDb: 3 }, sfx_events: E }, null, 1));
console.log(E.length, "sfx");
