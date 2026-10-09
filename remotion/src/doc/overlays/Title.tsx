/**
 * The opening title, and the playback-speed hint that follows it.
 *
 * `title_slide` exists because the first frame of a video is the thumbnail the
 * viewer already clicked, arriving in motion — it has to name the film, not
 * open mid-argument. It is a takeover, so it owns frame one outright while the
 * narration's first line is already running underneath. That matters for
 * retention: three seconds of silent titles before the voice starts is where
 * viewers leave, so the title plays OVER the cold open rather than delaying it.
 *
 * `speed_hint` is a small pill, not a takeover: it slides in near the top,
 * says its piece and leaves, without ever reframing the picture or covering
 * the side columns where the real graphics live.
 */
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CAPTION_SAFE_Y, EDGE, HEIGHT, MONO_STACK, PORTRAIT, SAFE_TOP, TEXT, TEXT_DIM, TYPE, withAlpha, shade, fg } from "../theme";
import type { Overlay } from "../types";
import { useExit, useLocal, useSettle, useWipe } from "./motion";

export const TitleSlide: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const { frame, fps } = useLocal();
  const exit = useExit(0.5);
  const rule = useWipe(0.55, 0.0);
  const under = useWipe(0.55, 0.62);
  const badge = useSettle(0.02, 0.9);
  const settle = useSettle(0, 0.55);
  const t = frame / fps;

  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        alignItems: "center",
        justifyContent: "center",
        padding: PORTRAIT
          ? `${SAFE_TOP}px 60px ${HEIGHT - CAPTION_SAFE_Y}px`
          : "0 150px 150px",
      }}
    >
      {/* an oversized ghosted year drifting behind the type */}
      {ov.value ? (
        <div
          style={{
            position: "absolute",
            right: PORTRAIT ? 20 : 70,
            bottom: PORTRAIT ? HEIGHT - CAPTION_SAFE_Y + 20 : 40,
            fontSize: PORTRAIT ? 300 : 460,
            fontWeight: 800,
            lineHeight: 0.8,
            letterSpacing: -14,
            color: withAlpha(accent, 0.13),
            opacity: badge,
            transform: `translateY(${(1 - badge) * 40}px)`,
          }}
        >
          {ov.value}
        </div>
      ) : null}

      <div style={{ position: "relative", width: "100%", textAlign: "center" }}>
        {ov.eyebrow ? (
          <div
            style={{
              fontFamily: MONO_STACK,
              fontSize: TYPE.label,
              fontWeight: 700,
              letterSpacing: 9,
              textTransform: "uppercase",
              color: accent,
              marginBottom: 26,
            }}
          >
            {ov.eyebrow}
          </div>
        ) : null}

        {/* rule wipes out from the centre, then the title lands letter by letter */}
        <div
          style={{
            height: 3,
            width: `${rule * 46}%`,
            margin: "0 auto 34px",
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />

        {/* Deliberately NOT animated in from nothing. This is frame one of the
            video: a title that assembles letter by letter means the literal
            first frame is empty, and the first frame is what a viewer sees
            while the player is still settling. So the title is fully present
            and readable at t=0, and only settles its scale. */}
        <div
          style={{
            fontSize: TYPE.display,
            fontWeight: 900,
            lineHeight: 1.04,
            letterSpacing: -1.5,
            color: TEXT,
            textShadow: `0 18px 60px ${shade(0.65)}`,
            transform: `scale(${1.018 - settle * 0.018})`,
          }}
        >
          {ov.text ?? ""}
        </div>

        {ov.style_hint ? (
          <div
            style={{
              marginTop: 30,
              fontSize: TYPE.body,
              fontWeight: 600,
              color: TEXT_DIM,
              opacity: interpolate(t, [0.0, 0.35], [0.25, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            {ov.style_hint}
          </div>
        ) : null}

        <div
          style={{
            height: 2,
            width: `${under * 22}%`,
            margin: "34px auto 0",
            backgroundColor: withAlpha(accent, 0.85),
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */

export const SpeedHint: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const { frame, fps } = useLocal();
  const t = frame / fps;
  const dur = ov.duration;

  // slide in, hold, slide out -- never a hard cut, it should feel like an aside
  const inP = interpolate(t, [0, 0.42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outP = interpolate(t, [dur - 0.45, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const k = Math.min(inP, outP);
  const ease = k * k * (3 - 2 * k);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: PORTRAIT ? SAFE_TOP : 148,
          left: PORTRAIT ? EDGE : 92,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 26px",
          borderRadius: 999,
          backgroundColor: "rgba(9,14,26,0.82)",
          border: `1px solid ${withAlpha(accent, 0.75)}`,
          boxShadow: `0 10px 34px ${shade(0.45)}, 0 0 26px ${withAlpha(accent, 0.25)}`,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          opacity: ease,
          transform: `translateX(${(1 - ease) * -52}px)`,
        }}
      >
        <span
          style={{
            fontFamily: MONO_STACK,
            fontSize: TYPE.label,
            fontWeight: 800,
            letterSpacing: 1,
            color: accent,
          }}
        >
          1.5&times;
        </span>
        <span
          style={{
            width: 1,
            height: 22,
            backgroundColor: fg(0.20),
          }}
        />
        <span
          style={{
            fontSize: TYPE.label,
            fontWeight: 600,
            color: TEXT_DIM,
            whiteSpace: "nowrap",
          }}
        >
          {ov.text ?? "Watch at 1.5x for a better experience"}
        </span>
      </div>
    </AbsoluteFill>
  );
};
