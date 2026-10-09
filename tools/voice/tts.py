"""Voiceover for the daily run: the episode's *_voiceover.txt in the cloned voice (Qwen3-TTS voice clone, CPU).

Usage: python tools/voice/tts.py <voiceover.txt> <out.wav> [--config config/voice.json]

Same model and reference as the Colab notebook (config/voice.json). Differences from one long Colab take:
- the text goes in paragraph chunks (chunkMinWords..chunkMaxWords), joined with a short pause, because a single
  long take dropped whole lines (docs/lessons.md, 2026-10-06 infosys);
- each chunk's length is checked against the expected speaking time; a chunk that comes out too short (dropped
  words) or too long (runaway audio) is generated again with another seed, keeping the closest take.
The reference clip lives in Drive (inbox/brand/), never in git: the repo is public.
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def chunks(text, min_words, max_words):
    """Consecutive paragraphs grouped to at least min_words; a paragraph is never split unless it alone exceeds max_words."""
    paragraphs = [" ".join(p.split()) for p in text.replace("\r\n", "\n").split("\n\n") if p.strip()]
    out, cur = [], []
    for p in paragraphs:
        n = len(p.split())
        if cur and sum(len(c.split()) for c in cur) + n > max_words:
            out.append("\n\n".join(cur))
            cur = []
        cur.append(p)
        if sum(len(c.split()) for c in cur) >= min_words:
            out.append("\n\n".join(cur))
            cur = []
    if cur:
        if out and len(" ".join(cur).split()) < min_words // 2:
            out[-1] += "\n\n" + "\n\n".join(cur)
        else:
            out.append("\n\n".join(cur))
    return out


def find_ref(stem):
    p = ROOT / stem
    if p.is_file():
        return p
    hits = [f for f in p.parent.glob("*") if f.is_file() and f.stem.lower() == p.name.lower()] if p.parent.is_dir() else []
    if not hits:
        sys.exit(f"error: voice reference {stem}.* not found (put it in the Drive folder inbox/brand/)")
    return hits[0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("voiceover")
    ap.add_argument("out")
    ap.add_argument("--config", default=str(ROOT / "config" / "voice.json"))
    args = ap.parse_args()
    cfg = json.loads(Path(args.config).read_text(encoding="utf8"))

    text = Path(args.voiceover).read_text(encoding="utf8")
    if "{" in text or "}" in text:
        sys.exit("error: the voiceover still has a {placeholder}; it would be read out")
    parts = chunks(text, cfg["chunkMinWords"], cfg["chunkMaxWords"])
    ref = find_ref(cfg["refAudio"])
    print(f"{len(text.split())} words in {len(parts)} chunks, reference {ref.name}", flush=True)

    import numpy as np
    import soundfile as sf
    import torch
    from qwen_tts import Qwen3TTSModel

    torch.set_num_threads(os.cpu_count())
    t0 = time.time()
    model = Qwen3TTSModel.from_pretrained(cfg["model"], device_map="cpu", dtype=torch.float32)
    prompt = model.create_voice_clone_prompt(ref_audio=str(ref), ref_text=cfg["refText"], x_vector_only_mode=False)
    print(f"model loaded in {time.time() - t0:.0f}s on {os.cpu_count()} CPUs", flush=True)

    lo, hi = cfg["durationTolerance"]
    pieces, report, sr = [], [], None
    for i, part in enumerate(parts):
        expected = len(part.split()) / cfg["wordsPerSecond"]
        best = None
        for attempt in range(cfg["retries"] + 1):
            torch.manual_seed(cfg["seed"] + i + 1000 * attempt)
            t = time.time()
            wavs, sr = model.generate_voice_clone(text=part, language=cfg["language"], voice_clone_prompt=prompt)
            wav = np.asarray(wavs[0], dtype=np.float32)
            ratio = len(wav) / sr / expected
            if best is None or abs(np.log(ratio)) < abs(np.log(best[1])):
                best = (wav, ratio)
            print(f"chunk {i + 1}/{len(parts)} try {attempt + 1}: {len(wav) / sr:.1f}s for {expected:.1f}s expected"
                  f" (x{ratio:.2f}) in {time.time() - t:.0f}s", flush=True)
            if lo <= ratio <= hi:
                break
        wav, ratio = best
        report.append({"chunk": i + 1, "words": len(part.split()), "seconds": round(len(wav) / sr, 2),
                       "ratio": round(ratio, 2), "ok": lo <= ratio <= hi, "start": part[:60]})
        pieces.append(wav)

    gap = np.zeros(int(cfg["pauseSeconds"] * sr), dtype=np.float32)
    audio = np.concatenate([x for w in pieces for x in (w, gap)][:-1])
    peak = float(np.max(np.abs(audio))) or 1.0
    if peak > 0.99:
        audio = audio * (0.99 / peak)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    sf.write(args.out, audio, sr, subtype="PCM_16")

    bad = [r for r in report if not r["ok"]]
    summary = f"voice: {len(audio) / sr:.1f}s from {len(parts)} chunks in {time.time() - t0:.0f}s; {len(bad)} chunk(s) outside the expected length"
    print(summary)
    Path(args.out).with_suffix(".tts.json").write_text(json.dumps({"summary": summary, "chunks": report}, indent=2), encoding="utf8")
    step = os.environ.get("GITHUB_STEP_SUMMARY")
    if step:
        with open(step, "a", encoding="utf8") as f:
            f.write(f"### Voice\n{summary}\n\n" + "".join(f"- chunk {r['chunk']}: x{r['ratio']} \"{r['start']}…\"\n" for r in bad))


if __name__ == "__main__":
    main()
