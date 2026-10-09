"""Step 1: take a finished edit from the AI-edits projects/ folder (or any video) and transcribe it.

Usage:
    python pipeline/transcribe.py <project>                       # projects/<project>, clean source (default)
    python pipeline/transcribe.py <part1> <part2> <part3> --slug <name>   # parts of one long video, joined
    python pipeline/transcribe.py <project> --from final          # output/final-16x9.mp4 + Whisper
    python pipeline/transcribe.py <joined-name> --lang te         # ../output/<name>-16x9.mp4 (npm run join) + Whisper
    python pipeline/transcribe.py path/to/video.mp4 --lang te     # any other file + Whisper

Sources (an AI-edits project is ../projects/<project>):
    clean  (default) work/visuals-<fmt>.mp4 + work/master.wav: the finished picture and loudness master
           WITHOUT the burned-in captions and intro/outro, so the Shorts' own captions don't double up.
           Words come from work/cleancut.words.json (already on that timeline): no Whisper run.
    final  output/final-<fmt>.mp4 exactly as delivered (burned captions, bumpers), transcribed by Whisper.

Creates jobs/<slug>/ containing:
    meta.json        source video info (duration, size, fps, language, where it came from)
    source.mp4       the video clips are cut from (projects only; a plain file is used in place)
    audio.wav        16 kHz mono audio (Whisper runs only)
    transcript.json  segments + word-level timestamps (used for cutting/captions)
    transcript.txt   timestamped, human/Claude-readable transcript
    transcript.srt   subtitles for the whole video
"""

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EDITOR = ROOT.parent  # the AI-edits repo this clipper lives in
PROJECTS = EDITOR / "projects"
LANGS = ("en", "te", "hi")

# small is good enough for English; Telugu/Hindi need a bigger model on Whisper.
DEFAULT_MODEL = {"en": "small", "te": "medium", "hi": "medium"}

SEG_GAP = 0.7  # a pause this long (s) starts a new transcript line
SEG_MAX_WORDS = 20


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
    return slug or "video"


def probe(video: Path) -> dict:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate:format=duration",
            "-of", "json", str(video),
        ],
        capture_output=True, text=True, check=True,
    )
    info = json.loads(out.stdout)
    stream = info["streams"][0]
    num, den = stream["r_frame_rate"].split("/")
    return {
        "width": int(stream["width"]),
        "height": int(stream["height"]),
        "fps": round(float(num) / float(den), 3),
        "duration": float(info["format"]["duration"]),
    }


def fmt_ts(sec: float, srt: bool = False) -> str:
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    if srt:
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
    return f"{int(h):02d}:{int(m):02d}:{s:04.1f}" if h else f"{int(m):02d}:{s:04.1f}"


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-y", "-v", "error", *args], check=True)


def editor_project(name: str) -> Path | None:
    d = PROJECTS / name.strip("/\\")
    return d if (d / "project.json").exists() else None


def concat(parts: list[Path], out: Path) -> None:
    """Stream-copy join (every part comes out of the same pipeline with the same settings)."""
    lst = out.with_suffix(".txt")
    lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    ffmpeg("-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", "-movflags", "+faststart", str(out))
    lst.unlink()


def clean_part(pdir: Path, fmt: str, out: Path) -> list[dict]:
    """Mux one project's caption-free picture with its master; return its words on that timeline."""
    work = pdir / "work"
    video, audio, words = work / f"visuals-{fmt}.mp4", work / "master.wav", work / "cleancut.words.json"
    missing = [f.name for f in (video, audio, words) if not f.exists()]
    if missing:
        sys.exit(f"{pdir.name}: {', '.join(missing)} missing. Finish the edit first (npm run finalize -- {pdir.name}),"
                 " or use --from final.")
    stale = [f.name for f in (video, audio) if f.stat().st_mtime < words.stat().st_mtime]
    if stale:
        print(f"  WARNING {pdir.name}: {', '.join(stale)} older than the clean cut; re-run visuals/finalize if it was re-cut")
    ffmpeg("-i", str(video), "-i", str(audio), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(out))
    data = json.loads(words.read_text(encoding="utf-8"))
    return [w for w in data if w.get("type", "word") == "word" and w.get("text", "").strip()]


def words_to_segments(words: list[dict]) -> list[dict]:
    """Group editor words ({text,start,end}) into transcript lines in this tool's segment format."""
    segments, cur = [], []

    def flush() -> None:
        if cur:
            segments.append({
                "id": len(segments),
                "start": cur[0]["s"],
                "end": cur[-1]["e"],
                "text": "".join(w["w"] for w in cur).strip(),
                "words": list(cur),
            })
            cur.clear()

    for w in words:
        word = {"w": " " + w["text"].strip(), "s": round(w["start"], 3), "e": round(w["end"], 3), "p": None}
        if cur and (word["s"] - cur[-1]["e"] > SEG_GAP or len(cur) >= SEG_MAX_WORDS
                    or (len(cur) >= 3 and re.search(r"[.?!।]$", cur[-1]["w"]))):
            flush()
        cur.append(word)
    flush()
    return segments


def whisper_segments(audio: Path, lang: str, model_name: str, duration: float) -> list[dict]:
    from faster_whisper import WhisperModel

    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments_iter, _ = model.transcribe(
        str(audio),
        language=lang,
        word_timestamps=True,
        vad_filter=True,
        beam_size=5,
        condition_on_previous_text=False,  # reduces repetition loops on long files
    )
    started = time.time()
    segments = []
    for seg in segments_iter:
        words = [
            {"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)}
            for w in (seg.words or [])
        ]
        segments.append({
            "id": len(segments),
            "start": round(seg.start, 3),
            "end": round(seg.end, 3),
            "text": seg.text.strip(),
            "words": words,
        })
        pct = min(100, seg.end / duration * 100)
        print(f"\r      {pct:5.1f}%  ({time.time() - started:.0f}s elapsed)", end="", flush=True)
    print()
    return segments


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("targets", nargs="+", help="AI-edits project name(s), a joined output name, or a video file")
    ap.add_argument("--from", dest="source", choices=["clean", "final"], default="clean",
                    help="projects: clean = no burned captions/bumpers (default), final = the delivered mp4")
    ap.add_argument("--format", default="16x9", choices=["16x9", "9x16"], help="which edit format to clip from")
    ap.add_argument("--lang", choices=LANGS, help="default: the project's language (required for plain files)")
    ap.add_argument("--model", help="tiny|base|small|medium|large-v3 (default depends on --lang)")
    ap.add_argument("--whisper", action="store_true", help="re-transcribe with Whisper even for a clean source")
    ap.add_argument("--slug", help="job folder name (default: project / file name)")
    args = ap.parse_args()

    projects = [editor_project(t) for t in args.targets]
    if any(projects) and not all(projects):
        sys.exit("Mix of project names and files: pass only AI-edits project names, or one video file.")
    if not all(projects) and len(args.targets) > 1:
        sys.exit(f"Not AI-edits projects: {', '.join(t for t, p in zip(args.targets, projects) if not p)}")
    if len(args.targets) > 1 and not args.slug:
        sys.exit("Several parts: name the job with --slug <name>.")

    origin: dict = {}
    words = None
    if all(projects):
        langs = {json.loads((p / "project.json").read_text(encoding="utf-8")).get("language") for p in projects}
        lang = args.lang or (langs.pop() if len(langs) == 1 else None)
        if lang not in LANGS:
            sys.exit(f"Project language is {lang!r}: pass --lang {'|'.join(LANGS)}.")
        slug = args.slug or slugify(projects[0].name)
        job = ROOT / "jobs" / slug
        job.mkdir(parents=True, exist_ok=True)
        video = job / "source.mp4"
        origin = {"projects": [p.name for p in projects], "from": args.source, "format": args.format}
        print(f"[1/3] {len(projects)} project(s), {args.source} {args.format} source -> jobs/{slug}/source.mp4")
        if args.source == "clean":
            parts = [video] if len(projects) == 1 else [job / f"part-{i + 1}.mp4" for i in range(len(projects))]
            words, offset = [], 0.0
            for p, part in zip(projects, parts):
                for w in clean_part(p, args.format, part):
                    words.append(w | {"start": w["start"] + offset, "end": w["end"] + offset})
                offset += probe(part)["duration"]
            if len(parts) > 1:
                concat(parts, video)
                for part in parts:
                    part.unlink()
        else:
            finals = [p / "output" / f"final-{args.format}.mp4" for p in projects]
            missing = [str(f) for f in finals if not f.exists()]
            if missing:
                sys.exit("Not rendered yet:\n  " + "\n  ".join(missing))
            if len(finals) > 1:
                concat(finals, video)
            else:
                ffmpeg("-i", str(finals[0]), "-c", "copy", str(video))
    else:
        target = args.targets[0]
        joined = EDITOR / "output" / f"{target}-{args.format}.mp4"
        video = joined if joined.exists() else Path(target).resolve()
        if not video.exists():
            sys.exit(f"Not found: no project {PROJECTS / target}, no {joined}, no file {video}")
        if not args.lang:
            sys.exit("A plain video file needs --lang en|te|hi.")
        lang = args.lang
        slug = args.slug or slugify(video.stem)
        job = ROOT / "jobs" / slug
        job.mkdir(parents=True, exist_ok=True)
        print(f"[1/3] {video}")

    use_whisper = words is None or args.whisper
    model_name = (args.model or DEFAULT_MODEL[lang]) if use_whisper else "ai-edits cleancut.words.json"
    meta = probe(video) | {"source": str(video), "slug": slug, "language": lang, "model": model_name} | origin
    (job / "meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"      {meta['width']}x{meta['height']} @ {meta['fps']}fps, {meta['duration'] / 60:.1f} min")

    if use_whisper:
        audio = job / "audio.wav"
        print("[2/3] Extracting audio...")
        ffmpeg("-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(audio))
        print(f"[3/3] Transcribing with Whisper '{model_name}' ({lang}) on CPU, this takes a while...")
        segments = whisper_segments(audio, lang, model_name, meta["duration"])
    else:
        print("[2/3] Reusing the edit's word timestamps (no Whisper run)")
        segments = words_to_segments(words)
        print(f"[3/3] {sum(len(s['words']) for s in segments)} words")

    (job / "transcript.json").write_text(
        json.dumps({"language": lang, "duration": meta["duration"], "segments": segments}, ensure_ascii=False),
        encoding="utf-8",
    )
    (job / "transcript.txt").write_text(
        "\n".join(f"[{fmt_ts(s['start'])} - {fmt_ts(s['end'])}] {s['text']}" for s in segments),
        encoding="utf-8",
    )
    (job / "transcript.srt").write_text(
        "\n\n".join(
            f"{i + 1}\n{fmt_ts(s['start'], True)} --> {fmt_ts(s['end'], True)}\n{s['text']}"
            for i, s in enumerate(segments)
        ),
        encoding="utf-8",
    )
    print(f"Done: {len(segments)} segments -> jobs/{slug}/transcript.txt")


if __name__ == "__main__":
    main()
