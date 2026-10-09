/**
 * The stage: where the video sits, frame by frame.
 *
 * v1 had one reframing (full-bleed <-> docked right) and every graphic used
 * it. v2 has six, and the overlay schedule drives which one is active:
 *
 *   full        1920x1080, untouched -- light marks only
 *   dock_right  video card on the right, graphic column on the left
 *   dock_left   mirrored -- the eye moves between beats
 *   band        video keeps the top 2/3, graphic takes a wide bottom strip
 *   corner      graphic owns the frame, video shrinks to a corner card
 *   takeover    video stays full-bleed but dims + blurs behind a full graphic
 *
 * (AI-edits: rects are computed for the current frame; see theme.setFrame.)
 *
 * Layouts blend continuously: `stageAt` returns a weighted mix of every
 * active window's target rect, so a corner -> dock move is one fluid motion
 * rather than a cut. Cropping is always uniform (one scale for both axes) --
 * a squeezed face was a real complaint on an early render.
 */
import { isBlueprint, isBroadcast, isLiquid } from "./style";
import { interpolate } from "remotion";
import {
  CAPTION_SAFE_Y,
  EDGE,
  HEIGHT,
  PORTRAIT,
  SAFE_TOP,
  WIDTH,
} from "./theme";
import type { CameraMove, Overlay, StageMode } from "./types";
import { REFRAMING, modeFor } from "./types";

/** Seconds a reframe takes, and the padding either side of a window. */
export const REFRAME = 0.62;

/** Gap between consecutive reframing overlays that stays in the same layout. */
const GAP_FILL = 3.0;

export type Rect = { x: number; y: number; w: number; h: number; r: number };

export type Stage = Rect & {
  /** 0 = full-bleed, 1 = fully reframed. Drives backdrop reveal. */
  reframed: number;
  /** Backdrop dim/blur behind a takeover. */
  dim: number;
  blur: number;
};

/**
 * Broadcast reframes the picture as a hard-edged SPLIT, not a floating card:
 * the video takes a full-height half of the frame with square corners, and the
 * "corner" mode parks it as a large flush block in the lower right rather than
 * a small rounded thumbnail. Different geometry is most of why the two styles
 * do not read as the same edit.
 */
// Landscape rects are the template's, designed for 1920x1080. Portrait has no
// left/right columns, so both dock modes put the video card at the TOP (under
// Instagram's top UI) and the graphic in the band between card and captions.
const rectsBroadcast = (): Record<StageMode, Rect> =>
  PORTRAIT
    ? {
        full: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
        dock_right: { x: 0, y: 0, w: WIDTH, h: Math.round(HEIGHT * 0.4), r: 0 },
        dock_left: { x: 0, y: 0, w: WIDTH, h: Math.round(HEIGHT * 0.4), r: 0 },
        band: { x: 0, y: 0, w: WIDTH, h: Math.round(HEIGHT * 0.42), r: 0 },
        corner: { x: WIDTH - 440, y: SAFE_TOP, w: 440, h: 248, r: 0 },
        takeover: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
      }
    : {
        full: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
        dock_right: { x: 960, y: 0, w: 960, h: HEIGHT, r: 0 },
        dock_left: { x: 0, y: 0, w: 960, h: HEIGHT, r: 0 },
        band: { x: 0, y: 0, w: WIDTH, h: 664, r: 0 },
        corner: { x: 1272, y: 512, w: 648, h: 364, r: 0 },
        takeover: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
      };

/**
 * Liquid floats EVERYTHING: even the band is an inset capsule rather than a
 * flush strip, corners are deep (44px), and the docked card sits a little
 * further in from the edges so its glass rim and shadow have room to read.
 */
const rectsLiquid = (): Record<StageMode, Rect> =>
  PORTRAIT
    ? {
        full: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
        dock_right: { x: EDGE, y: SAFE_TOP, w: WIDTH - 2 * EDGE, h: DOCK_CARD_H_PORTRAIT, r: 44 },
        dock_left: { x: EDGE, y: SAFE_TOP, w: WIDTH - 2 * EDGE, h: DOCK_CARD_H_PORTRAIT, r: 44 },
        band: { x: 36, y: 36, w: WIDTH - 72, h: Math.round(HEIGHT * 0.42) - 36, r: 44 },
        corner: { x: WIDTH - EDGE - 380, y: SAFE_TOP, w: 380, h: 240, r: 34 },
        takeover: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
      }
    : {
        full: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
        dock_right: { x: 996, y: 132, w: 840, h: 800, r: 46 },
        dock_left: { x: 84, y: 132, w: 840, h: 800, r: 46 },
        band: { x: 56, y: 48, w: WIDTH - 112, h: 616, r: 46 },
        corner: { x: 1420, y: 584, w: 416, h: 272, r: 36 },
        takeover: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
      };

/** Blueprint: glass's geometry with drafted, near-square corners (the crop
 *  brackets drawn around the picture in Doc.tsx need room, hence the inset). */
const rectsBlueprint = (): Record<StageMode, Rect> => {
  const g = rectsGlass();
  const out = {} as Record<StageMode, Rect>;
  for (const k of Object.keys(g) as StageMode[]) {
    const r = g[k];
    out[k] = r.w === WIDTH ? { ...r, r: 0 } : { x: r.x + 14, y: r.y + 14, w: r.w - 28, h: r.h - 28, r: 3 };
  }
  return out;
};

const rectsGlass = (): Record<StageMode, Rect> =>
  PORTRAIT
    ? {
        full: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
        dock_right: {
          x: EDGE,
          y: SAFE_TOP,
          w: WIDTH - 2 * EDGE,
          h: DOCK_CARD_H_PORTRAIT,
          r: 26,
        },
        dock_left: {
          x: EDGE,
          y: SAFE_TOP,
          w: WIDTH - 2 * EDGE,
          h: DOCK_CARD_H_PORTRAIT,
          r: 26,
        },
        band: { x: 0, y: 0, w: WIDTH, h: Math.round(HEIGHT * 0.42), r: 0 },
        corner: { x: WIDTH - EDGE - 380, y: SAFE_TOP, w: 380, h: 240, r: 18 },
        takeover: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
      }
    : {
        full: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
        dock_right: { x: 968, y: 116, w: 872, h: 848, r: 26 },
        dock_left: { x: 80, y: 116, w: 872, h: 848, r: 26 },
        band: { x: 0, y: 0, w: WIDTH, h: 700, r: 0 },
        // Sits above CAPTION_SAFE_Y -- the caption band would otherwise cut across
        // the bottom of this card.
        corner: { x: 1436, y: 600, w: 404, h: 264, r: 18 },
        takeover: { x: 0, y: 0, w: WIDTH, h: HEIGHT, r: 0 },
      };

/** Portrait dock card height; the graphic column starts below it. */
export const DOCK_CARD_H_PORTRAIT = 500;

/**
 * Where a graphic may draw while the picture is docked/banded, so panels never
 * sit under the video card or the caption band. Landscape keeps the template's
 * left/right column; portrait uses the strip between card and captions.
 */
export const graphicRegion = (
  mode: "dock" | "band",
  side?: "left" | "right",
) => {
  if (PORTRAIT) {
    const top =
      mode === "band"
        ? Math.round(HEIGHT * 0.42) + 30
        : isBroadcast()
          ? Math.round(HEIGHT * 0.4) + 40
          : SAFE_TOP + DOCK_CARD_H_PORTRAIT + 36;
    return {
      left: EDGE,
      width: WIDTH - 2 * EDGE,
      top,
      bottom: HEIGHT - CAPTION_SAFE_Y,
    };
  }
  if (mode === "band")
    return { left: 0, width: WIDTH, top: 700, bottom: HEIGHT - CAPTION_SAFE_Y };
  return {
    left: side === "right" ? 1012 : 80,
    width: 828,
    top: 120,
    bottom: HEIGHT - CAPTION_SAFE_Y,
  };
};

const RECTS = new Proxy({} as Record<StageMode, Rect>, {
  get: (_t, k: string) =>
    (isBroadcast()
      ? rectsBroadcast()
      : isLiquid()
        ? rectsLiquid()
        : isBlueprint()
          ? rectsBlueprint()
          : rectsGlass())[k as StageMode],
});

export type Window = { start: number; end: number; mode: StageMode };

/**
 * Close short gaps between consecutive reframing overlays that want the SAME
 * layout, so the video doesn't bounce out and straight back in. Different
 * layouts back-to-back are fine -- that transition is the point.
 */
export const fillGaps = (overlays: Overlay[]): Overlay[] => {
  const out = overlays.map((o) => ({ ...o }));
  const framing = out
    .map((o, i) => ({ o, i }))
    .filter(({ o }) => REFRAMING.has(o.type))
    .sort((a, b) => a.o.start - b.o.start);

  for (let k = 0; k < framing.length - 1; k++) {
    const cur = framing[k].o;
    const next = framing[k + 1].o;
    if (modeFor(cur) !== modeFor(next)) continue;
    const gap = next.start - (cur.start + cur.duration);
    if (gap > 0 && gap <= GAP_FILL) cur.duration = next.start - cur.start;
  }
  return out;
};

export const stageWindows = (
  overlays: Overlay[],
  totalDuration: number,
): Window[] => {
  const raw = overlays
    .filter((o) => REFRAMING.has(o.type))
    .map((o) => ({
      start: Math.max(0, o.start - REFRAME),
      end: Math.min(totalDuration, o.start + o.duration + REFRAME),
      mode: modeFor(o),
    }))
    .sort((a, b) => a.start - b.start);

  const merged: Window[] = [];
  for (const w of raw) {
    const prev = merged[merged.length - 1];
    if (prev && prev.mode === w.mode && w.start <= prev.end) {
      prev.end = Math.max(prev.end, w.end);
    } else if (prev && w.start < prev.end) {
      // Different layouts overlapping: hand over at the midpoint so the
      // reframe reads as one continuous move.
      const mid = (w.start + prev.end) / 2;
      prev.end = mid;
      merged.push({ ...w, start: mid });
    } else {
      merged.push({ ...w });
    }
  }
  return merged;
};

/** Smooth 0..1 ramp for one window at time t. */
const windowWeight = (t: number, w: Window): number => {
  if (t <= w.start - REFRAME || t >= w.end + REFRAME) return 0;
  const rampIn = interpolate(t, [w.start - REFRAME, w.start], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rampOut = interpolate(t, [w.end, w.end + REFRAME], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ease = (p: number) => p * p * (3 - 2 * p); // smoothstep
  return ease(Math.min(rampIn, rampOut));
};

export const stageAt = (t: number, windows: Window[]): Stage => {
  let weight = 0;
  const acc: Rect = { x: 0, y: 0, w: 0, h: 0, r: 0 };
  let dim = 0;
  let blur = 0;

  for (const w of windows) {
    const k = windowWeight(t, w);
    if (k <= 0) continue;
    const r = RECTS[w.mode];
    acc.x += r.x * k;
    acc.y += r.y * k;
    acc.w += r.w * k;
    acc.h += r.h * k;
    acc.r += r.r * k;
    weight += k;
    if (w.mode === "takeover") {
      dim = Math.max(dim, k);
      blur = Math.max(blur, k);
    }
  }

  const full = RECTS.full;
  const rest = Math.max(0, 1 - weight);
  const total = weight + rest;
  return {
    x: (acc.x + full.x * rest) / total,
    y: (acc.y + full.y * rest) / total,
    w: (acc.w + full.w * rest) / total,
    h: (acc.h + full.h * rest) / total,
    r: (acc.r + full.r * rest) / total,
    reframed: Math.min(1, weight),
    dim,
    blur,
  };
};

/** Which section (accent) is running at time t, from the chapter_open beats. */
export const sectionAt = (t: number, overlays: Overlay[]): number => {
  const chapters = overlays
    .filter((o) => o.type === "chapter_open")
    .sort((a, b) => a.start - b.start);
  let idx = 0;
  chapters.forEach((c, i) => {
    // A chapter_open may pin its accent (e.g. Part 1 blue/green, Part 2 red/orange).
    if (t >= c.start - REFRAME) idx = c.section ?? i;
  });
  return idx;
};

/* ------------------------------- camera ------------------------------- */

/** Camera moves are only allowed where the video is genuinely full-bleed. */
export const validCameraMoves = (
  moves: CameraMove[],
  windows: Window[],
): CameraMove[] =>
  moves.filter((m) => {
    const a = m.start;
    const b = m.start + m.duration;
    return !windows.some((w) => a < w.end + REFRAME && b > w.start - REFRAME);
  });

export const cameraScale = (t: number, moves: CameraMove[]): number => {
  let scale = 1;
  for (const m of moves) {
    const a = m.start;
    const b = m.start + m.duration;
    if (t < a || t > b) continue;
    const p = (t - a) / Math.max(0.001, m.duration);
    if (m.kind === "punch_in") {
      // fast in, hold, ease back
      const up = interpolate(p, [0, 0.18], [1, m.scale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      const down = interpolate(p, [0.72, 1], [m.scale, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      scale *= p < 0.45 ? up : down;
    } else if (m.kind === "pull_out") {
      scale *= interpolate(p, [0, 1], [m.scale, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    } else if (m.kind === "whip") {
      // quick lateral shove that settles -- used on hard transitions
      const k = Math.sin(Math.PI * Math.min(1, p * 1.6));
      scale *= 1 + (m.scale - 1) * k;
    } else {
      scale *= interpolate(p, [0, 1], [1, m.scale], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
  }
  return scale;
};
