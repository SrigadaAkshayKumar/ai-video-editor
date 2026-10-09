/**
 * Design tokens for the v2 visual system (ported from video-editor-template).
 *
 * v1 had exactly one look: a glass card in a left panel with the video docked
 * right, for every single beat. The note that killed it was "very monotonous --
 * a few text visuals, a few screen partitions with graphics on the left,
 * that's it." v2 treats VARIETY as a first-class constraint: six stage layouts
 * (stage.ts), a per-section accent colour, four surface treatments and a
 * motion vocabulary where each overlay family enters differently.
 *
 * FRAME-AWARE (AI-edits addition): the template was 1920x1080 only. Here the
 * frame size is set once per render with setFrame(), and the exported
 * WIDTH/HEIGHT/CAPTION_SAFE_Y/TYPE/SAFE_TOP/PORTRAIT bindings are live (ES
 * module `export let`), so every module reads the current frame. 9:16 keeps
 * readable content between SAFE_TOP (Instagram's top UI) and CAPTION_SAFE_Y
 * (the caption band, drawn later by HyperFrames and invisible to Remotion).
 */
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadTelugu } from "@remotion/google-fonts/NotoSansTelugu";
import { loadFont as loadDevanagari } from "@remotion/google-fonts/NotoSansDevanagari";
import { isBlueprint, isBroadcast, isCleantech, isLiquid } from "./style";

const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});
const mono = loadMono("normal", {
  weights: ["400", "500", "700", "800"],
  subsets: ["latin"],
});
loadTelugu("normal", { weights: ["500", "700"], subsets: ["telugu"] });
loadDevanagari("normal", { weights: ["500", "700"], subsets: ["devanagari"] });

/* ------------------------------- frame ------------------------------- */

export let WIDTH = 1920;
export let HEIGHT = 1080;
export let PORTRAIT = false;
/** Nothing that must stay readable may sit below this line (caption band). */
export let CAPTION_SAFE_Y = 900;
/** Nothing readable above this line (9:16: Instagram's top bar / chapter rail). */
export let SAFE_TOP = 120;
/** Default horizontal margin for anything hugging a frame edge. */
export let EDGE = 84;
export const FPS = 30;

const TYPE_LANDSCAPE = {
  hero: 148,
  display: 104,
  title: 72,
  headline: 52,
  body: 38,
  label: 27,
  micro: 21,
};
const TYPE_PORTRAIT = {
  hero: 132,
  display: 92,
  title: 66,
  headline: 50,
  body: 38,
  label: 27,
  micro: 22,
};

/** Type scale. Deliberately wide: a full-frame moment should dwarf an aside. */
export const TYPE = { ...TYPE_LANDSCAPE };

export const setFrame = (w: number, h: number): void => {
  syncPalette();
  WIDTH = w;
  HEIGHT = h;
  PORTRAIT = h > w;
  if (PORTRAIT) {
    // Instagram UI covers roughly y<220 and y>1500 of 1920; the caption band sits ~1340-1500.
    CAPTION_SAFE_Y = Math.round(h * 0.698); // 1340 @1920
    SAFE_TOP = Math.round(h * 0.14); // 270 @1920
    EDGE = 60;
    Object.assign(TYPE, TYPE_PORTRAIT);
  } else {
    CAPTION_SAFE_Y = Math.round(h * 0.833); // 900 @1080
    SAFE_TOP = Math.round(h * 0.111); // 120 @1080
    EDGE = Math.round(w * 0.044); // 84 @1920
    Object.assign(TYPE, TYPE_LANDSCAPE);
  }
};

/** Pick a value by orientation. */
export const pick = <T>(landscape: T, portrait: T): T =>
  PORTRAIT ? portrait : landscape;

/* ------------------------------- colour ------------------------------- */

/** Dark-surface categorical slots for real data. Fixed order, never remapped. */
export const SERIES = ["#3987e5", "#d95926", "#199e70"] as const;

/** One accent per chapter: rails, rules, chip fills, underlines and glows. */
export const ACCENTS = [
  "#5b9dff",
  "#22c3ae",
  "#f5a83c",
  "#b57cf5",
  "#3fca77",
] as const;
const ACCENTS_BROADCAST = [
  "#ffb300",
  "#00d9c0",
  "#ff5a3c",
  "#c9a2ff",
  "#7dd957",
] as const;

/** Liquid: system-style tints -- bright enough to read through clear glass. */
const ACCENTS_LIQUID = [
  "#64d2ff",
  "#0a84ff",
  "#ff453a",
  "#ff9f0a",
  "#30d158",
] as const;

/** Blueprint: drafting-pen inks -- cyan, amber, lime, violet, coral -- on navy. */
const ACCENTS_BLUEPRINT = [
  "#4fd1ff",
  "#ffb547",
  "#9be15d",
  "#b18cff",
  "#ff6b5b",
] as const;

/** Cleantech: cool inks dark enough to read on white (Tailwind 600s). */
const ACCENTS_CLEANTECH = [
  "#2563eb",
  "#0d9488",
  "#7c3aed",
  "#ea580c",
  "#0891b2",
] as const;

/** The accent set actually in force, per style variant. */
export const accents = (): readonly string[] =>
  isCleantech()
    ? ACCENTS_CLEANTECH
    : isBroadcast()
    ? ACCENTS_BROADCAST
    : isLiquid()
      ? ACCENTS_LIQUID
      : isBlueprint()
        ? ACCENTS_BLUEPRINT
        : ACCENTS;

/** Blueprint ink: the hairline colour every panel edge and grid line is drawn in. */
export const BP_INK = "#7fd3ff";
export const BP_PAPER = "#061428";

/**
 * Ink and paper flip with the style: every dark variant draws white type on a
 * near-black field; cleantech draws slate type on off-white paper. Live
 * bindings, re-set by syncPalette() (called from setFrame, after setStyle).
 */
export let INK = "#05070c";
export let TEXT = "#ffffff";
export let TEXT_DIM = "#dfe3ea";
export let TEXT_FAINT = "#93a0b4";
/** The frame's floor colour. */
export let PAPER = "#05070c";
/** Type/glyphs sitting ON an accent fill (chips, active steps, washes). */
export let ON_ACCENT = "#05070c";
/** A raised fill for inactive nodes/steps (cleantech: a pale slate). */
export let RAISED = "#0b1220";

/** Cleantech paper + card. */
export const CT_PAPER = "#f4f6f9";
const CT_CARD = "#ffffff";
const CT_LINE = "rgba(15,23,42,0.10)";
const CT_SHADOW = "0 1px 2px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.10)";

export const syncPalette = (): void => {
  const light = isCleantech();
  INK = light ? "#ffffff" : "#05070c";
  TEXT = light ? "#0f172a" : "#ffffff";
  TEXT_DIM = light ? "#334155" : "#dfe3ea";
  TEXT_FAINT = light ? "#64748b" : "#93a0b4";
  PAPER = light ? CT_PAPER : "#05070c";
  ON_ACCENT = light ? "#ffffff" : "#05070c";
  RAISED = light ? "#e8edf4" : "#0b1220";
};

/** Foreground tint at alpha: white on the dark styles, slate ink on cleantech
 *  (hairlines, tracks, faint fills -- anything that was rgba(255,255,255,a)). */
export const fg = (a: number): string =>
  isCleantech() ? `rgba(15,23,42,${Math.min(1, a * 0.8).toFixed(3)})` : `rgba(255,255,255,${a})`;

/** Shadow colour at alpha: black on the dark styles, a soft slate on paper. */
export const shade = (a: number): string =>
  isCleantech() ? `rgba(15,23,42,${(a * 0.22).toFixed(3)})` : `rgba(0,0,0,${a})`;

export const FONT_STACK = `${inter.fontFamily}, "Noto Sans Telugu", "Noto Sans Devanagari", "Segoe UI", Arial, sans-serif`;
export const MONO_STACK = `${mono.fontFamily}, Consolas, monospace`;

export const RADIUS = { card: 22, chip: 999, slab: 6 } as const;

/** Square, printed corners in broadcast; rounded, floating in glass. */
export const radius = (k: keyof typeof RADIUS): number =>
  isCleantech()
    ? k === "chip"
      ? 999
      : 16
    : isBlueprint()
    ? k === "slab"
      ? 0
      : 3
    : isBroadcast()
    ? k === "chip"
      ? 3
      : 0
    : isLiquid()
      ? RADIUS_LIQUID[k]
      : RADIUS[k];

/** Liquid glass: deep continuous corners, everything reads as a capsule. */
const RADIUS_LIQUID = { card: 38, chip: 999, slab: 30 } as const;

/** Broadcast sets type bigger and tighter -- it is a poster, not a card. */
export const type = (k: keyof typeof TYPE): number =>
  isBroadcast()
    ? Math.round(TYPE[k] * 1.1)
    : isBlueprint()
      ? Math.round(TYPE[k] * 0.9) // monospace sets ~20% wider than Inter
      : TYPE[k];

export const tracking = (): number =>
  isCleantech() ? -0.8 : isBroadcast() ? -1.4 : isLiquid() ? -0.6 : isBlueprint() ? -1 : 0;

/** Root typeface: blueprint sets EVERYTHING in the monospace -- it is a terminal. */
export const rootFont = (): string => (isBlueprint() ? MONO_STACK : FONT_STACK);

/**
 * Blueprint's signature: crop-mark corner brackets drawn as background
 * gradients (no extra DOM), so any surface that spreads glass()/slab() gets
 * them for free.
 */
export const bpBrackets = (
  color = "rgba(255,255,255,0.92)",
  len = 22,
  w = 2,
): React.CSSProperties => {
  const g = `linear-gradient(${color}, ${color})`;
  return {
    backgroundImage: Array(8).fill(g).join(", "),
    backgroundRepeat: "no-repeat",
    backgroundSize: [
      `${len}px ${w}px`, `${w}px ${len}px`,
      `${len}px ${w}px`, `${w}px ${len}px`,
      `${len}px ${w}px`, `${w}px ${len}px`,
      `${len}px ${w}px`, `${w}px ${len}px`,
    ].join(", "),
    backgroundPosition: [
      "top left", "top left",
      "top right", "top right",
      "bottom left", "bottom left",
      "bottom right", "bottom right",
    ].join(", "),
  };
};
const BP_MINOR_GRID = `linear-gradient(rgba(127,211,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(127,211,255,0.07) 1px, transparent 1px)`;

/**
 * Liquid glass, the material. Almost no tint -- the colour comes from what is
 * behind it -- a light blur with boosted saturation/brightness, an SVG lens
 * (LiquidDefs in Background.tsx) bending the backdrop, and the rims that sell
 * it: a bright specular edge top-left, a fainter one bottom-right, an inner
 * glow, and a soft floating shadow.
 */
const LIQUID_BACKDROP =
  "url(#liquid-lens) blur(7px) saturate(185%) brightness(1.1)";
export const liquidRim = (strength = 1): string =>
  [
    `inset 1.5px 2px 0 rgba(255,255,255,${0.62 * strength})`,
    `inset -1px -1.5px 0 rgba(255,255,255,${0.26 * strength})`,
    `inset 0 0 28px rgba(255,255,255,${0.13 * strength})`,
    `inset 0 -18px 30px -18px rgba(255,255,255,${0.16 * strength})`,
  ].join(", ");
const liquid = (
  tint: number,
  extra: React.CSSProperties = {},
): React.CSSProperties =>
  ({
    backgroundColor: `rgba(255,255,255,${tint})`,
    backgroundImage:
      "linear-gradient(150deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 32%, rgba(255,255,255,0) 55%, rgba(255,255,255,0.07) 100%)",
    backdropFilter: LIQUID_BACKDROP,
    WebkitBackdropFilter: LIQUID_BACKDROP,
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: RADIUS_LIQUID.card,
    boxShadow: `${liquidRim()}, 0 22px 60px rgba(0,0,0,0.38)`,
    ...extra,
  }) as React.CSSProperties;

/** A liquid pane for a whole graphic column (liquid only; {} otherwise). */
export const liquidPane = (): React.CSSProperties =>
  isLiquid()
    ? liquid(0.05, {
        backgroundColor: "rgba(14,18,30,0.30)",
        padding: PORTRAIT ? "34px 36px" : "48px 54px",
      })
    : {};

/* ------------------------------------------------------------------ */
/* Surfaces -- four distinct treatments, not one glass card everywhere */
/* ------------------------------------------------------------------ */

/** Frosted translucent card. Reads well over busy video. */
export const glass = (): React.CSSProperties =>
  isCleantech()
    ? {
        backgroundColor: CT_CARD,
        border: `1px solid ${CT_LINE}`,
        borderRadius: 16,
        boxShadow: CT_SHADOW,
      }
    : isLiquid()
    ? liquid(0.06)
    : isBlueprint()
    ? {
        backgroundColor: "rgba(6,20,40,0.86)",
        ...bpBrackets(),
        border: `1px solid ${withAlpha(BP_INK, 0.5)}`,
        borderRadius: 3,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.45), 0 0 26px ${withAlpha(BP_INK, 0.1)}`,
      }
    : isBroadcast()
    ? {
        backgroundColor: "rgba(8,10,14,0.92)",
        border: "none",
        borderLeft: "5px solid rgba(255,255,255,0.92)",
        borderRadius: 0,
        boxShadow: "14px 14px 0 rgba(0,0,0,0.55)",
      }
    : ({
        backgroundColor: "rgba(16,24,42,0.46)",
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 58%)",
        backdropFilter: "blur(34px) saturate(140%)",
        WebkitBackdropFilter: "blur(34px) saturate(140%)",
        border: "1px solid rgba(255,255,255,0.30)",
        borderRadius: RADIUS.card,
        boxShadow:
          "0 12px 38px rgba(0,0,0,0.46), inset 0 1.5px 0 rgba(255,255,255,0.40)",
      } as React.CSSProperties);

/** Opaque editorial slab: for when the graphic owns the frame. */
export const slab = (): React.CSSProperties =>
  isCleantech()
    ? {
        backgroundColor: CT_CARD,
        border: `1px solid ${CT_LINE}`,
        borderRadius: 20,
        boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 24px 60px rgba(15,23,42,0.12)",
      }
    : isBlueprint()
    ? {
        backgroundColor: BP_PAPER,
        backgroundImage: BP_MINOR_GRID,
        backgroundSize: "24px 24px",
        border: `1px solid ${withAlpha(BP_INK, 0.45)}`,
        borderTop: `3px solid ${BP_INK}`,
        borderRadius: 0,
        boxShadow: "0 18px 50px rgba(0,0,0,0.5)",
      }
    : isLiquid()
    ? liquid(0.04, {
        backgroundColor: "rgba(12,16,28,0.55)",
        borderRadius: RADIUS_LIQUID.slab,
      })
    : isBroadcast()
    ? {
        backgroundColor: "#07090d",
        border: "none",
        borderTop: "3px solid rgba(255,255,255,0.90)",
        borderRadius: 0,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
      }
    : {
        backgroundColor: "rgba(9,14,26,0.94)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: RADIUS.card,
        boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
      };

/** Outline-only. Nearly weightless -- for annotations over a live face. */
export const outline = (accent: string): React.CSSProperties =>
  isCleantech()
    ? {
        backgroundColor: "rgba(255,255,255,0.94)",
        border: `1.5px solid ${withAlpha(accent, 0.7)}`,
        borderRadius: 14,
        boxShadow: CT_SHADOW,
      }
    : isBlueprint()
    ? {
        backgroundColor: "rgba(4,12,26,0.66)",
        border: `2px dashed ${accent}`,
        borderRadius: 3,
        boxShadow: "none",
      }
    : isLiquid()
    ? liquid(0.04, {
        border: `1.5px solid ${withAlpha(accent, 0.75)}`,
        boxShadow: `${liquidRim(0.8)}, 0 0 26px ${withAlpha(accent, 0.28)}`,
      })
    : isBroadcast()
    ? {
        backgroundColor: "rgba(0,0,0,0.62)",
        border: `3px solid ${accent}`,
        borderRadius: 0,
        boxShadow: "none",
      }
    : {
        backgroundColor: "rgba(5,8,16,0.34)",
        border: `2px solid ${accent}`,
        borderRadius: RADIUS.card,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.35), 0 10px 30px rgba(0,0,0,0.40)",
      };

/** Saturated accent wash. The loudest surface; reserve it for one beat. */
export const wash = (accent: string): React.CSSProperties =>
  isLiquid()
    ? liquid(0, {
        backgroundColor: withAlpha(accent, 0.62),
        boxShadow: `${liquidRim(1.2)}, 0 20px 56px ${withAlpha(accent, 0.38)}`,
      })
    : washFlat(accent);
const washFlat = (accent: string): React.CSSProperties => ({
  backgroundColor: accent,
  border: "none",
  borderRadius: isBroadcast() ? 0 : isBlueprint() ? 3 : isCleantech() ? 16 : RADIUS.card,
  boxShadow: isBroadcast()
    ? "14px 14px 0 rgba(0,0,0,0.5)"
    : isCleantech()
      ? `0 14px 36px ${accent}33`
      : isBlueprint()
      ? `0 0 0 3px ${BP_PAPER}, 0 0 0 4.5px ${accent}, 0 0 40px ${withAlpha(accent, 0.3)}`
      : `0 18px 50px ${accent}44`,
});

export const withAlpha = (hex: string, alpha: number): string => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};
