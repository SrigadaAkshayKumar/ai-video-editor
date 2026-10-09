import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFor } from "./fonts";
import type { Language } from "./types";

const HIGHLIGHT = "#FFE14D";

/** Word-by-word captions: a few words per page, the spoken word highlighted. */
export const Captions: React.FC<{ captions: Caption[]; language: Language; top?: number }> = ({
  captions,
  language,
  top = 1290,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        // Indic words are longer on screen, so group fewer of them per page.
        combineTokensWithinMilliseconds: language === "en" ? 1100 : 800,
        breakOnSilenceAfterMilliseconds: 600,
      }),
    [captions, language],
  );

  const page = pages.find((p) => nowMs >= p.startMs && nowMs < p.startMs + p.durationMs);
  if (!page) return null;

  const pageFrame = frame - Math.round((page.startMs / 1000) * fps);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top,
          width: 960,
          textAlign: "center",
          fontFamily: fontFor(language),
          fontWeight: 800,
          fontSize: language === "en" ? 78 : 68,
          lineHeight: 1.25,
          textTransform: language === "en" ? "uppercase" : "none",
          color: "white",
          WebkitTextStroke: "10px black",
          paintOrder: "stroke fill",
          textShadow: "0 8px 24px rgba(0,0,0,0.6)",
          scale: interpolate(pageFrame, [0, 6], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.34, 1.56, 0.64, 1),
          }),
        }}
      >
        {page.tokens.map((token, i) => {
          const active = nowMs >= token.fromMs && nowMs < token.toMs;
          return (
            <span key={i} style={{ color: active ? HIGHLIGHT : "white", whiteSpace: "pre-wrap" }}>
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
