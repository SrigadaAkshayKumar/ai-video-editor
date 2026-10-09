#!/usr/bin/env node
// Show where each project is in the pipeline (or one project in detail).
// Usage: node tools/status.mjs [project] [--done <stage>] [--format 9:16]
//   --done marks a hand-authored stage complete (per-format stages: all formats unless --format).
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PROJECTS, die, markStage, openProject, parseCli, selectFormats, ts } from "./lib/common.mjs";

const SHARED = {
  talking: ["transcribe", "cut", "plan", "audio-plan", "mix"],
  faceless: ["transcribe", "cut", "direction", "research", "plan", "audio-plan", "mix"],
};
const PER_FORMAT = ["visuals", "scaffold", "captions", "finalize"];
const { flags, positional } = parseCli();
if (flags.done) {
  if (!positional[0]) die("--done needs a project");
  const p = openProject(positional[0]);
  const shared = SHARED[p.data.mode || "talking"];
  if (shared.includes(flags.done)) markStage(p, flags.done);
  else if (PER_FORMAT.includes(flags.done)) for (const f of selectFormats(p, flags.format)) markStage(p, flags.done, {}, f.key);
  else die(`unknown stage ${flags.done}; one of ${[...shared, ...PER_FORMAT].join(", ")}`);
}
const names = positional[0]
  ? [positional[0]]
  : existsSync(PROJECTS)
    ? readdirSync(PROJECTS).filter((n) => existsSync(join(PROJECTS, n, "project.json")))
    : [];
if (!names.length) console.log("no projects yet — npm run new -- <raw-video-or-voiceover>");
for (const name of names) {
  const p = openProject(name);
  const s = p.data.stages || {};
  const mode = p.data.mode || "talking";
  // plan files count as done when present
  const present = { plan: existsSync(p.paths.visualPlan), "audio-plan": existsSync(p.paths.audioPlan), direction: existsSync(p.paths.direction) };
  const mark = (st, done) => (done ? `✓${st}` : `·${st}`);
  console.log(
    `${p.data.name} [${mode}]  ${ts(p.data.source.duration)}${p.data.cleancut ? " → " + ts(p.data.cleancut.duration) : ""}  ` +
      SHARED[mode].map((st) => mark(st, s[st]?.done || present[st])).join(" "),
  );
  for (const f of selectFormats(p)) {
    const next = PER_FORMAT.find((st) => !s[`${st}@${f.key}`]?.done);
    console.log(`   ${f.aspect.padEnd(5)} ` + PER_FORMAT.map((st) => mark(st, s[`${st}@${f.key}`]?.done)).join(" ") + (next ? `   next: ${next}` : "   DONE"));
  }
}
