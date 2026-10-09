---
name: clip-shorts
description: Turn a finished AI-edits video (projects/<p>, or several parts of one long video) into YouTube Shorts. Reuses the edit's word timestamps, reads the whole transcript, picks self-contained dialog moments, adds text hooks + comment prompts, renders 9:16 clips with Remotion. Use when the user asks to clip/make shorts from an edited project or a long video.
---

# Long video → YouTube Shorts

Pipeline: AI-edits project (`../projects/<p>`) → transcribe (reuses the edit's words; Whisper only for plain files) → **Claude reads the full transcript and writes `clips.json`** → prepare (cut, captions, tracking) → render (Remotion) → `output/<slug>/`.

## 0. Collect the job settings

From the user's message, get (ask only for what is missing):

| Setting | Values | Notes |
|---|---|---|
| source | AI-edits project name(s) in `../projects/` | There is no input folder: the video comes from the editor's projects. Several parts of one long video → list them all + `--slug`. |
| language | `en` / `te` / `hi` | sets Whisper language, caption font, hook/CTA language |
| framing | `black` (16:9 in 9:16, black bars) · `blur` (blurred bg) · `center` (centre crop) · `track` (crop follows speaker's face) | faceless channels → `black`/`blur`; face channels → `center`/`track` (or `black`/`blur`). Can differ per clip. |
| model (optional) | `small`, `medium`, `large-v3` | Whisper runs only (plain file, `--from final`, `--whisper`): en→small, te/hi→medium |

## 1. Transcribe

Run from `AI-clipper/` (or `npm run shorts:transcribe -- …` from the repo root):

```bash
npm run transcribe -- <project>                               # ../projects/<project>, clean source
npm run transcribe -- <part1> <part2> <part3> --slug <name>    # parts of one long video, joined in order
npm run transcribe -- <project> --from final                  # the delivered final-16x9.mp4 instead
npm run transcribe -- <joined-name|file.mp4> --lang te        # ../output/<name>-16x9.mp4 (npm run join) or any file
```

Sources:
- **clean** (default, use this): the project's `work/visuals-16x9.mp4` + `work/master.wav` (the finished
  picture, graphics and -14 LUFS mix, but **no burned-in captions and no intro/outro**) muxed into
  `jobs/<slug>/source.mp4`. Words come straight from `work/cleancut.words.json`, so there is **no Whisper
  run** (instant, and Telugu/Hindi keep the ElevenLabs transcript). Needs the edit finalized
  (`npm run finalize -- <p>`); it warns if the picture/master are older than the clean cut.
- **final** (`--from final`): `output/final-16x9.mp4` as delivered, re-transcribed with Whisper. Its captions
  are burned in, so Shorts from it show two caption layers; only use it when the clean files are gone.
  A joined long video (`../output/<name>-16x9.mp4`) is the same: prefer listing its part projects.

Language defaults to the project's (`--lang` overrides). `--format 9x16` clips from the 9:16 edit instead.
Whisper runs are slow on CPU (~20 min/hour of video with small, ~45 min with medium): run them in the
background. Output: `jobs/<slug>/` with `source.mp4`, `transcript.txt` (timestamped), `transcript.json`
(word timestamps), `meta.json` (records which projects it came from).

## 2. Read EVERYTHING, then plan clips (this is Claude's job)

Read the **entire** `jobs/<slug>/transcript.txt` (in chunks if long) before choosing anything. Understand the whole script: topics, stories, arguments, jokes, callbacks. Do NOT just chop the video into equal pieces.

A good Short is a **self-contained dialog moment**:
- Makes sense with zero context (no "as I said earlier", no unresolved "he/that" in the first sentence).
- Has an arc: a setup/question → tension → payoff (answer, punchline, reveal, strong opinion, number/result).
- Starts on a strong line, never on filler ("so", "um", "okay so", "అయితే", "तो").
- Ends right after the payoff, on a complete sentence, not mid-thought.
- **Natural length, 70 s max.** Cut each clip where its moment ends: a 30 s moment is a 30 s Short, a 40 s moment is a 40 s Short. Most land around **30–40 s**. 70 s is only the ceiling (`prepare.py` refuses anything longer). **Never** stretch, merge or stitch in lines from elsewhere just to make a clip longer; that was a mistake the user corrected on 2026-10-06. Applies to every kind of video.
- **Never repeat footage.** No source second may appear in two clips, and no clip may play the same line twice. Every clip is a different part of the video. No "full version" clip that re-uses the others. `prepare.py` refuses overlapping plans.

**Hooks (two kinds, use both when it helps):**
1. **Text hook** (`hook`): ≤ 8 words on screen for the first 3 s. Curiosity, a bold claim, or a "you" problem. It must be truthful to the clip. Wrap the 1–2 punch words in `*asterisks*` (e.g. `Recruiters notice *THIS* coding contest 👀`): in black framing they get a yellow highlight box. Write it in the video's language and script (Telugu → తెలుగు, Hindi → हिन्दी) unless the user asks for English/Tenglish/Hinglish.
2. **Cold open** (optional): make the *first segment* the clip's most surprising 1–3 s line (its payoff or shocking statement), then play the setup up to just before that line, then continue after it, so the line is **not** heard twice. Example: `[{"start": 754.2, "end": 756.1}, {"start": 731.0, "end": 754.2}, {"start": 756.1, "end": 770.0}]`. Use it when the payoff is strong but the natural start is slow.

You can also remove a dull middle by splitting into multiple segments, as long as the speech still flows naturally.

**Comment prompt** (`cta`): shown over the last 3.5 s (black framing: in the top bar for the ~7 s before the end card). A specific question tied to the clip that people can answer in one line ("Which one would you pick, 1 or 2? 👇"), not a generic "like and subscribe". Same language as the hook.

**How many clips?** It depends on the content, not on a formula. Count every moment that passes the rules above, rank them by `score` (1–10: hook strength × standalone clarity × payoff × shareability), and keep everything ≥ 6. Rough sanity check: ~1 clip per 1–3 min of substantive talk (5 min → 3–5, 10 min → 4–8, 30 min → 10–18). Shorter clips mean more of them. Fewer is fine when the video is slow or repetitive. Tell the user the honest number and why.

Write `jobs/<slug>/clips.json`, ordered by score (best first):

```json
{
  "framing": "blur",
  "summary": "One-paragraph summary of the full video and why these moments were chosen.",
  "clips": [
    {
      "id": 1,
      "title": "YouTube title, < 70 chars, in the video's language",
      "hook": "On-screen hook text",
      "cta": "Specific comment question 👇",
      "segments": [{ "start": 731.0, "end": 768.4 }],
      "framing": "track",
      "description": "1–2 line YouTube description",
      "hashtags": ["#shorts", "#topic", "#niche"],
      "score": 8.5,
      "why": "Why this moment works as a standalone Short",
      "instagram": {
        "caption": "Hook line

2-4 short lines of value (✅ bullets ok)

Same comment question 👇

💾 Save this...
📌 Full video: link in bio",
        "hashtags": ["#topic", "#niche", "...8-12 tags", "#reels"]
      }
    }
  ]
}
```

**Instagram (always):** the user also posts every clip as an Instagram Reel, so every clip gets an `instagram` block. Write it for Instagram, not as a copy of the YouTube description: hook line first, short scannable lines, the comment question, a save prompt, and "📌 Full video: link in bio" (links in Instagram captions and comments aren't clickable). Use 8–12 hashtags, with `#reels` instead of `#shorts`. The upload sheet prints it under **Instagram caption**. If it's missing, the sheet builds a fallback from the YouTube fields. To rewrite only the sheet: `npm run render -- <slug> --sheet-only`.

Optional black-framing overrides (per clip or top-level): `"topTexts": ["📌 Full video link in pinned comment", "💬 Comment your thoughts below"]` and `"endCard": {"title": "WATCH FULL VIDEO", "subtitle": "Link in the pinned comment"}`. Leave them out to use those defaults. Write them in the video's language only if the user asks.

Timestamps come from `transcript.txt` (seconds, decimals OK). They are snapped to word boundaries automatically, so pick the sentence start/end and let the script handle padding. `framing` per clip is optional and overrides the top-level one.

### Black framing layout (letterbox videos only)

With `framing: "black"` (and bars at least 300 px tall), the render uses the bars, not the picture:
- **Start:** white flash + punch-in on the video, then the hook slams in word by word in the **top bar** (highlighted words boxed in yellow) with a bouncing 👇, and after 3 s it shrinks into a headline that stays on screen.
- **Top bar, middle:** animated chips rotate below the headline (`topTexts`), then the comment question (`cta`) as a yellow chip.
- **Bottom bar:** word-by-word captions, below the video, never on top of it. The video's bottom edge is a yellow progress bar.
- **Last 2.5 s:** animated end card: "WATCH FULL VIDEO · 📌 Link in the pinned comment". Audio keeps playing, so end the clip on its last complete sentence (2–3 s after the payoff), not mid-payoff.

Other framings (`blur`, `center`, `track`) keep the classic overlays. Code: `src/BlackBars.tsx`.

Every Short points to the pinned comment, so remind the user to pin a comment with the full-video link on each upload, and put the link in the description too.

## 3. Show the plan, then prepare + render

Show the user a table (id, score, duration, hook, one-line why) and the total count. Then run:

```bash
npm run prepare-clips -- <slug> [--framing blur] [--only 1,3]
npm run render -- <slug> [--only 1,3]
```

Rendering takes ~1–2 min per clip on CPU, so run it in the background. Output: `output/<slug>/NN-title.mp4` (1080×1920, 30 fps, H.264) and `output/<slug>/UPLOAD_SHEET.md` (titles, YouTube descriptions + hashtags, Instagram captions, source timestamps).

Spot-check 1–2 clips: extract a frame at ~1 s (hook), the middle (captions, top-bar chip) and the last 2 s (end card / comment prompt) with ffmpeg and look at them. With `track` framing, make sure the speaker's face is inside the frame.

## Editing a single clip afterwards

Change its entry in `clips.json`, then `npm run prepare-clips -- <slug> --only N` and `npm run render -- <slug> --only N`. For visual tweaks (fonts, colours, positions) edit `src/BlackBars.tsx` (black framing), `src/Captions.tsx`, `src/Overlays.tsx`, `src/Framing.tsx`; preview with `npm run studio`.

## Files

- `pipeline/transcribe.py`: source from `../projects/<p>` (clean picture + master + the edit's words), Whisper for plain files
- `pipeline/prepare.py`: word snapping, ffmpeg cut/join, captions, YuNet face tracking (model auto-downloads to `models/`)
- `scripts/render.mjs`: Remotion bundle + render + upload sheet
- `src/`: Remotion `Short` composition (1080×1920): `Framing`, `Captions`, `Hook`/`CallToAction`
