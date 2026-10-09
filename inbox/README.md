# inbox — drop files here, then name them in your prompt

| Folder | Put here | Example prompt |
|---|---|---|
| `talking/` | raw clips of a person on camera | "edit video-1 — fast-paced, bold captions, upbeat music, Telugu" |
| `faceless/` | a script **and** its voiceover, named as a pair: `script-1.txt` (or `.md`/`.docx`) + `script-1-audio.mp3` (or `.wav`/`.m4a`) | "edit faceless using script-1 and script-1-audio — calm documentary style, Hindi" |
| `brand/` | optional intro/outro clips, only for videos where you want them | "…and add brand/acme-outro at the end" |

- Refer to files by name without the extension; a leading `/` is fine **inside** a sentence
  (a message that *starts* with `/` is a Claude Code command).
- Say the style you want in the prompt (pace, caption style, music mood, look, language, anything
  to avoid). Mention whose channel/brand it is only when it matters (titles, thumbnail, intro/outro).
- Files are linked into `projects/<name>/source/`, so you can clear the inbox once a video is done.
