#!/usr/bin/env node
// Upload a finished daily episode to YouTube and schedule it (the daily run's last step; .github/workflows/daily-edit.yml).
// Usage:
//   node tools/youtube.mjs <project> [--shorts AI-clipper/output/<slug>] [--dry-run]
//   node tools/youtube.mjs --test <file.mp4>   one Private test upload (no schedule): proves the login works and
//                                              prints which channel it went to
// Reads projects/<p>/output/youtube.json (written by the daily-run skill):
//   {"title": "…", "description": "…", "tags": ["…"], "thumbnail": "output/thumbnail.png" (optional)}
// and the Shorts' AI-clipper/jobs/<p>/clips.json (title, description, hashtags per clip id; files NN-*.mp4).
// Schedule and limits: config/daily.json → youtube. Every upload goes up Private with a publishAt time, so YouTube
// publishes it by itself; nothing goes public before that time, and the owner can still change or cancel it in Studio.
// Note: until the Google Cloud project passes YouTube's API audit, YouTube keeps API uploads Private (no publishAt).
// Auth: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (tools/youtube-auth.mjs makes the refresh token once).
// Writes projects/<p>/output/youtube-uploaded.json (ids, links, publish times) and a summary for the run page.
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { PROJECTS, ROOT, die, parseCli, readJson, writeJson } from "./lib/common.mjs";

const { positional, flags } = parseCli();
const [project] = positional;
const testFile = typeof flags.test === "string" ? flags.test : null;
if (!project && !testFile) die("usage: node tools/youtube.mjs <project> [--shorts dir] [--dry-run] | --test <file.mp4>");
const dryRun = !!flags["dry-run"];
const cfg = { publishDelayDays: 1, publishTime: "18:00", shortsTimes: ["09:00", "13:00", "21:00"], categoryId: "27",
  language: "en", syntheticMedia: true, ...(readJson(join(ROOT, "config", "daily.json")).youtube || {}) };
if (testFile) await testUpload(testFile);
const out = join(PROJECTS, project, "output");
const metaFile = join(out, "youtube.json");
if (!existsSync(metaFile)) die(`${metaFile} missing — the daily-run skill writes it with the metadata`);
const meta = readJson(metaFile);

// ---- schedule -------------------------------------------------------------------------------------------------
const IST = 5.5 * 3.6e6;
/** "HH:MM" IST on (today IST + days) → Date; pushed a day later while it is less than an hour away. */
function istSlot(days, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date(Date.now() + IST);
  let t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, h, m) - IST;
  while (t < Date.now() + 3.6e6) t += 864e5;
  return new Date(t);
}

// ---- text limits (YouTube rejects the whole upload otherwise) ----------------------------------------------------
const clean = (s) => String(s ?? "").replace(/[<>]/g, "");
const title = (s) => clean(s).slice(0, 100).trim();
const description = (s) => clean(s).slice(0, 4900);
function tags(list) {
  const kept = [];
  let len = 0;
  for (const t of (list || []).map((x) => clean(x).replace(/^#/, "").trim()).filter(Boolean)) {
    const cost = t.length + (t.includes(" ") ? 2 : 0) + (kept.length ? 1 : 0);
    if (len + cost > 480) break;
    kept.push(t);
    len += cost;
  }
  return kept;
}

// ---- API ------------------------------------------------------------------------------------------------------
async function accessToken() {
  const need = ["YT_CLIENT_ID", "YT_CLIENT_SECRET", "YT_REFRESH_TOKEN"].filter((k) => !process.env[k]);
  if (need.length) die(`missing ${need.join(", ")} (docs/cloud-setup.md → YouTube)`);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: process.env.YT_CLIENT_ID, client_secret: process.env.YT_CLIENT_SECRET,
      refresh_token: process.env.YT_REFRESH_TOKEN, grant_type: "refresh_token" }),
  });
  const j = await r.json();
  if (!r.ok) die(`token refresh failed: ${j.error} ${j.error_description || ""} — re-run tools/youtube-auth.mjs`);
  return j.access_token;
}

async function upload(token, file, snippet, publishAt) {
  const body = {
    snippet: { ...snippet, categoryId: cfg.categoryId, defaultLanguage: cfg.language, defaultAudioLanguage: cfg.language },
    status: { privacyStatus: "private", ...(publishAt ? { publishAt: publishAt.toISOString() } : {}),
      selfDeclaredMadeForKids: false, containsSyntheticMedia: cfg.syntheticMedia },
  };
  const size = readFileSync(file).length;
  const start = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(size), "X-Upload-Content-Type": "video/mp4" },
    body: JSON.stringify(body),
  });
  if (!start.ok) die(`upload refused for ${file}: ${start.status} ${await start.text()}`);
  const session = start.headers.get("location");
  for (let attempt = 1; ; attempt++) {
    const put = await fetch(session, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: readFileSync(file) });
    if (put.ok) return await put.json();
    if (attempt >= 3 || put.status < 500) die(`upload failed for ${file}: ${put.status} ${await put.text()}`);
    await new Promise((r) => setTimeout(r, 5000 * attempt));
  }
}

/** --test: one Private upload, no schedule; report the channel YouTube put it on. Hoisted, so it runs before the plan. */
async function testUpload(file) {
  if (!existsSync(file)) die(`not found: ${file}`);
  const v = await upload(await accessToken(), file,
    { title: "Upload test - delete me", description: "Test upload from the Crack IT daily pipeline. Safe to delete.", tags: ["test"] }, null);
  const lines = ["### YouTube test upload", "", `- Video: https://youtube.com/shorts/${v.id} (Private)`,
    `- Channel: **${v.snippet?.channelTitle || "?"}** (id ${v.snippet?.channelId || "?"}, https://www.youtube.com/channel/${v.snippet?.channelId || ""})`,
    `- Status: ${v.status?.privacyStatus} / upload ${v.status?.uploadStatus}`, "",
    "If the channel is not Crack IT, run tools/youtube-auth.mjs again and pick the Crack IT channel."];
  console.log(lines.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  process.exit(0);
}

async function setThumbnail(token, id, file) {
  const type = extname(file).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const r = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${id}`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": type }, body: readFileSync(file),
  });
  return r.ok ? "set" : `not set (${r.status}: custom thumbnails need a phone-verified channel)`;
}

// ---- plan -----------------------------------------------------------------------------------------------------
const finals = readdirSync(out).filter((n) => /^final-16x9.*\.mp4$/.test(n));
if (!finals.length) die(`no final-16x9*.mp4 in ${out}`);
const plan = [{
  kind: "video", file: join(out, finals[0]), publishAt: istSlot(cfg.publishDelayDays, cfg.publishTime),
  snippet: { title: title(meta.title), description: description(meta.description), tags: tags(meta.tags) },
  thumbnail: meta.thumbnail ? join(PROJECTS, project, meta.thumbnail) : null,
}];
const shortsDir = flags.shorts ? join(ROOT, flags.shorts) : null;
const jobFile = join(ROOT, "AI-clipper", "jobs", project, "clips.json");
if (shortsDir && existsSync(shortsDir) && existsSync(jobFile) && cfg.shortsTimes.length) {
  const files = readdirSync(shortsDir).filter((n) => n.endsWith(".mp4"));
  const clips = readJson(jobFile).clips || [];
  clips.slice(0, cfg.shortsTimes.length).forEach((c, i) => {
    const f = files.find((n) => n.startsWith(`${String(c.id).padStart(2, "0")}-`));
    if (!f) return;
    const hashtags = (c.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`));
    if (!hashtags.some((h) => h.toLowerCase() === "#shorts")) hashtags.unshift("#Shorts");
    plan.push({
      // the day after the main video, so the "Full video" link already works
      kind: "short", file: join(shortsDir, f), publishAt: istSlot(cfg.publishDelayDays + 1, cfg.shortsTimes[i]),
      snippet: { title: title(c.title), description: description(`${c.description || ""}\n\nFULL_VIDEO\n\n${hashtags.join(" ")}`),
        tags: tags([...hashtags, ...(meta.tags || [])]) },
    });
  });
}
for (const p of plan) if (!p.snippet.title) die(`no title for ${p.file}`);

// ---- go -------------------------------------------------------------------------------------------------------
const results = [];
const token = dryRun ? null : await accessToken();
let videoUrl = "";
for (const p of plan) {
  if (p.kind === "short") p.snippet.description = p.snippet.description.replace("FULL_VIDEO", videoUrl ? `Full video: ${videoUrl}` : "").replace(/\n{3,}/g, "\n\n");
  if (dryRun) {
    results.push({ kind: p.kind, file: p.file, title: p.snippet.title, publishAt: p.publishAt.toISOString(), tags: p.snippet.tags.length });
    continue;
  }
  const { id } = await upload(token, p.file, p.snippet, p.publishAt);
  const url = p.kind === "short" ? `https://youtube.com/shorts/${id}` : `https://youtu.be/${id}`;
  if (p.kind === "video") videoUrl = url;
  const thumb = p.thumbnail && existsSync(p.thumbnail) ? await setThumbnail(token, id, p.thumbnail) : undefined;
  results.push({ kind: p.kind, id, url, title: p.snippet.title, publishAt: p.publishAt.toISOString(), thumbnail: thumb });
  console.log(`${p.kind} ${url} → publishes ${p.publishAt.toISOString()} (${p.snippet.title})`);
}

if (!dryRun) writeJson(join(out, "youtube-uploaded.json"), { uploadedAt: new Date().toISOString(), videos: results });
const istText = (iso) => new Date(Date.parse(iso) + IST).toISOString().slice(0, 16).replace("T", " ") + " IST";
const lines = ["### YouTube", "", "| | Title | Publishes |", "|---|---|---|",
  ...results.map((r) => `| ${r.url ? `[${r.kind}](${r.url})` : r.kind} | ${r.title} | ${istText(r.publishAt)} |`), "",
  "Uploaded Private with a publish time. If YouTube shows them as plain Private with no schedule, the API project is not audited yet: set the time in Studio."];
console.log(lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
