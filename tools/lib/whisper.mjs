// Local, free speech-to-text with whisper.cpp (whisper-cli). Used for English videos and for
// language detection; Telugu/Hindi go to ElevenLabs (see tools/transcribe.mjs).
// Binary + models are installed on first use under %LOCALAPPDATA%\whisper.cpp (outside the repo).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { download, loadEnv, run } from "./common.mjs";

const RELEASE = "v1.9.2";
const ZIP = process.platform === "win32" ? "whisper-blas-bin-x64.zip" : null;
const HOME = process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "whisper.cpp") : join(homedir(), ".whisper.cpp");
const MODELS = join(HOME, "models");

// Whisper normally "cleans up" speech. Priming it with disfluent text makes it keep fillers,
// false starts and repeats — the clean-cut stage needs to see them to remove them.
const VERBATIM_PROMPT =
  "Umm, so, uh, let me think, like, hmm... Okay, I- I mean, you know, the the thing is, uh, here's what I'm, like, thinking.";

const DTW_PRESETS = new Set(["tiny", "tiny.en", "base", "base.en", "small", "small.en", "medium", "medium.en", "large.v3"]);

/**
 * Whisper word timings drift across pauses. Re-anchor every word inside a measured speech region
 * (the gaps between ffmpeg silencedetect silences), keeping word order, so pauses and cut points
 * in the transcript are real. Words whose timing lands inside a pause (whisper drifts late) are
 * handled as a run: up to the last sentence end in the run they belong before the pause, the rest
 * after it; with no sentence end, they follow the previous word unless that word ended a sentence.
 * Each region's words are then linearly fitted into the region, preserving relative timing.
 */
export function alignWordsToSpeech(words, silences, duration) {
  const regions = [];
  let cursor = 0;
  for (const s of [...silences].sort((a, b) => a.start - b.start)) {
    if (s.start > cursor + 0.02) regions.push({ start: cursor, end: s.start });
    cursor = Math.max(cursor, s.end);
  }
  if (duration > cursor + 0.02) regions.push({ start: cursor, end: duration });
  if (!regions.length || !words.length) return words;

  const endsSentence = (w) => /[.?!।॥…]["')\]]*$/.test(w.text);
  const mids = words.map((w) => (w.start + w.end) / 2);
  const regionOf = (t) => regions.findIndex((r) => t >= r.start && t <= r.end);
  const assigned = mids.map(regionOf);

  // Resolve runs of consecutive words that sit in a pause.
  for (let i = 0; i < words.length; ) {
    if (assigned[i] >= 0) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < words.length && assigned[j + 1] < 0 && regionOf(mids[j + 1]) < 0) j++;
    const after = regions.findIndex((r) => r.start > mids[i]);
    const before = after < 0 ? regions.length - 1 : after - 1;
    let lastBack = i - 1; // index of the last word in the run that goes back
    if (before < 0) lastBack = i - 1;
    else if (after < 0) lastBack = j;
    else {
      for (let k = j; k >= i; k--)
        if (endsSentence(words[k])) {
          lastBack = k;
          break;
        }
      if (lastBack < i && i > 0 && !endsSentence(words[i - 1])) lastBack = j;
    }
    for (let k = i; k <= j; k++) assigned[k] = k <= lastBack ? before : after;
    i = j + 1;
  }
  for (let i = 1; i < assigned.length; i++) assigned[i] = Math.max(assigned[i], assigned[i - 1]); // keep order

  // Fit each region's words into the region with a linear time map.
  for (let r = 0; r < regions.length; r++) {
    const ids = assigned.flatMap((a, i) => (a === r ? [i] : []));
    if (!ids.length) continue;
    const R = regions[r];
    const s0 = words[ids[0]].start;
    const s1 = Math.max(words[ids.at(-1)].end, s0 + 0.05);
    const t0 = Math.max(R.start, Math.min(s0, R.end - 0.05));
    const t1 = Math.max(t0 + 0.05, Math.min(R.end, s1));
    const map = (t) => t0 + ((t - s0) * (t1 - t0)) / (s1 - s0);
    for (const i of ids) {
      const w = words[i];
      [w.start, w.end] = [map(w.start), map(Math.max(w.end, w.start + 0.04))];
    }
  }
  return words;
}

export async function whisperBinary() {
  loadEnv();
  const fromEnv = process.env.WHISPER_CLI_PATH || process.env.HYPERFRAMES_WHISPER_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const exe = process.platform === "win32" ? "whisper-cli.exe" : "whisper-cli";
  const found = findFile(HOME, exe);
  if (found) return found;
  const onPath = run(process.platform === "win32" ? "where" : "which", ["whisper-cli"], { allowFail: true });
  if (onPath.status === 0) return onPath.stdout.split(/\r?\n/)[0].trim();
  if (!ZIP) throw new Error("whisper-cli not found — install whisper.cpp (brew install whisper-cpp) or set WHISPER_CLI_PATH");

  console.log(`installing whisper.cpp ${RELEASE} → ${HOME} (one time)…`);
  mkdirSync(HOME, { recursive: true });
  const zip = join(tmpdir(), ZIP);
  await download(`https://github.com/ggml-org/whisper.cpp/releases/download/${RELEASE}/${ZIP}`, zip);
  run("tar", ["-xf", zip, "-C", HOME]); // Windows 10+ ships bsdtar, which reads zip
  rmSync(zip, { force: true });
  const installed = findFile(HOME, exe);
  if (!installed) throw new Error(`whisper-cli.exe not found after extracting ${ZIP}`);
  return installed;
}

export async function whisperModel(name) {
  const file = join(MODELS, `ggml-${name}.bin`);
  if (existsSync(file) && statSync(file).size > 1e6) return file;
  console.log(`downloading whisper model ${name} (one time)…`);
  await download(`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${name}.bin`, file);
  return file;
}

/** 16 kHz mono WAV — the input whisper.cpp is built around. */
function toWav(audio, workDir) {
  const wav = join(workDir, "audio-16k.wav");
  if (!existsSync(wav)) run("ffmpeg", ["-y", "-v", "error", "-i", audio, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", wav]);
  return wav;
}

/** Detect the spoken language from the first 30s with the small multilingual base model. */
export async function detectLanguage(audio, workDir) {
  const bin = await whisperBinary();
  const model = await whisperModel("base");
  const res = run(bin, ["-m", model, "-f", toWav(audio, workDir), "-l", "auto", "-dl"], { allowFail: true }); // no -np: it hides the detection line
  const m = `${res.stdout}\n${res.stderr}`.match(/auto-detected language:\s*(\w+)\s*\(p\s*=\s*([\d.]+)\)/);
  if (!m) throw new Error(`whisper language detection failed:\n${(res.stderr || "").slice(-600)}`);
  return { code: m[1], probability: Number(m[2]) };
}

/**
 * Transcribe English speech to word timestamps. Returns the same shape transcribe.mjs stores for
 * ElevenLabs ({ language_code, words: [{ text, type, start, end, logprob }] }) so the rest of the
 * pipeline doesn't care which engine ran.
 */
export async function whisperTranscribe(audio, workDir, { model = "small.en", keyterms = [] } = {}) {
  const bin = await whisperBinary();
  const modelFile = await whisperModel(model);
  const outBase = join(workDir, "whisper");
  const prompt = keyterms.length ? `${VERBATIM_PROMPT} ${keyterms.join(", ")}.` : VERBATIM_PROMPT;
  const threads = String(Math.max(2, Math.min(8, (await import("node:os")).availableParallelism() - 1)));
  run(bin, [
    "-m", modelFile, "-f", toWav(audio, workDir), "-l", "en", "-t", threads,
    "--prompt", prompt,
    "-ml", "1", "-sow", // one segment per word, split on word boundaries
    // DTW token alignment: without it whisper.cpp stretches words across pauses.
    ...(DTW_PRESETS.has(model) ? ["-dtw", model] : []),
    "-ojf", "-of", outBase, "-np",
  ]);
  const json = JSON.parse(readFileSync(`${outBase}.json`, "utf8"));
  const words = [];
  for (const seg of json.transcription || []) {
    const text = seg.text.trim();
    if (!text) continue;
    const toks = (seg.tokens || []).filter((t) => !/^\[_/.test(t.text) && t.text.trim());
    const p = toks.length ? toks.reduce((s, t) => s + (t.p ?? 1), 0) / toks.length : 1;
    const start = seg.offsets.from / 1000;
    const end = Math.max(start + 0.02, seg.offsets.to / 1000);
    // whisper marks non-speech as [MUSIC], (laughs), etc.
    const isEvent = /^[[(].*[\])]$/.test(text);
    words.push({ text, type: isEvent ? "audio_event" : "word", start, end, logprob: Math.log(Math.max(p, 1e-4)) });
  }
  return { engine: `whisper.cpp ${model}`, language_code: "eng", language_probability: null, text: words.map((w) => w.text).join(" "), words };
}

function findFile(dir, name) {
  if (!existsSync(dir)) return null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === name.toLowerCase()) return p;
    if (entry.isDirectory() && entry.name !== "models") {
      const hit = findFile(p, name);
      if (hit) return hit;
    }
  }
  return null;
}
