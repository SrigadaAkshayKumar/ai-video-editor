# Daily cloud edits: one-time setup

Every day at 06:00 IST, `.github/workflows/daily-edit.yml` runs on GitHub. It pulls the inbox from Google Drive,
picks the next episode that has a voiceover, has Claude Code edit it (`daily-run` skill), checks it with `verify`,
cuts the Shorts, and puts everything in Drive. Media never goes into git: only code and the edit decision files
(`projects/<p>/work/*.json`, `config/daily-state.json`) are committed back.

## 1. Google Drive layout

Make one folder in your Drive, `AI-edits`, holding the same `inbox/` tree as this repo:

```
AI-edits/
  inbox/
    brand/Intro.mp4
    faceless/Crack_IT_Daily_Videos/
      d02/  d02_..._script.md   d02_..._voiceover.txt   d02-voice.wav   [brief.txt]
      d03/  …
  output/                                  ← the workflow writes here
    d02-tcs-ai-engineers/
      final-16x9.mp4  credits.md  metadata.md  daily-report.md
      shorts/  01-….mp4  02-….mp4  UPLOAD_SHEET.md  clips.json
    _failed/d05-20261012-0031/daily-report.md   ← only when a run fails
```

- **An episode is edited when its folder has a voice file.** Upload the scripts any time. The run picks up the
  episode the morning after you drop `dNN-voice.wav` in.
- `brief.txt` (optional, one line) overrides the standing style in `config/daily.json` for that episode only.
- A different Drive folder name: set the repository **variable** `DRIVE_ROOT`.

## 2. Drive access for the runner (rclone)

On your PC: install rclone (`winget install Rclone.Rclone`), run `rclone config`, then choose
`n` (new remote), name **`gdrive`**, storage **drive**, and leave client id/secret **empty** (rclone's own app;
tokens made with a self-made app in "testing" mode expire after 7 days). Pick scope `drive`, then log in through
the browser.
Check it with `rclone lsd gdrive:AI-edits`. Then copy the whole `[gdrive]` section of
`%APPDATA%\rclone\rclone.conf` into the GitHub secret **`RCLONE_CONF`**.

A Google service account will not work for a personal Gmail Drive: it has no storage of its own.

## 3. GitHub secrets (repo → Settings → Secrets and variables → Actions)

| Secret | From |
|---|---|
| `RCLONE_CONF` | step 2 |
| `CLAUDE_CODE_OAUTH_TOKEN` | run `claude setup-token` on your PC (uses your Claude subscription), **or** set `ANTHROPIC_API_KEY` instead (pay per token) |
| `ELEVENLABS_API_KEY`, `PIXABAY_API_KEY`, `PEXELS_API_KEY`, `OPENVERSE_TOKEN`, `YOUTUBE_API_KEY` | the same values as your local `.env` (leave unused ones out) |

## 4. Schedule, cost, limits

- Time: the `cron` line in the workflow is UTC (`30 0 * * *` = 06:00 IST). GitHub may start scheduled runs a few
  minutes late. To run one now, go to **Actions → Daily edit → Run workflow**, optionally naming an episode (`d03`)
  and style words.
- Runner: `ubuntu-latest`, 2 CPUs / 7 GB RAM in a **private** repo (4 CPUs / 16 GB in a public one), max ~6 h per run.
  Renders are slower than on the laptop.
- Minutes: private repos get 2,000 free minutes a month. One episode (setup + edit + render + Shorts) will likely
  take 1–2.5 h, so daily runs will go past that. Either make the repo public (standard runners are free there; no
  media or keys are in the repo) or pay for the extra Linux minutes.
- The run never asks questions. Every judgment call is written into `daily-report.md` next to the video in Drive.
  Read it, and listen to the video, before posting.

## 5. Failures

When a step fails, nothing is uploaded except the report, which goes to `output/_failed/…`. GitHub emails you about
the failed run, and the Claude transcript is kept as a run artifact for 14 days. Fix the cause, then use
**Run workflow** with the episode name. Episodes listed in `config/daily-state.json` (or finalized in `projects/`)
are skipped; delete an entry to redo that episode.
