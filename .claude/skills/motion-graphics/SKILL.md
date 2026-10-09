---
name: motion-graphics
description: Plan the picture of an edit in work/visual-plan.json — motion graphics (28 component types across six stage layouts that dock/shrink/dim the video), b-roll cutaways from Pexels/Pixabay, camera moves, a-roll framing for 9:16 — validate it, QA it with stills in both formats, and render it with Remotion. Use for any titles, charts, stats, lower thirds, diagrams, b-roll or zooms in a talking-head or faceless edit.
---

# motion-graphics — work/visual-plan.json

Graphics serve the speech: every beat shows what is being said **at that moment**. Variety is a
hard requirement — the template's first visual system was rejected as "very monotonous: a few text
visuals, a few screen partitions with graphics on the left, that's it." The edit must keep changing
shape: how the frame is divided, what kind of object appears, how it arrives.

## Plan shape (clean-cut times)

```json
{
  "style": "glass",                         // or "broadcast" (flat editorial). Default: project style
  "framing": { "9:16": "45% 40%" },         // a-roll crop per format (talking head)
  "rail": true,                             // chapter rail from chapter_open titles
  "overlays": [ { "start": 41.5, "duration": 3.8, "type": "chapter_open", "text": "What Is Swayam?", "eyebrow": "Section 01", "section": 1 } ],
  "brolls": [ { "start": 88.0, "duration": 3.4, "src": "assets/broll/empty-office.mp4", "media_start": 1, "motion": "pan_right", "grade": "cool", "transition": "fade", "reason": "over 'onboarding is not happening'" } ],
  "camera_moves": [ { "start": 250.2, "duration": 2.4, "kind": "punch_in", "scale": 1.12 } ],
  "caption_blackouts": [ { "start": 300, "end": 318 } ],
  "scenes": [ … faceless only, see edit-video-faceless … ]
}
```
Any item can carry `"only": "9:16"` (or `"16:9"`) to appear in one format.

## Six stage layouts — picked by the component, never set directly

| Layout | Frame (16:9) | Frame (9:16) | Components |
|---|---|---|---|
| `full` | video untouched | same | `keyword_chip`, `lower_third`, `side_note`, `annotation`, `marquee_strip`, `speed_hint`, `sample_answer` |
| `dock` | video card one side, graphic column the other (`side` = graphic side) | video card top, graphic strip below | `bar_chart`, `line_chart`, `donut_chart`, `progress_ring`, `step_progress`, `timeline`, `bullet_list`, `comparison`, `term_card` |
| `band` | video top 2/3, wide strip below | video top 42%, strip below | `fact_band` |
| `corner` | graphic owns frame, video small card | card top-right | `number_roll`, `stat_trio`, `flow_diagram`, `matrix_grid`, `checklist` |
| `takeover` | video dims + blurs behind full-frame type | same | `chapter_open`, `big_statement`, `word_swap`, `quote_pull`, `poll_prompt`, `title_slide` |

Alternate dock `side` between consecutive dock beats. Over a whole video no layout carries more than
~a third of the reframing beats.

## Component vocabulary — the exact fields each one reads (validated by `--check`)

**Takeover** (full stops of the edit)
- `title_slide` — `text` (title), `eyebrow`, optional `value` (big ghosted year), `style_hint` (subtitle). Readable at frame 0; plays over the first line.
- `chapter_open` — `text` (2-5 words), `eyebrow` ("Section 02"), optional `railLabel`, `numeral` ("" hides the ghost number). ≥3s; **nothing else in its window**.
- `big_statement` — `text` (<~8 words), `eyebrow` = ONE word of text to highlight.
- `word_swap` — `from`, `to`, optional `text` caption. Hinge moments only ("Certificate → Skill").
- `quote_pull` — `text` (the quote), `eyebrow` (attribution).
- `poll_prompt` — `text` (question), `items` [{label, value 0-100 = visual weight only}], `eyebrow`.

**Corner** (the graphic IS the content)
- `number_roll` — numeric `value`, `prefix`/`suffix`/`decimals`, `text` label. A phrase, not a figure? use `big_statement`.
- `stat_trio` — `items` [{label, sublabel (prefix e.g. "₹"), value (number)}] ×2-3.
- `flow_diagram` — `items` [{label, sublabel}] ×2-5, `text` heading. **Reach for it whenever a process/pipeline is described.**
- `matrix_grid` — `items` [{label}], `text`. Sets: tools, roles, vendors.
- `checklist` — `items` [{label, state: "yes"|"no"}], `text`. "Do this, not that".

**Dock** (all need `side`)
- `bar_chart` / `line_chart` / `donut_chart` — `items` [{label, value}], `text`.
- `progress_ring` — **`value`** 0-100 (not `current`), `text`.
- `step_progress` — `items` [{label}], **`current_step`** (number), `text`.
- `timeline` — `items` [{label, sublabel}], optional `current` index, `text`.
- `bullet_list` — `items` [{label}], `text`.
- `comparison` — **`left` and `right`** {label, text} — NOT `items` (blank cards otherwise).
- `term_card` — `text` (term), `eyebrow`, `items[0].label` (definition).

**Band** — `fact_band` — `items` [{label, sublabel}] ×2-3.

**Full-bleed marks** (never the centre where the face is; `side` left/right)
- `keyword_chip` — `text` (1-3 words) · `lower_third` — `text`, `eyebrow` · `side_note` — `text`
- `annotation` — `text`, `shape`: underline|circle|bracket (cheap and lively — use it often)
- `marquee_strip` — `text` (≤2 per video: the loudest object) · `speed_hint` — optional `text`
- `sample_answer` — `text` with `[placeholders]` and `\n` lines; holds still to be screenshotted;
  pair with a `caption_blackouts` span (the card already says it).

## Rules

- **Overlay text is short English** (native-script words live in the captions), ~15 chars/second,
  ≥1.5s on screen. Text-only types ≤ about half the plan; if content has a shape, draw the shape.
- **A beat every ~4-5s** (talking head) / ~3-4s (faceless); sustained graphics count for their length.
  Don't put the same component twice in a row (the motion repeats). Overlays don't overlap each other.
- A full-bleed mark never overlaps a reframing window (±0.62s) — the frame is mid-move.
- `section` (0-4) picks the accent colour; it follows the running chapter if omitted.
- **9:16**: the same plan renders portrait-aware (cards top, graphics between card and captions,
  everything inside Instagram's safe zone). Long text wraps more — keep it short, check the stills.

### B-roll cutaways (talking head)
- `npm run broll -- search <p> "literal visual phrase" --format 16:9|9:16` → **Read the thumbnails**
  (stock search returns wrong subjects/regions/watermarks) → `npm run broll -- get <p> provider:id --name slug`.
  English, concrete, filmable: "analyst studying financial charts", not "margins".
- 2.0-4.5s each; cut away to something the speaker **literally just named**; ≥8s apart, roughly one
  per 25-40s; never during takeover/corner/chapter_open (inside dock/band is fine — it plays in the
  card); don't reuse a query. `motion` ken_in|ken_out|pan_left|pan_right|static, `grade`
  neutral|cool|warm|noir|hot (carries the mood), `transition` fade|cut|whip|flash.

### Camera moves
`punch_in` (hard emphasis), `drift_in` (long explanation), `pull_out` (after a chapter opener),
`whip` (~0.8s into a new section). Scale 1.06-1.15, ~one per 20-30s of full-bleed time; moves that
collide with a reframing window are dropped automatically.

## QA loop (don't skip — a full render is minutes)

1. `npm run visuals -- <p> --check` until 0 errors (it names the exact missing/mis-named field).
2. `npm run visuals -- <p> --stills 3.2,41.8,…` at one moment per component family → Read
   `work/stills-16x9/*.png` and `work/stills-9x16/*.png`. Look for: empty components, text over the
   caption band, collisions, a face covered for long, off-centre 9:16 framing.
3. `npm run visuals -- <p>` (both formats), then the captions pass.
4. New component types go in `remotion/src/doc/overlays/` + the registry + `RULES` in
   `tools/render-visuals.mjs`; check them with `npm run gallery` (one still per type, both formats).
