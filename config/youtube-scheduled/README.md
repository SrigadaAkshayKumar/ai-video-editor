What is already scheduled on YouTube, one file per project (main video publish times only, no video ids). Written by
`tools/youtube.mjs` on every upload and committed by the workflows; the queue (`--queue`, `--longform-slot`) reads it
together with the `youtube-uploaded.json` files on Drive, so emptying Drive no longer makes a run reuse a taken day.
Seeded by hand on 2026-11-17 (`lf08` is long-form 08; its project folder name was lost with the Drive cleanup).
