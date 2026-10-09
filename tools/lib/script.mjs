// Script ↔ transcript alignment for scripted voiceovers.
// The script is what the narrator MEANT to read, so aligning the spoken words to it (LCS over
// normalised tokens — works for Telugu/Devanagari as well as Latin) tells the clean cut:
//   - spoken words not in the script: re-reads, false starts, stumbles, ad-libs (cut candidates)
//   - script words never spoken: skipped or misread lines (tell the user)
//   - short 1:1 mismatches between matched anchors: ASR misspellings → caption textFixes
import { ts } from "./common.mjs";

export const tokenize = (text) =>
  (String(text).match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu) || []).map((t) => t.toLowerCase().replace(/’/g, "'"));

/** Proper-noun-ish terms from a script, to bias the speech-to-text (names, brands, acronyms). */
export function scriptKeyterms(text, max = 40) {
  // Narration only: skip markdown headings, list items and "**VISUAL:**"-style direction lines.
  const body = String(text)
    .split(/\r?\n/)
    .filter((l) => !/^\s*(#|[-*•]\s|\|)/.test(l) && !/^\s*\**\s*[A-Z][A-Z ]{2,}:\**/.test(l))
    .join("\n");
  const count = new Map();
  for (const m of body.matchAll(/\b([A-Z][a-z]*[A-Z][A-Za-z0-9]*|[A-Z]{2,}[a-z]?|[A-Z][a-z]+(?:\s[A-Z][a-z]+)+|[A-Z][a-z]{2,})\b/g)) {
    const t = m[1];
    if (STOP.has(t.toLowerCase()) || t.length < 3) continue;
    count.set(t, (count.get(t) || 0) + 1);
  }
  // keep camelCase brands (CodeVita), acronyms (TCS), multi-word names, and capitalised words used 2+ times
  return [...count]
    .filter(([t, n]) => /[a-z][A-Z]/.test(t) || /^[A-Z]{2,}/.test(t) || /\s/.test(t) || n >= 2)
    .map(([t]) => t)
    .slice(0, max);
}

const STOP = new Set(
  "the this that these those there here what when where which who why how only but and or so if it its it's you your we our they their he she his her is are was were be been being has have had do does did can could should would will shall may might must not no yes hey hi okay ok let let's step use put add pin comment like subscribe stay see think first second third then now also even just very really because over under after before about from into with without for of on in at to as by an a one two three four five six seven eight nine ten every most many much more some any all each other such same own".split(" "),
);

/** Longest common subsequence alignment → { matchT: Int32Array(transcript idx → script idx | -1) }. */
function lcs(a, b) {
  const n = a.length;
  const m = b.length;
  if (n * m > 60_000_000) return null; // ~2h of speech vs its script; beyond that, align in parts
  const W = m + 1;
  const dp = new Uint16Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i * W + j] = a[i] === b[j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
  const matchT = new Int32Array(n).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      matchT[i] = j;
      i++;
      j++;
    } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) i++;
    else j++;
  }
  return matchT;
}

/**
 * words: normalized transcript words [{id, text, start, end, type}]; script: plain text.
 * Returns a markdown report and suggested caption textFixes.
 */
export function alignScript(words, script) {
  const spoken = words.filter((w) => w.type === "word");
  const tw = spoken.map((w) => tokenize(w.text).join(""));
  const scriptTokens = tokenize(script);
  // Align from the END so that when a line was read twice, the LATER take is the one matched to the
  // script (narrators re-read until clean) and the earlier attempt shows up as an extra run.
  const rev = lcs([...tw].reverse(), [...scriptTokens].reverse());
  const matchT = rev && Int32Array.from(rev).reverse().map((x) => (x >= 0 ? scriptTokens.length - 1 - x : -1));
  if (!matchT) return { report: "# Script alignment\n\nScript/transcript too long to align in one pass.\n", textFixes: {} };

  const matched = [...matchT].filter((x) => x >= 0).length;
  const extras = []; // runs of spoken words with no script counterpart
  const fixes = {};
  let i = 0;
  while (i < spoken.length) {
    if (matchT[i] >= 0) {
      i++;
      continue;
    }
    let k = i;
    while (k < spoken.length && matchT[k] < 0) k++;
    // anchors around the run: if the script gap is the same length, it's a substitution (misspelling)
    const prevS = i > 0 ? matchT[i - 1] : -1;
    const nextS = k < spoken.length ? matchT[k] : scriptTokens.length;
    const gap = nextS - prevS - 1;
    if (gap === k - i && gap > 0 && gap <= 3) {
      const scriptWords = originalScriptWords(script, prevS + 1, gap);
      for (let x = 0; x < gap; x++) fixes[spoken[i + x].id] = keepPunct(spoken[i + x].text, scriptWords[x]);
    } else {
      extras.push({ from: spoken[i], to: spoken[k - 1], text: spoken.slice(i, k).map((w) => w.text).join(" ") });
    }
    i = k;
  }

  const coveredScript = new Set([...matchT].filter((x) => x >= 0));
  const missing = [];
  let s = 0;
  while (s < scriptTokens.length) {
    if (coveredScript.has(s)) {
      s++;
      continue;
    }
    let e = s;
    while (e < scriptTokens.length && !coveredScript.has(e)) e++;
    if (e - s >= 2) missing.push(scriptTokens.slice(s, e).join(" "));
    s = e;
  }

  const lines = [
    "# Script alignment (spoken vs written)",
    "",
    `- script: ${scriptTokens.length} words · spoken: ${spoken.length} words · matched: ${matched} (${Math.round((matched / Math.max(1, scriptTokens.length)) * 100)}% of the script)`,
    "- **Extra spoken runs** are where the narrator departed from the script: re-reads, false starts,",
    "  stumbles, ad-libs. Each is a cut candidate. For a line read twice the LATER take is matched and the",
    "  earlier one listed here — confirm the later take is the complete, clean one before cutting.",
    "",
    "## Extra spoken runs (not in the script)",
    "",
    ...(extras.length ? extras.map((x) => `- ${x.from.id}–${x.to.id} [${ts(x.from.start)}] "${x.text}"`) : ["- none"]),
    "",
    "## Script passages never spoken (skipped or misread — tell the user)",
    "",
    ...(missing.length ? missing.map((m) => `- "${m}"`) : ["- none"]),
    "",
    "## Suggested caption textFixes (ASR misspelling → script spelling)",
    "",
    Object.keys(fixes).length ? "```json\n" + JSON.stringify(fixes, null, 2) + "\n```" : "- none",
    "",
  ];
  return { report: lines.join("\n"), textFixes: fixes };
}

function originalScriptWords(script, startToken, count) {
  const raw = String(script).match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}]+)*/gu) || [];
  return raw.slice(startToken, startToken + count);
}

function keepPunct(spoken, scriptWord) {
  const trail = String(spoken).match(/[^\p{L}\p{M}\p{N}]+$/u)?.[0] || "";
  return (scriptWord || spoken) + trail;
}
