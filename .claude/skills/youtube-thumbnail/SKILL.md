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

## 5b. Faceless channels (Crack IT): three variants, a Gemini scene + designed type

The owner's call: the PICTURE comes from Gemini (`tools/gemini-image.mjs`, a photo-real scene); the TYPE, numbers,
logo and badge are always set by `tools/thumb-design.mjs` on top (Inter Display, the brand accent, fine grain,
vignette). An image model never draws text, numbers or logos. Make **three variants that test different ideas**
(YouTube Studio's *Test & Compare* takes up to 3):

| | Template | Idea | Example (d06) |
|---|---|---|---|
| **A** | `headline` + `scene` | the tension in 2-4 words, one word highlighted, over the emotional scene | `"lines": ["Selected.", "*Not* joined."]` |
| **B** | `stat` (+ `scene` optional) | the one number the video explains + 2-4 words, optional `trend` line (`up`/`down`) | `"number": "25,000", "caption": "freshers hired. *Still waiting?*"` |
| **C** | `versus` | this vs that, the right side is the answer the viewer wants (plain grade, no scene) | `left {Selected, YES}`, `right {Joining date, ?}` |

**Scene (Gemini):** one picture that carries the story's emotion, with ONE subject on the right third and empty dark
space on the left. Write the prompt as a photographer's brief: who (a young Indian graduate / IT employee, never a
celebrity or a named real person), the expression (worried, shocked, relieved, staring at a phone), the place
(hostel room at night, office corridor, campus placement hall), the light (one warm practical light, cool shadows,
low-key). The tool appends the rules (no text, no logos, subject right, left empty) itself.
```
node tools/gemini-image.mjs <p> --name A --n 3 --prompt "young Indian engineering graduate sitting on a hostel bed at night, staring at his phone in disbelief, offer letter beside him, warm desk-lamp light, cool blue shadows"
```
Read every `work/thumb/ai/A-*.png` and reject any with text or letters, a logo, extra fingers or a warped face, the
subject on the left, or a busy left side; regenerate (better prompt) at most twice. Spec `"scene": "work/thumb/ai/A-2.png"`.
No `GEMINI_API_KEY`, or Gemini fails → no scene: use the plain grade (and the stock-photo `person` below), never stop.

Write `output/thumbnails/spec.json` (format in the tool's header: `accent` = the brand colour, `brand` = the channel
name, `kicker` = a short context label like "4 reasons · 2026"), then
`node tools/thumb-design.mjs <p> output/thumbnails/spec.json` → `output/thumbnails/A.png` (+ `A-feed.png`).

**Dramatic extras** (each one earns its place, never all on every variant):
- **Company logo** when the video is about named companies: `node tools/logo.mjs search <p> "Cognizant"` → Read
  `work/thumb/logos/sheet.png`, pick the CURRENT official logo (not an old one, not a sub-brand), then
  `node tools/logo.mjs pick <p> <n> --name cognizant` → `assets/logos/cognizant.svg`; spec `"logo"`. It sits on a
  white plate, top right, untouched (never recoloured or cropped). Two companies compared: use `versus` and put the
  logo of the one the story is about. No logo found → leave it out, never draw one or ask Gemini for one.
- **Badge** (`"badge": "Must watch"`, or "Explained", "New rules", "Update"): 1-2 words, on ONE variant at most.
- **Person** (fallback only, when there is no Gemini scene): a real stock photo, cut out, on ONE variant:
  `node tools/broll.mjs search <p> "shocked young indian man office" --photos --orientation portrait --n 8`, Read
  the candidates, `get` the best, then `node tools/thumbnail.mjs cutout <p> assets/stills/<name>.jpg` → Read
  `work/thumb/cutout.png` → spec `"person": "work/thumb/cutout.png"`. Never `scene` and `person` on one variant.

Rules:
- **Not AI slop:** one accent colour plus off-white on the dark grade. No emoji, arrows, icons, stickers, fake UI or
  extra effects; the Gemini scene must look like a real photo (natural skin, real light), not glossy AI art. Extras
  only as above. If it needs explaining, it is too busy.
- **Words:** ≤ 4 big words per variant, never the title again; the title + thumbnail make one question the video
  answers, and the thumbnail never gives the answer. Highlight exactly one word (`*word*`) in `headline`.
- **Facts:** every number and name comes from the video (transcript, `metadata.md`); write it exactly as the video
  says it. Company names as plain text only.
- **Check:** Read every PNG and every `*-feed.png` (214 px wide, the size in the feed). Text clipped, wrapping
  badly, or the big words unreadable at feed size → shorten and render again.
- Write `output/thumbnails/thumbnails.md`: each variant's idea and text, and which one to use as the main thumbnail
  (the others go into Test & Compare).

## 6. Check before handing over

Read the feed-size previews (`work/thumb/preview-120-*.png`): big word readable? face recognisable?
Does it duplicate the title? Would a stranger get it? Does the video deliver what it implies?

## Don't

No fabricated logos, certificates, salary slips or documents; no trademarks by default (flag, let the
user decide); no reflexive red arrow + shocked face — credibility over alarm; no emoji.
