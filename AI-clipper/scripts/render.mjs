// Step 4: render every prepared clip of a job to output/<slug>/ and write an upload sheet.
//
// Usage:
//   npm run render -- <slug>
//   npm run render -- <slug> --only 1,3
//   npm run render -- <slug> --sheet-only   (rewrite UPLOAD_SHEET.md without rendering)

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [slug, ...rest] = process.argv.slice(2);
if (!slug) {
  console.error("Usage: npm run render -- <slug> [--only 1,3]");
  process.exit(1);
}
const onlyIdx = rest.indexOf("--only");
const sheetOnly = rest.includes("--sheet-only");
const only = onlyIdx >= 0 ? new Set(rest[onlyIdx + 1].split(",").map(Number)) : null;

const job = path.join(ROOT, "jobs", slug);
const plan = JSON.parse(fs.readFileSync(path.join(job, "clips.json"), "utf-8"));
const outDir = path.join(ROOT, "output", slug);
fs.mkdirSync(outDir, { recursive: true });

const fileSlug = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "clip";

if (!sheetOnly) console.log("Bundling Remotion project...");
const serveUrl = sheetOnly
  ? null
  : await bundle({
      entryPoint: path.join(ROOT, "src", "index.ts"),
      publicDir: path.join(job, "public"),
    });

const rendered = [];
for (const clip of sheetOnly ? [] : plan.clips) {
  const id = Number(clip.id);
  if (only && !only.has(id)) continue;
  const name = `clip_${String(id).padStart(2, "0")}`;
  const propsFile = path.join(job, "props", `${name}.json`);
  if (!fs.existsSync(propsFile)) {
    console.warn(`[${name}] not prepared, skipping (run npm run prepare-clips -- ${slug})`);
    continue;
  }
  const inputProps = JSON.parse(fs.readFileSync(propsFile, "utf-8"));
  const composition = await selectComposition({ serveUrl, id: "Short", inputProps });
  const outputLocation = path.join(outDir, `${String(id).padStart(2, "0")}-${fileSlug(clip.title ?? name)}.mp4`);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 18,
    inputProps,
    outputLocation,
    onProgress: ({ progress }) => process.stdout.write(`\r[${name}] rendering ${(progress * 100).toFixed(0)}%   `),
  });
  console.log(`\n[${name}] -> ${path.relative(ROOT, outputLocation)}`);
  rendered.push({ clip, file: path.basename(outputLocation) });
}

// Upload sheet: everything needed to post each Short.
// Instagram Reels caption: clips.json `instagram: {caption, hashtags}` if given, else built from the YouTube fields.
const instagramCaption = (c) => {
  const ig = c.instagram ?? {};
  const caption =
    ig.caption ??
    [
      c.hook.replace(/\*/g, ""),
      "",
      (c.description ?? "").replace(/Full video link in the pinned comment 📌/g, "").trim(),
      "",
      c.cta,
      "",
      "📌 Full video: link in bio",
    ].join("\n");
  const tags = ig.hashtags ?? (c.hashtags ?? []).map((h) => (h === "#shorts" ? "#reels" : h));
  return `${caption}\n\n${tags.join(" ")}`;
};
const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
const sheet = [
  `# Shorts from ${slug}`,
  "",
  `${plan.clips.length} clips planned. ${plan.summary ?? ""}`,
  "",
  ...plan.clips.flatMap((c) => {
    const prefix = `${String(c.id).padStart(2, "0")}-`;
    const r = rendered.find((x) => x.clip.id === c.id) ?? {
      file: fs.readdirSync(outDir).find((f) => f.startsWith(prefix) && f.endsWith(".mp4")),
    };
    const segs = (c.snapped_segments ?? c.segments).map((s) => `${fmt(s.start)}–${fmt(s.end)}`).join(" + ");
    return [
      `## ${c.id}. ${c.title}`,
      "",
      `- **File:** ${r.file ?? "_not rendered_"}`,
      `- **Score:** ${c.score ?? "-"}/10  ·  **Duration:** ${c.duration ?? "?"}s  ·  **Source:** ${segs}`,
      `- **Hook:** ${c.hook}`,
      `- **Comment prompt:** ${c.cta}`,
      `- **Why it works:** ${c.why ?? ""}`,
      "",
      "**Description**",
      "",
      c.description ?? "",
      "",
      (c.hashtags ?? []).join(" "),
      "",
      "**Instagram caption**",
      "",
      "```",
      instagramCaption(c),
      "```",
      "",
    ];
  }),
].join("\n");
fs.writeFileSync(path.join(outDir, "UPLOAD_SHEET.md"), sheet, "utf-8");
console.log(`Done. ${rendered.length} clip(s) in output/${slug}/ (see UPLOAD_SHEET.md)`);
