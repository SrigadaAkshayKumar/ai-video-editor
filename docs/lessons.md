# Lessons — read once per session, append after every real edit

Each entry is a rule that was paid for with a broken render or a viewer complaint. Most come from
`video-editor-template` (the Telugu tech-education pipeline this repo absorbed); the rest from building
this repo. Append new ones at the end: date, what happened, the rule. Keep it short.

## Audio

- **Never embed audio in a render pass.** Embedding SFX as HyperFrames `<audio>` corrupted the DIALOGUE
  (two audios at once, wrong segments, dead silence) in every configuration tried. Fixes to the video
  were blamed twice while SFX was the cause. Here: Remotion and HyperFrames render picture only;
  `tools/mix.mjs` mixes dialogue + music + SFX with ffmpeg; finalize muxes. If audio ever breaks,
  isolate SFX first.
- **Structural checks don't hear.** Lint-clean, no frozen frames, contrast passing — and the audio was
  still broken. Never declare audio "fixed" from checks; ask the user to listen.
- **SFX are measured, not guessed.** CC0 one-shots arrive brick-walled at 0 dBFS, 27 dB hotter than a
  synthesized library; an RMS rule alone buries a 0.4s sub-drop 34 dB down. Policy: 14 dB under the
  narration, peak ceiling 8 dB under its peak, a peak floor for short transients, and a length trim
  (a 0.55s swoosh at the same peak as a 0.14s pop is far louder).
- **Spectrum beats level.** Dialogue is ~81% in 300-3400 Hz. A swipe that lives there grated however
  far it was turned down; replacing it with a sub-band cue fixed it. Check `npm run sfx -- list` bands.
- **Density and repetition make a tic.** 78 cues → 54 by merging reframe clusters and only giving an
  exit cue to long clusters; one swipe per dock-in, not per dock-out. Any effect > ~1/3 of cues reads as a tic.
- **Music must be levelled per track.** CC0 beds measured -14 to -25 dB mean: a fixed gain gave a 13 dB
  spread ("negligible at the start, dominant at the end"). dynaudnorm + one house level 9 dB under the
  voice → 0 dB spread. Measure the bed in narration PAUSES, not under speech (the duck flattens it).
- **Sometimes the answer is no music.** A bed at the right level was still called "distracting —
  remove completely". Presence, not just gain.
- **Openverse titles lie.** "warm nostalgia" → vinyl crackle; "low tension" → an alarm patch; a
  "driving" cue → a yacht field recording; two beds shorter than their cues. Pick by title + tags +
  duration and check length ≥ music_start + cue.

## Cutting

- **Retakes are semantic.** The missed repeats were re-explanations with zero shared words, hedges
  before the full claim, the same clause in the other language. Compare meaning; sweep chronologically,
  then by claim, then inside each kept line (a fumble inside one line is invisible to the first two).
- **Boundaries leak.** A kept segment ending 20-60 ms past the last word catches the next take's attack
  ("Mendix Mendix", "addi additional"). STT starts were 80 ms late on the one the user heard. The
  word-timestamp sweep missed it; an RMS silence-then-onset test found it and two more. `cut.mjs` runs it.
- **Fixing a caption sliver doesn't fix the audio** — the boundary itself must move.
- **A zero-width word on a boundary can invert meaning** ("not everyone" → "everyone"). Extending the
  segment to swallow the redundant next line beat nudging the boundary.
- **Trailing dead air** — sweep every boundary, not just the one the user noticed.
- **Re-cuts: remap, don't re-author.** Old final → raw → new final carried 150 scenes, 129 overlays and
  65 SFX across 11 edits; an overlay whose start lands in removed material is DELETED, not shifted —
  diff the counts (`tools/retime.mjs` lists drops).
- **ElevenLabs quota**: Scribe bills ~1.11 credits/s; an 18-minute file needs ~1200. Check before long runs.
- **Whisper is not for Telugu/Hindi code-mixed speech** (faster-whisper small/medium produced nonsense
  syllables); it is fine for English with a verbatim prompt and silence re-anchoring.

## Picture

- **Variety is a requirement.** One layout for every beat was rejected as monotonous; six stage
  layouts, 28 components, distinct entrances, per-section accents fixed it.
- **Component props are the recurring silent defect.** `comparison` reads left/right not items (blank
  cards); `progress_ring` reads `value` not `current`; `stat_trio` draws a literal 0 without values;
  `step_progress` needs `current_step`; `fact_band` needs items. `render-visuals --check` enforces these.
- **Crop, never squeeze** a face into a docked card. Animate transforms, never width/height.
- **Nothing readable in the caption band** — it is drawn by a later pass Remotion can't see.
- **Never reframe over a news screenshot** — the cited article becomes a thumbnail.
- **Title at frame 0, over the first line** — silent titles at the head are where viewers leave.
- **Stock footage must not pretend to be evidence** of a named entity/event; use news or a graphic.
- **Look at every capture and clip.** Cookie walls look fine by file size; stock search returns the
  wrong subject; an article "from 2024" was dated 2022 on the page.
- **Docked b-roll can render blank** in a full encode while stills look right (unresolved in the
  template). Faceless keeps a `graphic` scene under docked charts ("no empty docks").

## Tooling (this repo)

- **PowerShell writes BOMs** (`Out-File`, `Set-Content -Encoding utf8` in 5.1): a BOM before `#!` breaks
  a Node script. Write code with the Write tool; JSON readers here strip BOMs.
- **winget PATH**: shells opened before the FFmpeg install don't see it; `tools/lib/common.mjs` adds the
  WinGet Links dir itself.
- **Headless Chrome can't go below ~500 px wide**: mobile news captures use a 500 px viewport at 2.16×.
- **Validator rules must return booleans** — `o.text || "message"` returned the text as an "error".

## 2026-10-04 — tcs (Crack IT, faceless, 16:9, no captions)

- **Hold the layout, not the graphic.** The template's gap-fill stretched a takeover up to the next one,
  so "What even is that?" stayed on screen ~2s after the narration moved on, under a new chip. Now only
  the stage window is filled; each overlay leaves on time (`Doc.tsx`). Caught in the verify sheet.
- **CDNs block headless capture** (TCS newsroom: "Access Denied", then 404 on the English URL) and
  OneTrust dims whole pages. `news.mjs` now drives Chrome via puppeteer-core with a normal user agent,
  rejects consent banners and strips overlays; when the publisher's page is unreachable, cite the
  primary record instead (the Guinness page states who/what/when itself).
- **Script keyterms**: extract only from narration lines (no headings, `**VISUAL:**` labels, sentence
  starters) — the first pass fed "VISUAL, HOOK, What, The…" to the STT.
- **A piped background render can fail silently** (`… | tail` returns 0). Run long renders with output
  to a log and check the tool's own exit code.
- **Intro offsets everything**: `verify` must shift clean-cut times by the prepended intro length.

## 2026-10-04 — talking-head-sample (English, whisper, 16:9 + 9:16)

- **9:16 dock cards cropped the face at the mouth.** A 16:9 source fills a 9:16 frame's full height, so
  `framing` Y did nothing and the card crop sat at dead centre. `Doc.tsx` now biases the card's vertical
  crop by the framing Y when one is set (`"9:16": "50% 15%"` for a head-and-shoulders shot).
- **Map thumbnail sheets back to ids carefully** — two clips were fetched by the wrong id from a numbered
  contact sheet; the stills caught it. Spot-check every `broll get`.
- **SFX were drowned by the music bed** (user: "dominated by the background music"). House levels put the
  bed 9 dB and SFX ~14 dB under the voice — so every cue sat under the bed. With music, the bed goes
  lower and dips around each cue; SFX peaks must sit above the bed.
- **Music policy**: BGM only when the prompt asks for it; CC0 only (`--cc0`) — YouTube uploads, no CC BY.

## 2026-10-05 — tcs-2 (Crack IT Part 2, faceless, 16:9, no captions)

- **Intro after the hook**: `project.json` `introAt` (clean-cut seconds; `npm run new … --intro-at s`) makes
  finalize splice the bumper mid-body (body trimmed either side). Put the splice in a pause and end the
  hook's music cue (with its fade) BEFORE it — the mix is one file, so a bed would be chopped mid-note.
  `verify` maps times across the splice and grabs frames on both sides of it.
- **`news capture --url` did nothing** (the usage line said `--url`, the code read a positional) — no
  error, no file. Now both work. Page sections are captured as `url#anchor` (own file per hash); before
  the fix every `#section` overwrote the same PNG.
- **CC0 music lives on Freesound**: `bgm search --cc0` against the default Jamendo/ccMixter sources found
  nothing for any query; `--cc0 --source freesound` did. No loop support: split long beds per chapter.
- **fact_band shows `label` big, `sublabel` small** — put the number in `label` (₹3.36 LPA), the name in
  `sublabel`. `bar_chart` rounds values to integers (3.36 → 3), so it can't carry decimal packages.
- **The edit laptop is 16 GB RAM, no dedicated GPU.** The full Remotion render was killed for low memory at
  40% with the default 6 tabs; 3 finished it. Now the defaults: Remotion concurrency 3 + 512 MB offthread
  video cache (`REMOTION_CONCURRENCY`), HyperFrames `--workers 2` (`HYPERFRAMES_WORKERS`). One long render
  at a time, never two formats or visuals + finalize in parallel; check free RAM before starting.
- **Thumbnail demo defaults leaked**: an omitted `--native` let the composition's default Telugu line
  ("ఉద్యోగం రాదు") onto an English thumbnail. `thumbnail.mjs` now sends "" for omitted text. `--bg-pos`
  sets which part of a cropped photo stays (a 3:2 stock photo lost the face at the top under cover-crop).

## 2026-10-05 — ai-skill (Crack IT, faceless, 16:9, no captions, no stock, no BGM)

- **No stock footage = empty docks.** A faceless edit made only of `graphic` + `news` scenes left half the frame
  as a bare accent field beside every dock/corner component. Graphic scenes now take `"card": {value, label}`:
  a type slab (big figure/word) drawn in the picture, so the dock/corner card carries a number instead of
  nothing (`Scenes.tsx` TypeSlab; hidden under takeovers). Don't put a card on a scene that opens with a
  chapter_open — the slab sits blurred behind the scrim while it clears.
- **`step_progress.current_step` is 0-based** (3 highlighted the 4th item). Caught in the stills.
- **`annotation` lands at a fixed side position, not on the article** — over a news scene it underlined an ad.
  Use a `keyword_chip` there.
- **Script dates are not facts**: the script (and FACE Prep) said "March 2026" for the TCS 60% figure; Business
  Standard's page reads Feb 20 2026 (AI Impact Summit, Feb). Keep the spoken word if the user says so, but show
  only the page's real date on screen.
- **Never splice on a Whisper word end.** `introAt` 21.51 came from whisper's "needed." end time; the word really
  ended at 21.77 (whisper ran ~0.3s early on this TTS), so the bumper cut "degree | intro | needed". Measure the
  pause with an RMS envelope (≥0.08s under -45 dB) and put `introAt` inside it (here 21.83).

## 2026-10-06 — infosys (Crack IT, faceless, 16:9, no captions, new "liquid" style)

- **The VO file itself can be missing lines.** Whisper read "credit card informa|tion.com and digitalcareers…" at
  3:41: the TTS export had dropped red flag 5 and half of V19. A second whisper pass on the chunk confirmed it was
  the audio, not STT. Check `script-diff.md`'s "never spoken" list for mid-sentence holes before directing.
- **Whisper crams words at a splice**: "tax forms or" got 40 ms, so `keepPauseMax` cut real speech as a "pause".
  When a cut lands near STT-compressed words, re-time them in words.json from the RMS envelope, pin the join with
  a `time` cut, and re-transcribe the joined audio to hear what the viewer will hear.
- **Style "liquid"** (`--style liquid` / plan `"style": "liquid"`): clear refractive panes (SVG lens via
  backdrop-filter url(#liquid-lens)), specular rims, aurora field, jelly springs, glass rim on the docked picture,
  capsule chapter rail (hidden before the first chapter_open). Docked panels sit in their own glass pane.
- **chapter_open `section` now pins the accent** for rail/background too (Part 1 blue/green, Part 2 red/orange).
- **A no-space chip overflows**: "career.infosys.com/offerValidation" ran off frame; add spaces so it wraps.
- **The SE form URL captured a "permission declined" page** — an official page can still be the wrong evidence.
- **Render in RAM-gated chunks.** The full Remotion render was killed at 40% again (3 tabs, ~1.5 GB free —
  Chrome/VS Code/Defender eat the rest). `remotion/scripts/render.mjs` now renders 40s chunks, each in its own
  child process (memory returned between chunks), reusing one bundle, sizing tabs to free RAM (1-3), waiting
  while < 2 GB is free, resuming kept chunks after a kill, retrying a failed chunk on 1 tab, and joining with
  ffmpeg stream copy + a frame-count check. A killed render's orphaned child kept writing into the next run's
  log — a stack trace AFTER "rendered …" is the old run, verify the file (frames + full decode) before redoing it.
- **ffprobe `csv=p=0` prints `8957,`** (trailing comma) for stream entries — parseInt, not Number().

## 2026-10-06 — infosys-2 (Crack IT, faceless, 16:9, no captions, new "blueprint" style, CC0 BGM)

- **Style "blueprint"** (`--style blueprint` / plan `"style": "blueprint"`): navy drafting grid that creeps, scan line,
  registration marks + ruler, everything set in JetBrains Mono (type scale ×0.9 — mono runs ~20% wider), hairline
  panels with crop-mark corner brackets (`bpBrackets()` as background gradients, no extra DOM), stepped "plotter"
  motion (quantised ease-out, no float), a shell-prompt chapter rail (`crack-it:~/02-section-prep$ [####....] 2/3`)
  and crop marks + FIG tag round the docked picture. Code in `remotion/src/doc/Blueprint.tsx`.
- **New `data_table` component** (corner): `columns`, `rows[{cells, at, color}]` printing in on cue (`at` = seconds
  into the overlay — take them from the word times), `footer`/`footer_at`, optional `code` listing beside it (trace
  tables). Landscape it hugs the LEFT: centred at 1240px wide it ran under the corner picture card.
- **chapter_open's ghost numeral defaults to "00" for section 0** — set `numeral` explicitly when `section` is used
  for colour rather than chapter order.
- **poll_prompt silently capped options at 3**; now up to 5 (two columns past three).
- **The VO dropped a clause again** (V11's interview timings). A second whisper pass on the chunk confirmed it; the
  timings went on screen labelled "reported" instead.
- **Freesound CC0 search wants 1-2 generic words** ("tension", "lofi", "upbeat") — four-word mood phrases found nothing.

## 2026-10-07 — cognizant (Crack IT, faceless, 16:9, no captions, liquid, CC0 BGM, 24 min — the first long edit)

- **The VO had no think pauses.** The script's 23 `<<THINK>>` markers were read straight through. `edl.json`
  `"gaps": [{after, seconds}]` now INSERTS silence (timeline.json marks `gap_after`; retime carries times inside a gap).
  The split goes in the measured pause nearest the word — whisper word ends were up to 0.5s late on this TTS — and
  every split was then re-transcribed either side: 6 of 31 auto-picks cut mid-phrase ("to | Rhea", "from and | by",
  "pause | and try it"). Those take a hand-placed `"time"` (raw s). Never trust a split you haven't re-heard via STT.
- **A gap split must keep the segment's existing gap**: splitting a segment that already had a gap at its end dropped
  that gap (4 of 7 chapter beats vanished). Diff the gap count in timeline.json after every cut.
- **Straddled words near a split** land on the far side of the gap in cleancut.words.json; anchor overlays to the
  gap times (timeline.json), not to the question's last word.
- **New `question_card`** (takeover): topic eyebrow + numeral + question + option chips, `timer`/`timer_at` ring
  countdown over the inserted silence. `step_progress` items take `at` (advance in place — a chain of overlays
  re-entered every 2s). `data_table` columns are now sized/aligned by content, code listings sized to their longest
  line (≤640px) with ligatures off (`!=` rendered as `≠` in Python code).
- **Phrase lookups must be scoped**: `at("question one tell me")` matched the technical Q1 instead of HR Q1 and gave a
  negative duration. Search from the section's start time.
- **181 SFX cues blew Windows' 32k command line** (spawnSync ENAMETOOLONG) in mix.mjs: one input per distinct file +
  asplit, graph via `-/filter_complex <file>` (ffmpeg 9). Music cues take `"loop": true` for short CC0 beds.
- **Mint blocks automated capture**; the onboarding-delay claim went on screen as a graphic worded "reported".

## 2026-10-07 — cognizant-onboarding (Crack IT, faceless, 16:9, no captions, new "cleantech" style, SFX only)

- **The VO dropped ~1:50 mid-sentence** ("then got a revised, is…" → "…Cognizant Digital Business, which is why…"). A
  first-pass whisper with the script prompt HALLUCINATED the missing word ("October") — only a prompt-free re-transcription
  of the chunk showed the truncation. Re-check every suspicious join without the verbatim prompt.
- **The narrator read a placeholder aloud** ("I am [YOUR NAME]") — grep the script for `[…]` placeholders before cutting.
- **Whisper word ends were ~0.3-0.8s off in both directions** on this TTS; bisect a boundary by transcribing chunks that
  end/start at candidate times, then cut by `time`. A time cut swallows any word >50% inside it — re-time that word in
  words.json (here "all." spanned the silence).
- **Style "cleantech"** (`--style cleantech`): the first LIGHT variant. Theme colours are now live per style — `TEXT/TEXT_DIM/
  TEXT_FAINT/INK/PAPER/ON_ACCENT/RAISED` (re-set by `syncPalette()` in setFrame) and `fg(a)`/`shade(a)` replace hard-coded
  `rgba(255,255,255,a)` / black shadows. Any new component must use them, or it disappears on paper. `speed_hint` and
  `sample_answer` are still dark-only.

## 2026-10-07 — walkin (Crack IT, faceless, 16:9, no captions, blueprint, CC0 BGM)

- **Aggregator URLs get recycled.** freshersvoice.com's "cognizant-walk-in-drive" / "hcltech-walk-in-drive" pages now show
  NEWER drives than the script cites, and an AmbitionBox salary URL redirected to a different company with different numbers.
  A capture can be "HTTP 200, the right site" and still not support the claim — read the date AND the claimed line on the page;
  if it's gone, show a labelled text card ("reported listing"), never the newer page.
- **TTS reads "I.T." as "I"/"eye"** (and "fresher" → "pressure") in some positions; whisper with the script prompt hides it.
  Prompt-free chunk STT on every line containing an acronym before cutting.
