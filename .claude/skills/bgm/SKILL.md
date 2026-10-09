---
name: bgm
description: Choose, fetch and place background music for an edit — Openverse search (commercial-use CC, or CC0-only), music_cues in work/audio-plan.json with fades, offsets and a deliberate silence gap; tools/mix.mjs conditions every bed, sets it to one measured house level under the voice and sidechain-ducks it. Use when adding, swapping or re-levelling music.
---

# bgm — work/audio-plan.json → music_cues

```json
{ "music_cues": [
    { "start": 0.0, "end": 46.2, "file": "assets/music/cold-tension.mp3", "gain_rel": 1.0,
      "fade_in": 0.8, "fade_out": 2.5, "music_start": 12.0, "mood": "cold tension" },
    { "start": 52.0, "end": 180.0, "file": "assets/music/cold-tension.mp3", "music_start": 60, "gain_rel": 0.9, "mood": "explainer bed" } ] }
```

## Levels are measured — don't hand-tune them

`tools/mix.mjs` runs every bed through `dynaudnorm` (flattens the track's own 15 dB swings — the
cause of "negligible at the start, dominant at the end"), puts it **9 dB under the narration**
(mean-to-mean; 20 dB read "negligible", 6.5 dB "dominant"), then **sidechain-ducks** it against the
voice. `gain_rel` trims around that house level (1.0 = house; 1.2-1.3 for a bed that should punch at
the peak; 0.8 to sit back). Measured numbers land in `work/levels.json`.

## House policy (user, 2026-10-04)

- Music only when the prompt asks for it (the user says so at the start of the prompt). Default: none.
- **CC0 only** — always `--cc0`. These videos go to YouTube: no CC BY / BY-SA, no attribution strings,
  no claim risk (same reason stock comes only from Pexels/Pixabay). Nothing usable in CC0 → say so and
  offer no music; never fall back to BY.
- **SFX must cut through the bed.** In talking-head-sample the bed (9 dB under the voice) drowned the
  SFX (~14 dB under). With music, sit the bed lower and dip it around each cue; check `work/levels.json`.

## Choosing music

1. Mood from the brief/direction: tech/tutorial → `corporate`, `technology`, `lofi`, `minimal`;
   motivational → `upbeat`, `inspiring`; vlog → `acoustic`, `chill`; story → `piano`, `cinematic`;
   hype → `energetic`, `electronic`; Indian flavour → `indian`, `sitar`, `tabla`.
2. `npm run bgm -- search <p> "upbeat corporate" [--min 60] [--cc0]` — 1-3 generic words.
   Default licences allow commercial use (CC0/BY/BY-SA; **BY needs the credit line**); `--cc0` =
   no attribution at all, smaller pool (try `--source jamendo,ccmixter,freesound`).
3. **Titles lie.** The template got a vinyl-crackle texture for "warm nostalgia" and an alarm patch for
   "low tension". Pick by title + tags + duration; reject textures/field recordings; instrumental only.
4. `npm run bgm -- get <p> <id> --name slug` → `assets/music/slug.mp3` (+ credit).
5. Check every cue: track length ≥ `music_start` + (end − start), else it runs out.

## Placement

- **One bed at a time**: cues don't overlap; at a mood change end one and start the next at the same
  time (fades cross). 3-5 distinct moods for a whole long video; re-use a bed at another `music_start`
  rather than adding a mood that returns junk.
- A bed change is an event: put it at a turn, not at a chapter heading.
- **Leave one deliberate silence**: no bed under the single most important line — the strongest
  emphasis available. `fade_out` 0.4s into that gap; otherwise fades 0.6-1.2s in, 2-3s out (2-3s in
  when a bed creeps under a calm passage).
- Talking head: one bed is often enough; dense fast speech can take `gain_rel` 0.8.
- The template's last documentary dropped music entirely after the viewer called it "distracting" —
  presence, not just level. If the user says the bed is too much, offer removing it.

## Credits

`npm run finalize` writes `output/credits.md`; CC BY / BY-SA lines **must** go in the YouTube
description and Instagram caption — say so. You cannot hear the bed: ask the user to listen.
