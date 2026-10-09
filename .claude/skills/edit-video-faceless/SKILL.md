---
name: edit-video-faceless
description: Turns a bare voiceover (no presenter on camera) into a finished faceless documentary/explainer for YouTube 16:9 and Instagram 9:16 — clean-cuts the narration, DIRECTS it (story spine, tension curve, hooks, involvement beats), researches the claims and screenshots the real sources, plans a scene track (stock b-roll, stills, news screenshots, pure-graphic beats) with motion graphics, designs music + SFX, renders, captions and credits it. Use when the user gives a voiceover/narration file (or says "faceless video", "make a video from this VO", "documentary").
---

# edit-video-faceless — voiceover → documentary

You are the **director and the editor**. Nobody's face carries this video: every second of picture,
every beat of tension and every reason to stay past 30 seconds is your decision. Treat the script as
material, not a spec. Read `docs/lessons.md` first; the mechanics (render, captions, mix, finalize,
verify) are the same as `edit-video` — read its architecture section.

**Review gates are ON by default here** (the template that taught this learned it is far cheaper to
redirect a documentary at the direction stage than after a render): stop and show the user after
**direction** and after **scenes**. Skip the gates only if the user says to run straight through.

## 0. Intake

The user drops a **script** and its **voiceover** in `inbox/faceless/` as a pair — `script-1.txt`
(or `.md`/`.docx`) and `script-1-audio.mp3` (or `.wav`/`.m4a`) — and says "use script-1 and
script-1-audio" (maybe written "/script-1"; strip the slash). `npm run inbox` shows what is waiting
and how files pair.

`npm run new -- script-1-audio --script script-1 --brief "<the user's style words, verbatim>" [--lang te|hi|en]`
(the script pairs automatically when named `<x>` / `<x>-audio`; the project is named after the script).
The style words in the prompt are the brief — map them with `edit-video`'s "Style brief → settings"
table. No brand/channel unless the user names one (`config/brands/`, `--brand`, `--intro`/`--outro`).

**The script is the source of truth** (`source/script.txt`): it is what the narrator MEANT to say.
- Read it in full before anything else — it is how you understand the concept, the argument and the
  claims; direction (stage 2) is built from it plus the audio's actual delivery.
- `transcribe` aligns the spoken words to it → `work/script-diff.md`: **extra spoken runs** (re-reads,
  false starts, stumbles, ad-libs — cut candidates; for a line read twice the earlier take is listed),
  **script passages never spoken** (tell the user), and **suggested caption textFixes** (ASR misspelling
  → the script's spelling; paste them into `edl.json` → `textFixes`, especially names and Telugu/Hindi words).
- Script proper nouns are passed to the speech-to-text as keyterms automatically.
- No script? Say it would help (alignment, spelling) and continue from the transcript alone.
Needs a b-roll key (`PEXELS_API_KEY` or `PIXABAY_API_KEY`); without one, plan graphic and still
scenes only and say so up front. Music/SFX need no key.

## 1. Transcribe + clean cut

`npm run transcribe -- <p>`, read `work/script-diff.md`, then the **clean-cut** skill's voiceover rules: cut dead air hard, keep
the last complete take of a re-read line, cut reading artifacts, **keep a held beat (0.35-0.55s)
before reveals** via `"holds"` in the EDL, don't strip every breath. Note rhetorical questions to the
viewer in the cut reasons — they become involvement beats. `npm run cut -- <p>`.

## 2. Direction — the stage that matters most → `work/direction.json`

Read the whole clean script (`work/cleancut.transcript.md`) before writing anything. Find what is
already there:
- **promise** — what the first 20s implicitly promises; **turn** — the moment the obvious answer
  stops being the answer (the spine of the tension curve); **payoff** — what the viewer knows at the
  end. Can't state the payoff in one sentence? Put it in `risks` and tell the user.

```json
{
  "logline": "…", "promise": "…", "turn": { "time": 7.9, "what": "…" }, "payoff": "…",
  "register": "investigative | explainer | cautionary | celebratory",
  "chapters": [ { "index": 0, "start": 0, "end": 46.2, "title": "THE CLAIM", "job": "…", "tension": 0.6, "grade": "cool" } ],
  "tension_curve": [ { "time": 0, "level": 0.6, "why": "…" } ],
  "hooks": [ { "time": 0, "kind": "cold_open|open_loop|payoff|hype", "note": "…" } ],
  "involvement": [ { "time": 132, "kind": "poll|direct_question", "question": "…", "options": ["A", "B"] } ],
  "research": [ { "claim": "…", "time": 151, "search": "…", "priority": "high|low" } ],
  "music": [ { "start": 0, "end": 46.2, "mood": "cold tension", "energy": "bed|build|drive|tense|release|sting" } ],
  "risks": [ "…" ]
}
```

Non-negotiables:
- **Tension is a sawtooth**, not a level: a trough (≤0.3) at least every 60-90s; the single highest
  point at the turn, not the end. Tension comes from the script's own material (an open question, a
  number that doesn't add up) — never from a red flash over an ordinary sentence.
- **Hype is a cost**: at most one `hype` hook per chapter, none in an explanation chapter.
- **Every open loop has a placed payoff**, or don't open it.
- **Involvement: 2-4 per video**, never in the first 25s, never on the turn, answerable from what
  the viewer has been told. Poll bars are rhetoric, never data.
- **Research list = only real, checkable claims** (numbers, dates, named organisations, quotes).
  Unsourceable → `risks`, stated without a screenshot.
- 3-6 chapters for 5-12 min; music follows the curve (a bed change is an event — at a turn, not a
  heading); plan at least one **no-music gap** on the most important line.

**Gate:** show logline, chapters + jobs, where the turn is, the curve's shape, involvement beats,
research list by priority, and what can't be sourced.

## 3. Research the claims

For each `research` entry: `WebSearch` for the primary source (the outlet that broke it, the
ministry/company document) over aggregators. Record exact URL, outlet, headline as published, date
**read off the page** (search snippets lie about dates). Never invent a source, adjust a headline, or
attach one article to another claim. A claim that fails → say so and plan a graphic instead.

## 4. Scenes + motion graphics → `work/visual-plan.json` (`scenes` + `overlays` + `camera_moves`)

Use the **motion-graphics** skill's vocabulary and validation. Faceless specifics:
- `scenes` are contiguous from 0 to the end (validated). Kinds: `broll` (literal visual query —
  "server room dark", never "opportunity"), `still` (photo, Ken-Burns'd), `news` (`url`, `source`,
  `headline`, `date`, optional `highlight` / `highlight_portrait` rects), `graphic` (no footage — the
  accent field; **first-class**, the right answer for data, definitions and big statements).
- **Open on a `title_slide` over the first line** (it is readable at frame 0 — never delay the voice).
  A `speed_hint` around 4-7s if the video is long.
- **First ~60s cuts twice as fast as the body**: 2-3s scenes, a visual beat per line; body 4-9s,
  varied (three 6s scenes in a row is monotony). Over ~12s the picture dies.
- **Stock footage must never appear to depict a named entity or event.** Real claims get a `news`
  scene or a graphic.
- **Every number the narration says exists on screen** (`number_roll`, `stat_trio`, `bar_chart`,
  `progress_ring`). Overlay density: a beat every ~3-4s; text-only types ≤ a third.
- **Never a reframing overlay over a `news` scene** (validated) — it shrinks the cited article to a
  thumbnail. Over news only `keyword_chip`/`side_note`/`annotation`, off the headline.
- `chapter_open` at each chapter start; `poll_prompt` for each poll beat; grade follows tension
  (≤0.3 neutral/warm · 0.3-0.6 cool · 0.6-0.85 cool/noir · >0.85 noir/hot); `flash` ≤2 per video.
- Assets: `npm run broll -- search <p> "query" [--photos]` → **Read the thumbnails**, `get`;
  `npm run news -- capture <p>` (desktop + mobile shots) → **Read every PNG** (cookie wall? paywall?
  404?), set `highlight`s from what you see; blocked → capture in Chrome (claude-in-chrome:
  new tab, reject non-essential cookies, `save_to_disk`) and `npm run news -- adopt <p> <url> <png> [--portrait]`.
- `npm run visuals -- <p> --check`, then `--stills` across scene kinds in **both formats** and Read them.

**Gate:** scene count by kind, average scene length, which claims have real screenshots (outlets),
overlay counts by family, anything downgraded to a graphic for honesty.

## 5. Sound → `work/audio-plan.json`

**sfx** + **bgm** skills. Without a bed a faceless video sounds like a slideshow: 3-5 distinct moods,
one bed at a time, the planned **silence gap** on the key line, no SFX on the payoff line itself.
Audit every bed (title fits the mood, duration ≥ music_start + cue length); you cannot hear them — say so.

## 6. Render, captions, finalize, verify, credits

`npm run visuals` → `npm run scaffold` → `npm run mix` → `npm run finalize` → `npm run verify`
(Read both sheets: one frame per scene kind, the joins, captions at cut boundaries).
`output/credits.md` carries the **SOURCES** block — mandatory in the description when headlines are shown.

## Report

Output paths; raw → final duration and takes cut; chapter list and where the turn landed; scenes by
kind; sourced claims (and those that couldn't be); overlay/SFX counts; beds used; what you verified vs
what needs the user's eyes and ears; the credits reminder. Offer `/youtube-metadata` and `/youtube-thumbnail`.
