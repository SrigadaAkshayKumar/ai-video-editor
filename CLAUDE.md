# AI-edits

Claude Code is the editor. Two kinds of input, two deliverables each:

| Input | Skill | Output |
|---|---|---|
| Raw video of a person talking (Telugu / Hindi / English / code-mixed) | `edit-video` | `output/final-16x9.mp4` (YouTube) + `output/final-9x16.mp4` (Instagram) |
| A voiceover with no presenter (faceless documentary/explainer) | `edit-video-faceless` | same |
| A finished edit here (`projects/<p>`, or all parts of a long video) | `AI-clipper/.claude/skills/clip-shorts/SKILL.md` (read it) | `AI-clipper/output/<slug>/` 9:16 Shorts + upload sheet |

## How work arrives

**Unattended daily run** (GitHub Actions, Google Drive in/out): `.github/workflows/daily-edit.yml` → `daily-script`
skill (planned episode, else fresh news; format `docs/examples/crack-it-d01/`) → `tools/voice/tts.py` (owner's cloned
voice, Qwen3-TTS on CPU, `config/voice.json`) → `daily-run` skill → `tools/daily.mjs` (next / script-check / check /
done), standing brief `config/daily.json`; setup in `docs/cloud-setup.md`. The repo is public: no media, voice
reference or keys in git.

The user drops files in `inbox/` and names them in the prompt with the style they want:
- `inbox/talking/video-1.mp4` + "edit video-1 — fast, bold captions, Telugu" → `edit-video`
- `inbox/faceless/script-1.txt` + `script-1-audio.mp3` + "edit faceless using script-1 and
  script-1-audio — calm documentary" → `edit-video-faceless` (the script is the source of truth)
Names may be written "/script-1" — strip the slash. `npm run inbox` lists what is waiting.
**The prompt's style words are the brief** (`--brief`). This repo edits for many clients: no channel or
brand is assumed; when the user names one, use/create `config/brands/<slug>.json` (`--brand`,
`--intro`/`--outro` from `inbox/brand/`).

Stage skills: `clean-cut`, `motion-graphics`, `captions`, `sfx`, `bgm`; packaging: `youtube-metadata`,
`youtube-thumbnail`. **Read `docs/lessons.md` once per session** — incidents that cost real renders.

## Architecture

```
source ─ transcribe ─ cut (EDL, boundary audit) ─ work/cleancut.mp4|wav + cleancut.words.json + timeline.json
  work/visual-plan.json ─ tools/render-visuals.mjs ─ Remotion `Doc` (MUTED) ─ work/visuals-<fmt>.mp4   ×2 formats
  tools/scaffold-edit.mjs ─ HyperFrames captions pass over the visuals ─ edit-<fmt>/                     ×2
  work/audio-plan.json ─ tools/mix.mjs (dialogue + ducked, levelled music + levelled SFX) ─ work/mix.wav   ×1
  tools/finalize.mjs ─ render captions pass, mux with -14 LUFS master, intro/outro ─ output/final-<fmt>.mp4
  tools/verify.mjs ─ durations, audio streams, loudness, frozen frames, frames at every cut join
```

| Concern | Provider | Where |
|---|---|---|
| STT, English | whisper.cpp `small.en`, local, free (verbatim prompt + silence re-anchoring) | `tools/transcribe.mjs`, `tools/lib/whisper.mjs` |
| STT, Telugu / Hindi / code-mixed | ElevenLabs Scribe v2 (paid) | `tools/transcribe.mjs` |
| Picture: a-roll/scenes, 6 stage layouts, 28 graphic types, b-roll, camera, chapter rail | Remotion (`remotion/src/doc/`, ported from video-editor-template, made 16:9 + 9:16 aware) | `tools/render-visuals.mjs` |
| Captions (word-synced, Indic-correct) | HyperFrames 0.8.120 | `tools/scaffold-edit.mjs`, `tools/captions.mjs` |
| B-roll + stills | Pexels, falls back to Pixabay | `tools/broll.mjs` |
| News screenshots (faceless) | headless Chrome/Edge, or claude-in-chrome + `adopt` | `tools/news.mjs` |
| Music | Openverse (CC BY/BY-SA/CC0) | `tools/bgm.mjs` |
| SFX | repo `assets/sfx` + HyperFrames set + Openverse CC0 | `tools/sfx.mjs` |
| Mix + levels | ffmpeg (sidechain duck, measured levels) | `tools/mix.mjs`, `tools/lib/audio.mjs` |
| Thumbnail / Reels cover | real face frame + cut-out + Remotion `Thumbnail` | `tools/thumbnail.mjs` |

## Commands (repo root)

```
npm run inbox                             (what's waiting, and script ↔ audio pairs)
npm run new -- <inbox-name|path> [--script name] --brief "…" [--lang te|hi|en] [--mode talking|faceless]
               [--formats 16:9,9:16] [--style glass|broadcast|liquid] [--brand slug] [--intro clip] [--outro clip]
npm run transcribe -- <p> [--force] [--lang …] [--engine whisper|elevenlabs] [--whisper-model medium.en]
npm run cut -- <p> [--dry-run]            node tools/retime.mjs <p>     (after a re-cut)
npm run visuals -- <p> [--check] [--stills 3.2,40] [--format 9:16]
npm run scaffold -- <p>                   npm run captions -- <p> [--style pop|clean|karaoke] …
npm run broll -- search|get <p> … [--photos] [--provider pexels|pixabay]
npm run news -- status|capture|adopt <p> …
npm run bgm -- search|get <p> … [--cc0]   npm run sfx -- list [<p>] | fetch <p> <name> ["query"]
npm run mix -- <p>                        npm run finalize -- <p> [--quality draft|looks|delivery] [--no-outro]
npm run verify -- <p>                     npm run thumbnail -- frames|cutout|render <p> …
npm run status [-- <p>]                   npm run gallery   (one still per graphic type, both formats)
npm run join -- <out-name> <part-project…> [--format 16x9]   (long video edited as parts → output/<out>-16x9.mp4, stream copy)
npm run shorts:transcribe -- <project…> [--slug name] [--from clean|final]   (AI-clipper: Shorts from finished edits;
               no input folder; clean = visuals + master, no burned captions, reuses cleancut.words.json)
npm run shorts:prepare -- <slug> [--only 1,3]   npm run shorts:render -- <slug> [--only 1,3]
```

## Conventions

- Tools are dependency-free Node ESM with shared helpers in `tools/lib/` (`common.mjs`, `audio.mjs`,
  `whisper.mjs`): small CLIs, `parseCli`, `openProject`, `die`, JSON/MD artefacts. Match that style.
- Decisions live in files: `work/edl.json` (raw timeline), `work/direction.json`,
  `work/visual-plan.json` and `work/audio-plan.json` (clean-cut timeline). Tools are re-runnable.
- Fetched media lives in the project's `assets/` (shared by both formats); credits in `work/credits.json`.
- New graphic component: `remotion/src/doc/overlays/` + registry + `RULES` in `tools/render-visuals.mjs`
  + a gallery entry; run `npm run gallery` and Read both sheets. `npx tsc --noEmit && npx eslint src` in `remotion/`.
- Scripted voiceovers: `source/script.txt` (from .txt/.md/.docx); `transcribe` writes
  `work/script-diff.md` (extra spoken runs = cut candidates, never-spoken passages, caption spelling fixes).
- Brand/channel profiles only on request: `config/brands/<slug>.json`; bumpers via `--intro`/`--outro`.
- Secrets in `.env` (the user pastes keys there; see `.env.example`). Never print or commit it.
- Windows: write files with the Write tool, not PowerShell (BOM). Tools find winget's ffmpeg themselves.
- Fixtures: `projects/pipeline-test` (talking head, TTS + test pattern, hand-made transcript — never
  `--force` transcribe it) and `projects/faceless-test` (TTS voiceover through whisper). Raw media is
  git-ignored.
