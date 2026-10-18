#!/usr/bin/env node
// Upload a finished daily episode to YouTube and schedule it (the daily run's last step; .github/workflows/daily-edit.yml).
// Usage:
//   node tools/youtube.mjs <project> [--shorts AI-clipper/output/<slug>] [--dry-run]
//        [--publish "2026-10-15 16:00"]   main video at this IST time (Shorts the same day, see below)
//        [--no-thumbnail]               leave YouTube's auto thumbnail (set one later with --set-thumbnail)
//   node tools/youtube.mjs --test <file.mp4>   one Private test upload (no schedule): proves the login works and
//                                              prints which channel it went to
//   node tools/youtube.mjs <project> --set-thumbnail [file]   put a (new) thumbnail on the video already uploaded
//        (id from output/youtube-uploaded.json). file default: output/thumbnails/main.txt names the variant (e.g. "B"),
//        else youtube.json "thumbnail", else output/thumbnails/A.png. The schedule is left untouched.
//   node tools/youtube.mjs <project> --update [--publish "2026-10-15 16:00"] [--shorts dir]
//        re-apply the CURRENT youtube.json / clips.json / config to the videos already uploaded (ids from
//        youtube-uploaded.json): title, description, tags, AI label, and the schedule (main at --publish or where it
//        is; Shorts the same day, shortsGapMinutes apart). A video that is already public stays public.
//        Needs the edit permission (tools/youtube-auth.mjs asks for it since 2026-10).
// Reads projects/<p>/output/youtube.json (written by the daily-run skill):
//   {"title": "…", "description": "…", "tags": ["…"], "thumbnail": "output/thumbnail.png" (optional)}
// and the Shorts' AI-clipper/jobs/<p>/clips.json (title, description, hashtags per clip id; files NN-*.mp4).
// Schedule and limits: config/daily.json → youtube. Every upload goes up Private with a publishAt time, so YouTube
// publishes it by itself; nothing goes public before that time, and the owner can still change or cancel it in Studio.
// Note: until the Google Cloud project passes YouTube's API audit, YouTube keeps API uploads Private (no publishAt).
// Auth: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (tools/youtube-auth.mjs makes the refresh token once).
// Writes projects/<p>/output/youtube-uploaded.json (ids, links, publish times) and a summary for the run page.
import { appendFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { PROJECTS, ROOT, die, parseCli, readJson, run, writeJson } from "./lib/common.mjs";

const { positional, flags } = parseCli();
const [project] = positional;
const testFile = typeof flags.test === "string" ? flags.test : null;
if (!project && !testFile) die("usage: node tools/youtube.mjs <project> [--shorts dir] [--dry-run] | --test <file.mp4>");
const dryRun = !!flags["dry-run"];
const cfg = { publishDelayDays: 1, publishTime: "18:00", shortsCount: 3, shortsGapMinutes: 60, categoryId: "27",
  language: "en", syntheticMedia: false, ...(readJson(join(ROOT, "config", "daily.json")).youtube || {}) };
if (testFile) await testUpload(testFile);
if (flags["set-thumbnail"]) await setThumbnailOnly(project);
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
    if (len + cost > 490) break; // YouTube: 500 characters, commas and quotes included
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
  // YouTube takes at most 2 MB: a photo-heavy PNG goes up as a high-quality JPEG instead
  let tmp = null;
  if (statSync(file).size > 1.9e6) {
    tmp = mkdtempSync(join(tmpdir(), "yt-thumb-"));
    const jpg = join(tmp, "thumb.jpg");
    for (const q of [2, 4, 6]) {
      run("ffmpeg", ["-y", "-v", "error", "-i", file, "-q:v", String(q), jpg]);
      if (statSync(jpg).size < 1.9e6) break;
    }
    file = jpg;
  }
  try {
    const type = extname(file).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
    const r = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${id}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": type }, body: readFileSync(file),
    });
    if (r.ok) return "set";
    const why = (await r.text()).match(/"message":\s*"([^"]+)"/)?.[1] || "";
    return `not set (${r.status} ${why}${r.status === 403 ? " — custom thumbnails need a phone-verified channel: youtube.com/verify" : ""})`;
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
}

/** --set-thumbnail: replace the thumbnail of the episode's uploaded main video. Hoisted, runs before the plan. */
async function setThumbnailOnly(p) {
  const dir = join(PROJECTS, p, "output");
  const upFile = join(dir, "youtube-uploaded.json");
  if (!existsSync(upFile)) die(`${upFile} missing: ${p} is not uploaded yet (the thumbnail goes on with the upload)`);
  const up = readJson(upFile);
  const video = (up.videos || []).find((v) => v.kind === "video" && v.id) || die("no main video id in youtube-uploaded.json");
  const pickFile = join(dir, "thumbnails", "main.txt");
  const pick = existsSync(pickFile) ? readFileSync(pickFile, "utf8").trim().replace(/\.png$/i, "") : "";
  const yj = existsSync(join(dir, "youtube.json")) ? readJson(join(dir, "youtube.json")) : {};
  const rel = typeof flags["set-thumbnail"] === "string" ? flags["set-thumbnail"]
    : pick ? `output/thumbnails/${pick}.png` : yj.thumbnail || "output/thumbnails/A.png";
  const file = existsSync(rel) ? rel : join(PROJECTS, p, rel);
  if (!existsSync(file)) die(`thumbnail not found: ${rel}`);
  const result = await setThumbnail(await accessToken(), video.id, file);
  video.thumbnail = result;
  video.thumbnailFile = rel;
  video.thumbnailSetAt = new Date().toISOString();
  writeJson(upFile, up);
  const line = `### YouTube thumbnail\n\n- ${video.url}: ${rel} → **${result}** (schedule unchanged: ${video.publishAt})\n`;
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, line);
  process.exit(result === "set" ? 0 : 1);
}

const md = (s) => String(s).replace(/\|/g, "\\|"); // titles carry " | ", which splits a table cell
function istText(iso) {
  return new Date(Date.parse(iso) + IST).toISOString().slice(0, 16).replace("T", " ") + " IST";
}

// ---- plan -----------------------------------------------------------------------------------------------------
/** --publish "YYYY-MM-DD HH:MM" in IST → Date; else the configured slot. */
function publishFlag() {
  const upFile = join(out, "youtube-uploaded.json");
  if (flags.update && !flags.publish && existsSync(upFile)) {
    const main = readJson(upFile).videos?.find((v) => v.kind === "video");
    if (main?.publishAt) return new Date(main.publishAt); // --update keeps the main video's time
  }
  if (!flags.publish) return istSlot(cfg.publishDelayDays, cfg.publishTime);
  const m = String(flags.publish).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/) || die(`--publish "YYYY-MM-DD HH:MM" (IST), got ${flags.publish}`);
  const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - IST);
  if (t < Date.now() + 3.6e6) die(`--publish ${flags.publish} IST is in the past or less than an hour away`);
  return t;
}
const mainAt = publishFlag();
/** Shorts: the same day as the main video, one every shortsGapMinutes after it (so the video is already public
 *  when each Short goes out and can be its "Related video"). */
const shortAt = (i) => new Date(mainAt.getTime() + (i + 1) * cfg.shortsGapMinutes * 6e4);
const finals = readdirSync(out).filter((n) => /^final-16x9.*\.mp4$/.test(n));
if (!finals.length && !flags.update) die(`no final-16x9*.mp4 in ${out}`);
const plan = [{
  kind: "video", file: join(out, finals[0] || "final-16x9.mp4"), publishAt: mainAt,
  snippet: { title: title(meta.title), description: description(meta.description), tags: tags(meta.tags) },
  thumbnail: meta.thumbnail && !flags["no-thumbnail"] ? join(PROJECTS, project, meta.thumbnail) : null,
}];
const shortsDir = flags.shorts ? join(ROOT, flags.shorts) : null;
const jobFile = join(ROOT, "AI-clipper", "jobs", project, "clips.json");
if ((flags.update || (shortsDir && existsSync(shortsDir))) && existsSync(jobFile) && cfg.shortsCount > 0) {
  const files = shortsDir && existsSync(shortsDir) ? readdirSync(shortsDir).filter((n) => n.endsWith(".mp4")) : [];
  const clips = readJson(jobFile).clips || [];
  clips.filter((c) => flags.update || files.some((n) => n.startsWith(`${String(c.id).padStart(2, "0")}-`))).slice(0, cfg.shortsCount).forEach((c, i) => {
    const f = files.find((n) => n.startsWith(`${String(c.id).padStart(2, "0")}-`)) || "";
    const hashtags = (c.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`));
    if (!hashtags.some((h) => h.toLowerCase() === "#shorts")) hashtags.unshift("#Shorts");
    plan.push({
      kind: "short", clipId: c.id, file: shortsDir ? join(shortsDir, f) : "", publishAt: shortAt(i),
      snippet: { title: title(c.title), description: description(`${c.description || ""}\n\n${hashtags.join(" ")}`),
        tags: tags([...hashtags, ...(meta.tags || [])]) },
    });
  });
}
for (const p of plan) if (!p.snippet.title) die(`no title for ${p.file}`);
if (flags.update) await updateUploaded();

/** --update: videos.update on what is already on YouTube, from the plan above. */
async function updateUploaded() {
  const upFile = join(out, "youtube-uploaded.json");
  if (!existsSync(upFile)) die(`${upFile} missing: nothing uploaded to update`);
  const up = readJson(upFile);
  const token = await accessToken();
  const shortsUp = up.videos.filter((v) => v.kind === "short");
  const rows = [];
  for (const p of plan) {
    // the uploaded video this plan entry stands for: main video, or the Short of the same clip (older uploads: same title, else same position)
    const v = p.kind === "video" ? up.videos.find((x) => x.kind === "video")
      : shortsUp.find((x) => x.clipId != null && x.clipId === p.clipId) || shortsUp.find((x) => x.title === p.snippet.title)
        || shortsUp[plan.filter((q) => q.kind === "short").indexOf(p)];
    if (!v) continue;
    const cur = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?part=status&id=${v.id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
    const live = cur.items?.[0]?.status?.privacyStatus === "public";
    const at = p.publishAt;
    const body = {
      id: v.id,
      snippet: { ...p.snippet, categoryId: cfg.categoryId, defaultLanguage: cfg.language, defaultAudioLanguage: cfg.language },
      status: { privacyStatus: live ? "public" : "private", ...(live ? {} : { publishAt: at.toISOString() }),
        selfDeclaredMadeForKids: false, containsSyntheticMedia: cfg.syntheticMedia },
    };
    const r = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,status", {
      method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) {
      const why = j.error?.message || r.status;
      rows.push(`| [${p.kind}](${v.url}) | NOT updated: ${why}${r.status === 403 ? " (re-run tools/youtube-auth.mjs: the login needs the edit permission)" : ""} | |`);
      continue;
    }
    Object.assign(v, { title: p.snippet.title, clipId: p.clipId ?? v.clipId, updatedAt: new Date().toISOString(),
      publishAt: live ? v.publishAt : at.toISOString(),
      youtubeStatus: { privacy: j.status?.privacyStatus, publishAt: j.status?.publishAt || null, aiLabel: j.status?.containsSyntheticMedia } });
    rows.push(`| [${p.kind}](${v.url}) | ${md(p.snippet.title)} | ${live ? "already public" : istText(at.toISOString())}, AI label ${cfg.syntheticMedia ? "Yes" : "No"} |`);
  }
  writeJson(upFile, up);
  const lines = ["### YouTube update", "", "| | Title | Publishes |", "|---|---|---|", ...rows, ""];
  console.log(lines.join("\n"));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
  process.exit(rows.some((r) => r.includes("NOT updated")) ? 1 : 0);
}

// ---- go -------------------------------------------------------------------------------------------------------
const results = [];
const token = dryRun ? null : await accessToken();
let videoUrl = "";
for (const p of plan) {
  if (dryRun) {
    results.push({ kind: p.kind, file: p.file, title: p.snippet.title, publishAt: p.publishAt.toISOString(), tags: p.snippet.tags.length });
    continue;
  }
  const { id, status } = await upload(token, p.file, p.snippet, p.publishAt);
  const url = p.kind === "short" ? `https://youtube.com/shorts/${id}` : `https://youtu.be/${id}`;
  if (p.kind === "video") videoUrl = url;
  const thumb = p.thumbnail && existsSync(p.thumbnail) ? await setThumbnail(token, id, p.thumbnail) : undefined;
  results.push({ kind: p.kind, id, url, title: p.snippet.title, clipId: p.clipId, publishAt: p.publishAt.toISOString(),
    // what YouTube actually stored: no publishAt here = the API project is not audited, the video stays Private
    youtubeStatus: { privacy: status?.privacyStatus, publishAt: status?.publishAt || null }, thumbnail: thumb });
  console.log(`${p.kind} ${url} → publishes ${p.publishAt.toISOString()} (${p.snippet.title}); YouTube stored: ${status?.privacyStatus}, publishAt ${status?.publishAt || "NONE"}`);
}

if (!dryRun) writeJson(join(out, "youtube-uploaded.json"), { uploadedAt: new Date().toISOString(), videos: results });
const lines = ["### YouTube", "", "| | Title | Publishes | YouTube stored | Thumbnail |", "|---|---|---|---|---|",
  ...results.map((r) => `| ${r.url ? `[${r.kind}](${r.url})` : r.kind} | ${md(r.title)} | ${istText(r.publishAt)} | ${r.youtubeStatus ? `${r.youtubeStatus.privacy}, ${r.youtubeStatus.publishAt ? "scheduled " + istText(r.youtubeStatus.publishAt) : "NO schedule"}` : ""} | ${r.thumbnail || (r.kind === "video" ? "YouTube auto" : "")} |`), "",
  ...(videoUrl && results.some((r) => r.kind === "short") ? [`Related video: the API cannot set it. In Studio → each Short → Details → Related video → pick ${videoUrl}.`, ""] : []),
  "Uploaded Private with a publish time. If YouTube shows them as plain Private with no schedule, the API project is not audited yet: set the time in Studio."];
console.log(lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
