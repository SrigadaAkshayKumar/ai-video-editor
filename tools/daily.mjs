#!/usr/bin/env node
// Bookkeeping for the unattended daily run (.github/workflows/daily-edit.yml + the daily-script / daily-run skills).
// Claude writes and edits; this file only answers the questions a workflow can't leave to judgment.
// Usage:
//   node tools/daily.mjs next [dNN]   which episode today and what it still needs. Picks the first folder in
//                                     config/daily.json's series without a finished edit (or the one named); with
//                                     none left, the next number (a fresh-news episode). Prints JSON with
//                                     needs = script | voice | edit:
//                                       script  the voiceover is missing or still has {FILL…}/{OPTIONAL…} (daily-script skill)
//                                       voice   the voiceover is ready but there is no audio (tools/voice/tts.py)
//                                       edit    the audio is there (daily-run skill)
//                                     plus the edit look for the episode (config/daily.json → looks): a random pick,
//                                     never one of the last `avoidRecent` looks used, so episodes don't all look alike.
//   node tools/daily.mjs script-check reads daily-script.json (written by the daily-script skill), confirms the
//                                     episode's script + voiceover are complete. Exit 1 = stop the run.
//   node tools/daily.mjs check        reads daily-run.json (written by Claude at the end of the run), confirms the
//                                     final video passes verify and the Shorts exist. Exit 1 = do not upload.
//   node tools/daily.mjs done [--look name]  records the episode (and its look) in config/daily-state.json
//                                     (committed by the workflow).
// In GitHub Actions every answer is also written to $GITHUB_OUTPUT (episode, needs, project, shorts_dir, …).
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { PROJECTS, ROOT, die, parseCli, readJson, run, writeJson } from "./lib/common.mjs";
import { MEDIA_EXT } from "./lib/inbox.mjs";

const CONFIG = join(ROOT, "config", "daily.json");
const STATE = join(ROOT, "config", "daily-state.json");
const RESULT = join(ROOT, "daily-run.json");
const SCRIPT_RESULT = join(ROOT, "daily-script.json");
const PLACEHOLDER = /\{(FILL|OPTIONAL)/i;

const { positional, flags } = parseCli();
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

const series = join(ROOT, config.series);
const episodeNumber = (name) => Number(name.slice(1));
const listEpisodes = () => readdirSync(series).filter((n) => /^d\d+$/i.test(n)).sort((a, b) => episodeNumber(a) - episodeNumber(b));
const filesOf = (ep) => readdirSync(join(series, ep));
const audioOf = (ep) => filesOf(ep).find((n) => MEDIA_EXT.includes(extname(n).toLowerCase()));
const voiceoverOf = (ep) => filesOf(ep).find((n) => /_voiceover\.txt$/i.test(n));
const scriptOf = (ep) => filesOf(ep).find((n) => /_script\.md$/i.test(n));
const rel = (...parts) => join(...parts).replace(/\\/g, "/");

/** What an existing episode folder still needs before it can be edited. */
function needsOf(ep) {
  if (audioOf(ep)) return "edit";
  const vo = voiceoverOf(ep);
  if (!vo || PLACEHOLDER.test(readFileSync(join(series, ep, vo), "utf8"))) return "script";
  return "voice";
}

/**
 * The edit look for an episode: random among the looks not used in the last `avoidRecent` finished episodes.
 * Seeded by the episode name, so the plan and pick steps of one run (and a re-run) agree on the same look.
 */
function lookOf(episode) {
  const list = config.looks?.list || [];
  if (!list.length) return null;
  // episodes finished before looks existed count as config.looks.untagged (they were all blueprint edits)
  const recent = state.done
    .filter((d) => d.episode !== episode && !d.note?.startsWith("skipped"))
    .slice(-(config.looks.avoidRecent ?? 2))
    .map((d) => d.look || config.looks.untagged);
  const pool = list.filter((l) => !recent.includes(l.name));
  const choices = pool.length ? pool : list;
  let h = 2166136261;
  for (const ch of episode.toLowerCase()) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return choices[(h >>> 0) % choices.length];
}
const lookFields = (episode) => {
  const look = lookOf(episode);
  return look ? { look: look.name, look_style: look.style, look_brief: look.brief } : {};
};

if (cmd === "next") {
  if (!existsSync(series)) die(`${config.series} not found — is the Drive inbox synced?`);
  const episodes = listEpisodes();
  const pick = arg ? episodes.find((e) => e.toLowerCase() === arg.toLowerCase()) : episodes.find((e) => !finished(e));
  if (arg && !pick) die(`no episode folder ${arg} in ${config.series}`);
  if (!pick) {
    if (config.freshNews === false) {
      output({ episode: "none" });
      process.exit(0);
    }
    const last = episodes.length ? episodeNumber(episodes.at(-1)) : 0;
    const episode = `d${String(last + 1).padStart(2, "0")}`;
    output({ episode, needs: "script", dir: rel(config.series, episode), audio: "", voiceover: "", brief: "", ...lookFields(episode) });
    process.exit(0);
  }
  const audio = audioOf(pick);
  const vo = voiceoverOf(pick);
  const briefFile = join(series, pick, "brief.txt");
  output({
    episode: pick,
    needs: needsOf(pick),
    dir: rel(config.series, pick),
    audio: audio ? rel(config.series, pick, audio) : "",
    voiceover: vo ? rel(config.series, pick, vo) : "",
    brief: existsSync(briefFile) ? readFileSync(briefFile, "utf8").trim().replace(/\s+/g, " ") : "",
    ...lookFields(pick),
  });
} else if (cmd === "script-check") {
  if (!existsSync(SCRIPT_RESULT)) die("daily-script.json missing — the script step did not finish");
  const r = readJson(SCRIPT_RESULT);
  if (r.status !== "ok") die(`the script step reported status "${r.status}": ${r.notes || "see daily-script-report.md"}`);
  if (!/^d\d+$/i.test(r.episode || "") || !existsSync(join(series, r.episode))) die(`daily-script.json names no episode folder: ${r.episode}`);
  const vo = voiceoverOf(r.episode);
  if (!vo) die(`${r.episode} has no *_voiceover.txt`);
  if (!scriptOf(r.episode)) die(`${r.episode} has no *_script.md`);
  const text = readFileSync(join(series, r.episode, vo), "utf8");
  if (PLACEHOLDER.test(text) || /[{}]/.test(text)) die(`${vo} still has a placeholder or brace — the voice would read it out`);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < 150) die(`${vo} has only ${words} words`);
  output({ episode: r.episode, needs: needsOf(r.episode), dir: rel(config.series, r.episode), voiceover: rel(config.series, r.episode, vo), words });
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
  const look = typeof flags.look === "string" && flags.look ? { look: flags.look } : {};
  state.done.push({ episode: r.episode, project: r.project, ...look, at: new Date().toISOString() });
  writeJson(STATE, state);
  console.log(`${r.episode} → done (${basename(STATE)})`);
} else die("usage: node tools/daily.mjs next [dNN] | script-check | check | done [--look name]");
