#!/usr/bin/env node
// Background music from Openverse (Jamendo / ccMixter; Freesound with --source).
//   search: node tools/bgm.mjs search <project> "calm piano" [--min 60] [--n 8] [--cc0] [--any-license]
//   get:    node tools/bgm.mjs get <project> <openverseId> [--name slug]   → assets/music/<slug>.mp3
// Default filter: licences that allow commercial use (CC0 / BY / BY-SA; BY needs the credit line).
// --cc0 restricts to public domain (no attribution at all; smaller, more variable pool).
// Then reference the file from work/audio-plan.json music_cues — tools/mix.mjs levels and ducks it.
// The template's warning: CC titles lie (a vinyl-crackle texture for "warm nostalgia", an alarm patch
// for "low tension"). Pick by title + tags + duration, and tell the user to LISTEN before shipping.
import { join } from "node:path";
import { addCredit, die, download, loadEnv, openProject, parseCli, slugify, writeJson } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const [cmd, projectName, arg] = positional;
if (!cmd || !projectName || !arg) {
  console.log('Usage: bgm.mjs search <project> "mood genre" [--min 60] [--n 8] [--cc0] [--any-license] | get <project> <id> [--name slug]');
  process.exit(1);
}
const project = openProject(projectName);
loadEnv();
const headers = process.env.OPENVERSE_TOKEN ? { Authorization: `Bearer ${process.env.OPENVERSE_TOKEN}` } : {};
const api = (path) =>
  fetch(`https://api.openverse.org/v1${path}`, { headers }).then(async (r) => {
    if (!r.ok) die(`Openverse ${r.status}: ${await r.text()}`);
    return r.json();
  });

if (cmd === "search") {
  const videoLen = project.data.cleancut?.duration ?? project.data.source.duration;
  const min = Number(flags.min || Math.min(90, Math.ceil(videoLen)));
  const n = Number(flags.n || 8);
  const params = { q: arg, page_size: "20", mature: "false" };
  // Jamendo + ccMixter are actual music; freesound is mostly loops/field recordings.
  params.source = flags.source || "jamendo,ccmixter";
  if (flags.cc0) params.license = "cc0,pdm";
  else if (!flags["any-license"]) params.license_type = "commercial";
  const res = await api(`/audio/?${new URLSearchParams(params)}`);
  const picks = res.results
    .filter((a) => (a.duration ?? 0) / 1000 >= min && !/\bnc\b|-nc|nd/.test(a.license))
    .filter((a) => !/\b(sfx|sound effect|ambience|ambiente|field recording|foley|folley|noise|noisy|vinyl|crackle|alarm|explosion|rumble|birdsong|jungle|garden|office|rain|traffic|crowd)\b/i.test(`${a.title} ${(a.tags || []).map((t) => t.name).join(" ")}`))
    .slice(0, n);
  if (!picks.length) die(`no tracks ≥${min}s for "${arg}" — try fewer/more generic words ("ambient", "upbeat", "cinematic")`);
  for (const a of picks)
    console.log(
      `${a.id}  ${(a.duration / 1000).toFixed(0)}s  ${a.license.toUpperCase()}  "${a.title}" by ${a.creator}  [${(a.genres || []).join(",")}${a.tags?.length ? " | " + a.tags.slice(0, 6).map((t) => t.name).join(",") : ""}]`,
    );
  writeJson(join(project.paths.work, "bgm-search.json"), { query: arg, results: picks });
  console.log(`next: node tools/bgm.mjs get ${projectName} <id> --name <slug>   (check the title fits the mood first)`);
} else if (cmd === "get") {
  const a = await api(`/audio/${arg}/`);
  const name = slugify(flags.name || a.title || a.id);
  const rel = `assets/music/${name}.mp3`;
  await download(a.url, join(project.dir, rel));
  const attribution = a.license === "cc0" || a.license === "pdm" ? null : a.attribution;
  addCredit(project.paths.credits, {
    file: rel,
    kind: "music",
    source: `Openverse/${a.source}`,
    title: a.title,
    url: a.foreign_landing_url,
    creator: a.creator,
    license: `CC ${a.license.toUpperCase()} ${a.license_version || ""}`.trim(),
    attribution,
  });
  console.log(`saved ${rel}  (${(a.duration / 1000).toFixed(0)}s, CC ${a.license.toUpperCase()})`);
  if (attribution) console.log(`attribution REQUIRED in the description: ${attribution}`);
  console.log(`use it: { "start": 0, "end": <s>, "file": "${rel}", "gain_rel": 1.0 } in work/audio-plan.json music_cues`);
} else die(`unknown command ${cmd}`);
