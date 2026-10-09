---
name: daily-script
description: The UNATTENDED script step of the daily run in GitHub Actions — get the next Crack IT episode's script + voiceover ready for the voice step. Planned episodes (the dNN folders already in the series) come first; a planned voiceover with {FILL…}/{OPTIONAL…} gets its figures filled from confirmed sources; when no planned episode is left, research today's news for the channel's audience and write a new episode in the exact d01 format. Use only when the prompt says it is the daily script step (or the user asks to rehearse it locally).
---

# Daily script step (no human in the loop)

The workflow has pulled the Drive inbox into `inbox/` and run `node tools/daily.mjs next`, which said the next
episode needs a script. Your prompt names that episode. After you stop, the workflow runs
`node tools/daily.mjs script-check`, then the voice step reads the voiceover **word for word** in the owner's cloned
voice, then the `daily-run` skill edits it. Nobody reads the script before it is voiced, so it must be right.

## Ground rules

- **Nobody will answer a question.** Decide, and write each decision in `daily-script-report.md`.
- Never generate audio, never touch other episodes' audio, never print `.env`.
- Read first: `config/daily.json` (series folder, standing brief), `config/brands/crack-it.json` (audience, voice
  of the channel), `docs/examples/crack-it-d01/` (**the format to copy**), and the `TTS reads` lines in
  `docs/lessons.md`.
- Series folder = `config/daily.json` → `series`. List every `dNN/` folder and read the title line (`# Day …`) of each
  `*_script.md`, so you know what the channel has already covered and what the planned episodes promise.

## 1. Which episode

Work through the cases in order and stop at the first that applies:

1. **Planned episode named in the prompt has no voiceover, or its voiceover has `{FILL…}`/`{OPTIONAL…}`:**
   - Missing voiceover but the `*_script.md` has ```` ```vo ```` blocks: the voiceover is those blocks' text, in
     order, paragraphs separated by one blank line, nothing else (see the d01 pair).
   - Placeholders: fill every one with a **confirmed** figure (section 3). Replace the placeholder in **both** files,
     spelled for speech in the voiceover (section 4) and as digits in the script's tables/Screen lines. Resolve
     `{OPTIONAL…}` by keeping the line (filled) or deleting it cleanly.
   - If a figure cannot be confirmed yet (the results are not out, the event has not happened): **defer** this
     episode. Leave its files untouched, note why in the report, and go to the next planned folder that is not
     finished (`config/daily-state.json`, or a `projects/*/project.json` made from it). Apply this same case to it.
     A planned episode that is already complete is a valid pick: the voice step will record it.
2. **No planned episode can be made ready:** write a **fresh-news episode** in a new folder: the next free number
   after the highest existing `dNN` (the prompt gives it when the series has run out).

Deferring keeps the date-bound plan honest: the deferred episode comes up again tomorrow, first in line.

## 2. Fresh-news episode

- **Audience:** engineering/science students and freshers moving from campus to their first IT job in India
  (placements, off-campus drives, onboarding and joining letters, company results as they affect hiring, layoffs,
  new roles and skills, exams and assessments like NQT/coding contests, salaries for freshers).
- **Find the topic:** search news from the last 48 hours (company press releases, Business Standard, Economic
  Times, Mint, BusinessToday, Moneycontrol, NDTV Profit, official careers pages). Prefer the story with a concrete,
  checkable fact that changes what a fresher should do this week. Skip anything the series has already covered
  unless there is a real update, and say so in the title ("Update: …").
- **Shape (copy d01):** a hook that names who it is for and promises specific takeaways; 4–7 scenes `S01 · …`;
  plain-words explanation of every number; a practical "what to do now" section; a CTA that asks a specific comment
  question + subscribe. Length **650–950 words** of voiceover (~4–6 min).
- **Names:** folder `dNN/`, files `dNN_<topic_slug>_script.md` and `dNN_<topic_slug>_voiceover.txt`
  (lower-case words joined by `_`, e.g. `d18_infosys_onboarding_update`).
- **Do not promise a specific next video** ("tomorrow I will explain …"): tomorrow's topic is not decided yet. A
  generic "subscribe so you don't miss the next update" is fine.

## 3. Facts (the voice step cannot fix a wrong number)

- Every figure, date, name and quote needs a source you actually opened in this run. Official sources first
  (company press release, investor presentation, exchange filing, official careers/notice page). Media figures
  need two reputable outlets that agree; if outlets disagree, say "about" with the rounded figure they share
  (as d01 did with net profit) or leave the figure out.
- Candidate reports, social posts and aggregator sites are never facts: present them as "candidates are
  reporting …" and label them on screen ("Candidate update, not official").
- Never invent a quote. Never state a future event as certain.
- If you cannot build a correct episode at all, stop: write `daily-script.json` with `"status": "failed"`.

## 4. Writing for the voice (it reads every character)

- Acronyms with dots, as in d01: `T.C.S.`, `A.I.`, `C.E.O.`, `U.S.`. Avoid the bare acronym `I.T.` — the TTS says
  "eye" (lessons): write "tech", "software" or "information technology" instead.
- Numbers in words, Indian style: "five lakh ninety eight thousand", "thirteen thousand nine hundred crore rupees",
  "nine point six billion U.S. dollars", "thirteen point three percent", "the fifteenth of October".
- No symbols, digits, brackets, braces, URLs, emojis, markdown or stage directions in the voiceover. Short spoken
  sentences. One blank line between paragraphs; keep a paragraph to one idea (the voice step chunks on them).
- Address viewers the way the channel does (`config/brands/crack-it.json` notes).

## 5. The script file (the edit follows it as its direction pass)

Copy d01's structure exactly: `# Day NN · <title>`, the item table (Post date, Title, Alt title, Length,
Thumbnail), a **sources paragraph** listing each figure with its outlet and date, then per scene a ```` ```vo ````
block (identical to the voiceover text for that scene) and a **Screen** list. Use only the component names the
edit knows: `NewsCard`, `StatCounter`, `CompareChart`, `Timeline`, `FlowDiagram`, `ChecklistPanel`, `QuoteCard`,
`TipBadge`, `TrapBadge`, `ChapterDots`, plus stock-footage searches written as *search "…"*. Name the real source
for every `NewsCard`. No real logos on sample documents.

The ```` ```vo ```` blocks joined in order must equal the voiceover file exactly.

## 6. Finish

Write at the repo root:
- `daily-script.json`: `{"episode": "dNN", "status": "ok"|"failed", "kind": "planned"|"planned-filled"|"fresh", "deferred": ["dNN", …], "notes": "…"}`
- `daily-script-report.md`: which episode and why, every deferral and its reason, every figure with its source
  link, anything the owner should check before the video goes out.

Then check your own work: read the voiceover once more as if you were the TTS (any digit, brace, symbol or `I.T.`
left?), and confirm the vo blocks match it. Do not commit, push or upload — the workflow does that.
