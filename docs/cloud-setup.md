# Daily cloud edits: one-time setup

Every day at 06:00 IST, `.github/workflows/daily-edit.yml` runs on GitHub. It pulls the inbox from Google Drive and
takes the next unfinished episode of the series, in order:

1. **Script** (`daily-script` skill), only when the episode needs one: a planned episode whose voiceover still has
   `{FILL…}` gets its figures filled from confirmed sources (or is deferred until they exist); once every planned
   episode is done, Claude researches the day's news for the channel and writes a new episode in the d01 format
   (`docs/examples/crack-it-d01/`).
2. **Voice** (`tools/voice/tts.py`), only when there is no audio yet: your cloned voice from the voiceover text,
   with the same Qwen3-TTS model and settings as the Colab notebook (`config/voice.json`). About 30 minutes for a
   4–5 minute voiceover. Script and voice are saved back to the episode's Drive folder.
3. **Edit** (`daily-run` skill): edit, `verify`, Shorts, metadata, and everything goes to Drive.

Media never goes into git: only code and the edit decision files (`projects/<p>/work/*.json`,
`config/daily-state.json`) are committed back.

## 1. Google Drive layout

Make one folder in your Drive, `AI-edits`, holding the same `inbox/` tree as this repo:

```
AI-edits/
  inbox/
    brand/Intro.mp4  my-final-voice.MP3      ← voice reference for the clone (never put it in the public repo)
    faceless/Crack_IT_Daily_Videos/
      d02/  d02_..._script.md   d02_..._voiceover.txt   d02-voice.wav   [brief.txt]
      d03/  …
  output/                                  ← the workflow writes here
    d02-tcs-ai-engineers/
      final-16x9.mp4  credits.md  metadata.md  daily-report.md
      shorts/  01-….mp4  02-….mp4  UPLOAD_SHEET.md  clips.json
    _failed/d05-20261012-0031/daily-report.md   ← only when a run fails
```

- **Episodes run in folder order, one a day.** A folder with only a script gets voiced, then edited, in the same
  run; a folder where you dropped your own `dNN-voice.wav` skips the voice step. With no planned folder left, the run
  makes `d<next>/` itself from fresh news (turn that off with `"freshNews": false` in `config/daily.json`).
- **Voice reference:** `inbox/brand/my-final-voice.*` plus its exact words in `config/voice.json` → `refText`.
  Recording a new reference? Upload it with the same name and update `refText` (a 10–20 s clip clones better).
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
| `CLAUDE_CODE_OAUTH_TOKEN` | run `claude setup-token` on your PC (uses your Claude subscription), **or** set `ANTHROPIC_API_KEY` instead (pay per token). Check Anthropic's current terms for subscription tokens in scheduled CI. |
| `ELEVENLABS_API_KEY`, `PIXABAY_API_KEY`, `PEXELS_API_KEY`, `OPENVERSE_TOKEN`, `YOUTUBE_API_KEY` | the same values as your local `.env` (leave unused ones out) |

**This repo is public.** Keys live only in your local `.env` (git-ignored) and in these secrets; the workflow writes
`.env` on the runner at run time and the runner is thrown away afterwards. GitHub masks secrets in run logs and
never gives them to pull requests from forks. Run logs themselves are public, so Claude's transcripts go to Drive
(`output/_logs/`) instead of run artifacts. Never paste a key into a commit, issue or workflow file; if one leaks,
revoke it at the provider and replace the secret.

## 4. Schedule, cost, limits

- Time: the `cron` line in the workflow is UTC (`30 0 * * *` = 06:00 IST). GitHub may start scheduled runs a few
  minutes late. To run one now, go to **Actions → Daily edit → Run workflow**, optionally naming an episode (`d03`)
  and style words.
- Runner: `ubuntu-latest`, 4 CPUs / 16 GB RAM (public repo), max ~6 h per run. Renders are slower than on the laptop.
- Minutes: free and unlimited on standard runners for a public repo. One episode (script + voice + edit + render +
  Shorts) will likely take 1.5–3 h.
- The run never asks questions. Every judgment call is written into `daily-script-report.md` (topic, sources for
  every figure) and `daily-report.md` next to the video in Drive. Read them, and listen to the video, before posting.

## 5. Failures

When a step fails, nothing is uploaded except the report, which goes to `output/_failed/…`. GitHub emails you about
the failed run, and the Claude transcripts are in Drive under `output/_logs/`. A script written before the failure
is already saved in the episode's Drive folder, so the re-run goes straight to the voice. Fix the cause, then use
**Run workflow** with the episode name. Episodes listed in `config/daily-state.json` (or finalized in `projects/`)
are skipped; delete an entry to redo that episode.
