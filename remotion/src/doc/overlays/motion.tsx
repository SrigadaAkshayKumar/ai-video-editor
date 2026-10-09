/**
 * Motion vocabulary.
 *
 * v1 had exactly one entrance -- a spring rise + fade -- on every overlay,
 * which is most of why the edit read as monotonous. Each hook here is a
 * DIFFERENT way for something to arrive, and each overlay family picks one
 * that suits what it is: numbers roll, lists stagger, statements wipe,
 * annotations draw, terms type.
 */
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { isBlueprint, isBroadcast, isCleantech, isLiquid } from "../style";

/**
 * Blueprint: a pen plotter / terminal redraw -- progress advances in hard
 * steps (`steps` per move, on whole frames) with an ease-out, so a card
 * "prints" into place in a few visible ticks instead of gliding.
 */
const plot = (frame: number, start: number, len: number, steps = 5) => {
  const p = interpolate(frame, [start, start + len], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 2),
  });
  return p >= 1 ? 1 : Math.floor(p * steps) / steps;
};

/** Local progress helpers -- `frame` is relative to the overlay's Sequence. */
export const useLocal = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return { frame, fps, durationInFrames, t: frame / fps };
};

/** Standard exit fade so nothing ever pops off. */
export const useExit = (seconds = 0.34) => {
  const { frame, fps, durationInFrames } = useLocal();
  const f = Math.min(Math.round(fps * seconds), durationInFrames / 2);
  return interpolate(frame, [durationInFrames - f, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/** A: spring settle -- weight arriving. For cards and slabs.
 *  In broadcast this becomes a fast, near-linear snap with no float: things
 *  cut into place the way a broadcast lower third does, rather than easing in. */
export const useSettle = (delay = 0, mass = 0.7) => {
  const { frame, fps } = useLocal();
  if (isBlueprint()) return plot(frame, delay * fps, fps * 0.3, 5);
  if (isBroadcast()) {
    return interpolate(frame, [delay * fps, delay * fps + fps * 0.22], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (p) => 1 - Math.pow(1 - p, 4),
    });
  }
  if (isLiquid()) {
    // Liquid: a droplet landing -- a soft overshoot that wobbles once and settles.
    return spring({
      frame: frame - Math.round(delay * fps),
      fps,
      config: { damping: 11, stiffness: 120, mass: mass * 0.9 },
      durationInFrames: Math.round(fps * 0.9),
    });
  }
  return spring({
    frame: frame - Math.round(delay * fps),
    fps,
    config: { damping: 200, mass },
    durationInFrames: Math.round(fps * 0.55),
  });
};

/** B: overshooting slide from an edge -- for chips and lower thirds.
 *  Broadcast removes the bounce entirely: a hard horizontal push that stops
 *  dead. The absence of overshoot is a large part of the different feel. */
export const useShove = (delay = 0) => {
  const { frame, fps } = useLocal();
  if (isBlueprint()) return plot(frame, delay * fps, fps * 0.28, 4);
  if (isCleantech()) {
    // Cleantech: a precise ease-out glide, no overshoot -- product UI, not a toy.
    return interpolate(frame, [delay * fps, delay * fps + fps * 0.42], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (p) => 1 - Math.pow(1 - p, 3),
    });
  }
  if (isBroadcast()) {
    return interpolate(frame, [delay * fps, delay * fps + fps * 0.26], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (p) => 1 - Math.pow(1 - p, 5),
    });
  }
  return spring({
    frame: frame - Math.round(delay * fps),
    fps,
    config: { damping: 13, stiffness: 140, mass: 0.55 },
    durationInFrames: Math.round(fps * 0.8),
  });
};

/** C: linear wipe 0..1 -- for clip-path reveals and drawn strokes. */
export const useWipe = (seconds = 0.5, delay = 0) => {
  const { frame, fps } = useLocal();
  return interpolate(frame, [delay * fps, (delay + seconds) * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

/** D: staggered progress for the nth item in a list/grid.
 *  Broadcast snaps each row in on a tighter step, so a list reads as a
 *  rundown being punched up rather than items blooming in. */
export const useStagger = (index: number, step = 0.11, delay = 0) => {
  const { frame, fps } = useLocal();
  if (isBlueprint()) {
    // Rows print one after another like lines scrolling into a terminal.
    const d = delay + index * step * 0.8;
    return plot(frame, d * fps, fps * 0.2, 3);
  }
  if (isBroadcast()) {
    const d = delay + index * (step * 0.62);
    return interpolate(frame, [d * fps, d * fps + fps * 0.18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: (p) => 1 - Math.pow(1 - p, 4),
    });
  }
  if (isLiquid()) {
    return spring({
      frame: frame - Math.round((delay + index * step * 1.15) * fps),
      fps,
      config: { damping: 12, stiffness: 150, mass: 0.5 },
      durationInFrames: Math.round(fps * 0.75),
    });
  }
  return spring({
    frame: frame - Math.round((delay + index * step) * fps),
    fps,
    config: { damping: 200, mass: 0.5 },
    durationInFrames: Math.round(fps * 0.5),
  });
};

/** E: count-up towards a target, settling after the card has landed. */
export const useCountUp = (target: number, seconds = 1.15, delay = 0.18) => {
  const { frame, fps } = useLocal();
  const p = spring({
    frame: frame - Math.round(delay * fps),
    fps,
    config: { damping: 200, mass: 1.1 },
    durationInFrames: Math.round(fps * seconds),
  });
  return target * p;
};

/** F: typewriter -- returns how many characters are visible. */
export const useTypewriter = (text: string, cps = 26, delay = 0.1) => {
  const { frame, fps } = useLocal();
  const elapsed = Math.max(0, frame / fps - delay);
  return Math.min(text.length, Math.floor(elapsed * cps));
};

/* ------------------------------ components ----------------------------- */

/** Word-by-word rise. The workhorse for statements and titles. */
export const Words: React.FC<{
  text: string;
  step?: number;
  delay?: number;
  rise?: number;
  highlight?: string;
  accent?: string;
  style?: React.CSSProperties;
}> = ({
  text,
  step = 0.07,
  delay = 0,
  rise = 22,
  highlight,
  accent,
  style,
}) => {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span style={style}>
      {words.map((w, i) => (
        <Word
          key={`${w}-${i}`}
          word={w}
          index={i}
          step={step}
          delay={delay}
          rise={rise}
          color={
            highlight &&
            w.toLowerCase().replace(/[^a-z0-9]/g, "") ===
              highlight.toLowerCase().replace(/[^a-z0-9]/g, "")
              ? accent
              : undefined
          }
        />
      ))}
    </span>
  );
};

const Word: React.FC<{
  word: string;
  index: number;
  step: number;
  delay: number;
  rise: number;
  color?: string;
}> = ({ word, index, step, delay, rise, color }) => {
  const p = useStagger(index, step, delay);
  return (
    <span
      style={{
        display: "inline-block",
        marginRight: "0.24em",
        opacity: p,
        color,
        transform: `translateY(${(1 - p) * rise}px)`,
      }}
    >
      {word}
    </span>
  );
};

/**
 * Letters that arrive individually with a slight blur -- heavier than Words,
 * used for the one or two moments that need to feel like an impact.
 */
export const Letters: React.FC<{
  text: string;
  step?: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ text, step = 0.028, delay = 0, style }) => (
  <span style={style}>
    {text.split("").map((c, i) => (
      <Letter key={i} ch={c} index={i} step={step} delay={delay} />
    ))}
  </span>
);

const Letter: React.FC<{
  ch: string;
  index: number;
  step: number;
  delay: number;
}> = ({ ch, index, step, delay }) => {
  const p = useStagger(index, step, delay);
  if (ch === " ") return <span>&nbsp;</span>;
  return (
    <span
      style={{
        display: "inline-block",
        opacity: p,
        filter: `blur(${(1 - p) * 8}px)`,
        transform: `translateY(${(1 - p) * 26}px) scale(${0.86 + p * 0.14})`,
      }}
    >
      {ch}
    </span>
  );
};

/** An SVG stroke that draws itself on. Underlines, circles, arrows, rings. */
export const DrawnPath: React.FC<{
  d: string;
  progress: number;
  stroke: string;
  width?: number;
  length?: number;
  cap?: "round" | "butt";
  fill?: string;
}> = ({
  d,
  progress,
  stroke,
  width = 6,
  length = 1200,
  cap = "round",
  fill = "none",
}) => (
  <path
    d={d}
    fill={fill}
    stroke={stroke}
    strokeWidth={width}
    strokeLinecap={cap}
    strokeLinejoin="round"
    strokeDasharray={length}
    strokeDashoffset={length * (1 - progress)}
  />
);

/** Odometer digit column: each digit rolls up into place. */
export const Odometer: React.FC<{
  value: number;
  decimals?: number;
  style?: React.CSSProperties;
}> = ({ value, decimals = 0, style }) => {
  const text = value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    // No overflow:hidden here -- clipping the column also clips the glow and
    // leaves a visible band behind the digits mid-roll.
    <span style={{ ...style, display: "inline-flex" }}>
      {text
        .split("")
        .map((ch, i) =>
          /\d/.test(ch) ? (
            <Digit key={i} ch={ch} index={i} />
          ) : (
            <span key={i}>{ch}</span>
          ),
        )}
    </span>
  );
};

const Digit: React.FC<{ ch: string; index: number }> = ({ ch, index }) => {
  const p = useStagger(index, 0.035);
  return (
    <span
      style={{
        display: "inline-block",
        transform: `translateY(${(1 - p) * 0.28}em)`,
        opacity: Math.min(1, p * 1.4),
      }}
    >
      {ch}
    </span>
  );
};

/** Clip-path wipe wrapper. Direction picks which edge the reveal comes from. */
export const Wipe: React.FC<
  React.PropsWithChildren<{
    progress: number;
    dir?: "left" | "right" | "up" | "down";
    style?: React.CSSProperties;
  }>
> = ({ progress, dir = "left", style, children }) => {
  const p = Math.max(0, Math.min(1, progress)) * 100;
  const inset =
    dir === "left"
      ? `inset(0 ${100 - p}% 0 0)`
      : dir === "right"
        ? `inset(0 0 0 ${100 - p}%)`
        : dir === "up"
          ? `inset(${100 - p}% 0 0 0)`
          : `inset(0 0 ${100 - p}% 0)`;
  return <div style={{ ...style, clipPath: inset }}>{children}</div>;
};
