// Audio helpers shared by tools/sfx.mjs and tools/mix.mjs: SFX name resolution, spectral band
// classification, and the measured levelling policy (ported from the template's sfx_levels.py and
// music_levels.py, whose constants were tuned on real viewer complaints — see project.md there).
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, extname, join } from "node:path";
import { ROOT, readJson, volumeDetect, writeJson } from "./common.mjs";

export const LIBRARY = join(ROOT, "assets", "sfx");
export const HF_LIBRARY = join(homedir(), ".claude", "skills", "media-use", "audio", "assets", "sfx");
const AUDIO_EXT = [".mp3", ".wav", ".m4a", ".ogg", ".flac"];

/** Every SFX reachable by name: project assets/sfx > repo library > HyperFrames bundled set. */
export function sfxCatalog(projectDir) {
  const out = new Map();
  const add = (dir, source) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      if (!AUDIO_EXT.includes(extname(f).toLowerCase())) continue;
      const name = basename(f, extname(f));
      if (!out.has(name)) out.set(name, { name, file: join(dir, f), source });
    }
  };
  if (projectDir) add(join(projectDir, "assets", "sfx"), "project");
  add(LIBRARY, "library");
  add(HF_LIBRARY, "hyperframes");
  return out;
}

export function resolveSfx(name, projectDir) {
  return sfxCatalog(projectDir).get(name) ?? null;
}

/**
 * Share of a sound's energy below the voice (0-120 Hz) and on it (300-3400 Hz).
 * The template's measurement: dialogue is ~81% in 300-3400 Hz; a cue that lives there competes with
 * every word however quiet it is, while sub-band cues (sub_drop/impact/riser: 93-100% < 120 Hz) are
 * felt and never mask speech. That is why sub-band cues carry structure and vocal-band cues are rationed.
 */
export function bandShares(file) {
  const p = (db) => 10 ** (db / 10);
  const total = p(volumeDetect(file).mean);
  const low = p(volumeDetect(file, "lowpass=f=120,lowpass=f=120").mean);
  const vocal = p(volumeDetect(file, "highpass=f=300,highpass=f=300,lowpass=f=3400,lowpass=f=3400").mean);
  const share = (x) => Math.round(Math.min(1, x / total) * 100) / 100;
  const s = { low: share(low), vocal: share(vocal) };
  return { ...s, band: s.low >= 0.6 ? "sub" : s.vocal >= 0.5 ? "vocal" : "mixed" };
}

/** Cached analysis (duration, band) per SFX file, keyed by size+mtime. */
export function analyseSfx(entries, cacheFile) {
  const cache = existsSync(cacheFile) ? readJson(cacheFile) : {};
  let dirty = false;
  for (const e of entries) {
    const st = statSync(e.file);
    const key = `${e.file}|${st.size}|${Math.round(st.mtimeMs)}`;
    if (!cache[key]) {
      const { mean, peak } = volumeDetect(e.file);
      cache[key] = { mean, peak, ...bandShares(e.file), seconds: durationOf(e.file) };
      dirty = true;
    }
    Object.assign(e, cache[key]);
  }
  if (dirty) writeJson(cacheFile, cache);
  return entries;
}

export function durationOf(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file], { encoding: "utf8" });
  return Math.round(Number(r.stdout.trim()) * 100) / 100 || 0;
}

/* ------------------------------ levelling ------------------------------ */
// Every effect sits a fixed distance under THIS narration and is never allowed to peak near it.
export const SFX_POLICY = {
  rmsBelowDb: 14, // perceived level under the voice
  peakHeadroomDb: 8, // hard ceiling under the voice's peak
  transientPeakBelowDb: 24, // floor for short one-shots (RMS rule buries brick-walled 0dBFS hits)
  shortSeconds: 2.5,
  trimRefSeconds: 0.18, // the ear integrates energy: longer effects at the same peak sound louder,
  trimPerDoublingDb: 4.5, // so every doubling of length beyond a transient costs 4.5 dB…
  trimFloorDb: -8, // …down to -8 dB
};

const dbToGain = (db) => 10 ** (db / 20);

export function sfxGain(effect, narration) {
  const P = SFX_POLICY;
  const target = narration.mean - P.rmsBelowDb;
  const ceiling = narration.peak - P.peakHeadroomDb;
  let want = dbToGain(target - effect.mean);
  let limitedBy = "rms";
  if (effect.seconds && effect.seconds <= P.shortSeconds) {
    const floor = dbToGain(narration.peak - P.transientPeakBelowDb - effect.peak);
    if (floor > want) [want, limitedBy] = [floor, "transient-floor"];
  }
  const peakGain = dbToGain(ceiling - effect.peak);
  if (peakGain < want) [want, limitedBy] = [peakGain, "peak-ceiling"];
  let trim = 0;
  if (effect.seconds > P.trimRefSeconds) {
    trim = Math.max(P.trimFloorDb, -P.trimPerDoublingDb * Math.log2(effect.seconds / P.trimRefSeconds));
    want *= dbToGain(trim);
  }
  return { gain: Math.max(0.02, Math.min(2, want)), limitedBy, trimDb: Math.round(trim * 10) / 10 };
}

// Beds are conditioned (dynaudnorm flattens a track's own 15 dB swings — the cause of "negligible at
// the start, dominant at the end") and then measured to ONE house level under the narration.
export const MUSIC_CONDITION = "dynaudnorm=f=250:g=13:p=0.85:m=6";
export const MUSIC_BELOW_DB = 9; // mean-to-mean, before ducking; 20 dB read "negligible", 6.5 dB "dominant"

export function musicGain(file, narration) {
  const { mean } = volumeDetect(file, MUSIC_CONDITION);
  return { gain: Math.max(0.01, Math.min(1, dbToGain(narration.mean - MUSIC_BELOW_DB - mean))), conditionedMean: mean };
}

// Sidechain duck tuned for narration over a bed: drops as soon as the voice is present, comes back
// slowly enough not to pump between words.
export const DUCK = "sidechaincompress=threshold=0.025:ratio=9:attack=25:release=550:makeup=1";
