---
name: clean-cut
description: Editorial rules for turning a raw talking video or voiceover into a clean cut — removing retakes, repetitions, false starts, stutters, fillers, mispronounced words, contradictions/inconsistencies, off-script chatter and dead air — by writing work/edl.json for tools/cut.mjs. Telugu, Hindi, English and code-mixed speech. Use for stage 2 of edit-video or whenever the user asks to tighten/re-cut a video.
---

# clean-cut

Goal: the viewer hears **one fluent, correct take of everything the speaker meant to say, in order**,
with natural rhythm — and nothing else. Be ruthless with mistakes, careful with meaning.

## Inputs

- `work/transcript.md` — lines `L012 [mm:ss–mm:ss] w120–w134 | text`, pauses, `⁽?⁾` low-confidence
  words, `[events]`, long silences. Word ids are what you cut with.
- `work/words.json` — the same words with exact times and `conf` (0–1).
- Check the header's `engine`. **whisper** (English) is primed to transcribe verbatim and its word
  times are re-anchored to measured silences, but it can still smooth over a mumbled filler or a
  very fast stutter — treat an unexplained short gap inside a sentence, or a `⁽?⁾` word, as a
  possible hidden disfluency, and use a `time` cut if `silences.json` and the context confirm it.
  **ElevenLabs** (Telugu/Hindi) timings are tighter and it tags `[events]`.

- `work/script-diff.md` — only when the user supplied a script (faceless): what was said vs what was
  written. Every "extra spoken run" is a cut candidate (re-read, false start, stumble, ad-lib); the
  suggested `textFixes` correct caption spelling from the script. An ad-lib that genuinely adds
  something may stay — the script is the intent, not a cage.

Read the **entire** transcript before writing a single cut. Retakes are only obvious in context.

## What to remove

Work through these in order. Every removal gets a short `reason`.

1. **Retakes — judged by MEANING, not by words.** This is the part most often missed. A speaker
   re-explains the same point with different wording, a different example, a hedge first and the full
   claim later, or the same clause switched between Telugu/Hindi and English — with zero shared
   words. Ask "if I kept only one of these, would the viewer miss any new information?" If no, it is
   a retake: keep the ONE take spoken completely through to the end of the sentence (usually the last)
   and cut every other attempt, even non-adjacent ones, even ones that sound fluent in isolation.
   Be aggressive: do not keep an earlier restatement "for context" — the complete version reads fine
   alone. Keep a restatement only if it adds genuinely new information, or it is deliberate rhetorical
   emphasis in a tight couple of sentences (not a restart after a pause or hedge).

   **Mandatory sweep before writing the EDL** (fumble-and-respeak is the dominant pattern and the most
   common review complaint — the template's speakers attempted single claims 5-9 times):
   - *Pass 1, chronological:* for EVERY line ask "is this idea stated again anywhere later?" —
     restatements are routinely 2-6 lines apart with a silence, hedge or aside between.
   - *Pass 2, by claim:* list the distinct claims the video makes; any claim covered by more than one
     line is a retake cluster — keep exactly one.
   - *Pass 3, inside each kept line:* a single transcript line can hold a fumble — a phrase, a stall,
     the same phrase again ("akkarleni courses, akkarlenanta you know … akkarleni courses"). Passes 1-2
     compare lines and cannot see it.

   Signals an attempt was abandoned (cut it even with no word overlap): it ends mid-sentence, mid-word,
   on a dangling connective or trails off; it is followed by a >1.5s silence and the same thought
   started over; it repeats the previous line's opening clause before going further (keep the run that
   gets furthest); the same sentence is tried 3+ times — keep only the last complete one.
2. **False starts / abandoned sentences.** Speaker starts, trails off or stops, restarts differently.
   Remove from the first word of the abandoned attempt to the start of the restart.
3. **Stutters and doubled words.** `this is, this is` → keep the last; `the the` → one.
   Cut the *earlier* copy so the kept word flows into what follows.
4. **Fillers** (only when used as filler, not as content):
   - English: um, uh, er, ah, hmm, like, you know, I mean, so (sentence-initial), basically, actually, right?, okay so
   - Hindi: मतलब/matlab, तो/toh (leading), हाँ/haan, अच्छा/accha, यानी/yaani, वो/woh (hesitation), ना/na, है ना/hai na, बस/bas, एक्चुअली
   - Telugu: అంటే/ante, ఆ/aa, ఏమో/emo, అదే/ade, మరి/mari (leading), ఇంక/inka, కదా/kada (tag), అలా/ala (hesitation), ఏంటంటే/entante, సో/so
   - Code-mixed speech mixes all of the above; ElevenLabs may write English words in Telugu/Devanagari
     script (e.g. `సో`, `एक्चुअली`) — treat them the same.
   Leave a filler in if removing it would make the cut audibly choppy *and* it is short — but default to removing.
5. **Mispronunciations and slips.** Signals: `⁽?⁾` / `conf < 0.5`, garbled ASR output, a word
   immediately said again correctly (`Hyderbad— Hyderabad`), a name said two ways. Remove the wrong
   attempt and keep the correct one. If a word is mispronounced and **never** said correctly,
   keep it and list it under "couldn't fix" in your report.
6. **Inconsistencies / self-corrections.** `in 2019 — no sorry, 2020` → keep only the corrected
   statement (`in 2020`); remove the wrong fact *and* the correction phrase (`no sorry`, `sorry`, `I mean`,
   `ఆ కాదు`, `नहीं नहीं`). If two takes state different facts and neither is corrected, keep the last
   and flag it to the user.
7. **Off-script material.** "Is it recording?", "cut that", "let me do that again", "one more time",
   countdowns, talking to someone off camera, clapping/slates, coughs, sneezes, long breaths, lip
   smacks, phone noises, `[events]` that aren't content (keep genuine laughter that's part of the
   content). Use `{ "time": "a-b" }` cuts for non-speech noise that sits inside kept speech.
8. **Dead air** — handled for you: lead-in/tail are trimmed and every pause is capped at
   `keepPauseMax`. Don't write cuts for ordinary pauses.

## Voiceovers (faceless edits)

A narration track, read from a script, in a quiet room:
- **Dead air between takes** is the biggest win: `keepPauseMax` 0.3-0.35. Narration with air between
  every sentence sounds amateur.
- **But keep a beat before a reveal**: 0.35-0.55s before a line that lands a reveal, a number or a
  chapter turn — `"holds": [{ "after": "<last word id before the beat>", "max": 0.5 }]`. Say "held beat"
  in your notes; the next stage puts a graphic or the music gap there.
- Retakes: the narrator re-reads until clean — keep the **last** complete, best-read take.
- Reading artifacts: false starts, a swallowed word retaken, page turns, lip smacks, take slates,
  "okay"/"let me try that again" — cut them all; they are not in the script.
- **Don't cut every breath** (it sounds synthetic) — only breaths inside gaps you're removing anyway
  or a gasp before a retake.
- Keep the narration's rhetorical questions to the viewer ("ఇది మీకు తెలుసా?") and flag them — they
  become involvement beats.

## What NOT to do

- Don't change meaning, merge two different points into one, or drop qualifiers ("not", "only",
  "almost", Telugu `కాదు`/`లేదు`, Hindi `नहीं`/`मत`) — re-read every join.
- Don't cut a word in half or leave a sentence without its verb (Telugu/Hindi are verb-final: the
  verb is at the **end** — make sure the kept take includes it).
- Don't reorder content (not supported; tell the user if a reorder would help).
- Don't remove deliberate dramatic pauses — if one matters, leave the words around it alone and
  raise `keepPauseMax` only if the whole video is meant to be slow.

## edl.json

```json
{
  "remove": [
    { "words": "w6-w12",  "reason": "false start; full retake at L003" },
    { "words": "w40-w58", "reason": "retake 1 of intro (kept take 2 at w59-w77)" },
    { "words": "w23",     "reason": "filler (um)" },
    { "words": "w90-w91,w95", "reason": "filler ante + stutter" },
    { "time": "83.20-84.05", "reason": "cough inside kept sentence" }
  ],
  "keepPauseMax": 0.35,
  "edgePad": 0.08,
  "textFixes": { "w26": "This", "w311": "HyperFrames" },
  "holds": [ { "after": "w88", "max": 0.5 } ]
}
```

- `words` ranges are inclusive, comma-separable; `time` ranges are raw-timeline seconds.
- `keepPauseMax`: 0.25–0.3 fast social cut · 0.35 default · 0.5 calm/educational.
- `edgePad`: room kept around each cut so consonants aren't clipped; 0.06–0.1.
- `textFixes`: **caption text only** (audio is untouched) — fix ASR misspellings, brand names,
  capitalisation after a cut, wrong script for English loanwords if the user wants Latin script.
- `holds`: keep up to `max` seconds of pause after a word (a dramatic beat), overriding `keepPauseMax`.

## Process

1. Read the transcript; list the takes for each passage in your head (or in `work/cut-notes.md` for
   long videos) — "intro: L001–L004 (take 1, broken), L005–L007 (take 2, good)".
2. Write `work/edl.json`.
3. `npm run cut -- <p> --dry-run` → read the **clean script** it prints, line by line, as the viewer
   would hear it. Look for: leftover repeats, joins that break grammar, missing verbs, dangling
   "so"/"and"/"అంటే"/"तो", lost meaning. Fix the EDL and dry-run again until it reads cleanly.
4. `npm run cut -- <p>` → renders `work/cleancut.mp4` + re-timed `work/cleancut.words.json`
   (shared by the 16:9 and 9:16 edits).
5. Read `work/cut-report.md`: every removal should be one you intended, with its reason, and the
   "clean script" should match your dry-run. The printed rendered duration must equal the expected
   duration (± 0.05s); if not, something went wrong in the encode — re-run.
   - **Boundary audit**: the cut measured every join on the real audio and moved any edge that caught
     the attack of the next (removed) take or the tail of a removed word — STT word times are
     routinely 50-80 ms off, so a word-timestamp check alone misses audible leaks. Each move is listed.
   - **Fragile words**: a very short or zero-width word sitting on a cut (in the template a zero-width
     "కాదు" on a boundary turned "not everyone gets them" into "everyone gets them"). Re-read each
     one's sentence; the better fix is usually to extend the kept segment to swallow the redundant
     line after it, removing the splice entirely, rather than nudging a boundary by milliseconds.
6. Report to the user in a few lines: raw → clean duration, % removed, count by reason
   (retakes / fillers / stutters / slips / off-script), and any "couldn't fix" items.
