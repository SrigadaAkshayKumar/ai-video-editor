#!/usr/bin/env node
// Company logos for thumbnails, from Wikimedia Commons (vector files; the logo stays the company's trademark:
// editorial use only, never altered, never implying a partnership).
//   search <project> "Cognizant"        → downloads up to 6 candidates to work/thumb/logos/ and a contact sheet
//                                          work/thumb/logos/sheet.png (Read it: which one is the CURRENT official logo?)
//   pick <project> <n> [--name cognizant] → assets/logos/<name>.svg (or .png) + a credit in work/credits.json
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { addCredit, die, openProject, parseCli, readJson, run, slugify, writeJson } from "./lib/common.mjs";

const UA = "CrackIT-thumbnails/1.0 (https://github.com/SrigadaAkshayKumar/ai-video-editor)";
const API = "https://commons.wikimedia.org/w/api.php";
const { positional, flags } = parseCli();
const [cmd, projectName, arg] = positional;
if (!cmd || !projectName || !arg) die('usage: logo.mjs search <project> "Company" | pick <project> <n> [--name slug]');
const project = openProject(projectName);
const dir = join(project.paths.work, "thumb", "logos");

async function api(params) {
  const r = await fetch(`${API}?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`, { headers: { "User-Agent": UA } });
  if (!r.ok) die(`Wikimedia Commons ${r.status}`);
  return r.json();
}

if (cmd === "search") {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const found = [];
  for (const q of [`${arg} logo filetype:drawing`, `${arg} logo`]) {
    const s = await api({ action: "query", list: "search", srsearch: q, srnamespace: "6", srlimit: "10" });
    for (const h of s.query?.search || []) if (!found.includes(h.title) && /logo/i.test(h.title) && /\.(svg|png)$/i.test(h.title)) found.push(h.title);
    if (found.length >= 6) break;
  }
  if (!found.length) die(`no logo found for "${arg}" on Wikimedia Commons — leave the logo out`);
  const info = await api({ action: "query", titles: found.slice(0, 6).join("|"), prop: "imageinfo", iiprop: "url|extmetadata" });
  const list = [];
  for (const [i, p] of (info.query?.pages || []).entries()) {
    const ii = p.imageinfo?.[0];
    if (!ii) continue;
    const file = join(dir, `${i + 1}${extname(ii.url).toLowerCase()}`);
    const r = await fetch(ii.url, { headers: { "User-Agent": UA } });
    if (!r.ok) continue;
    writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    const m = ii.extmetadata || {};
    list.push({ n: i + 1, file, title: p.title, page: ii.descriptionurl, license: m.LicenseShortName?.value || "see page",
      date: (m.DateTimeOriginal?.value || m.DateTime?.value || "").replace(/<[^>]+>/g, "").slice(0, 10) });
  }
  writeJson(join(dir, "candidates.json"), list);
  // contact sheet: every candidate on white and on the dark thumbnail background
  const cells = list.map((c) => `<div class="c"><b>${c.n}</b><div class="w"><img src="${pathToFileURL(c.file)}"></div><div class="d"><img src="${pathToFileURL(c.file)}"></div><small>${c.title.replace(/^File:/, "").slice(0, 48)} · ${c.date}</small></div>`).join("");
  const html = `<!doctype html><meta charset=utf-8><style>body{margin:0;width:1200px;background:#ddd;font:14px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px}
.c{background:#fff;padding:8px}.c b{font-size:22px}.w,.d{height:110px;display:flex;align-items:center;justify-content:center;margin:4px 0}.d{background:#0b0d12}
img{max-width:85%;max-height:90px}</style>${cells}`;
  const tmp = join(tmpdir(), `logos-${Date.now()}.html`);
  writeFileSync(tmp, html);
  const chrome = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/chromium", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].find((p) => p && existsSync(p));
  if (chrome) {
    const shot = join(dir, "sheet-full.png");
    run(chrome, ["--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", "--virtual-time-budget=4000", "--window-size=1216,900", `--screenshot=${shot}`, pathToFileURL(tmp).href]);
    run("ffmpeg", ["-y", "-v", "error", "-i", shot, "-vf", "crop=1216:700:0:0", join(dir, "sheet.png")]);
  }
  rmSync(tmp, { force: true });
  for (const c of list) console.log(`${c.n}  ${c.title}  (${c.date}, ${c.license})`);
  console.log(`contact sheet → ${join(dir, "sheet.png")}  (Read it; pick the current official logo, then: logo.mjs pick ${projectName} <n>)`);
} else if (cmd === "pick") {
  const list = existsSync(join(dir, "candidates.json")) ? readJson(join(dir, "candidates.json")) : die("run search first");
  const c = list.find((x) => x.n === Number(arg)) || die(`no candidate ${arg}`);
  const name = slugify(flags.name || c.title.replace(/^File:/, "").replace(/\.\w+$/, ""));
  mkdirSync(join(project.dir, "assets", "logos"), { recursive: true });
  const rel = `assets/logos/${name}${extname(c.file)}`;
  copyFileSync(c.file, join(project.dir, rel));
  addCredit(join(project.paths.work, "credits.json"), { file: rel, title: c.title, source: c.page, license: c.license,
    note: "trademark of its owner; editorial use" });
  console.log(`→ ${rel}`);
} else die('usage: logo.mjs search <project> "Company" | pick <project> <n> [--name slug]');
