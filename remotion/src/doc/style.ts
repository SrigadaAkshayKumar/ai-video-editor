/**
 * Visual STYLE VARIANTS -- a second edit pattern, selectable per render.
 *
 * Why this exists: the first faceless documentary and this one used the same
 * language (frosted glass cards, soft spring settles, a floating rounded video
 * card, a top chapter rail). The note was that a new video "feels like I am
 * watching my previous documentary" -- the edit pattern needs OPTIONS, not a
 * tweak.
 *
 * So the picture language is now a profile, not a constant. The scene plan,
 * the overlay list and every component stay exactly the same; what changes is
 * how surfaces are drawn, how things arrive, how the frame is divided and what
 * chrome runs around the edge.
 *
 *   "glass"     -- the original: frosted translucent cards, soft spring
 *                  settles, rounded floating video card, top chapter rail.
 *   "broadcast" -- flat editorial: opaque panels with a hard accent keyline
 *                  and square corners, clip-path wipes instead of springs,
 *                  split-screen framing instead of a floating card, a bottom
 *                  progress bar and an oversized section numeral.
 *
 *   "liquid"    -- liquid glass (iOS-26 style): near-clear refractive capsules
 *                  with specular rims over a moving aurora field, jelly-spring
 *                  arrivals, a floating capsule chapter rail, deep round corners.
 *
 *   "blueprint" -- drafting table / terminal: deep navy field with a major +
 *                  minor grid, hairline cyan-ink panels with corner brackets
 *                  and square corners, monospace type, stepped "plotter"
 *                  arrivals (quantised, no float), a shell-prompt status bar
 *                  for the chapter rail and registration marks round the edge.
 *
 *   "cleantech" -- light, minimal product-explainer: off-white paper with a
 *                  faint dot grid, white cards with a hairline slate border and
 *                  a soft long shadow, slate ink type, one cool accent per
 *                  chapter, critically-damped arrivals (no overshoot) and a
 *                  thin segmented chapter rail. The only LIGHT variant: theme
 *                  colours (TEXT, fg(), shade(), PAPER) flip with it.
 *
 * Set once at the top of the composition; every module reads it through
 * `style()`. Adding a third variant means adding a branch here and in the
 * three places that consult it (theme surfaces, stage rects, motion curves).
 */

export type StyleName = "glass" | "broadcast" | "liquid" | "blueprint" | "cleantech";

let CURRENT: StyleName = "glass";

export const setStyle = (s: StyleName | undefined | null): void => {
  CURRENT = s === "broadcast" || s === "liquid" || s === "blueprint" || s === "cleantech" ? s : "glass";
};

export const style = (): StyleName => CURRENT;

export const isBroadcast = (): boolean => CURRENT === "broadcast";

export const isLiquid = (): boolean => CURRENT === "liquid";

export const isBlueprint = (): boolean => CURRENT === "blueprint";

export const isCleantech = (): boolean => CURRENT === "cleantech";
