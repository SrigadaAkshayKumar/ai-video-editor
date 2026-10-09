---
name: sfx
description: Design the sound effects of an edit in work/audio-plan.json sfx_events — which effect, where, how often — using the measured SFX library (repo assets/sfx, HyperFrames' bundled set, CC0 fetches from Openverse) and the spectral rule that sub-band cues carry structure while vocal-band cues are rationed. Mixed and levelled by tools/mix.mjs. Use when adding or adjusting SFX in any edit.
---

# sfx — work/audio-plan.json → sfx_events

```json
{ "sfx_events": [ { "time": 19.8, "sfx": "sub_drop", "reason": "dock-in for the checklist cluster at 20.3" },
                  { "time": 24.2, "sfx": "impact", "gain": 0.8, "reason": "big_statement 'On paper, the jobs exist'" } ] }
```
Clean-cut times. `sfx` is a NAME (`npm run sfx -- list [<p>]` shows them all with length and band).
`gain` can only push a cue further DOWN. Levels are **measured**, not chosen: every effect lands
~14 dB under this narration with a peak ceiling, a short-transient floor and a length trim
(`tools/mix.mjs`, see `work/levels.json`). Never "fix" a level by guessing a gain.

## The one rule: impact, not irritation

The template measured it: dialogue is ~81% in 300-3400 Hz. A cue that lives ON the voice
(`whoosh`, `pop`, `click`, `ding`) competes with every word however quiet; a cue that lives UNDER it
(`sub_drop`, `impact`, `riser`: 74-100% below 120 Hz here) is felt and never masks speech. Its noisy
swipe was not fixed by turning it down — it was replaced by a sub-band cue. So:

**Sub-band — carries the structure**
- `sub_drop` — the reframe cue: ~0.5s before the FIRST overlay of a dock/corner/band cluster, and
  once at the cluster's end. One pair per CLUSTER, never one per chart.
- `impact` — lands a punchline: `big_statement`/`word_swap`, only the ~6-8 real turning points.
- `riser` (1.7s) — builds INTO a `chapter_open`: start = chapter start − 1.5s. ≤4-5 per video.
- also: `impact-bass-1/2`, `whoosh-cinematic` (HyperFrames set).

**Vocal-band — rationed**
- `pop`, `click` — an individual reveal inside a cluster, a `keyword_chip`/`annotation`. Leave many reveals silent.
- `ding` — a checklist "yes" / resolved point, a handful at most.
- `whoosh` — movement only (a `whip`/`flash` b-roll entry), never within ~6s of another whoosh.
- `typing` — only under a `term_card` or code reveal. `clock_tick`, `glitch`, `reveal` — when the moment literally is that.

Need something else? `npm run sfx -- fetch <p> <name> ["literal query"]` pulls a CC0 one-shot from
Openverse; then `npm run sfx -- list <p>` to see its band before using it. Keep the whole video to
**6-10 distinct effects**.

## Placement

- Never two cues within 0.35s; never the same cue within ~4s; no single effect over ~a third of all
  cues (it becomes a tic — `mix.mjs` warns).
- **Movement cues follow the picture, accent cues follow meaning.** One cue per moment — never a
  swipe and a whoosh on the same transition.
- No SFX inside a `chapter_open` window except the riser into it. **No SFX on the payoff line itself**
  — land the line dry, put the cue on the graphic after it.
- Budget: ~1 cue per 8-10s (talking head), ~1 per 4-6s clustered (faceless: dense in a montage,
  near-silent under a long calm explanation). If a cue sits on more than ~half the overlays, cut back.

`npm run mix -- <p>` builds `work/mix.wav` (finalize re-mixes automatically when the plan changes).
You cannot hear it — tell the user to listen for SFX that land wrong or grate.
