---
name: daily-run
description: The UNATTENDED daily run in GitHub Actions — edit one Crack IT episode end to end with nobody to ask, finalize and verify it, cut YouTube Shorts from it with AI-clipper, write the upload metadata, and leave daily-run.json + daily-report.md for the workflow to check and upload to Google Drive. Use only when the prompt says it is the daily run (or the user asks to rehearse it locally).
---

# Daily run (no human in the loop)

The workflow (`.github/workflows/daily-edit.yml`) has already: pulled the Drive inbox into `inbox/`, picked the
episode (`node tools/daily.mjs next`), installed everything, and written `.env`. Your prompt names the episode, its
voiceover and the brief. After you stop, the workflow runs `node tools/daily.mjs check` and uploads only if it passes.

## Ground rules

- **Nobody will answer a question.** Never ask; decide, and write the decision in `daily-report.md`.
  If something is genuinely impossible (no audio, unreadable script, a `{FILL` template whose numbers you cannot
  confirm), stop, write `daily-run.json` with `"status": "failed"` and the reason, and end.
- **Read `docs/lessons.md` first**, then `config/daily.json` (the standing brief). A non-empty brief in the prompt
  (from `brief.txt` in the episode's Drive folder, or typed when the run was started by hand) overrides it.
- This is a 2-CPU / 7 GB Linux runner, not the laptop. One render at a time; never run two renders in parallel.
  Renders take longer here than the laptop's estimates; that is fine (the job has ~5.5 h).
- Never generate or alter the voice. Never print `.env`.

## Standing rules (from the user; they live here because the cloud run has no memory of past sessions)

- **Music: none** unless the brief asks for BGM. When asked: CC0 only (`npm run bgm -- … --cc0`), never CC BY.
  Stock footage/photos from Pexels/Pixabay only.
- **SFX must be audible** — cues have to cut through the bed; check levels in `work/levels.json` after the mix.
- **Crack IT series** (`inbox/faceless/Crack_IT_Daily_Videos/dNN/`): `dNN_<topic>_voiceover.txt` = spoken words
  (TTS spelling), `dNN_<topic>_script.md` = scenes + **Screen** directions (follow them; they ARE the direction pass),
  audio = the media file in the folder. Create with
  `npm run new -- <audio-path> --mode faceless --brand crack-it --formats 16:9 --style <look's style> --no-captions --brief "<brief>; <look's brief>"`.
- **Edit look:** the prompt names this episode's look (picked at random from `config/daily.json` → `looks`, never one
  of the last two used, so consecutive episodes don't look alike). Its `--style` and its words (pacing, what leads
  the picture: graphics, news screenshots or b-roll; SFX character) are part of the brief — follow them through
  the visual plan and the SFX design, not just the theme. A brief override in the prompt wins where they clash.
  Name the look in `daily-report.md`.
- Results templates (d01, d05, d15, d16, d17) may still contain `{FILL…}`/`{OPTIONAL…}`: the spoken audio is the
  truth. Take numbers from the transcript and confirm them against the company's official press release (web
  search) before they go on screen; if they disagree or cannot be confirmed, fail the run rather than publish
  a wrong number.
- Day 04 (LTIMindtree IGNITE, 2023): keep the year visible on screen.
- Component mapping: NewsCard → news scene (+keyword_chip source), StatCounter → number_roll/stat_trio,
  CompareChart → bar_chart, Timeline → timeline, FlowDiagram → flow_diagram, ChecklistPanel → checklist,
  QuoteCard → quote_pull, TipBadge/TrapBadge → side_note/keyword_chip, ChapterDots → chapter rail.
  CommentCard/EndScreen have no component: substitute (quote_pull / a closing card) and note it in the report.
- On-screen: something changes every 4–6 s, keywords only, "reported" for non-official claims, no real logos on
  fake/sample documents.

## Steps

0. **Existing project?** If `projects/` already has a project made from this episode's folder (work pushed from
   the laptop, or an earlier failed run), its `source/` media is not in git. Keep its `work/*.json` decisions
   aside, delete the folder, re-create it with `npm run new` (same audio, so the same name), restore the decisions
   that still apply (the `edl.json` / plans are valid only if the transcript matches), and carry on from there.
1. **Edit** with the `edit-video-faceless` skill, all stages, through `npm run finalize -- <p>` and
   `npm run verify -- <p>`. Read the verify sheet and the stills yourself; fix anything broken before moving on.
   `verify` must end with `structure ok`.
2. **Metadata**: `youtube-metadata` skill → `projects/<p>/output/metadata.md` (titles, description with chapters,
   tags, pinned comment, plus credits from `output/credits.md`).
3. **Shorts**: read `AI-clipper/.claude/skills/clip-shorts/SKILL.md` and follow it with the finished project:
   `npm run shorts:transcribe -- <p>` (clean source, no Whisper), write `AI-clipper/jobs/<p>/clips.json` (framing from
   `config/daily.json` → `shorts.framing`, the video's language), `npm run shorts:prepare -- <p>`,
   `npm run shorts:render -- <p>`. Spot-check frames of each clip. All of the skill's clip rules apply (natural
   length ≤ 70 s, no repeated footage, honest hooks, Instagram block on every clip).
4. **Report** — write both files at the repo root:
   - `daily-run.json`: `{"episode": "dNN", "project": "<p>", "shorts": "<p>", "status": "ok"|"failed", "notes": "…"}`
   - `daily-report.md`: what was made, every judgment call (cuts, substitutions, numbers checked and against what
     source), anything the user should look at or listen to before posting, and the Shorts table.
   Copy `daily-report.md` into `projects/<p>/output/` too, so it lands in Drive next to the video.

Do not commit, push or upload — the workflow does that after `check` passes.
