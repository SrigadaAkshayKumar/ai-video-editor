#!/usr/bin/env node
// List what is waiting in inbox/ and how faceless scripts pair with their voiceovers.
// Usage: node tools/inbox.mjs
import { basename, extname, relative } from "node:path";
import { ROOT, probe } from "./lib/common.mjs";
import { MEDIA_EXT, SCRIPT_EXT, inboxFiles, pairedScript } from "./lib/inbox.mjs";

const files = inboxFiles();
if (!files.length) console.log("inbox is empty — drop clips in inbox/talking/, scripts + voiceovers in inbox/faceless/");
for (const f of files) {
  const ext = extname(f).toLowerCase();
  const rel = relative(ROOT, f).split("\\").join("/");
  if (MEDIA_EXT.includes(ext)) {
    const info = probe(f);
    const kind = info.width ? `video ${info.width}x${info.height}` : "audio";
    const pair = !info.width || /faceless/.test(rel) ? pairedScript(f) : null;
    console.log(`${rel}  — ${kind}, ${info.duration.toFixed(1)}s${pair ? `  ↔ script ${basename(pair)}` : ""}`);
  } else if (SCRIPT_EXT.includes(ext)) console.log(`${rel}  — script`);
  else console.log(`${rel}  — (unsupported type; scripts must be .txt/.md/.docx)`);
}
