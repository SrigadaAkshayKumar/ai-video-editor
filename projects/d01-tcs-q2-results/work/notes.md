# d01 — TCS Q2 FY27 results (paused 2026-10-08, user: "collect stock footage, don't render, I'll tell you later")

Settings (project.json): blueprint, 16:9, no captions, Crack IT intro after the hook (introAt not set yet), SFX, no BGM (not asked).

## Done
- transcribe (whisper small.en): whole script spoken, no re-reads, no dropped lines. A prompt-free pass (noprompt/text.txt)
  confirms T.C.S. / A.I. read correctly. TTS runs paragraphs together (no silence ≥0.8s).
- edl.json written; `cut --dry-run` only. Gap auto-picks (raw s): 25.50, 72.46, 105.28, 136.21, 193.38, 237.04.
  NOT yet verified by STT either side — 72.46 is 0.67s after whisper's "more" end ("matter more | number one" is run
  together): bisect it before the real cut. introAt = the gap after w87 ("…joining letters this month.").
- News captures (all read, all OK): BT results + BT headcount (both Oct 8 2026, 5:31 PM), BT fresher 25k (Apr 13 2026),
  TCS press release (headline only, "International Growth and Strategic Wins Underpin TCS' Q2").
  Highlights (fractions of desktop shot): BT headline y≈0.105 h≈0.04 x≈0.073 w≈0.63; BT standfirst y≈0.15 h≈0.02;
  BT fresher quote para y≈0.575 h≈0.03; TCS headline x 0.13 y 0.105 w 0.7 h 0.065.
- Stock (assets/broll, Pixabay, credits.json): stock-chart (hook), results-meeting, crowd-above (headcount),
  office-floor, desk-work, laptop-keys (NextStep login), phone-hands (check email), waiting (still waiting),
  celebrate / celebrate-back (got JL), corridor / office-corridor (onboarding waves),
  empty-chairs (multi-shot: empty dark room ~5s, red chairs from ~13.5s — use media_start 13.5, ≤3.5s).

## Verified figures (for on-screen numbers)
| Figure | Value | Source |
|---|---|---|
| Revenue | ₹73,188 cr, +11.22% YoY | Business Today, Oct 8 2026 |
| CC growth | +0.5% QoQ, +2.8% YoY | Investing.com earnings-call / slides, Oct 8 2026 |
| Operating margin | 24% (flat QoQ) | BT / Investing.com |
| Net profit | ₹13,934 cr, +14.86% YoY | BT |
| TCV | $9.6 bn | BT |
| AI revenue | $3.1 bn annualised, >10% of revenue | BT |
| Headcount | 5,98,056, +4,258 QoQ, 3rd straight quarter of addition | BT headcount article |
| Headcount history | Q3 FY26 5,82,163 · Q4 FY26 5,84,519 (+2,356) · Q1 FY27 5,93,798 (+9,279) · Q2 FY27 5,98,056 | Outlook Business / Zee Biz (Q1), BT |
| Attrition (LTM, IT services) | 13.3% vs 13.6% | BT headcount article |
| Fresher offers FY27 | 25,000; "Clarity on demand will lead to more hiring" — K Krithivasan (to PTI) | BT, Apr 13 2026 |
| FY26 fresher hires | 44,000+ (reported) | BT, Apr 13 2026 |
| Joining letters, DOJ 15 Oct, NextStep | candidate reports only — label "Candidate update, not official" | — |

## Next (when the user says go)
verify splits → `npm run cut` → direction.json → build-plan.mjs (pattern: projects/walkin/work/build-plan.mjs, chapters:
HOOK · headline numbers · 01 headcount · 02 attrition · 03 hiring (turn: 25k vs 44k) · joining letters · wrap-up/CTA)
→ `visuals --check` + stills → audio-plan (SFX only) → visuals → mix → finalize → verify.
Script components with no repo type: CommentCard (use quote_pull/side_note labelled "Candidate report"), EndScreen
(lower_third "Tomorrow: TCS AI engineers" + subscribe big_statement). Narration says "next six minutes"; the cut is ~4.5 min.
