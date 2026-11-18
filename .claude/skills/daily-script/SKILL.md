---
name: daily-script
description: The UNATTENDED script step of the daily run in GitHub Actions — get the next Crack IT episode's script + voiceover ready for the voice step. Planned episodes (the dNN folders already in the series) come first; a planned voiceover with {FILL…}/{OPTIONAL…} gets its figures filled from confirmed sources; when no planned episode is left (or plannedEpisodes is false), write a new episode in the exact d01 format: an evergreen fresher guide first, news only when it changes what a fresher must do. Use only when the prompt says it is the daily script step (or the user asks to rehearse it locally).
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

**`config/daily.json` → `"plannedEpisodes": false` (the owner's standing choice):** the planned folders are retired.
Skip case 1: write a fresh episode (section 2: evergreen first) in the folder the prompt names, and never pick,
fill or copy a planned folder. Still read the planned titles, but only to avoid repeating a topic. If the prompt names
a folder that already holds your unfinished fresh script, finish that one.

Otherwise work through the cases in order and stop at the first that applies:

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

## 2. Fresh episode: evergreen first (the owner's choice, 2026-11-16)

Crack IT is **not a news channel**. It is the guide a fresher keeps coming back to between campus and the first
months of the first IT job. Most episodes are **evergreen**: still true and useful a year from now. A news topic is
allowed only when it **directly changes what a fresher must do** (a large hiring or onboarding drive with dates,
joining dates moved, an exam/assessment announced, an offer-letter or BGV policy change at a big recruiter). Company
results, visas, stock moves, layoffs of senior staff, AI-industry news and the like are **not** topics on their own.

- **Audience:** engineering/science students and freshers moving from campus to their first IT job in India.
- **Evergreen pillars** (pick the one the series has covered least lately; never repeat a topic already in the
  series: look at every `dNN/*_script.md` title line and every file in `config/youtube-scheduled/`, the record of
  everything already on YouTube that survives a Drive cleanup):
  1. Offer, onboarding and joining: offer letter vs appointment letter, joining-date delays, documents, first week.
  2. Background verification: what is checked, mismatches, gaps, insufficiency mails.
  3. Interviews and tests: aptitude, coding rounds, HR questions, NQT-style exams, group discussion.
  4. Money: CTC vs in-hand, salary slip, PF/UAN, tax regime basics for a first salary, bond and notice period.
  5. First year at work: bench, project allocation, appraisals, emails and timesheets, work from office rules.
  6. Skills and growth: what to learn while waiting to join, certifications that matter, switching after one year.
  7. Safety: fake offers, paid-training scams, fake HR calls and how to verify.
- **Facts still need sources** (section 3): official pages (EPFO, income-tax portal, company careers/onboarding
  pages, labour-law references) for rules and numbers; explain processes in general terms where they differ between
  companies, and name the company when a fact is company-specific.
- **When a news topic qualifies:** search the last 48 hours (company press releases, Business Standard, Economic
  Times, Mint, BusinessToday, Moneycontrol, NDTV Profit, official careers pages) and keep the angle on what the
  fresher should do this week.
- **Kind:** write `"kind": "fresh"` in `daily-script.json` for both evergreen and news episodes.
- **Tools, in this order, and never give up after one failure:** WebSearch / WebFetch; when they are missing, error
  or are blocked by a site, use the repo's own helpers through Bash, which work on the runner:
  `node tools/web.mjs news "<query>" [--days 2]` (Google News headlines; add `--provider bing` for direct article
  links) and `node tools/web.mjs read <url>` (the page's text in headless Chrome; a page read this way counts as
  opened). For a news check, try several searches ("freshers", "campus hiring", "onboarding", "NQT", "off-campus
  drive", "joining date", recruiter names); with no qualifying news, make an evergreen episode, which is always
  possible.
  `"status": "failed"` is only for when the tools themselves cannot reach any source; then say which tool failed and
  its exact error in `notes`.
- **Shape (copy d01):** a hook that names who it is for and promises specific takeaways; 4–7 scenes `S01 · …`;
  plain-words explanation of every number; a practical "what to do now" section; a CTA that asks a specific comment
  question + subscribe. Length **650–950 words** of voiceover (~4–6 min).
- **Names:** folder `dNN/`, files `dNN_<topic_slug>_script.md` and `dNN_<topic_slug>_voiceover.txt`
  (lower-case words joined by `_`, e.g. `d18_infosys_onboarding_update`).
- **Do not promise a specific next video** ("tomorrow I will explain …"): tomorrow's topic is not decided yet. A
  generic "subscribe so you don't miss the next update" is fine.

## 2b. Make them click and keep watching (every episode)

The topic and the first 30 seconds decide the video. Honest but irresistible: every promise is paid off in the video.

- **Pick the angle a student would click:** a fear, a mistake, money, a secret rule, a shortcut, a "nobody tells
  you". Frame the evergreen topic as a question the viewer already worries about ("Your offer letter can be
  cancelled for this one line", "Why your in-hand salary is 30 percent less than your CTC").
- **Hook, the first 2–3 sentences (under 10 seconds):** open on the stake or the surprising fact, not on "Hi
  guys" or the channel name. Then say who it is for and the payoff ("By the end you will know exactly …"). No
  intro talk before the hook.
- **Open loops:** promise something specific for later ("the third mistake is the one that gets offers revoked")
  and pay it off there. One open loop alive at every point of the video.
- **Re-hooks every 30–45 seconds:** a new question, a number, a "but here is the catch", a mini-story of a
  fresher ("Ravi joined on Monday and on Wednesday …"), or "most people get this next part wrong".
- **Concrete over vague:** real numbers, sample lines from an email, a step list; one idea per sentence; talk to
  "you".
- **Pattern for scenes:** problem → why it happens → what to do (steps) → trap to avoid. Keep the energy high; no
  filler, no repeating the same point.
- **End strong:** a one-line recap, then the comment question tied to their situation, then subscribe. Never end
  with "that's all for today".
- Write the title idea and three thumbnail-text options (3–5 words, emotional, completing the title) in the
  script's item table: the edit and metadata steps use them.

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
