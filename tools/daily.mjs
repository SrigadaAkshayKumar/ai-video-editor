#!/usr/bin/env node
// Bookkeeping for the unattended daily run (.github/workflows/daily-edit.yml + the daily-run skill).
// Claude does the editing; this file only answers the questions a workflow can't leave to judgment.
// Usage:
//   node tools/daily.mjs next [dNN]   which episode to edit: the first folder in config/daily.json's series with a
//                                     voiceover and no finished edit (or the one named). Prints JSON; "none" = idle.
//   node tools/daily.mjs check        reads daily-run.json (written by Claude at the end of the run), confirms the
//                                     final video passes verify and the Shorts exist. Exit 1 = do not upload.
//   node tools/daily.mjs done         records the episode in config/daily-state.json (committed by the workflow).
// In GitHub Actions every answer is also written to $GITHUB_OUTPUT (episode, project, shorts_dir, …).
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { PROJECTS, ROOT, die, parseCli, readJson, run, writeJson } from "./lib/common.mjs";
import { MEDIA_EXT } from "./lib/inbox.mjs";

const CONFIG = join(ROOT, "config", "daily.json");
const STATE = join(ROOT, "config", "daily-state.json");
const RESULT = join(ROOT, "daily-run.json");

const { positional } = parseCli();
const [cmd, arg] = positional;
const config = readJson(CONFIG);
const state = existsSync(STATE) ? readJson(STATE) : { done: [] };

function output(values) {
  console.log(JSON.stringify(values, null, 2));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(values).map(([k, v]) => `${k}=${v ?? ""}\n`).join(""));
}

/** An episode already finished here: in the state file, or a project made from its folder that reached finalize. */
function finished(episode) {
  if (state.done.some((d) => d.episode === episode)) return true;
  if (!existsSync(PROJECTS)) return false;
  const re = new RegExp(`[\\\\/]${episode}[\\\\/]`, "i");
  return readdirSync(PROJECTS).some((p) => {
    const f = join(PROJECTS, p, "project.json");
    if (!existsSync(f)) return false;
    const data = readJson(f);
    return re.test(data.source?.original || "") && Object.keys(data.stages || {}).some((s) => s.startsWith("finalize"));
  });
}

if (cmd === "next") {
  const series = join(ROOT, config.series);
  if (!existsSync(series)) die(`${config.series} not found — is the Drive inbox synced?`);
  const episodes = readdirSync(series).filter((n) => /^d\d+$/i.test(n)).sort();
  const audioOf = (ep) => readdirSync(join(series, ep)).find((n) => MEDIA_EXT.includes(extname(n).toLowerCase()));
  const pick = arg ? episodes.find((e) => e.toLowerCase() === arg.toLowerCase()) : episodes.find((e) => audioOf(e) && !finished(e));
  if (arg && !pick) die(`no episode folder ${arg} in ${config.series}`);
  if (!pick) {
    output({ episode: "none" });
    process.exit(0);
  }
  const audio = audioOf(pick);
  if (!audio) die(`${pick} has no voiceover yet (drop dNN-voice.wav into its Drive folder)`);
  const briefFile = join(series, pick, "brief.txt");
  output({
    episode: pick,
    audio: join(config.series, pick, audio).replace(/\\/g, "/"),
    brief: existsSync(briefFile) ? readFileSync(briefFile, "utf8").trim().replace(/\s+/g, " ") : "",
  });
} else if (cmd === "check") {
  if (!existsSync(RESULT)) die("daily-run.json missing — the edit did not finish");
  const r = readJson(RESULT);
  if (r.status !== "ok") die(`the run reported status "${r.status}": ${r.notes || "see daily-report.md"}`);
  const out = join(PROJECTS, r.project, "output");
  const finals = readdirSync(out).filter((n) => /^final-.*\.mp4$/.test(n));
  if (!finals.length) die(`no final-*.mp4 in ${out}`);
  const v = run(process.execPath, [join(ROOT, "tools", "verify.mjs"), r.project, "--no-frames"], { allowFail: true });
  process.stdout.write(v.stdout);
  if (v.status !== 0 || !/structure ok/.test(v.stdout)) die("verify did not pass — not uploading");
  const shortsDir = join("AI-clipper", "output", r.shorts || r.project);
  const shorts = existsSync(join(ROOT, shortsDir)) ? readdirSync(join(ROOT, shortsDir)).filter((n) => n.endsWith(".mp4")) : [];
  if (config.shorts !== false && !shorts.length) die(`no Shorts in ${shortsDir}`);
  output({ project: r.project, shorts_dir: shortsDir.replace(/\\/g, "/"), finals: finals.join(" "), shorts: shorts.length });
} else if (cmd === "done") {
  const r = readJson(RESULT);
  state.done = state.done.filter((d) => d.episode !== r.episode);
  state.done.push({ episode: r.episode, project: r.project, at: new Date().toISOString() });
  writeJson(STATE, state);
  console.log(`${r.episode} → done (${basename(STATE)})`);
} else die("usage: node tools/daily.mjs next [dNN] | check | done");
