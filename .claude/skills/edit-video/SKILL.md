---
name: edit-video
description: End-to-end editor for TALKING-HEAD videos (a person on camera) in this repo. Use when the user hands over a raw video with a speaker and wants a finished edit, or asks to continue/resume/redo any stage of an existing talking-head project — clean cut, motion graphics, b-roll, SFX, music, captions, final render, thumbnail. Delivers YouTube 16:9 and Instagram 9:16. Telugu, Hindi, English and code-mixed speech. For a voiceover with no presenter use edit-video-faceless.
---

# edit-video — talking head → final-16x9.mp4 + final-9x16.mp4

You are the editor. Tools in `tools/` do the mechanical work; **you make every editorial decision**
and keep it in files (`work/edl.json`, `work/visual-plan.json`, `work/audio-plan.json`) so any stage
can be redone. Read `docs/lessons.md` once per session — every rule there was paid for with a broken render.

## Architecture (why it is shaped like this)

```
raw ─ transcribe ─ cut ─┬─ work/cleancut.mp4 ──────────────┐
                        │                                    │ (dialogue)
       visual-plan.json ┴─ Remotion `Doc` (muted) ×2 formats  │
                             └─ HyperFrames captions pass ×2  │
       audio-plan.json ─────────────── tools/mix.mjs ◄───────┘ → work/mix.wav (once)
                                                     finalize: picture + -14 LUFS master + intro/outro
```

- **Remotion** draws the whole picture: the a-roll in one of six stage layouts (full / dock left /
  dock right / band / corner / takeover), 28 motion-graphic types, b-roll cutaways, camera moves, chapter rail.
- **HyperFrames** draws only the word-level captions (browser shaping renders Telugu/Devanagari correctly).
- **ffmpeg** does ALL audio: no `<audio>` in any render — embedding it corrupted dialogue repeatedly in
  the template this repo inherits from.
- Both formats share one clean-cut timeline, one visual plan and one mix.

## Stages

| # | Stage | Tool | Skill / notes |
|---|-------|------|---------------|
| 0 | Intake | `npm run new -- <inbox-name> --brief "…" [--lang te\|hi\|en] [--style glass\|broadcast] [--keyterms "A,B"]` | see Intake below |
| 1 | Transcribe | `npm run transcribe -- <p>` | English → whisper (free) · Telugu/Hindi → ElevenLabs |
| 2 | Clean cut | `npm run cut -- <p> [--dry-run]` | **clean-cut** skill. Most important stage. |
| 3 | Visual plan | write `work/visual-plan.json`; `npm run visuals -- <p> --check`; `--stills t1,t2` | **motion-graphics** skill |
| 4 | B-roll | `npm run broll -- search\|get` | inside motion-graphics |
| 5 | Render picture | `npm run visuals -- <p>` | ~1-2 min per minute of video per format |
| 6 | Captions | `npm run scaffold -- <p>` (+ `npm run captions -- <p> --style …`) | **captions** skill |
| 7 | Audio plan | write `work/audio-plan.json`; `npm run sfx -- list`; `npm run bgm -- search\|get`; `npm run mix -- <p>` | **sfx**, **bgm** skills |
| 8 | Finalize | `npm run finalize -- <p>` | lint, render, master, intro/outro, `output/credits.md` |
| 9 | Verify | `npm run verify -- <p>` → Read both `work/verify-*/sheet.jpg` | never skip |
| 10 | Package | `youtube-metadata`, `youtube-thumbnail` skills | offer at the end |

`npm run status` shows progress. After a re-cut: `node tools/retime.mjs <p>` carries both plans onto
the new timeline (old clean → raw → new clean) and lists anything whose moment was cut.

## Running it

1. **Intake.** The user drops the clip in `inbox/talking/` and names it in the prompt ("edit video-1 …",
   possibly written "/video-1" — strip the slash). `npm run inbox` lists what is waiting.
   `npm run new -- video-1 --brief "<the user's style words, verbatim>"` (+ `--lang` if they said it,
   `--keyterms` for names/brands). **The prompt's style instructions are the brief** — map them to
   settings before planning (see "Style brief → settings"). Ask nothing the prompt already answers.
   Brand/channel: none by default — this repo edits for many clients. Only when the user says whose
   video it is, load `config/brands/<slug>.json` (or create it from what they tell you) and pass
   `--brand`, plus `--intro`/`--outro` clips from `inbox/brand/` if they ask for them.
2. **Transcribe**, then read `work/transcript.md` end to end. Check the header's `engine` and `language`.
3. **Clean cut** — follow `clean-cut` exactly, including the boundary-audit and fragile-word output.
4. **Plan visuals** from `work/cleancut.transcript.md` (clean-cut times). Write the plan, `--check` it
   (it validates every component's required fields — the template's #1 silent defect), fix, then render
   `--stills` at 6-10 interesting times and **Read them in both formats** before the full render.
   Framing: if the speaker is off-centre in 9:16, set `"framing": {"9:16": "40% 45%"}`.
5. **Render picture**, **scaffold captions**, **plan audio** and **mix**, **finalize**, **verify**.
6. **Report**: both output paths; raw → clean duration and what was cut (by reason); overlay/b-roll/SFX
   counts; music used; anything fragile or uncertain; credits that MUST go in the description; and say
   plainly that you cannot hear the mix — ask the user to listen for the joins, bed level and ducking.
   Offer `/youtube-metadata` and `/youtube-thumbnail`.

## Style brief → settings

Translate the user's words into concrete choices and state them in one line before planning:

| They say | Set |
|---|---|
| fast / energetic / reels / punchy | `keepPauseMax` 0.25, caption `pop` 2-3 words, a beat every 2-4s, camera punches, sub-band SFX on structure |
| calm / professional / documentary / long-form | `keepPauseMax` 0.4-0.5, caption `clean` 4-6 words, a beat every 6-10s, fewer SFX, soft bed |
| minimal / clean / no-fuss | few overlays (text marks only where useful), no marquee/glitch, `clean` captions or none |
| bold / premium / news / editorial | `--style broadcast`, high-contrast accents |
| storytelling / emotional | `karaoke` captions, `piano`/`cinematic` bed, a music gap on the key line |
| "no music" / "no SFX" / "no captions" / "no b-roll" | honour exactly; skip that stage |
| (music not mentioned) | **no BGM** — the user says at the start of the prompt whether to add music; default is none. When added: CC0 only (`--cc0`) and SFX must stay clearly audible over it |
| a colour ("use yellow", a hex) | caption `--accent`, overlay `section` accents/brand |

Anything unusual in the brief overrides these defaults. Keep the brief in `project.json.brief` so a
re-edit later follows the same style.

## Review gates

Default: run straight through and report. If the user asks for checkpoints (or `project.json.review`
is `"stages"`), stop after the clean cut, after the visual plan (show stills), and after the audio
plan. A requested change is the new bar for that stage — revise and re-show the same stage.

## Rules

- All plan times are on the **clean-cut timeline**; EDL times are **raw**.
- Overlay text is short English by default (native script lives in the captions) unless the brief says otherwise.
- Never hand-edit generated files (`compositions/captions.html`, `work/props-*.json`) — regenerate.
- Keys in `.env`: `ELEVENLABS_API_KEY` (Telugu/Hindi), `PEXELS_API_KEY` or `PIXABAY_API_KEY` (b-roll).
  Missing one → stop and say exactly which, and that it goes in `C:\AI-edits\.env`.
- Windows: write JSON with the Write tool (PowerShell mangles inline JSON; `Out-File`/`Set-Content` add
  a BOM — the tools tolerate it in JSON, but never write code files that way).
- Cleanup once the user confirms the final: `render/`, `work/visuals-*.mp4`, `work/captioned-*`,
  `work/stills-*`, `work/verify-*` are regenerable. Keep `output/`, `work/*.json`, `assets/`.
