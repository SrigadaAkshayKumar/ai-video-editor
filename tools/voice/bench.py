"""CPU speed test for Qwen3-TTS voice clone on a GitHub runner (temporary; see .github/workflows/tts-bench.yml)."""
import os, sys, time
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

torch.set_num_threads(os.cpu_count())
model_id = sys.argv[1]
ref_audio = "https://qianwen-res.oss-cn-beijing.aliyuncs.com/Qwen3-TTS-Repo/clone.wav"
ref_text = "Okay. Yeah. I resent you. I love you. I respect you. But you know what? You blew it! And thanks to you."
text = ("TCS has just announced its results for the July to September quarter, and if you are holding a TCS offer "
        "letter or waiting for your joining letter, there are three numbers in this report that matter much more to "
        "you than profit. In the next six minutes, I will explain those three numbers in simple words.")

t = time.time()
model = Qwen3TTSModel.from_pretrained(model_id, device_map="cpu", dtype=torch.float32)
print(f"load {time.time() - t:.1f}s, cpus {os.cpu_count()}", flush=True)
prompt = model.create_voice_clone_prompt(ref_audio=ref_audio, ref_text=ref_text, x_vector_only_mode=False)
t = time.time()
wavs, sr = model.generate_voice_clone(text=text, language="English", voice_clone_prompt=prompt)
gen = time.time() - t
dur = len(wavs[0]) / sr
name = model_id.split("/")[-1]
sf.write(f"bench-{name}.wav", wavs[0], sr)
line = f"| {name} | {os.cpu_count()} | {dur:.1f}s | {gen:.1f}s | {gen / dur:.2f}x |"
print(line)
with open(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull), "a") as f:
    f.write(line + "\n")
