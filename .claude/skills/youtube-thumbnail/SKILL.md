---
name: youtube-thumbnail
description: Design and build a high-CTR thumbnail for a video this repo edited — hook selection, the real face frame pulled from the footage, background cut-out, type set with real fonts (Telugu/Devanagari included), the YouTube 1280x720 thumbnail and the Instagram 1080x1920 cover, an optional image-generation prompt for the background layer, and a feed-size legibility check. Use when the user asks for a thumbnail, thumbnail ideas, a cover image, or how to make the thumbnail more clickable.
---

# Thumbnail (and Reels cover)

## The rule that shapes everything

**An image model cannot produce the creator's real face, and cannot set type** (it mangles Latin and
can't shape Telugu conjuncts at all). A generated "Indian man with glasses" is a stranger, and a
stranger on a personal channel destroys recognition. So every thumbnail is **layers**:
1. the face — a real frame from the footage, cut out;
2. the background/graphic — generated, a frame, or a plain accent gradient;
3. the type — set by `tools/thumbnail.mjs render` with real fonts.
Faceless videos: no face layer; a graphic/stock background + type.

## 1. Read the video first (never ask what it is about)

`work/cleancut.transcript.md`, `work/visual-plan.json` (`big_statement`s are already the punchlines —
the best one is usually the thumbnail line; `chapter_open`s are the sections), the title if the
youtube-metadata skill ran (the thumbnail **completes** the title, never repeats it).

## 2. One hook

The single moment with the biggest gap between what the viewer assumes and what the video says: the
counter-intuitive answer, the number they didn't know, the binary they can't resolve without watching.
For student/early-career audiences: money, jobs and wasted effort; fear of wasted effort beats promise
of reward. Lead with the risk — but only one the video actually delivers.

## 3. Face frame (talking head)

```
node tools/thumbnail.mjs frames <p> --auto            # punch-in moments + big_statement starts
node tools/thumbnail.mjs frames <p> --at 41.2,88.0    # or specific clean-cut times
```
Frames come from the RAW footage at full quality (mapped through `work/timeline.json`). Read them;
pick eyes to camera, brows up or furrowed, mouth mid-word, hands in frame if gesturing. Say which and why.
`node tools/thumbnail.mjs cutout <p> work/thumb/face-41.2.png` → `work/thumb/cutout.png` (Read it:
hair and hand edges intact?).

## 4. Background (optional generated layer)

Give the user an image-generation prompt for the BACKGROUND ONLY, written as composition and lighting,
not a scene: "dark navy studio backdrop, single warm rim light from upper right, soft amber glow on the
left third, fine dot-grid texture, deep vignette, empty negative space on the right two thirds for a
subject cut-out, cinematic, high contrast, 16:9 1280x720". Negative prompt always: `no text, no letters,
no words, no watermark, no logos, no people, no faces, no hands, cluttered, low contrast, busy`.
("no people" matters — the generated layer must not add a second person.) Or skip it: the renderer
draws an accent gradient.

## 5. Render

```
node tools/thumbnail.mjs render <p> --big "NOT ENOUGH" --small "Certificates alone" \
     --native "ఉద్యోగం రాదు" --cutout work/thumb/cutout.png [--background work/thumb/bg.png] \
     --accent "#ffcc00" --side right
```
→ `output/thumbnail-16x9.png` (1280x720) and `output/cover-9x16.png` (1080x1920 Reels cover).
Layout rules baked in: face one third, text the other; two type sizes; bottom-right clear for the
duration stamp. Text 3-4 words; one word huge. A native-script line against an English title signals
the language instantly. Accent = the section accent of the hook's chapter, or the brand's colour if the user named a brand
(`config/brands/<slug>.json`). No brand → no channel styling assumed.

## 6. Check before handing over

Read the feed-size previews (`work/thumb/preview-120-*.png`): big word readable? face recognisable?
Does it duplicate the title? Would a stranger get it? Does the video deliver what it implies?

## Don't

No fabricated logos, certificates, salary slips or documents; no trademarks by default (flag, let the
user decide); no reflexive red arrow + shocked face — credibility over alarm; no emoji.
