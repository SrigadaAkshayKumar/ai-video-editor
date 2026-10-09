---
name: captions
description: Generate and style word-synced captions (Telugu, Hindi, English, code-mixed) as the HyperFrames captions pass over each format's Remotion picture, fix caption text, black captions out under on-screen text, and check caption content at every cut join. Use when creating, restyling, correcting or repositioning captions in any edit.
---

# captions

`npm run captions -- <p> [--format 9:16] [--style pop|clean|karaoke] [--max-words N] [--position bottom|middle] [--accent "#hex"] [--uppercase]`

Writes `edit-<fmt>/compositions/captions.html` for every format (or just `--format`) from
`work/cleancut.words.json` (already on the clean-cut timeline). `style`, `accent` and `uppercase` are
shared by all formats (one brand look); `max-words` and `position` are per format — pass them with
`--format`. Everything is remembered in `project.json → captions`, so re-running with no flags keeps
it. The scaffold already mounts the captions (`<div id="captions" … data-track-index="4">`).

Defaults: bottom band in both formats — **16:9** 5 words, 64px · **9:16** 3 words, 76px at y≈1348,
inside Instagram's safe zone. The Remotion graphics keep clear of exactly this band (CAPTION_SAFE_Y in
`remotion/src/doc/theme.ts`), so captions and graphics never collide by construction.

`npm run scaffold -- <p>` builds the captions pass over `work/visuals-<fmt>.mp4` and generates the
captions; re-run `npm run captions` alone to restyle.

## Choosing a style

| Content | Style | Words/group |
|---|---|---|
| Shorts / reels, energetic, hooks | `pop` (white, thick outline, active word in accent, word bounce) | 2–3 |
| Educational / interview / long-form | `clean` (dark pill, accent on active word) | 4–6 |
| Story / calm / music-led | `karaoke` (dim → white fill as words are spoken) | 3–5 |

Accent = the brand colour from the brief, else `#FFD400`. Use `--uppercase` only for English-only
videos (no effect on Indic scripts).

## Text corrections

Never hand-edit the generated HTML. Fix words at the source:
- Add `"textFixes": { "<raw word id>": "Correct" }` to `work/edl.json` and re-run `npm run cut` then
  `npm run scaffold` (refresh) — raw ids are the `src` field in `work/cleancut.words.json`.
- Common fixes: brand/person names, English words the ASR wrote in Telugu/Devanagari script when the
  user wants them in Latin (or vice versa), casing at the start of a sentence after a cut, numbers
  (`ఇరవై` → `20` when it reads better).

## Scripts and fonts

Telugu (Noto Sans Telugu), Devanagari (Noto Sans Devanagari) and Latin (Poppins) fonts ship as
woff2 in each `edit-<fmt>/assets/fonts/` and are declared in both `index.html` and the captions template — the
renderer has no system fonts. If you add a new font anywhere, it needs its own `@font-face` with a
local woff2, or lint fails with `font_family_without_font_face`.

Indic words are long: in 9:16 keep `--max-words` ≤ 3; the generator also caps characters per group.

## Blackouts

When a card already shows the words (`sample_answer`, a full-screen quote being read), add
`"caption_blackouts": [{ "start", "end" }]` to `work/visual-plan.json` and re-run `npm run captions`.
Words inside are dropped and any hole ends a caption group, so no line spans the card (the template's
"word before the hole + word after it" garbage line).

## Check the joins

`npm run verify -- <p>` grabs a frame just after every cut. Read the sheet: each caption must be a real
fragment of one sentence. A splice of two different takes in one line is a content bug no linter sees.
One caption group is visible at a time; groups hold through short pauses and never overlap.

`npm run captions` marks the stage done.
