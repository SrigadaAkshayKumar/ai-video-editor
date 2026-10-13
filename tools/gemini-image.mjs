#!/usr/bin/env node
// Photo-real thumbnail scenes from the Gemini API (image models, "Nano Banana"). The image is only the PICTURE layer:
// type, numbers, logos and badges are always set by tools/thumb-design.mjs on top, never drawn by the model.
// Usage:
//   node tools/gemini-image.mjs <project> --name A --prompt "worried young Indian fresher holding an offer letter…"
//        [--n 2] [--aspect 16:9] [--model gemini-2.5-flash-image]
//   → projects/<p>/work/thumb/ai/A-1.png, A-2.png (1280x720) + prompts.json. Read them and pick one; spec "scene".
// Key: GEMINI_API_KEY (.env / GitHub secret; free key at https://aistudio.google.com/apikey).
// Models are tried in order until one answers: --model, $GEMINI_IMAGE_MODEL, then the list below.
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { die, openProject, parseCli, readJson, requireEnv, run, writeJson } from "./lib/common.mjs";

const MODELS = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview", "gemini-2.0-flash-preview-image-generation"];
// Always appended: the model must leave the text side empty and never invent text, logos or real people.
const GUARD = "Photorealistic editorial photograph, cinematic colour grade, shallow depth of field, natural skin, " +
  "realistic hands. Composition for a YouTube thumbnail: the subject fills the RIGHT third of the frame, the LEFT " +
  "half is dark, calm, out-of-focus negative space (text goes there later). Absolutely no text, letters, numbers, " +
  "signs, captions, logos, brand marks, watermarks, UI or screens with readable content. Not a celebrity or any " +
  "real, identifiable person. Not cartoon, not 3D render, not illustration, no oversaturated colours.";

const { positional, flags } = parseCli();
const [projectName] = positional;
if (!projectName || !flags.prompt) die('usage: node tools/gemini-image.mjs <project> --name A --prompt "…" [--n 2] [--aspect 16:9] [--model id]');
const project = openProject(projectName);
const key = requireEnv("GEMINI_API_KEY", "Free key: https://aistudio.google.com/apikey");
const name = String(flags.name || "scene");
const n = Math.max(1, Math.min(4, Number(flags.n) || 2));
const aspect = String(flags.aspect || "16:9");
const models = [flags.model, process.env.GEMINI_IMAGE_MODEL, ...MODELS].filter((m, i, a) => m && typeof m === "string" && a.indexOf(m) === i);
const dir = join(project.paths.work, "thumb", "ai");
mkdirSync(dir, { recursive: true });
const prompt = `${flags.prompt}\n\n${GUARD}`;

/** One image from the first model that works; remembers which one did. */
let working = null;
async function generate() {
  const errors = [];
  for (const model of working ? [working] : models) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: aspect } } }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      errors.push(`${model}: ${r.status} ${j.error?.message?.slice(0, 200) || ""}`);
      if ([400, 403, 404, 429].includes(r.status) && !working) continue; // not available on this key/tier → next model
      break;
    }
    const part = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData?.data);
    if (!part) {
      errors.push(`${model}: no image (${j.candidates?.[0]?.finishReason || j.promptFeedback?.blockReason || "no reason given"})`);
      break;
    }
    working = model;
    return { model, data: Buffer.from(part.inlineData.data, "base64"), mime: part.inlineData.mimeType };
  }
  appendFileSync(join(dir, "errors.log"), `${new Date().toISOString()}\n  ${errors.join("\n  ")}\n`);
  die(`Gemini made no image:\n  ${errors.join("\n  ")}\n(429 / limit 0 = this model has no free quota on your key: enable billing in AI Studio, or pass --model)`);
}

const log = existsSync(join(dir, "prompts.json")) ? readJson(join(dir, "prompts.json")) : [];
for (let i = 1; i <= n; i++) {
  const { model, data, mime } = await generate();
  const raw = join(tmpdir(), `gemini-${Date.now()}-${i}.${mime?.includes("png") ? "png" : "jpg"}`);
  writeFileSync(raw, data);
  const out = join(dir, `${name}-${i}.png`);
  // fill 1280x720 exactly (centre crop), whatever size the model returned
  run("ffmpeg", ["-y", "-v", "error", "-i", raw, "-vf", "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720", out]);
  log.push({ file: `work/thumb/ai/${name}-${i}.png`, model, prompt: flags.prompt, at: new Date().toISOString() });
  console.log(`${out}  (${model})`);
}
writeJson(join(dir, "prompts.json"), log);
console.log(`Read each image: subject on the right, left side empty, no text or logos, hands and face natural? Then spec "scene": "work/thumb/ai/${name}-<n>.png"`);
