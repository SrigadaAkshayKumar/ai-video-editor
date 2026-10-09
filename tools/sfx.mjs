#!/usr/bin/env node
// SFX library.
//   list  [project]                 every effect usable by name in audio-plan.json, with length and
//                                   spectral band (sub = felt under the voice; vocal = competes with it)
//   fetch <project> <name> ["query"] [--library]
//                                   download a CC0 effect from Openverse (Freesound) as <name>.mp3 into
//                                   the project's assets/sfx (or the shared repo library with --library)
// Names resolve project assets/sfx > repo assets/sfx > HyperFrames bundled set.
import { join } from "node:path";
import { LIBRARY, analyseSfx, sfxCatalog } from "./lib/audio.mjs";
import { addCredit, die, download, openProject, parseCli, slugify } from "./lib/common.mjs";

const { flags, positional } = parseCli();
const [cmd, projectName, name, query] = positional;

if (cmd === "list" || !cmd) {
  const project = projectName ? openProject(projectName) : null;
  const entries = [...sfxCatalog(project?.dir).values()];
  analyseSfx(entries, join(LIBRARY, ".analysis.json"));
  entries.sort((a, b) => (a.band === b.band ? a.name.localeCompare(b.name) : a.band === "sub" ? -1 : b.band === "sub" ? 1 : 0));
  console.log("name                 secs  band   <120Hz  voice  source");
  for (const e of entries)
    console.log(
      `${e.name.padEnd(20)} ${String(e.seconds).padStart(5)}  ${e.band.padEnd(6)} ${String(Math.round(e.low * 100)).padStart(5)}%  ${String(Math.round(e.vocal * 100)).padStart(4)}%  ${e.source}`,
    );
  console.log("\nsub-band cues carry structure (reframes, punchlines, chapter builds); vocal-band cues are rationed.");
} else if (cmd === "fetch") {
  if (!projectName || !name) die('usage: sfx.mjs fetch <project> <name> ["search query"] [--library]');
  const project = openProject(projectName);
  const q = query || name.replace(/[_-]+/g, " ");
  const params = new URLSearchParams({ q, license: "cc0", source: "freesound", page_size: "20", mature: "false" });
  const res = await fetch(`https://api.openverse.org/v1/audio/?${params}`);
  if (!res.ok) die(`Openverse ${res.status}`);
  const hits = (await res.json()).results.filter((a) => a.license === "cc0" && (a.duration ?? 0) > 0 && a.duration <= 6000);
  if (!hits.length) die(`no CC0 one-shots for "${q}" — try a more literal query`);
  const a = hits[0];
  const dir = flags.library ? LIBRARY : join(project.dir, "assets", "sfx");
  const file = join(dir, `${slugify(name).replace(/-/g, "_")}.mp3`);
  await download(a.url, file);
  addCredit(project.paths.credits, {
    file: file.replace(/\\/g, "/"),
    kind: "sfx",
    source: `Openverse/${a.source}`,
    title: a.title,
    url: a.foreign_landing_url,
    creator: a.creator,
    license: "CC0 (no attribution required)",
  });
  console.log(`saved ${file}  "${a.title}" by ${a.creator} (${(a.duration / 1000).toFixed(1)}s, CC0)`);
  console.log(`check its band with: node tools/sfx.mjs list ${projectName}`);
} else die(`unknown command ${cmd}`);
