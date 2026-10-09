/**
 * A sample answer the viewer is meant to SCREENSHOT.
 *
 * Everything else in this system is punctuation -- it arrives, lands, leaves.
 * This one is a reference card: the whole answer sits in the centre of the
 * frame, unbroken, and HOLDS. The b-roll keeps running either side of it so
 * the picture is still alive, but the card itself stops moving almost
 * immediately, because a card that is still drifting when the viewer hits the
 * shutter is useless to them.
 *
 * Deliberately NOT in TAKEOVER/CORNER/DOCK (see types.ts): those reframe the
 * picture, and the whole point here is that the footage stays full-bleed and
 * visible at the margins while the card owns the middle.
 *
 * Placeholders are written [in square brackets] in the text and drawn in the
 * accent colour, so the template reads as a template rather than as a claim
 * about the speaker.
 */
import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { MONO_STACK, PORTRAIT, SAFE_TOP, TEXT, TEXT_FAINT, WIDTH, fg, shade } from "../theme";
import type { Overlay } from "../types";

const cardW = () => (PORTRAIT ? WIDTH - 90 : 1180);

/** Splits "...in the range of [realistic range]. I am..." into styled runs. */
const Slots: React.FC<{ line: string; accent: string }> = ({
  line,
  accent,
}) => (
  <>
    {line.split(/(\[[^\]]+\])/g).map((part, i) =>
      part.startsWith("[") && part.endsWith("]") ? (
        <span
          key={i}
          style={{
            color: accent,
            fontWeight: 700,
            // a faint slot underline, so it reads as "you fill this in"
            borderBottom: `2px solid ${accent}55`,
          }}
        >
          {part.slice(1, -1)}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    )}
  </>
);

export const SampleAnswer: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;

  // Settle fast and then sit perfectly still for the whole hold. Seek-safe:
  // every value is a pure function of the current frame.
  const inP = interpolate(t, [0, 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outT = durationInFrames / fps;
  const outP = interpolate(t, [outT - 0.45, outT], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const o = Math.min(inP, outP);

  const lines: string[] = (ov.text ?? "")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  // Long answers get a step down in size rather than an overflowing card.
  const chars = (ov.text ?? "").length;
  const body = PORTRAIT
    ? chars > 520
      ? 29
      : chars > 380
        ? 32
        : 36
    : chars > 520
      ? 31
      : chars > 380
        ? 34
        : 38;

  return (
    <AbsoluteFill style={{ opacity: o }}>
      {/* Dim the footage behind the card only -- the margins stay bright so the
          b-roll is still doing something at the edges of frame. */}
      <AbsoluteFill
        style={{
          background: PORTRAIT
            ? "rgba(5,7,12,0.72)"
            : `linear-gradient(90deg, rgba(5,7,12,0) 0%, rgba(5,7,12,0.55) 14%, ` +
              `rgba(5,7,12,0.78) 26%, rgba(5,7,12,0.78) 74%, rgba(5,7,12,0.55) 86%, ` +
              `rgba(5,7,12,0) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (WIDTH - cardW()) / 2,
          top: PORTRAIT ? SAFE_TOP : 132,
          width: cardW(),
          // No transform on the hold: a card that is still easing when the
          // viewer screenshots it comes out blurred.
          transform: `translateY(${(1 - inP) * 18}px)`,
        }}
      >
        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize: 21,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: accent,
            marginBottom: 18,
          }}
        >
          {ov.eyebrow ?? "Sample answer"}
        </div>
        <div
          style={{
            backgroundColor: "rgba(10,14,22,0.94)",
            border: `1px solid ${fg(0.13)}`,
            borderLeft: `6px solid ${accent}`,
            borderRadius: 18,
            padding: "44px 48px 40px",
            boxShadow: `0 30px 90px ${shade(0.55)}`,
          }}
        >
          {lines.map((l, i) => (
            <div
              key={i}
              style={{
                fontSize: body,
                lineHeight: 1.5,
                color: TEXT,
                fontWeight: 500,
                marginBottom: i === lines.length - 1 ? 0 : 18,
              }}
            >
              <Slots line={l} accent={accent} />
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: MONO_STACK,
            fontSize: 18,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: TEXT_FAINT,
          }}
        >
          Screenshot this
        </div>
      </div>
    </AbsoluteFill>
  );
};
