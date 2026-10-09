#!/usr/bin/env node
// The one audio pass: dialogue/VO (from the clean cut) + music beds + SFX → work/mix.wav, shared by
// every output format (they share the clean-cut timeline). Ported from the template's mix_audio.py,
// sfx_levels.py and music_levels.py. Levels are MEASURED against this video's own narration:
//   - every SFX sits ~14 dB under the voice, with a peak ceiling and a short-transient floor
//   - every music bed is conditioned (dynaudnorm) and placed at one house level 9 dB under the voice,
//     then sidechain-ducked against the voice; `gain_rel` trims relative to that house level
// Usage: node tools/mix.mjs <project> [--dry-run]
//
// audio-plan.json (clean-cut timeline):
// {
//   "music_cues": [ { "start": 0, "end": 46.2, "file": "assets/music/x.mp3", "gain_rel": 1.0,
//                     "fade_in": 1.0, "fade_out": 2.5, "music_start": 0, "mood": "cold tension",
//                     "loop": false } ],   // loop: repeat a short CC0 bed to fill a long cue (seamless loops only)
//   "sfx_events": [ { "time": 8.4, "sfx": "sub_drop", "gain": 1.0, "reason": "…" } ]
// }
// A per-cue sfx `gain` can only push an effect further DOWN (clamped to ≤1).
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DUCK, LIBRARY, MUSIC_CONDITION, analyseSfx, musicGain, resolveSfx, sfxGain } from "./lib/audio.mjs";
import { die, markStage, openProject, parseCli, readJson, round3, run, ts, volumeDetect, writeJson } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths, data } = project;
if (!data.cleancut || !existsSync(paths.cleancut)) die("no clean cut — run cut first");
const plan = existsSync(paths.audioPlan) ? readJson(paths.audioPlan) : { music_cues: [], sfx_events: [] };
const D = data.cleancut.duration;

const narration = volumeDetect(paths.cleancut);
console.log(`narration: mean ${narration.mean.toFixed(1)} dB, peak ${narration.peak.toFixed(1)} dB`);

// ---- validate + level ----------------------------------------------------------------------
const warns = [];
const cues = (plan.music_cues || []).slice().sort((a, b) => a.start - b.start);
cues.forEach((c, i) => {
  if (i && c.start < cues[i - 1].end - 0.01) warns.push(`music cue @${ts(c.start)} overlaps the previous one — one bed at a time`);
  const file = join(project.dir, c.file || "");
  if (!c.file || !existsSync(file)) return warns.push(`music cue @${ts(c.start)}: missing file ${c.file}`);
  const len = Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file]).stdout);
  if (!c.loop && len < (c.music_start || 0) + (c.end - c.start)) warns.push(`music cue @${ts(c.start)}: track is ${len.toFixed(0)}s, cue needs ${((c.music_start || 0) + c.end - c.start).toFixed(0)}s — it will run out`);
});
const musicLevels = {};
for (const c of cues) {
  if (!c.file || musicLevels[c.file] || !existsSync(join(project.dir, c.file))) continue;
  musicLevels[c.file] = musicGain(join(project.dir, c.file), narration);
}

const events = (plan.sfx_events || []).slice().sort((a, b) => a.time - b.time);
const sfxFiles = new Map();
for (const e of events) {
  const hit = resolveSfx(e.sfx, project.dir);
  if (!hit) warns.push(`sfx "${e.sfx}" @${ts(e.time)} not found (node tools/sfx.mjs list)`);
  else sfxFiles.set(e.sfx, hit);
}
analyseSfx([...sfxFiles.values()], join(LIBRARY, ".analysis.json"));
const sfxLevels = Object.fromEntries([...sfxFiles].map(([n, e]) => [n, { ...sfxGain(e, narration), band: e.band, seconds: e.seconds }]));
events.forEach((e, i) => {
  if (i && e.time - events[i - 1].time < 0.35) warns.push(`sfx @${ts(e.time)} is within 0.35s of the previous cue`);
});
const counts = events.reduce((m, e) => ((m[e.sfx] = (m[e.sfx] || 0) + 1), m), {});
for (const [n, c] of Object.entries(counts))
  if (events.length >= 6 && c / events.length > 0.34) warns.push(`"${n}" is ${c}/${events.length} cues — over a third reads as a tic`);
const vocal = events.filter((e) => sfxLevels[e.sfx]?.band === "vocal").length;
if (events.length) console.log(`sfx: ${events.length} cues (${vocal} vocal-band), ~1 per ${(D / events.length).toFixed(1)}s`);

writeJson(paths.levels, { narration, music: musicLevels, sfx: sfxLevels });
for (const w of warns) console.log(`  warn: ${w}`);
if (flags["dry-run"]) process.exit(0);

// ---- one ffmpeg pass ------------------------------------------------------------------------
const inputs = ["-i", paths.cleancut];
const parts = ["[0:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,asplit=2[vo][key]"];
const mixLabels = ["[vo]"];
let idx = 1;
const musLabels = [];
for (const c of cues) {
  const lvl = musicLevels[c.file];
  if (!lvl) continue;
  const len = Math.max(0.5, c.end - c.start);
  const ms = c.music_start || 0;
  const fin = c.fade_in ?? 1.0;
  const fout = c.fade_out ?? 2.0;
  const gain = lvl.gain * (c.gain_rel ?? 1);
  const delay = Math.round(c.start * 1000);
  inputs.push(...(c.loop ? ["-stream_loop", "-1"] : []), "-i", join(project.dir, c.file));
  parts.push(
    `[${idx}:a]atrim=start=${ms.toFixed(3)}:end=${(ms + len).toFixed(3)},asetpts=PTS-STARTPTS,` +
      `afade=t=in:st=0:d=${fin.toFixed(2)},afade=t=out:st=${Math.max(0, len - fout).toFixed(3)}:d=${fout.toFixed(2)},` +
      `${MUSIC_CONDITION},volume=${gain.toFixed(4)},aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,` +
      `adelay=${delay}|${delay}[mus${musLabels.length}]`,
  );
  musLabels.push(`[mus${musLabels.length}]`);
  idx++;
}
if (musLabels.length) {
  parts.push(
    musLabels.length > 1
      ? `${musLabels.join("")}amix=inputs=${musLabels.length}:duration=longest:dropout_transition=0:normalize=0[bed]`
      : `${musLabels[0]}anull[bed]`,
  );
  parts.push(`[bed][key]${DUCK}[ducked]`);
  mixLabels.push("[ducked]");
} else parts.push("[key]anullsink");

// Each distinct SFX file is ONE input, split per use: one input per event blew Windows' 32k
// command-line limit on a 24-minute edit with 181 cues (spawnSync ENAMETOOLONG).
let n = 0;
const used = events.filter((e) => sfxFiles.get(e.sfx));
const byFile = new Map();
for (const e of used) {
  const f = sfxFiles.get(e.sfx).file;
  if (!byFile.has(f)) byFile.set(f, []);
  byFile.get(f).push(e);
}
for (const [file, list] of byFile) {
  inputs.push("-i", file);
  const outs = list.map((_, k) => `[sx${idx}_${k}]`).join("");
  parts.push(list.length > 1 ? `[${idx}:a]asplit=${list.length}${outs}` : `[${idx}:a]anull${outs}`);
  list.forEach((e, k) => {
    const gain = sfxLevels[e.sfx].gain * Math.min(1, e.gain ?? 1);
    const delay = Math.round(e.time * 1000);
    parts.push(`[sx${idx}_${k}]volume=${gain.toFixed(4)},aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,adelay=${delay}|${delay}[sfx${n}]`);
    mixLabels.push(`[sfx${n}]`);
    n++;
  });
  idx++;
}
// normalize=0: the voice must not be attenuated just because other inputs exist.
// alimiter: a safety ceiling, not a loudness pass (finalize does loudness).
parts.push(`${mixLabels.join("")}amix=inputs=${mixLabels.length}:duration=first:dropout_transition=0:normalize=0[pre]`);
parts.push(`[pre]alimiter=limit=0.97:level=disabled[aout]`);
// The graph goes through a file (-/filter_complex): long edits outgrow the command line.
const graphFile = join(paths.work, "mix.filtergraph.txt");
writeFileSync(graphFile, parts.join(";\n"));
run("ffmpeg", ["-y", "-v", "error", ...inputs, "-/filter_complex", graphFile, "-map", "[aout]", "-c:a", "pcm_s16le", "-ar", "48000", paths.mix]);

const mixed = volumeDetect(paths.mix);
markStage(project, "mix", { music: musLabels.length, sfx: n });
console.log(`mixed ${musLabels.length} music cue(s) (ducked) + ${n} sfx → ${paths.mix} (mean ${mixed.mean.toFixed(1)} dB, peak ${mixed.peak.toFixed(1)} dB, ${round3(D)}s)`);
console.log("You cannot hear this mix — ask the user to listen for: bed level under speech, ducking, transitions.");
