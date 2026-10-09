#!/usr/bin/env node
// Screenshots of the real articles behind a faceless video's claims (news scenes).
//   status  <project>                  what the plan cites vs what is captured; start here
//   capture <project> [--url U]        headless Chrome/Edge: a desktop shot (16:9 scenes) and a
//                                      mobile-width shot (9:16 scenes, legible on a phone) per URL
//   adopt   <project> <url> <png> [--portrait]
//                                      ingest a screenshot taken in a real browser (claude-in-chrome:
//                                      save_to_disk) — the route for consent walls / paywalls
// Captures land in assets/news/ and are recorded in work/news.json; tools/render-visuals.mjs fills
// news scenes' src/src_portrait from it by URL. `adopt` REFUSES a URL the plan does not cite: never
// attach one article's screenshot to another claim. LOOK at every capture (Read the PNG): a full-size
// cookie wall or paywall looks fine by file size.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import { die, openProject, parseCli, readJson, writeJson } from "./lib/common.mjs";
import { spawnSync } from "node:child_process";

const { flags, positional } = parseCli();
const [cmd, projectName, urlArg, fileArg] = positional;
const project = openProject(projectName);
const { paths } = project;
const manifest = existsSync(paths.news) ? readJson(paths.news) : {};
const plan = existsSync(paths.visualPlan) ? readJson(paths.visualPlan) : {};
const cited = (plan.scenes || []).filter((s) => s.kind === "news" && s.url);
const SUSPICIOUS = 60_000;
const DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MOBILE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

const slug = (url) => {
  const u = new URL(url);
  return `${u.hostname.replace(/^www\./, "")}_${u.pathname.split("/").filter(Boolean).at(-1) || "page"}${u.hash ? `_${u.hash.slice(1)}` : ""}` // #section = its own shot
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 70);
};
const record = (url, field, dest, how) => {
  const scene = cited.find((s) => s.url === url) || {};
  manifest[url] = {
    ...(manifest[url] || {}),
    source: scene.source || manifest[url]?.source || "",
    headline: scene.headline || manifest[url]?.headline || "",
    date: scene.date || manifest[url]?.date || "",
    [field]: dest.replace(/\\/g, "/").replace(project.dir.replace(/\\/g, "/") + "/", ""),
    captured_via: how,
  };
};

if (cmd === "status" || !cmd) {
  if (!cited.length) console.log("no news scenes in work/visual-plan.json");
  for (const s of cited) {
    const e = manifest[s.url];
    const show = (rel) => {
      if (!rel || !existsSync(join(project.dir, rel))) return "MISSING";
      const kb = Math.round(statSync(join(project.dir, rel)).size / 1024);
      return `${rel} (${kb}KB)${kb * 1024 < SUSPICIOUS ? " ← suspiciously small, look at it" : ""}`;
    };
    console.log(`${s.source || "?"} — ${s.url}\n   desktop: ${show(e?.path)}\n   mobile:  ${show(e?.path_portrait)}`);
  }
} else if (cmd === "capture") {
  const browser = findBrowser();
  if (!browser) die("no Chrome/Edge found — capture in a real browser and use `adopt`");
  const one = urlArg || flags.url; // capture <p> <url> or --url <url> (the usage line documents --url)
  const urls = one ? [String(one)] : cited.map((s) => s.url);
  mkdirSync(join(project.dir, "assets", "news"), { recursive: true });
  const failed = [];
  const VIEWS = [
    { field: "path", width: 1440, height: 2200, scale: 1.5, mobile: false, ua: DESKTOP_UA },
    { field: "path_portrait", width: 430, height: 1500, scale: 2.5, mobile: true, ua: MOBILE_UA },
  ];
  const puppeteer = await import("puppeteer-core").catch(() => null);
  if (puppeteer) {
    // A real browser session: normal user agent (CDNs block "HeadlessChrome"), cookie banners
    // rejected (or removed), then the screenshot. Falls back to the plain CLI capture below.
    const b = await puppeteer.default.launch({ executablePath: browser, headless: true, args: ["--no-first-run", "--hide-scrollbars", "--mute-audio"] });
    try {
      for (const url of urls)
        for (const v of VIEWS) {
          const dest = join(project.dir, "assets", "news", `${slug(url)}${v.mobile ? "_mobile" : ""}.png`);
          const page = await b.newPage();
          try {
            await page.setUserAgent(v.ua);
            await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: v.scale, isMobile: v.mobile, hasTouch: v.mobile });
            const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 45_000 }).catch(() => null);
            await new Promise((r) => setTimeout(r, 1500));
            const cleared = await page.evaluate(dismissConsent);
            await new Promise((r) => setTimeout(r, 800));
            await page.evaluate(dismissConsent);
            await page.screenshot({ path: dest });
            const status = res?.status?.() ?? 0;
            record(url, v.field, dest, "puppeteer");
            const kb = Math.round(statSync(dest).size / 1024);
            console.log(`+ ${dest} (${kb}KB, HTTP ${status}${cleared ? `, ${cleared} consent element(s) cleared` : ""})${status >= 400 ? " ← BLOCKED" : kb * 1024 < SUSPICIOUS ? " ← suspiciously small" : ""}`);
          } catch (err) {
            failed.push(`${url} (${v.mobile ? "mobile" : "desktop"}): ${err.message.split("\n")[0]}`);
          } finally {
            await page.close();
          }
        }
    } finally {
      await b.close();
    }
  }
  for (const url of puppeteer ? [] : urls) {
    for (const [field, size, scale, ua] of [
      ["path", "1440,2200", 1.5, null],
      ["path_portrait", "500,1700", 2.16, MOBILE_UA],
    ]) {
      const dest = join(project.dir, "assets", "news", `${slug(url)}${field === "path" ? "" : "_mobile"}.png`);
      const profile = mkdtempSync(join(tmpdir(), "newsshot-"));
      const res = spawnSync(
        browser,
        [
          "--headless=new", `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions",
          "--hide-scrollbars", "--mute-audio", `--force-device-scale-factor=${scale}`, `--window-size=${size}`,
          "--virtual-time-budget=8000", ...(ua ? [`--user-agent=${ua}`] : []), `--screenshot=${dest}`, url,
        ],
        { timeout: 45_000 },
      );
      rmSync(profile, { recursive: true, force: true });
      if (!existsSync(dest) || res.error) {
        failed.push(`${url} (${field === "path" ? "desktop" : "mobile"}): ${res.error?.code === "ETIMEDOUT" ? "hung >45s" : "no screenshot"}`);
        continue;
      }
      record(url, field, dest, "headless");
      const kb = Math.round(statSync(dest).size / 1024);
      console.log(`+ ${dest} (${kb}KB)${kb * 1024 < SUSPICIOUS ? " ← suspiciously small" : ""}`);
    }
  }
  writeJson(paths.news, manifest);
  if (failed.length) console.log(`\nfailed — capture these in a real browser and \`adopt\` them:\n${failed.map((f) => "  - " + f).join("\n")}`);
  console.log("\nNow Read every PNG: confirm it is the article (not a cookie wall/paywall/404) and note the headline's position for `highlight`.");
} else if (cmd === "adopt") {
  if (!urlArg || !fileArg) die("usage: news.mjs adopt <project> <url> <screenshot.png> [--portrait]");
  if (!cited.some((s) => s.url === urlArg))
    die(`no news scene in work/visual-plan.json cites ${urlArg} — capture the article the plan actually names`);
  if (!existsSync(fileArg)) die(`not found: ${fileArg}`);
  const dest = join(project.dir, "assets", "news", `${slug(urlArg)}${flags.portrait ? "_mobile" : ""}${extname(fileArg).toLowerCase() || ".png"}`);
  mkdirSync(join(project.dir, "assets", "news"), { recursive: true });
  copyFileSync(fileArg, dest);
  record(urlArg, flags.portrait ? "path_portrait" : "path", dest, "browser");
  writeJson(paths.news, manifest);
  console.log(`adopted ${dest} for ${urlArg}`);
} else die(`unknown command ${cmd}`);


/** Runs in the page: click the most privacy-preserving consent button, then remove what remains. */
function dismissConsent() {
  let n = 0;
  const label = (el) => (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().toLowerCase();
  const buttons = [...document.querySelectorAll("button, [role=button], a, input[type=button], input[type=submit]")];
  const prefer = ["reject all", "reject", "decline", "necessary only", "only necessary", "use necessary", "deny", "refuse"];
  const fallback = ["close", "×", "✕", "accept all", "allow all", "accept", "i agree", "got it", "ok"];
  for (const words of [prefer, fallback]) {
    const hit = buttons.find((b) => words.includes(label(b)) && b.offsetParent !== null);
    if (hit) {
      hit.click();
      n++;
      break;
    }
  }
  const sel = [
    "#onetrust-consent-sdk", "#onetrust-banner-sdk", ".onetrust-pc-dark-filter", "#CybotCookiebotDialog", ".fc-consent-root",
    "#usercentrics-root", ".qc-cmp2-container", "#didomi-host", "[id*=cookie-banner]", "[class*=cookie-banner]", "[id*=consent]", "[class*=consent-]",
  ];
  for (const el of document.querySelectorAll(sel.join(","))) (el.remove(), n++);
  // any remaining full-screen dimmer on top of the page
  for (const el of document.querySelectorAll("body *")) {
    const s = getComputedStyle(el);
    if ((s.position === "fixed" || s.position === "sticky") && Number(s.zIndex) > 999 && el.offsetHeight > innerHeight * 0.6 && el.offsetWidth > innerWidth * 0.6) (el.remove(), n++);
  }
  document.documentElement.style.overflow = "auto";
  document.body.style.overflow = "auto";
  return n;
}

function findBrowser() {
  const env = process.env;
  const candidates = [
    join(env["ProgramFiles"] || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    join(env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
    join(env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    join(env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Microsoft", "Edge", "Application", "msedge.exe"),
    join(env["ProgramFiles"] || "C:\\Program Files", "Microsoft", "Edge", "Application", "msedge.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  return candidates.find((p) => p && existsSync(p)) || null;
}
