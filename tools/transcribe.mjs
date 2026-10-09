#!/usr/bin/env node
// Stage 1a — transcribe the raw video verbatim with word timestamps. Engine by language (cost):
//   English        → whisper.cpp, local and free (small.en; --whisper-model medium.en for noisy audio)
//   Telugu / Hindi → ElevenLabs Scribe v2 (paid; far better on Indic + code-mixed speech)
//   unknown        → free whisper language detection first; English only if confident (p ≥ 0.8),
//                    anything else / uncertain (e.g. Hinglish, Tenglish) goes to ElevenLabs
// Writes work/transcript.raw.json (engine output, cached), work/words.json (normalized),
// work/silences.json (ffmpeg silencedetect) and work/transcript.md (the editor's view).
// Usage: node tools/transcribe.mjs <project> [--force] [--lang te|hi|en] [--engine whisper|elevenlabs]
//        [--whisper-model small.en|medium.en] [--diarize] [--model scribe_v2]
import { existsSync, openAsBlob, readFileSync } from "node:fs";
import { join } from "node:path";
import { alignScript } from "./lib/script.mjs";
import { alignWordsToSpeech, detectLanguage, whisperTranscribe } from "./lib/whisper.mjs";
import {
  die,
  markStage,
  openProject,
  parseCli,
  readJson,
  requireEnv,
  run,
  ts,
  writeJson,
  writeText,
} from "./lib/common.mjs";

const { flags, positional } = parseCli();
const project = openProject(positional[0]);
const { paths } = project;
const src = project.data.source.file;

// ISO-639-1 → ISO-639-3 (Scribe accepts both; 3-letter is unambiguous).
const LANGS = { te: "tel", hi: "hin", en: "eng", ta: "tam", kn: "kan", ml: "mal", mr: "mar", bn: "ben" };

// 1. Audio extract — mono AAC is ~10x smaller than the video to upload.
if (!existsSync(paths.audio) || flags.force) {
  console.log("extracting audio…");
  run("ffmpeg", ["-y", "-v", "error", "-i", src, "-vn", "-ac", "1", "-ar", "44100", "-c:a", "aac", "-b:a", "128k", paths.audio]);
}

// 2. Silence map (independent of the transcript; catches dead air with breaths/noise).
const silences = detectSilences(paths.audio);
writeJson(paths.silences, silences);

// 3. Transcribe (cached — use --force to redo).
let raw;
if (existsSync(paths.transcriptRaw) && !flags.force) {
  console.log("using cached transcript.raw.json (pass --force to re-transcribe)");
  raw = readJson(paths.transcriptRaw);
} else {
  let lang = flags.lang || project.data.language;
  let engine = flags.engine || (lang === "en" ? "whisper" : lang ? "elevenlabs" : null);
  if (!engine) {
    const det = await detectLanguage(paths.audio, paths.work);
    console.log(`detected language: ${det.code} (p=${det.probability}) via whisper`);
    project.data.detectedLanguage = { code: det.code, probability: det.probability, by: "whisper" };
    if (det.code === "en" && det.probability >= 0.8) {
      engine = "whisper";
      lang = "en";
    } else {
      engine = "elevenlabs";
      if (["te", "hi"].includes(det.code) && det.probability >= 0.5) lang = det.code; // else let Scribe auto-detect
    }
  }
  if (!["whisper", "elevenlabs"].includes(engine)) die(`unknown --engine ${engine}`);
  if (engine === "whisper" && lang && lang !== "en")
    die(`whisper is only used for English here (${lang} needs --engine elevenlabs) — .en models translate other languages`);

  if (engine === "whisper") {
    const model = flags["whisper-model"] || "small.en";
    console.log(`transcribing locally with whisper.cpp ${model} (free)…`);
    raw = await whisperTranscribe(paths.audio, paths.work, { model, keyterms: project.data.keyterms || [] });
    alignWordsToSpeech(raw.words, silences, project.data.source.duration);
  } else {
    raw = await elevenLabs(lang);
  }
  raw.engine ??= "elevenlabs scribe";
  writeJson(paths.transcriptRaw, raw);
}
raw.engine ??= "elevenlabs scribe"; // transcripts cached before engines were recorded

async function elevenLabs(lang) {
  const key = requireEnv("ELEVENLABS_API_KEY", "Get one at https://elevenlabs.io/app/settings/api-keys");
  const form = new FormData();
  form.append("model_id", flags.model || "scribe_v2");
  form.append("file", await openAsBlob(paths.audio, { type: "audio/mp4" }), "audio.m4a");
  form.append("timestamps_granularity", "word");
  form.append("tag_audio_events", "true");
  // Verbatim is essential: the clean cut needs to SEE fillers, false starts and repeats.
  form.append("no_verbatim", "false");
  form.append("diarize", flags.diarize ? "true" : "false");
  if (lang) form.append("language_code", LANGS[lang] || lang);
  for (const term of project.data.keyterms || []) form.append("keyterms", term);

  console.log(`transcribing with ElevenLabs (${lang ? "language " + lang : "auto language"})…`);
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form,
  });
  if (!res.ok) die(`ElevenLabs ${res.status}: ${await res.text()}`);
  return res.json();
}

// 4. Normalize to the word shape HyperFrames captions also understand ({id,text,start,end}).
const words = [];
for (const w of raw.words || []) {
  if (w.type === "spacing") continue;
  const text = String(w.text).trim();
  if (!text) continue;
  words.push({
    id: `w${words.length}`,
    text,
    start: w.start,
    end: w.end,
    type: w.type === "audio_event" ? "event" : "word",
    ...(w.speaker_id ? { speaker: w.speaker_id } : {}),
    ...(typeof w.logprob === "number" ? { conf: Math.round(Math.exp(w.logprob) * 100) / 100 } : {}),
  });
}
writeJson(paths.words, words);

// 5. Human/LLM-readable transcript used to make cut decisions.
const md = renderTranscript(words, silences, raw, project.data.source.duration);
writeText(paths.transcriptMd, md);

// 6. Scripted voiceover: align what was said to what was written.
if (project.data.script?.file && existsSync(project.data.script.file)) {
  const { report, textFixes } = alignScript(words, readFileSync(project.data.script.file, "utf8"));
  writeText(join(paths.work, "script-diff.md"), report);
  console.log(`script alignment → work/script-diff.md (${Object.keys(textFixes).length} suggested caption fixes)`);
}

project.data.detectedLanguage ??= { code: raw.language_code, probability: raw.language_probability };
markStage(project, "transcribe", { words: words.length, engine: raw.engine });
console.log(`${raw.engine}: language ${raw.language_code}, ${words.length} tokens`);
console.log(`wrote ${paths.transcriptMd}`);
console.log(`next: read transcript.md, write work/edl.json, then npm run cut -- ${project.data.name} --dry-run`);

function detectSilences(audio) {
  const res = run("ffmpeg", ["-hide_banner", "-nostats", "-i", audio, "-af", "silencedetect=noise=-35dB:d=0.35", "-f", "null", "-"]);
  const out = [];
  let start = null;
  for (const line of res.stderr.split("\n")) {
    const s = line.match(/silence_start: ([\d.]+)/);
    const e = line.match(/silence_end: ([\d.]+)/);
    if (s) start = Number(s[1]);
    if (e && start != null) {
      out.push({ start: start, end: Number(e[1]) });
      start = null;
    }
  }
  return out;
}

function renderTranscript(words, silences, raw, duration) {
  const LINE_BREAK_GAP = 0.45;
  const MAX_WORDS = 16;
  const lines = [];
  let cur = [];
  const flush = () => cur.length && (lines.push(cur), (cur = []));
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = words[i - 1];
    if (prev && w.start - prev.end >= LINE_BREAK_GAP) flush();
    cur.push(w);
    if (/[.?!।॥]$/.test(w.text) || cur.length >= MAX_WORDS) flush();
  }
  flush();

  const fmtWord = (w) => {
    if (w.type === "event") return `[${w.text.replace(/[()]/g, "")}]`;
    return w.conf != null && w.conf < 0.5 ? `${w.text}⁽?⁾` : w.text;
  };
  const longSilences = silences.filter((s) => s.end - s.start >= 0.8);

  const out = [
    `# Transcript (raw timeline)`,
    ``,
    `- language: ${raw.language_code}${raw.language_probability != null ? ` (p=${raw.language_probability})` : ""} · engine: ${raw.engine}`,
    `- duration: ${ts(duration)} · tokens: ${words.length} · lines: ${lines.length}`,
    `- legend: \`L012 [mm:ss.ss–mm:ss.ss] w120–w134 | text\` · \`word⁽?⁾\` = low ASR confidence (possible mispronunciation/mumble) · \`[event]\` = non-speech audio · \`… pause Xs\` = gap before the next line`,
    `- reference words by id (w120) or ranges (w120–w134) in work/edl.json`,
    ``,
  ];
  if (words.length && words[0].start > 0.5) out.push(`… lead-in ${words[0].start.toFixed(2)}s before first word`);
  lines.forEach((line, i) => {
    const first = line[0];
    const last = line.at(-1);
    out.push(
      `L${String(i + 1).padStart(3, "0")} [${ts(first.start)}–${ts(last.end)}] ${first.id}–${last.id} | ${line.map(fmtWord).join(" ")}`,
    );
    const next = lines[i + 1]?.[0];
    if (next) {
      const gap = next.start - last.end;
      if (gap >= 0.6) out.push(`   … pause ${gap.toFixed(2)}s`);
    }
  });
  const tail = duration - (words.at(-1)?.end ?? 0);
  if (tail > 0.5) out.push(`… tail ${tail.toFixed(2)}s after last word`);
  out.push("", `## Long silences (≥0.8s, -35dB)`, "");
  out.push(longSilences.length ? longSilences.map((s) => `- ${ts(s.start)}–${ts(s.end)} (${(s.end - s.start).toFixed(2)}s)`).join("\n") : "- none");
  return out.join("\n") + "\n";
}
