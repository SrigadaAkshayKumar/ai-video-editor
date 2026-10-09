"""Step 3: turn jobs/<slug>/clips.json (written by Claude) into render-ready clips.

Usage:
    python pipeline/prepare.py <slug>                  # framing from clips.json
    python pipeline/prepare.py <slug> --framing blur   # override framing for every clip
    python pipeline/prepare.py <slug> --only 1,3       # only some clips

For each clip it:
  * snaps segment boundaries to whole words (never cuts mid-word),
  * cuts + joins the segments from the source with ffmpeg -> jobs/<slug>/public/clip_XX.mp4,
  * refuses plans where a clip is over 70 s or reuses source footage (across or within clips),
  * builds word-level captions re-timed to the clip,
  * (framing=track) detects the speaker's face and writes a smoothed crop path,
  * writes Remotion props -> jobs/<slug>/props/clip_XX.json
"""

import argparse
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRAMINGS = ("black", "blur", "center", "track")
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
YUNET_PATH = ROOT / "models" / "face_detection_yunet_2023mar.onnx"

LEAD_IN = 0.12   # seconds kept before the first word
TAIL = 0.30      # seconds kept after the last word
MAX_LEN = 70  # hard cap only: clips run their natural length, usually 30-40 s
MIN_LEN = 15  # below this a clip is probably a fragment, not a moment (warning only)
OVERLAP_TOLERANCE = 0.5  # seconds two clips may share at a boundary (word padding)


def load_words(transcript: dict) -> list[dict]:
    return [w for seg in transcript["segments"] for w in seg["words"]]


def snap_segment(start: float, end: float, words: list[dict], duration: float) -> tuple[float, float]:
    """Move start/end outward so no word is cut, without swallowing neighbouring words."""
    inside = [i for i, w in enumerate(words) if w["e"] > start and w["s"] < end]
    if not inside:
        return max(0.0, start), min(duration, end)
    first, last = inside[0], inside[-1]
    prev_end = words[first - 1]["e"] if first > 0 else 0.0
    next_start = words[last + 1]["s"] if last + 1 < len(words) else duration
    s = max(prev_end, words[first]["s"] - LEAD_IN, 0.0)
    e = min(next_start, words[last]["e"] + TAIL, duration)
    return round(s, 3), round(e, 3)


def build_captions(segments: list[tuple[float, float]], words: list[dict]) -> list[dict]:
    captions, offset = [], 0.0
    for s, e in segments:
        for w in words:
            if w["s"] >= s - 0.02 and w["e"] <= e + 0.02:
                text = w["w"].strip()
                if not text:
                    continue
                # Whisper splits numbers like "20" ",000" / "50" "%": glue them back on.
                if captions and re.match(r"^[,.%']|^\d", text) and re.search(r"\d$", captions[-1]["text"]):
                    captions[-1]["text"] += text
                    captions[-1]["endMs"] = round((min(w["e"], e) - s + offset) * 1000)
                    continue
                captions.append({
                    "text": " " + text,
                    "startMs": round((max(w["s"], s) - s + offset) * 1000),
                    "endMs": round((min(w["e"], e) - s + offset) * 1000),
                    "timestampMs": None,
                    "confidence": w.get("p"),
                })
        offset += e - s
    return captions


def find_overlaps(clip_segments: dict[int, list[tuple[float, float]]]) -> list[str]:
    """No source second may appear twice: not in two clips, not twice inside one clip."""
    spans = sorted((s, e, cid) for cid, segs in clip_segments.items() for s, e in segs)
    problems = []
    for i, (s1, e1, c1) in enumerate(spans):
        for s2, e2, c2 in spans[i + 1:]:
            if s2 >= e1 - OVERLAP_TOLERANCE:
                break
            shared = min(e1, e2) - s2
            where = f"clip {c1} repeats" if c1 == c2 else f"clips {c1} and {c2} repeat"
            problems.append(f"{where} {s2:.1f}-{min(e1, e2):.1f}s of the source ({shared:.1f}s)")
    return problems


def cut_clip(source: str, segments: list[tuple[float, float]], out: Path) -> None:
    cmd = ["ffmpeg", "-y", "-v", "error"]
    for s, e in segments:
        cmd += ["-ss", f"{s:.3f}", "-t", f"{e - s:.3f}", "-i", source]
    n = len(segments)
    chains = "".join(
        f"[{i}:v:0]setpts=PTS-STARTPTS,format=yuv420p[v{i}];[{i}:a:0]asetpts=PTS-STARTPTS[a{i}];" for i in range(n)
    )
    joined = "".join(f"[v{i}][a{i}]" for i in range(n))
    cmd += [
        "-filter_complex", f"{chains}{joined}concat=n={n}:v=1:a=1[v][a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "17",
        "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(out),
    ]
    subprocess.run(cmd, check=True)


def track_face(clip: Path, samples_per_sec: float = 5.0) -> list[dict]:
    """Return [{t, x}] where x is the normalised horizontal centre of the main speaker."""
    import cv2
    import numpy as np

    if not YUNET_PATH.exists():
        YUNET_PATH.parent.mkdir(exist_ok=True)
        print("      downloading face detection model...")
        urllib.request.urlretrieve(YUNET_URL, YUNET_PATH)

    cap = cv2.VideoCapture(str(clip))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    step = max(1, round(fps / samples_per_sec))
    detector = None
    raw: list[tuple[float, float | None]] = []
    prev_x = 0.5
    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % step == 0:
            h, w = frame.shape[:2]
            scale = 640 / w
            small = cv2.resize(frame, (640, round(h * scale)))
            if detector is None:
                detector = cv2.FaceDetectorYN.create(str(YUNET_PATH), "", (small.shape[1], small.shape[0]), 0.6)
            _, faces = detector.detect(small)
            x = None
            if faces is not None and len(faces):
                # Prefer big faces, and faces close to where we already are (stability).
                def score(f):
                    cx = (f[0] + f[2] / 2) / small.shape[1]
                    return f[2] * f[3] * (1.0 - 0.5 * abs(cx - prev_x))
                best = max(faces, key=score)
                x = float((best[0] + best[2] / 2) / small.shape[1])
                prev_x = x
            raw.append((idx / fps, x))
        idx += 1
    cap.release()

    if not raw:
        return [{"t": 0, "x": 0.5}]

    # Fill gaps (no face found) with the nearest known value.
    xs = [x for _, x in raw]
    known = [x for x in xs if x is not None]
    last = known[0] if known else 0.5
    for i, x in enumerate(xs):
        if x is None:
            xs[i] = last
        else:
            last = x

    # Median filter kills single-frame false detections.
    arr = np.array(xs)
    med = np.array([np.median(arr[max(0, i - 2): i + 3]) for i in range(len(arr))])

    # Smooth camera with a hard cut when the speaker jumps (shot change / other person).
    out, cam = [], med[0]
    for i, (t, _) in enumerate(raw):
        target = med[i]
        jump = abs(target - cam) > 0.2 and i + 1 < len(med) and abs(med[i + 1] - cam) > 0.2
        if jump:
            cam = target
        elif abs(target - cam) > 0.03:  # dead zone: ignore tiny head movement
            cam += (target - cam) * 0.25
        out.append({"t": round(t, 3), "x": round(float(cam), 4)})
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--framing", choices=FRAMINGS, help="override framing for all clips")
    ap.add_argument("--only", help="comma separated clip ids, e.g. 1,3")
    args = ap.parse_args()

    job = ROOT / "jobs" / args.slug
    meta = json.loads((job / "meta.json").read_text(encoding="utf-8"))
    transcript = json.loads((job / "transcript.json").read_text(encoding="utf-8"))
    plan_path = job / "clips.json"
    if not plan_path.exists():
        sys.exit(f"{plan_path} not found. Ask Claude to analyse the transcript first.")
    plan = json.loads(plan_path.read_text(encoding="utf-8"))

    words = load_words(transcript)
    only = {int(i) for i in args.only.split(",")} if args.only else None
    (job / "public").mkdir(exist_ok=True)
    (job / "props").mkdir(exist_ok=True)

    # Snap every clip first so repeats are caught across the whole plan, even with --only.
    snapped = {
        int(c["id"]): [snap_segment(s["start"], s["end"], words, meta["duration"]) for s in c["segments"]]
        for c in plan["clips"]
    }
    problems = find_overlaps(snapped)
    for cid, segs in snapped.items():
        total = sum(e - s for s, e in segs)
        if total > MAX_LEN:
            problems.append(f"clip {cid} is {total:.1f}s, over the {MAX_LEN}s max")
        elif total < MIN_LEN:
            print(f"  WARNING: clip {cid} is only {total:.1f}s; make sure it's a complete moment")
    if problems:
        sys.exit("Fix clips.json first:\n  " + "\n  ".join(problems))

    for clip in plan["clips"]:
        cid = int(clip["id"])
        if only and cid not in only:
            continue
        framing = args.framing or clip.get("framing") or plan.get("framing") or "blur"
        if framing not in FRAMINGS:
            sys.exit(f"clip {cid}: unknown framing '{framing}'")

        segments = snapped[cid]
        total = sum(e - s for s, e in segments)
        name = f"clip_{cid:02d}"
        print(f"[{name}] {total:.1f}s, {len(segments)} segment(s), framing={framing}")

        video_file = job / "public" / f"{name}.mp4"
        cut_clip(meta["source"], segments, video_file)

        track = None
        if framing == "track":
            print("  tracking speaker...")
            track = track_face(video_file)

        props = {
            "src": f"{name}.mp4",
            "durationInSeconds": round(total, 3),
            "srcWidth": meta["width"],
            "srcHeight": meta["height"],
            "framing": framing,
            "language": meta["language"],
            "hook": clip.get("hook", ""),
            "cta": clip.get("cta", ""),
            "captions": build_captions(segments, words),
            "track": track,
        }
        # Black-bar extras (top-bar prompts, end card): per clip, else plan-wide, else the Remotion defaults.
        for key in ("topTexts", "endCard"):
            value = clip.get(key) or plan.get(key)
            if value:
                props[key] = value
        (job / "props" / f"{name}.json").write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
        clip["snapped_segments"] = [{"start": s, "end": e} for s, e in segments]
        clip["duration"] = round(total, 2)

    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Prepared. Next: npm run render -- {args.slug}")


if __name__ == "__main__":
    main()
