/**
 * Blueprint style chrome: the drafting-table field behind the picture and the
 * shell-prompt chapter bar. Kept apart from Background.tsx because nothing
 * here is shared with the other three styles.
 *
 * The field is a navy sheet with a minor + major grid that creeps very slowly,
 * a faint scan line, ruler ticks down the left edge and registration marks in
 * the corners. Like the other fields it stays low-contrast -- it is paper, not
 * a graphic.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  BP_INK,
  EDGE,
  HEIGHT,
  MONO_STACK,
  PORTRAIT,
  SAFE_TOP,
  WIDTH,
  withAlpha,
} from "./theme";

const Registration: React.FC<{ x: number; y: number; color: string }> = ({
  x,
  y,
  color,
}) => (
  <svg
    width={44}
    height={44}
    viewBox="0 0 44 44"
    style={{ position: "absolute", left: x - 22, top: y - 22 }}
  >
    <circle cx={22} cy={22} r={11} fill="none" stroke={color} strokeWidth={1.4} />
    <line x1={0} y1={22} x2={44} y2={22} stroke={color} strokeWidth={1.4} />
    <line x1={22} y1={0} x2={22} y2={44} stroke={color} strokeWidth={1.4} />
  </svg>
);

export const BlueprintField: React.FC<{
  accent: string;
  reveal: number;
  t: number;
}> = ({ accent, reveal, t }) => {
  const drift = (t * 3) % 160; // px; one major cell every ~53s
  const scanPeriod = 11;
  const scanY = ((t % scanPeriod) / scanPeriod) * (HEIGHT + 200) - 100;
  const ink = withAlpha(BP_INK, 0.55);
  const m = 46; // registration mark inset
  const ticks = Math.floor(HEIGHT / 40);
  return (
    <AbsoluteFill style={{ backgroundColor: "#04101f" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1300px 900px at 30% 35%, ${withAlpha(
            accent,
            0.13 + 0.07 * reveal,
          )}, transparent 65%), linear-gradient(170deg, #07182f 0%, #04101f 60%, #030b17 100%)`,
        }}
      />
      {/* minor grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${withAlpha(BP_INK, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(BP_INK, 0.06)} 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          backgroundPosition: `${drift}px ${drift * 0.5}px`,
        }}
      />
      {/* major grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${withAlpha(BP_INK, 0.14)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(BP_INK, 0.14)} 1px, transparent 1px)`,
          backgroundSize: "160px 160px",
          backgroundPosition: `${drift}px ${drift * 0.5}px`,
        }}
      />
      {/* scan line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: scanY,
          height: 120,
          background: `linear-gradient(180deg, transparent, ${withAlpha(
            BP_INK,
            0.05,
          )} 85%, ${withAlpha(BP_INK, 0.22)} 99%, transparent)`,
        }}
      />
      {/* ruler down the left edge */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 26, height: HEIGHT }}>
        {Array.from({ length: ticks }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: i * 40,
              width: i % 4 === 0 ? 22 : 11,
              height: 1,
              backgroundColor: withAlpha(BP_INK, i % 4 === 0 ? 0.45 : 0.25),
            }}
          />
        ))}
      </div>
      <Registration x={m} y={m} color={ink} />
      <Registration x={WIDTH - m} y={m} color={ink} />
      <Registration x={m} y={HEIGHT - m} color={ink} />
      <Registration x={WIDTH - m} y={HEIGHT - m} color={ink} />
      {/* faint scanlines + vignette so the sheet reads as a screen */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(180deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 4px)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${WIDTH}px ${HEIGHT}px at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * The chapter rail as a shell prompt, top-left:
 *   crack-it:~/03-section-prep$ ▋        [#####.....] 3/5
 * The path types itself in when a chapter starts; the cursor blinks.
 */
export const BlueprintRail: React.FC<{
  chapters: { title: string; start: number }[];
  t: number;
  accent: string;
  duration: number;
  opacity: number;
}> = ({ chapters, t, accent, duration, opacity }) => {
  if (chapters.length === 0 || opacity <= 0.01 || t < chapters[0].start) return null;
  const idx = Math.max(0, chapters.filter((c) => c.start <= t + 0.001).length - 1);
  const cur = chapters[idx];
  const end = idx + 1 < chapters.length ? chapters[idx + 1].start : duration;
  const p = Math.max(0, Math.min(1, (t - cur.start) / Math.max(0.001, end - cur.start)));
  const path = `~/${String(idx + 1).padStart(2, "0")}-${slug(cur.title)}`;
  const typed = Math.min(path.length, Math.floor((t - cur.start) * 34));
  const cursorOn = Math.floor(t * 2.2) % 2 === 0;
  const cells = 12;
  const filled = Math.round(p * cells);
  return (
    <div
      style={{
        position: "absolute",
        top: PORTRAIT ? SAFE_TOP - 86 : 30,
        left: EDGE,
        right: PORTRAIT ? EDGE : undefined,
        display: "flex",
        alignItems: "center",
        gap: 26,
        padding: "10px 18px",
        fontFamily: MONO_STACK,
        fontSize: PORTRAIT ? 19 : 21,
        letterSpacing: 0.5,
        color: "#e6f4ff",
        backgroundColor: "rgba(3,11,23,0.78)",
        border: `1px solid ${withAlpha(BP_INK, 0.4)}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 3,
        opacity,
        whiteSpace: "nowrap",
      }}
    >
      <span>
        <span style={{ color: accent, fontWeight: 700 }}>crack-it</span>
        <span style={{ color: withAlpha(BP_INK, 0.8) }}>:</span>
        <span style={{ fontWeight: 700 }}>{path.slice(0, typed)}</span>
        <span style={{ color: withAlpha(BP_INK, 0.8) }}>{typed >= path.length ? "$" : ""}</span>
        <span
          style={{
            display: "inline-block",
            width: "0.6em",
            height: "1.05em",
            marginLeft: 6,
            verticalAlign: "-0.15em",
            backgroundColor: cursorOn ? accent : "transparent",
          }}
        />
      </span>
      <span style={{ color: withAlpha(BP_INK, 0.85) }}>
        [
        <span style={{ color: accent }}>{"#".repeat(filled)}</span>
        <span style={{ color: withAlpha(BP_INK, 0.35) }}>{".".repeat(cells - filled)}</span>
        ] {idx + 1}/{chapters.length}
      </span>
    </div>
  );
};

/** Crop-mark brackets + a dimension tag around the docked picture. */
export const BlueprintPictureFrame: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  accent: string;
}> = ({ x, y, w, h, opacity, accent }) => {
  const len = 34;
  const off = 10;
  const c = withAlpha("#ffffff", 0.9);
  const corner = (cx: number, cy: number, sx: number, sy: number) => (
    <>
      <div style={{ position: "absolute", left: sx > 0 ? cx : cx - len, top: cy - 1, width: len, height: 2, backgroundColor: c }} />
      <div style={{ position: "absolute", left: cx - 1, top: sy > 0 ? cy : cy - len, width: 2, height: len, backgroundColor: c }} />
    </>
  );
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          border: `1px solid ${withAlpha(BP_INK, 0.55)}`,
          borderRadius: 3,
        }}
      />
      {corner(x - off, y - off, 1, 1)}
      {corner(x + w + off, y - off, -1, 1)}
      {corner(x - off, y + h + off, 1, -1)}
      {corner(x + w + off, y + h + off, -1, -1)}
      <div
        style={{
          position: "absolute",
          // Inside the picture's bottom-left corner: below it is the caption band.
          left: x + 14,
          top: y + h - 42,
          padding: "4px 10px",
          backgroundColor: "rgba(3,11,23,0.72)",
          fontFamily: MONO_STACK,
          fontSize: 16,
          letterSpacing: 2,
          color: withAlpha(BP_INK, 0.8),
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: accent }}>■</span> FIG · {Math.round(w)} × {Math.round(h)}
      </div>
    </div>
  );
};
