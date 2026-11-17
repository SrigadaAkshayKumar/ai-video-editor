---
name: longform-script
description: The UNATTENDED script step of the weekly Crack IT long-form run (.github/workflows/long-form.yml) — research and write one new evergreen 20–30 minute masterclass for freshers (production script + TTS-ready voiceover) into the long-form scripts folder, for the cloned-voice step and the long edit that follow. Use only when the prompt says it is the long-form script step (or the user asks to rehearse it locally).
---

# Long-form script (Crack IT weekly masterclass)

Nobody will answer a question: decide, and write each decision into the report. Never generate audio, never print
`.env`, never touch other scripts in the folder.

## 1. Read first

- The prompt gives the folder (`SRC`, the Drive folder `inbox/faceless/crack-it-long-form-scripts`) and the number `NN`.
- `SRC/00_README_workflow.md` if it exists (the owner's notes on long-form videos).
- What the channel has already covered: every file in `config/youtube-scheduled/` (one per video already on YouTube:
  the file name is the topic slug, `lfNN-…` = long-form, `dNN-…` = short video; `title` where present), every
  `SRC/*_script.md` title line and every `inbox/faceless/Crack_IT_Daily_Videos/d*/*_script.md` title line. Drive can
  be emptied, so `config/youtube-scheduled/` is the record that always holds. Never repeat a long-form topic (the
  same big question under another title counts as a repeat); a short video on the same theme is fine to go deeper on.
- `config/brands/crack-it.json` (audience, voice of the channel), `docs/examples/crack-it-d01/` (the scene format),
  and the `TTS reads` lines in `docs/lessons.md`.

## 2. Topic: one evergreen masterclass

Crack IT is the guide a fresher keeps coming back to between campus and the first year of the first IT job in India.
A long-form video is a **complete, evergreen guide** to one big question: still true a year from now, worth saving
and sharing. No news topics. Pick the pillar the long-form series has covered least:

1. Offer, onboarding and joining, start to finish (letters, documents, delays, first week).
2. Background verification end to end.
3. Cracking the IT hiring process: aptitude, coding, technical and HR rounds, NQT-style exams.
4. Money in the first job: CTC vs in-hand, salary slip line by line, PF/UAN, first tax return, bonds and notice period.
5. The first year at work: bench, allocation, appraisal cycles, workplace habits, switching after a year.
6. Skills roadmap while waiting to join / in the first year.
7. Staying safe: fake offers, paid-training and HR scams, how to verify anything.

Title it as a masterclass a fresher would search for ("… complete guide for freshers", "… explained end to end").

## 3. Research and facts

- Tools: WebSearch / WebFetch first; when they are missing or blocked, `node tools/web.mjs news "<query>"` and
  `node tools/web.mjs read <url>` (headless Chrome; a page read this way counts as opened).
- Every rule, number, form name, portal step and deadline needs a source you opened in this run, official first
  (EPFO, income-tax portal, government notifications, company careers/onboarding pages). Where companies differ, say
  so and give the common pattern; name a company only for a company-specific fact.
- Never invent a quote, a number or a "most companies" claim. Leave out what you cannot confirm.

## 4. Shape (20–30 minutes)

- **4,000–5,200 words** of voiceover (the cloned voice reads about 190 words a minute: ~21–27 minutes).
- A 30–45 second hook: who it is for, the problem, and what they will be able to do by the end.
- **6–9 chapters**, each a clear step or question, each ending with a one-line takeaway; a short "quick recap"
  chapter before the end; a CTA asking one specific comment question + subscribe.
- Concrete examples, sample emails/checklists read out step by step, common mistakes ("trap") and fixes ("tip").
- Do not promise a specific next video.

## 4b. Click and retention

Apply section 2b of `.claude/skills/daily-script/SKILL.md` (angle, hook, open loops, re-hooks, concrete examples,
strong end) to the whole masterclass: a hook in the first 10 seconds that names the stake; a chapter map promised up
front ("by chapter five you will …"); every chapter opens with its own mini-hook and closes with a teaser of the
next; a fresher's story threaded through the video; the most valuable chapter promised early and delivered late.
Title and thumbnail-text ideas go into the script's table.

## 5. Writing for the voice (it reads every character)

- Acronyms with dots: `T.C.S.`, `B.G.V.`, `P.F.`, `U.A.N.`, `H.R.`. Avoid bare `I.T.`: say "tech", "software" or
  "information technology".
- Numbers in words, Indian style ("four point five lakh per annum", "twelve percent", "the fifteenth of every month").
- No symbols, digits, brackets, braces, URLs, emojis, markdown or stage directions in the voiceover. Short spoken
  sentences. One blank line between paragraphs; paragraphs of about 40–150 words, one idea each.

## 6. Files to write (all in `SRC`, `NN` as given, `<slug>` lower-case words joined by `_`)

- `NN_<slug>_script.md`: `# Long-form NN · <title>`, a table (Title, Alt title, Length, Audience), a **sources**
  list (each fact, outlet/page, date), then per chapter `## Chapter k · <name>` with a ```` ```vo ```` block (exactly
  that chapter's voiceover) and a **Screen** list using the edit's components (`ChecklistPanel`, `FlowDiagram`,
  `StatCounter`, `CompareChart`, `Timeline`, `QuoteCard`, `TipBadge`, `TrapBadge`, `NewsCard` with its real source,
  `ChapterDots`) plus stock searches written as *search "…"*. No real logos on sample documents.
- `NN_<slug>_voiceover.txt`: the ```` ```vo ```` blocks joined in order, nothing else.
- `NN_<slug>_voiceover.clean.txt`: the same text (the run reads this one; it marks the voiceover as ready to voice).
- `NN_written-by-claude.txt`: one line, the title and today's date (marks a script the run wrote itself).
- At the repo root: `longform-script.json` `{"status": "ok"|"failed", "number": "NN", "slug": "…", "title": "…",
  "words": n, "notes": "…"}` and `longform-script-report.md` (topic and why, every fact with its source).

If you cannot build a correct script, write `longform-script.json` with `"status": "failed"` and the reason
(which tool failed and its exact error, if that was the cause).
