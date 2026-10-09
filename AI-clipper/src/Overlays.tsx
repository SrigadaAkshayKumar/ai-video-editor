import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFor } from "./fonts";
import type { Language } from "./types";

const HOOK_SECONDS = 3;
const CTA_SECONDS = 3.5;

const popIn = (frame: number, start: number, end: number, fps: number) => ({
  opacity: interpolate(frame, [start, start + 0.2 * fps, end - 0.25 * fps, end], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }),
  scale: interpolate(frame, [start, start + 0.35 * fps], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  }),
});

/** Big text hook for the first seconds, sitting in the top area above the speaker. */
export const Hook: React.FC<{ text: string; language: Language }> = ({ text, language }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!text || frame > HOOK_SECONDS * fps) return null;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 300,
          maxWidth: 940,
          padding: "26px 40px",
          borderRadius: 24,
          backgroundColor: "white",
          color: "#111",
          fontFamily: fontFor(language),
          fontWeight: 900,
          fontSize: text.length > 45 ? 58 : 72,
          lineHeight: 1.2,
          textAlign: "center",
          boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          rotate: "-2deg",
          ...popIn(frame, 0, HOOK_SECONDS * fps, fps),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Comment prompt over the final seconds of the clip. */
export const CallToAction: React.FC<{ text: string; language: Language }> = ({ text, language }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const start = Math.max(HOOK_SECONDS * fps, durationInFrames - CTA_SECONDS * fps);
  if (!text || frame < start) return null;

  return (
    <AbsoluteFill style={{ alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: 320,
          maxWidth: 940,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "26px 40px",
          borderRadius: 28,
          backgroundColor: "rgba(15,15,20,0.85)",
          border: "4px solid #FFE14D",
          color: "white",
          fontFamily: fontFor(language),
          fontWeight: 800,
          fontSize: text.length > 45 ? 50 : 60,
          lineHeight: 1.2,
          ...popIn(frame, start, durationInFrames + fps, fps),
        }}
      >
        <span style={{ fontSize: 84 }}>💬</span>
        <span>{text}</span>
      </div>
    </AbsoluteFill>
  );
};
