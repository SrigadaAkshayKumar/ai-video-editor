/** Shapes of the JSON tools/render-visuals.mjs hands to Remotion as input props. */

export type ChartItem = {
  label: string;
  value?: number;
  sublabel?: string;
  state?: "yes" | "no" | "maybe";
  /** step_progress: seconds into the overlay at which this step becomes active. */
  at?: number;
};

/**
 * v2 overlay vocabulary, grouped by the STAGE LAYOUT each one drives (see
 * stage.ts). The layout is inferred from the type, so the planner picks a
 * component for what the speaker is saying and the framing follows.
 */
export type OverlayType =
  // --- takeover: the graphic owns the frame, video dims and blurs behind ---
  | "chapter_open" // section intro: number, kinetic title, accent wipe
  | "big_statement" // the punchline, as full-frame typography
  | "word_swap" // "X -> Y": first term struck through, second slams in
  | "quote_pull" // a viewer question / quoted line
  // --- corner: graphic full-frame, video shrinks to a small corner card ---
  | "number_roll" // one huge odometer figure
  | "stat_trio" // three figures landing in sequence
  | "flow_diagram" // nodes joined by arrows that draw on
  | "matrix_grid" // grid of chips popping in
  | "checklist" // ticks and crosses
  | "data_table" // a real table, rows printing in on cue (+ optional code listing)
  // --- dock: video as a card on one side, graphic on the other ---
  | "bar_chart"
  | "line_chart"
  | "donut_chart"
  | "progress_ring"
  | "step_progress"
  | "timeline"
  | "bullet_list"
  | "comparison"
  | "term_card" // dictionary-style term + definition
  // --- band: video keeps the top of the frame, graphic takes a wide strip ---
  | "fact_band"
  // --- full: video stays full-bleed, light marks on top ---
  | "keyword_chip"
  | "lower_third"
  | "side_note"
  | "annotation" // drawn underline / circle / bracket around a floating word
  | "marquee_strip" // thin strip with a scrolling repeated phrase
  // --- takeover, faceless only: pull the viewer into the video ---
  | "poll_prompt" // a question put to the audience, options filling in
  | "title_slide" // the opening title, over the first line of narration
  // --- full: a light mark that never reframes the picture ---
  | "speed_hint" // "watch at 1.5x", slides in near the top and leaves
  | "sample_answer" // a reference card the viewer is meant to screenshot
  // --- takeover: a solved-question explainer's problem card + think timer ---
  | "question_card";

export type Overlay = {
  railLabel?: string;
  numeral?: string;
  start: number;
  duration: number;
  type: OverlayType;
  text?: string;
  eyebrow?: string;
  side?: "left" | "right";
  value?: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  items?: ChartItem[];
  current_step?: number;
  current?: number;
  left?: { label: string; text: string };
  right?: { label: string; text: string };
  from?: string; // word_swap: the term being replaced
  to?: string; // word_swap: the term replacing it
  shape?: "underline" | "circle" | "bracket"; // annotation
  section?: number; // accent index; defaults to the running chapter
  style_hint?: string;
  // data_table
  columns?: string[];
  rows?: { cells: string[]; at?: number; color?: string }[];
  footer?: string;
  footer_at?: number;
  code?: string;
  // question_card: a "pause and solve" countdown of `timer` s, starting `timer_at` s into the overlay
  timer?: number;
  timer_at?: number;
};

export type CameraMove = {
  start: number;
  duration: number;
  kind: "punch_in" | "drift_in" | "pull_out" | "whip";
  scale: number;
  reason?: string;
};

/**
 * A cutaway over the talking head. The dialogue keeps running underneath --
 * only the PICTURE changes -- so a b-roll cut is scheduled purely against what
 * the speaker is saying, and never against the audio.
 *
 * It draws into the same 1920x1080 picture rect the face does, which means the
 * stage crops it identically: a cutaway during a docked beat appears inside the
 * video card, not over the whole frame. The planner still keeps them out of
 * `corner` and `takeover` windows, where the picture is too small to be worth
 * cutting away to.
 */
export type BRoll = {
  start: number;
  duration: number;
  /** Path under the render public dir (assets/broll/...). */
  src: string;
  /** CSS object-position for the cover crop. */
  position?: string;
  /** Where in the source clip to start playing, seconds. */
  media_start?: number;
  motion?: SceneMotion;
  grade?: SceneGrade;
  /** How it arrives AND leaves; `cut` is hard both ways. */
  transition?: SceneTransition;
  /** What the planner asked for; resolved to `src` by fetch_broll. Not drawn. */
  query?: string;
  reason?: string;
};

/* ------------------------------------------------------------------ */
/* Faceless documentary: there is no talking head, so the picture layer */
/* is a scene track instead of a subclip track. Everything else (stage  */
/* layouts, overlays, camera) is shared with Main.                      */
/* ------------------------------------------------------------------ */

export type SceneKind =
  | "broll" // stock video clip, played and Ken-Burns'd
  | "still" // stock photo / generated still, Ken-Burns'd
  | "news" // a real article screenshot, in a browser frame with attribution
  | "graphic"; // no media at all -- the accent field, so overlays own the frame

export type SceneMotion =
  | "static"
  | "ken_in"
  | "ken_out"
  | "pan_left"
  | "pan_right";

/** How this scene arrives. `cut` is a hard cut, the rest cost ~0.4s. */
export type SceneTransition = "cut" | "fade" | "whip" | "flash";

/** Colour treatment. The grade is how the picture carries the tension curve. */
export type SceneGrade = "neutral" | "cool" | "warm" | "noir" | "hot";

export type Scene = {
  index: number;
  /** Final-cut timeline, seconds. */
  start: number;
  end: number;
  kind: SceneKind;
  /** Path under the render public dir. Omit for `graphic`. */
  src?: string;
  /** 9:16 alternative (e.g. a mobile-width news capture). */
  src_portrait?: string;
  /** CSS object-position for cover-cropped media, e.g. "30% 50%". */
  position?: string;
  /** For `broll`: where in the source clip to start playing, seconds. */
  media_start?: number;
  motion?: SceneMotion;
  transition?: SceneTransition;
  grade?: SceneGrade;
  /** `news` only: attribution drawn under the frame. */
  source?: string;
  headline?: string;
  date?: string;
  url?: string;
  /** `news` only: normalised (0..1) rect of the screenshot to underline. */
  highlight?: { x: number; y: number; w: number; h: number };
  /** 9:16 capture: the headline sits elsewhere on a mobile-width page. */
  highlight_portrait?: { x: number; y: number; w: number; h: number };
  /** `graphic` only: a type slab drawn in the picture, so a docked/corner
   *  graphic scene shows a big number or word in the card instead of an
   *  empty field (faceless edits without stock footage). */
  card?: { value: string; label?: string };
  /** Planner's note; not drawn. */
  reason?: string;
};

/**
 * Props for the `Doc` composition (AI-edits). One composition for both modes:
 *   talking  -- the clean cut (one frame-accurate file) is the picture, with
 *               b-roll islands punched into it
 *   faceless -- the scene track is the picture
 * The render is MUTED: dialogue/VO, music and SFX are mixed by tools/mix.mjs.
 * Paths are relative to the render's --public-dir (projects/<p>/render/).
 */
export type DocProps = {
  mode: "talking" | "faceless";
  styleVariant?: "glass" | "broadcast" | "liquid" | "blueprint" | "cleantech";
  width: number;
  height: number;
  fps: number;
  durationInSeconds: number;
  aroll?: { src: string; position?: string };
  scenes?: Scene[];
  overlays: Overlay[];
  brolls?: BRoll[];
  cameraMoves: CameraMove[];
  /** Hide the chapter rail (e.g. a short with a single section). */
  rail?: boolean;
};

/** Which stage layout each overlay type asks for. */
export type StageMode =
  | "full"
  | "dock_right"
  | "dock_left"
  | "band"
  | "corner"
  | "takeover";

const TAKEOVER: OverlayType[] = [
  "chapter_open",
  "big_statement",
  "word_swap",
  "quote_pull",
  "poll_prompt",
  "title_slide",
  "question_card",
];
const CORNER: OverlayType[] = [
  "number_roll",
  "stat_trio",
  "flow_diagram",
  "matrix_grid",
  "checklist",
  "data_table",
];
const DOCK: OverlayType[] = [
  "bar_chart",
  "line_chart",
  "donut_chart",
  "progress_ring",
  "step_progress",
  "timeline",
  "bullet_list",
  "comparison",
  "term_card",
];
const BAND: OverlayType[] = ["fact_band"];

export const modeFor = (ov: Overlay): StageMode => {
  if (TAKEOVER.includes(ov.type)) return "takeover";
  if (CORNER.includes(ov.type)) return "corner";
  if (BAND.includes(ov.type)) return "band";
  if (DOCK.includes(ov.type)) {
    // "side" names the side the GRAPHIC sits on; the video docks opposite.
    return ov.side === "right" ? "dock_left" : "dock_right";
  }
  return "full";
};

/** Types that reframe the video (anything but a light mark on full-bleed). */
export const REFRAMING = new Set<OverlayType>([
  ...TAKEOVER,
  ...CORNER,
  ...DOCK,
  ...BAND,
]);
