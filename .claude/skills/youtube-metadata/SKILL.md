---
name: youtube-metadata
description: Write the upload package for a video this repo edited — YouTube title options, description with chapters, tags, pinned comment, thumbnail text, and the Instagram Reels caption + hashtags for the 9:16 cut — optimised for whichever channel/client the user says it is for (config/brands/ profiles, only when named). Use when the user asks what to title a video, for a description, tags, chapters, "the YouTube metadata", an Instagram caption, or SEO/CTR advice on a finished render.
---

# Upload package (YouTube + Instagram)

You have the whole video on disk — don't ask what it is about. Read first:

| File | Gives you |
|---|---|
| `work/cleancut.transcript.md` | every claim, in the speaker's words, on the final timeline |
| `work/cut-report.md` | the clean script; `work/edl.json` reasons summarise structure |
| `work/visual-plan.json` | `chapter_open` overlays = section titles + FINAL timestamps → YouTube chapters; `big_statement`s = the punchlines |
| `work/direction.json` (faceless) | logline, promise, payoff |
| `output/credits.md` | sources + required attributions — they go in the description |
| `project.json` `brief` / `brand` | the user's intent for this video; the brand slug if they named one |
| `config/brands/<slug>.json` | that brand's name, handle, channel id, audience, title formula, examples, links (only if a brand is named) |

Never invent a claim, number or promise the video doesn't deliver.

## 1. Real channel data (tell the user which tier you got)

**Whose video is it?** This repo edits for many people. If the user hasn't said, write channel-neutral
metadata (no channel name in titles, generic links) and ask in one line whether they want it tuned to
a channel. When they name one, use/create `config/brands/<slug>.json` and do the tiers below.

- **Tier 1 — YouTube Data API** (`YOUTUBE_API_KEY` in `.env`, channel id in the brand profile):
  `search?channelId=…&order=viewCount&type=video&maxResults=25` and `order=date`, then
  `videos?part=snippet,statistics,contentDetails&id=…`. The gap between what performs all-time and
  what performs recently is the most useful signal there is.
- **Tier 2 — the browser** (ask first): open the channel's Videos tab, sort Popular, read titles + views;
  then Latest. Public, no login.
- **Tier 3 — WebSearch**: conventions only, no view counts. Say the advice is pattern-matched.
- For CTR-level advice ask the user for YouTube Studio numbers (impressions, CTR, AVD).

If the brand profile is missing fields, infer the conventions from the channel's recent titles and
offer to save them to `config/brands/<slug>.json` (name, handle, title formula + examples, audience, links).

## 2. Conventions

- Match the channel's own title formula (a title that looks foreign to the channel loses the
  returning-subscriber click). For Telugu/Hindi channels the usual pattern is an **English title**
  with the language as a keyword: `<hook> | Telugu | <Channel>` or `<topic> in Telugu`.
- Check for an existing video on the same topic: differentiate on the question this one answers, and
  link the older one.

## 3. Produce one copy-pasteable block

**Titles — 4-6, ranked, each < 60 characters**, keyword in the first 3-4 words, a spread of angles:
the direct question, the myth-buster/negative framing, the real number or outcome the video contains,
the "who is this for". One line of click logic each. No emoji.

**Description**: first two lines (all most people see) restate promise + payoff with the main keyword
in line 1, keyword-dense but readable in the first 150 characters; a short paragraph in the audience's
own register (Telugu/Hindi-English mix is fine); **chapters** from the `chapter_open` overlays, first
one `0:00`, format `M:SS Title` (add the intro length if an intro is appended); links (anything the
video mentions, the related older video, socials from the brand profile if any); the **credits block** from
`output/credits.md`; 3-5 hashtags last.

**Tags** 15-25, comma separated: exact English search phrases, the same intent transliterated
("nptel telugu"), channel tags, broad topic tags last; highest intent first.

**Thumbnail text**: 2-3 options, 3-5 words, completing the title rather than repeating it.

**Pinned comment**: one line inviting the specific comment this video should generate.

**Instagram (9:16 cut)**: a caption whose first line is the hook (it truncates after ~125
characters), 2-4 short lines, a call to comment/save, the credits if required, 5-10 hashtags mixing
topic + language + niche. Suggest a cover frame (see youtube-thumbnail: `output/cover-9x16.png`).

## Rules

- Never promise what the video doesn't deliver; the honest counter-intuitive angle is usually the
  stronger hook anyway. No clickbait the first 30 seconds doesn't pay off.
- Credits/sources required by `output/credits.md` are not optional.
