#!/usr/bin/env bash
# Every video already on YouTube (config/youtube-scheduled, the ledger in git), one line each: project slug and title.
# Put into the script steps' prompts, so a new episode never repeats a covered topic, even when Drive was emptied.
for f in config/youtube-scheduled/*.json; do
  node -e 'const j=require("./"+process.argv[1]); const v=(j.videos||[])[0]||{};
    console.log(`- ${j.project} (${(v.publishAt||"").slice(0,10)})${v.title ? ": " + v.title : ""}`)' "$f"
done
