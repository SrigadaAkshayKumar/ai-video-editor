#!/usr/bin/env node
// B-roll stock footage. Provider: Pexels when PEXELS_API_KEY is set, otherwise Pixabay
// (PIXABAY_API_KEY). Force one with --provider pexels|pixabay.
//   search: node tools/broll.mjs search <project> "query" [--format 9:16] [--orientation portrait|landscape|square] [--min 4] [--n 6]
//           → lists candidates as <provider>:<id> and saves thumbnails to work/broll-thumbs/ (Read them to judge fit).
//           Orientation follows --format (default: the project's first format).
//   get:    node tools/broll.mjs get <project> <provider:id> [--name slug]
//           → assets/broll/<slug>.mp4 (shared by every format) + a credit in work/credits.json
// Add --photos to search/get still images instead (faceless "still" scenes) → assets/stills/<slug>.jpg
import { join } from "node:path";
import { addCredit, die, download, loadEnv, openProject, parseCli, selectFormats, slugify, writeJson } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const photos = !!flags.photos;
const [cmd, projectName, arg] = positional;
if (!cmd || !projectName || !arg) {
  console.log('Usage: broll.mjs search <project> "query" [--format …] [--min 4] [--n 6] [--provider …] | get <project> <provider:id> [--name slug] [--format …]');
  process.exit(1);
}
const project = openProject(projectName);
loadEnv();

// ---- providers: each normalizes to { id, provider, duration, width, height, thumb, page, creator, creatorUrl, files[] } ----
const PROVIDERS = {
  pexels: {
    env: "PEXELS_API_KEY",
    license: "Pexels License (free to use, attribution appreciated)",
    async search(key, query, orientation, perPage) {
      const q = new URLSearchParams({ query, orientation, per_page: String(Math.min(80, perPage)), size: "medium" });
      const res = await getJson(`https://api.pexels.com/videos/search?${q}`, { Authorization: key }, "Pexels");
      return res.videos.map(fromPexels);
    },
    async get(key, id) {
      return fromPexels(await getJson(`https://api.pexels.com/videos/videos/${id}`, { Authorization: key }, "Pexels"));
    },
    async searchPhotos(key, query, orientation, perPage) {
      const q = new URLSearchParams({ query, orientation, per_page: String(Math.min(80, perPage)) });
      const res = await getJson(`https://api.pexels.com/v1/search?${q}`, { Authorization: key }, "Pexels");
      return res.photos.map(fromPexelsPhoto);
    },
    async getPhoto(key, id) {
      return fromPexelsPhoto(await getJson(`https://api.pexels.com/v1/photos/${id}`, { Authorization: key }, "Pexels"));
    },
  },
  pixabay: {
    env: "PIXABAY_API_KEY",
    license: "Pixabay Content License (free to use, no attribution required)",
    async search(key, query, orientation, perPage) {
      // Pixabay has no orientation filter for video — over-fetch and filter by frame shape.
      const q = new URLSearchParams({ key, q: query.slice(0, 100), video_type: "film", safesearch: "true", per_page: String(Math.min(200, Math.max(3, perPage * 3))) });
      const res = await getJson(`https://pixabay.com/api/videos/?${q}`, {}, "Pixabay");
      return res.hits.map(fromPixabay).filter((v) => shapeOf(v.width, v.height) === orientation);
    },
    async get(key, id) {
      const res = await getJson(`https://pixabay.com/api/videos/?${new URLSearchParams({ key, id: String(id) })}`, {}, "Pixabay");
      if (!res.hits?.length) die(`Pixabay video ${id} not found`);
      return fromPixabay(res.hits[0]);
    },
    async searchPhotos(key, query, orientation, perPage) {
      const o = orientation === "portrait" ? "vertical" : orientation === "landscape" ? "horizontal" : "all";
      const q = new URLSearchParams({ key, q: query.slice(0, 100), image_type: "photo", safesearch: "true", orientation: o, per_page: String(Math.min(200, Math.max(3, perPage))) });
      const res = await getJson(`https://pixabay.com/api/?${q}`, {}, "Pixabay");
      return res.hits.map(fromPixabayPhoto);
    },
    async getPhoto(key, id) {
      const res = await getJson(`https://pixabay.com/api/?${new URLSearchParams({ key, id: String(id) })}`, {}, "Pixabay");
      if (!res.hits?.length) die(`Pixabay image ${id} not found`);
      return fromPixabayPhoto(res.hits[0]);
    },
  },
};

function fromPexels(v) {
  return {
    id: v.id,
    provider: "pexels",
    duration: v.duration,
    width: v.width,
    height: v.height,
    thumb: v.image,
    page: v.url,
    creator: v.user.name,
    creatorUrl: v.user.url,
    files: v.video_files.filter((f) => f.file_type === "video/mp4" && f.width && f.height).map((f) => ({ url: f.link, width: f.width, height: f.height, fps: f.fps })),
  };
}

function fromPixabay(h) {
  const tiers = ["tiny", "small", "medium", "large"].map((t) => h.videos[t]).filter((f) => f?.url && f.width && f.height);
  const best = tiers.at(-1) || { width: 0, height: 0 };
  return {
    id: h.id,
    provider: "pixabay",
    duration: h.duration,
    width: best.width,
    height: best.height,
    thumb: h.videos.medium?.thumbnail || h.videos.small?.thumbnail || h.videos.tiny?.thumbnail,
    page: h.pageURL,
    creator: h.user,
    creatorUrl: `https://pixabay.com/users/${h.user}-${h.user_id}/`,
    files: tiers.map((f) => ({ url: f.url, width: f.width, height: f.height })),
  };
}

function fromPexelsPhoto(p) {
  return {
    id: p.id, provider: "pexels", duration: 0, width: p.width, height: p.height, thumb: p.src.medium, page: p.url,
    creator: p.photographer, creatorUrl: p.photographer_url,
    files: [{ url: p.src.large2x, width: Math.min(p.width, 1880), height: 0 }, { url: p.src.original, width: p.width, height: p.height }],
  };
}

function fromPixabayPhoto(h) {
  return {
    id: h.id, provider: "pixabay", duration: 0, width: h.imageWidth, height: h.imageHeight, thumb: h.webformatURL, page: h.pageURL,
    creator: h.user, creatorUrl: `https://pixabay.com/users/${h.user}-${h.user_id}/`,
    files: [{ url: h.largeImageURL, width: Math.min(h.imageWidth, 1280), height: 0 }],
  };
}

const shapeOf = (w, h) => (h > w * 1.1 ? "portrait" : w > h * 1.1 ? "landscape" : "square");

async function getJson(url, headers, label) {
  const r = await fetch(url, { headers });
  if (!r.ok) die(`${label} ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

/** Pick the provider: explicit, else the first one with a key (Pexels preferred). */
function provider(name) {
  const order = name ? [name] : ["pexels", "pixabay"];
  for (const p of order) {
    if (!PROVIDERS[p]) die(`unknown provider ${p}; use pexels or pixabay`);
    const key = process.env[PROVIDERS[p].env];
    if (key) return { name: p, key, ...PROVIDERS[p] };
    if (name) die(`${PROVIDERS[p].env} is empty in .env`);
  }
  die("no b-roll key: set PEXELS_API_KEY (https://www.pexels.com/api/new/) or PIXABAY_API_KEY (https://pixabay.com/api/docs/) in .env");
}

if (cmd === "search") {
  const p = provider(flags.provider);
  const fmt = flags.format ? selectFormats(project, flags.format, { single: true })[0] : selectFormats(project)[0];
  const orientation = flags.orientation || shapeOf(fmt.width, fmt.height);
  const n = Number(flags.n || 6);
  const min = photos ? 0 : Number(flags.min || 4);
  const search = (o) => (photos ? p.searchPhotos(p.key, arg, o, n * 2) : p.search(p.key, arg, o, n * 3));
  let picks = (await search(orientation)).filter((v) => v.duration >= min).slice(0, n);
  if (!picks.length && orientation !== "landscape" && !flags.orientation) {
    // Vertical stock is scarce (especially on Pixabay); a landscape clip cover-crops into 9:16 fine.
    console.log(`no ${orientation} clips — showing landscape ones (they will be centre-cropped; check the thumbnail's middle)`);
    picks = (await search("landscape")).filter((v) => v.duration >= min).slice(0, n);
  }
  if (!picks.length) die(`no ${p.name} results for "${arg}" (≥${min}s) — try a simpler/visual query`);
  const thumbs = join(project.paths.work, "broll-thumbs");
  for (const v of picks) {
    const thumb = join(thumbs, `${v.provider}-${v.id}.jpg`);
    if (v.thumb) await download(v.thumb, thumb).catch(() => {});
    console.log(`${v.provider}:${v.id}  ${photos ? "photo" : v.duration + "s"}  ${v.width}x${v.height}  by ${v.creator}  thumb: ${thumb}`);
  }
  writeJson(join(project.paths.work, "broll-search.json"), { provider: p.name, query: arg, orientation, results: picks });
  console.log(`(${p.name}, ${orientation} for ${fmt.aspect}) next: node tools/broll.mjs get ${projectName} <provider:id> --name <slug>`);
} else if (cmd === "get") {
  const [prefix, rawId] = arg.includes(":") ? arg.split(":") : [flags.provider, arg];
  const p = provider(prefix);
  const fmts = selectFormats(project);
  const v = photos ? await p.getPhoto(p.key, rawId) : await p.get(p.key, rawId);
  const target = Math.max(...fmts.map((f) => Math.max(f.width, f.height)));
  // Smallest rendition that still covers the largest output frame; avoids hauling 4K files around.
  const files = [...v.files].sort((a, b) => a.width * a.height - b.width * b.height);
  const file = files.find((f) => Math.max(f.width, f.height) >= target) || files.at(-1);
  if (!file) die(`no rendition for ${p.name}:${rawId}`);
  const name = slugify(flags.name || `${p.name}-${v.id}`);
  const rel = photos ? `assets/stills/${name}.jpg` : `assets/broll/${name}.mp4`;
  await download(file.url, join(project.dir, rel));
  addCredit(project.paths.credits, {
    file: rel, kind: photos ? "still" : "broll", source: p.name === "pexels" ? "Pexels" : "Pixabay",
    url: v.page, creator: v.creator, creatorUrl: v.creatorUrl, license: p.license,
  });
  if (!photos && Math.max(file.width, file.height) < target) console.log(`note: best rendition ${file.width}x${file.height} is below ${target}px — it will be upscaled`);
  console.log(`saved ${rel}  (${p.name}, ${file.width}x${file.height || "?"}${photos ? "" : `, ${v.duration}s`})`);
  console.log(
    photos
      ? `look at it: Read ${rel}`
      : `spot-check it: ffmpeg -ss 1 -i ${rel} -frames:v 1 work/check.png, then Read the PNG (stock search returns the wrong subject sometimes)`,
  );
} else die(`unknown command ${cmd}`);
