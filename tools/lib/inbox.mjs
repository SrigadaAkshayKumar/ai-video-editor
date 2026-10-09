// The drop-off folder. The user puts files in inbox/ and refers to them by name in the prompt
// ("edit /video-1", "use /script-1 and /script-1-audio"); these helpers turn a name into a file.
//   inbox/talking/   raw clips of a person on camera
//   inbox/faceless/  scripts (script-1.txt|.md|.docx) + their voiceovers (script-1-audio.mp3|.wav|.m4a)
//   inbox/brand/     optional intro/outro clips for a client or channel (only when the user asks)
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { ROOT, die, run } from "./common.mjs";

export const INBOX = join(ROOT, "inbox");
export const MEDIA_EXT = [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"];
export const SCRIPT_EXT = [".txt", ".md", ".docx"];

const stem = (f) => basename(f, extname(f)).toLowerCase();

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (n.startsWith(".") || n.toLowerCase() === "readme.md") return [];
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/** All files waiting in the inbox. */
export const inboxFiles = () => walk(INBOX);

/**
 * Resolve "video-1", "/script-1-audio", "inbox/faceless/x.mp3" or an absolute path to a file.
 * `exts` narrows the match (e.g. media only, scripts only).
 */
export function resolveInput(ref, exts = null) {
  if (!ref) return null;
  const raw = String(ref).trim().replace(/^["']|["']$/g, "");
  for (const p of [raw, resolve(raw), join(ROOT, raw)]) if (existsSync(p) && statSync(p).isFile()) return resolve(p);
  // basename: "/script-1" may arrive mangled by Git Bash as "C:/Program Files/Git/script-1"
  const want = basename(raw.replace(/^[\\/]+/, "")).replace(/\.[a-z0-9]+$/i, "").toLowerCase();
  const hits = inboxFiles().filter((f) => stem(f) === want && (!exts || exts.includes(extname(f).toLowerCase())));
  if (hits.length > 1) die(`"${ref}" matches several inbox files: ${hits.map((h) => h.replace(ROOT, ".")).join(", ")} — use the full file name`);
  return hits[0] || null;
}

/**
 * For a voiceover named "<x>-audio" (or "<x>_audio", "<x> audio"), the script named "<x>".
 * Else, when the audio sits in its own folder (Crack_IT_Daily_Videos/d01/d01-voice.wav), that folder's
 * spoken-words file (*voiceover.txt / *vo.txt), or its only script.
 */
export function pairedScript(audioFile) {
  const s = stem(audioFile).replace(/[-_ ]?(audio|vo|voiceover|voice)$/i, "");
  const byName = inboxFiles().filter((f) => stem(f) === s && SCRIPT_EXT.includes(extname(f).toLowerCase()));
  if (byName.length === 1) return byName[0];
  const near = readdirSync(dirname(audioFile))
    .filter((n) => SCRIPT_EXT.includes(extname(n).toLowerCase()) && n.toLowerCase() !== "readme.md" && !n.startsWith("."))
    .map((n) => join(dirname(audioFile), n));
  const spoken = near.filter((f) => /[-_ ](voiceover|vo)$/i.test(stem(f)));
  if (spoken.length === 1) return spoken[0];
  return near.length === 1 ? near[0] : null;
}

/** The screen-direction script next to a spoken-words file (d01_x_voiceover.txt → d01_x_script.md), if any. */
export function directionScript(scriptFile) {
  if (!scriptFile || !/[-_ ](voiceover|vo)$/i.test(stem(scriptFile))) return null;
  const base = stem(scriptFile).replace(/[-_ ](voiceover|vo)$/i, "");
  const hit = readdirSync(dirname(scriptFile)).find((n) => SCRIPT_EXT.includes(extname(n).toLowerCase()) && stem(n) === `${base}_script`);
  return hit ? join(dirname(scriptFile), hit) : null;
}

/** Plain text of a script file (.txt / .md / .docx). */
export function readScript(file) {
  const ext = extname(file).toLowerCase();
  if (ext === ".txt" || ext === ".md") return readFileSync(file, "utf8").replace(/^﻿/, "");
  if (ext === ".docx") {
    // A .docx is a zip; Windows 10+ tar reads zip. Paragraphs end at </w:p>.
    const tmp = mkdtempSync(join(tmpdir(), "docx-"));
    try {
      run("tar", ["-xf", file, "-C", tmp, "word/document.xml"]);
      const xml = readFileSync(join(tmp, "word", "document.xml"), "utf8");
      return xml
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<w:br\/>/g, "\n")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  die(`can't read ${basename(file)} — save the script as .txt, .md or .docx`);
}
