# Daily cloud edits: one-time setup

Every day at 15:03 IST, `.github/workflows/daily-edit.yml` runs on GitHub. It pulls the inbox from Google Drive and
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
- **Edit looks:** each episode gets a look picked at random from `config/daily.json` → `looks.list` (a visual
  style plus pacing, what leads the picture and the SFX character), never one of the last `avoidRecent` (2) used.
  Add, remove or reword looks there; the run summary on GitHub and `daily-report.md` name the look used.
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
| `GEMINI_API_KEY` | thumbnail scenes: a key from <https://aistudio.google.com/apikey>. Optional variable `GEMINI_IMAGE_MODEL` picks the model (default `gemini-2.5-flash-image`, then the newer ones). Without it, thumbnails fall back to the plain grade + stock photo |

**This repo is public.** Keys live only in your local `.env` (git-ignored) and in these secrets; the workflow writes
`.env` on the runner at run time and the runner is thrown away afterwards. GitHub masks secrets in run logs and
never gives them to pull requests from forks. Run logs themselves are public, so Claude's transcripts go to Drive
(`output/_logs/`) instead of run artifacts. Never paste a key into a commit, issue or workflow file; if one leaks,
revoke it at the provider and replace the secret.

## 4. YouTube upload (optional)

After the Drive upload, the run uploads the video and up to three Shorts to the channel as **Private with a publish
time**, so YouTube publishes them by itself (`tools/youtube.mjs`). The default schedule is the main video the next day
at 18:00 IST and the Shorts the same day, one an hour after it (19:00, 20:00, 21:00). Change it in `config/daily.json` →
`youtube` (`enabled: false` pauses the upload: videos go to Drive only). The upload sets the title, description, tags,
category Education, and the thumbnail when the run made one. "Altered or synthetic content" is set to No
(`syntheticMedia`): the narration is the owner's own cloned voice reading the owner's script over real stock footage,
which YouTube does not ask to label; set it to true if a video ever uses someone else's voice or a realistic AI-made
scene. The API cannot set a Short's "Related video": link each Short to the main video in Studio. Links go to the run page and to
`youtube-uploaded.json` in the episode's Drive folder. Watch each video in Studio before its time; change or cancel
anything there.

One-time setup, signed in with the Google account that **owns the channel**:

1. <https://console.cloud.google.com> → create a project (any name).
2. **APIs & Services → Library** → *YouTube Data API v3* → **Enable**.
3. **Google Auth Platform** (OAuth consent screen): External, an app name, your email. Under **Data access** add the
   scopes `.../auth/youtube.upload` and `.../auth/youtube` (the second lets the pipeline edit its own uploads: title,
   description, tags, schedule, AI label). Under **Audience** press **Publish app** (In production): in Testing mode the
   login expires after 7 days.
4. **Clients → Create client → Desktop app**. Copy the client ID and secret.
5. On your PC, in this repo: `node tools/youtube-auth.mjs <client_id> <client_secret>`. Open the link, pick the
   channel's account (and the channel, for a Brand account), then **Advanced → Go to … (unsafe) → Allow** (it is
   your own app). The terminal prints a refresh token.
6. GitHub secrets: `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`. Never paste the token anywhere else.
   Logins made before October 2026 had upload permission only: run step 5 again (same client) and replace
   `YT_REFRESH_TOKEN` to allow edits. Then **Actions → Upload to YouTube → project + "update"** (and "rewrite" to
   rewrite the title/description/tags by the current rules) re-applies them to an episode already on YouTube.
7. Verify the channel's phone number at <https://www.youtube.com/verify>: custom thumbnails need it.
8. **YouTube API audit.** Until the Cloud project passes it, YouTube keeps every API upload **Private** and ignores
   the publish time, so you set *Scheduled* in Studio yourself (1 minute). Apply with the *YouTube API Services Audit
   and Quota Extension* form. It is free and usually takes a few weeks. After approval the schedule just works.

Turn the upload off with the repository variable `YOUTUBE_UPLOAD = off`, or `"enabled": false`. The free quota
allows about 6 uploads a day, so keep to 1 video and 3 Shorts per run.

## 5. Schedule, cost, limits

- Time: the `cron` line in the workflow is UTC (`33 9 * * *` = 15:03 IST; minutes :00 and :30 are GitHub's busiest and scheduled runs there get dropped). GitHub may start scheduled runs a few
  minutes late. To run one now, go to **Actions → Daily edit → Run workflow**, optionally naming an episode (`d03`)
  and style words.
- **Backup start:** GitHub has been starting this schedule 6–10 hours late. A Claude Routine on the owner's account
  checks every day at 15:45 IST and, if no run has started in the last 12 hours, starts one with **Run workflow**.
  A run with no episode named does nothing when an episode finished less than `minHoursBetween` (12) hours ago
  (`config/daily.json`), so the late schedule and the backup never make two episodes in a row. To make an extra
  episode by hand, name it in **Run workflow** (`d07`).
- Runner: `ubuntu-latest`, 4 CPUs / 16 GB RAM (public repo), max ~6 h per run. Renders are slower than on the laptop.
- Minutes: free and unlimited on standard runners for a public repo. One episode (script + voice + edit + render +
  Shorts) will likely take 1.5–3 h.
- The run never asks questions. Every judgment call is written into `daily-script-report.md` (topic, sources for
  every figure) and `daily-report.md` next to the video in Drive. Read them, and listen to the video, before posting.

## 6. Failures

When a step fails, nothing is uploaded except the report, which goes to `output/_failed/…`. GitHub emails you about
the failed run, and the Claude transcripts are in Drive under `output/_logs/`. A script written before the failure
is already saved in the episode's Drive folder, so the re-run goes straight to the voice. Fix the cause, then use
**Run workflow** with the episode name. Episodes listed in `config/daily-state.json` (or finalized in `projects/`)
are skipped; delete an entry to redo that episode.
