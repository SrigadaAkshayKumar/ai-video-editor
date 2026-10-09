/**
 * Full-bleed marks: the video is untouched and these sit on top of it.
 *
 * The rule that survives from v1: never the centre 40% of the frame, where
 * the face is. What changes is that they are no longer all the same glass
 * rectangle -- a chip, a lower third, a sticky note and a drawn annotation
 * are four visibly different objects.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { CAPTION_SAFE_Y, EDGE, HEIGHT, MONO_STACK, PORTRAIT, SAFE_TOP, TEXT, TYPE, glass, slab, wash, withAlpha, ON_ACCENT, fg, shade } from "../theme";
import type { Overlay } from "../types";
import {
  DrawnPath,
  Words,
  useExit,
  useLocal,
  useSettle,
  useShove,
  useWipe,
} from "./motion";

// Landscape: the left/right 30% columns, never the centre 40% where the face is.
// Portrait: the face owns the upper-middle of the frame, so marks live either
// just under Instagram's top bar or just above the caption band.
const sideBox = (side: Overlay["side"]): React.CSSProperties => ({
  position: "absolute",
  width: PORTRAIT ? 640 : 470,
  boxSizing: "border-box",
  ...(side === "right" ? { right: EDGE } : { left: EDGE }),
});
/** Vertical anchor for a mark: "high" (top band) or "low" (just above captions). */
const markY = (
  landscapeTop: number,
  band: "high" | "low",
): React.CSSProperties =>
  PORTRAIT
    ? band === "high"
      ? { top: SAFE_TOP + 30 }
      : { bottom: HEIGHT - CAPTION_SAFE_Y + 40 }
    : { top: landscapeTop };

/** A mono chip that shoves in from its own edge and drags a trail behind it. */
export const KeywordChip: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit(0.28);
  const p = useShove();
  const dir = ov.side === "right" ? 1 : -1;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div
        style={{
          ...sideBox(ov.side),
          ...markY(250, "high"),
          textAlign: ov.side === "right" ? "right" : "left",
          transform: `translateX(${(1 - p) * 90 * dir}px)`,
          opacity: Math.min(1, p * 1.6),
        }}
      >
        <div
          style={{
            ...wash(accent),
            display: "inline-block",
            padding: "16px 30px",
            borderRadius: 12,
            fontFamily: MONO_STACK,
            fontSize: 34,
            fontWeight: 700,
            color: ON_ACCENT,
            boxShadow: `0 14px 40px ${withAlpha(accent, 0.45)}`,
          }}
        >
          {ov.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Lower third: an accent bar unrolls, the label rides out of it. */
export const LowerThird: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit(0.3);
  const bar = useWipe(0.36, 0);
  const label = useSettle(0.22);
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div
        style={{
          ...sideBox(ov.side),
          bottom: PORTRAIT ? HEIGHT - CAPTION_SAFE_Y + 40 : 250,
          width: "auto",
          maxWidth: PORTRAIT ? 900 : 700,
        }}
      >
        <div
          style={{
            height: 6,
            backgroundColor: accent,
            transform: `scaleX(${bar})`,
            transformOrigin:
              ov.side === "right" ? "right center" : "left center",
          }}
        />
        <div
          style={{
            ...slab(),
            borderRadius: 0,
            padding: "22px 34px",
            opacity: label,
            transform: `translateY(${(1 - label) * -14}px)`,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: TEXT,
              letterSpacing: -0.5,
            }}
          >
            {ov.text}
          </div>
          {ov.eyebrow ? (
            <div
              style={{
                fontSize: TYPE.label,
                color: fg(0.62),
                marginTop: 8,
              }}
            >
              {ov.eyebrow}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A tilted note, pinned to the frame. Deliberately imperfect. */
export const SideNote: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit(0.3);
  const p = useShove();
  const tilt = ov.side === "right" ? 2.4 : -2.4;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div
        style={{
          ...sideBox(ov.side),
          ...(PORTRAIT ? markY(0, "low") : { top: "50%", marginTop: -120 }),
          opacity: Math.min(1, p * 1.5),
          transform: `rotate(${tilt * p}deg) translateY(${(1 - p) * 40}px)`,
        }}
      >
        <div
          style={{
            ...glass(),
            padding: "30px 32px",
            borderTop: `4px solid ${accent}`,
          }}
        >
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: TEXT,
              lineHeight: 1.24,
            }}
          >
            <Words text={ov.text ?? ""} step={0.06} rise={14} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * A drawn mark around a floating word -- underline, hand-circle or bracket.
 * Reads as annotation rather than UI, which is the point: it looks like
 * someone marking up the frame while the speaker talks.
 */
export const Annotation: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit(0.3);
  const draw = useWipe(0.55, 0.14);
  const label = useSettle(0.05);
  const shape = ov.shape ?? "underline";
  const w = 520;
  const h = 190;

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div
        style={{
          ...sideBox(ov.side),
          ...(PORTRAIT
            ? { bottom: HEIGHT - CAPTION_SAFE_Y + 70 }
            : { top: 400 }),
          width: w,
        }}
      >
        {/* the circle's stroke starts ~40px in, so the word is inset to sit
            inside it rather than hanging off its left edge */}
        <div
          style={{
            position: "relative",
            padding: shape === "circle" ? "18px 60px 18px 66px" : "18px 26px",
            textAlign: shape === "underline" ? "left" : "center",
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 800,
              color: TEXT,
              opacity: label,
              transform: `translateY(${(1 - label) * 14}px)`,
              textShadow: `0 4px 22px ${shade(0.75)}`,
              position: "relative",
              zIndex: 2,
            }}
          >
            {ov.text}
          </div>
          <svg
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
            style={{
              position: "absolute",
              left: 0,
              top: -30,
              zIndex: 1,
              overflow: "visible",
            }}
          >
            {shape === "circle" ? (
              <DrawnPath
                d={`M 40 66 C 120 22, 420 24, 470 74 C 500 116, 380 150, 220 148 C 90 146, 18 122, 44 78`}
                progress={draw}
                stroke={accent}
                width={6}
                length={1500}
              />
            ) : shape === "bracket" ? (
              <DrawnPath
                d={`M 30 40 L 12 40 L 12 132 L 30 132 M ${w - 30} 40 L ${w - 12} 40 L ${w - 12} 132 L ${w - 30} 132`}
                progress={draw}
                stroke={accent}
                width={5}
                length={420}
              />
            ) : (
              <DrawnPath
                d={`M 20 122 C 160 106, 330 132, 470 112`}
                progress={draw}
                stroke={accent}
                width={8}
                length={520}
              />
            )}
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A thin strip with the phrase repeating and scrolling. Used very sparingly. */
export const MarqueeStrip: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const { frame, fps } = useLocal();
  const exit = useExit(0.3);
  const enter = useWipe(0.4, 0);
  const shift = (frame / fps) * 130;
  const text = `${ov.text}   ·   `;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: PORTRAIT ? SAFE_TOP : 128,
          height: 84,
          overflow: "hidden",
          backgroundColor: withAlpha(accent, 0.92),
          transform: `scaleY(${enter})`,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            whiteSpace: "nowrap",
            transform: `translateX(${-shift}px)`,
            fontSize: 42,
            fontWeight: 800,
            letterSpacing: 2,
            color: ON_ACCENT,
          }}
        >
          {text.repeat(14)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
