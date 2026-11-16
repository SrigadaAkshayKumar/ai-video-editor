#!/usr/bin/env node
// Research helpers for the unattended script step, for when Claude's own web tools are missing or blocked on the
// runner (the first fresh-news run, 2026-11-15, gave up in 30 s with no source opened).
//   news "<query>" [--days 2] [--max 15] [--provider google|bing]
//                                           news headlines from the last N days (India, English):
//                                           date · outlet · title · link. Google links redirect to the article
//                                           (read follows them); Bing links are the article itself
//   read <url> [--max 20000]               the page in headless Chrome (real user agent, redirects followed):
//                                           final URL, title, then the visible text
// A page read here counts as opened: cite its final URL and outlet in the report.
import { existsSync } from "node:fs";
import { die, parseCli } from "./lib/common.mjs";

const { positional, flags } = parseCli();
const [cmd, arg] = positional;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const decode = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
const tag = (xml, name) => decode((xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) || [])[1] || "");

function findBrowser() {
  return [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
    "/opt/pw-browsers/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"].find((p) => p && existsSync(p)) || null;
}

if (cmd === "news") {
  if (!arg) die('usage: node tools/web.mjs news "<query>" [--days 2] [--max 15] [--provider google|bing]');
  const days = Number(flags.days) || 2;
  const bing = flags.provider === "bing";
  const url = bing
    ? `https://www.bing.com/news/search?${new URLSearchParams({ q: arg, format: "rss", setlang: "en-IN", cc: "IN" })}`
    : `https://news.google.com/rss/search?${new URLSearchParams({ q: `${arg} when:${days}d`, hl: "en-IN", gl: "IN", ceid: "IN:en" })}`;
  const r = await fetch(url, { headers: { "user-agent": UA } });
  if (!r.ok) die(`${bing ? "Bing" : "Google"} News answered ${r.status}`);
  const since = Date.now() - days * 864e5;
  // Bing wraps the article in an apiclick redirect: the real address is its url= parameter
  const real = (link) => { try { return new URL(link).searchParams.get("url") || link; } catch { return link; } };
  const items = [...(await r.text()).matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1])
    .map((x) => ({ date: new Date(tag(x, "pubDate")), source: tag(x, "source") || tag(x, "News:Source"), title: tag(x, "title"), link: real(tag(x, "link")) }))
    .filter((i) => !(i.date < since))
    .sort((a, b) => b.date - a.date)
    .slice(0, Number(flags.max) || 15);
  if (!items.length) console.log(`no results for "${arg}" in the last ${days} days`);
  for (const i of items) console.log(`${i.date.toISOString().slice(0, 16).replace("T", " ")} UTC · ${i.source} · ${i.title}\n  ${i.link}`);
} else if (cmd === "read") {
  if (!arg) die("usage: node tools/web.mjs read <url> [--max 20000]");
  const browser = findBrowser();
  if (!browser) die("no Chrome/Chromium found (set CHROME_PATH)");
  const puppeteer = await import("puppeteer-core").catch(() => die("puppeteer-core missing: run npm install"));
  const b = await puppeteer.default.launch({ executablePath: browser, headless: true, args: ["--no-first-run", "--no-sandbox", "--mute-audio"] });
  try {
    const page = await b.newPage();
    await page.setUserAgent(UA);
    await page.goto(arg, { waitUntil: "domcontentloaded", timeout: 45_000 });
    // Google News links land on a redirect page first
    for (let i = 0; i < 40 && /news\.google\.com/.test(page.url()); i++) await new Promise((r) => setTimeout(r, 500));
    await new Promise((r) => setTimeout(r, 1500));
    const text = (await page.evaluate(() => document.body?.innerText || "")).replace(/\n{3,}/g, "\n\n").trim();
    if (/news\.google\.com/.test(page.url())) die("still on the Google News redirect: open the outlet's own link instead (news --provider bing, or search the headline)");
    console.log(`URL: ${page.url()}\nTITLE: ${await page.title()}\n`);
    console.log(text.slice(0, Number(flags.max) || 20_000) || "(no visible text: paywall, consent wall or a script-only page)");
  } finally {
    await b.close();
  }
} else die('usage: node tools/web.mjs news "<query>" [--days 2] | read <url>');
