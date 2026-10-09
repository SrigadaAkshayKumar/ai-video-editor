import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fontFor } from "./fonts";
import type { EndCard, Language } from "./types";

// Layout pieces for framing="black": the letterbox bars carry the hook, prompts and captions.

const YELLOW = "#FFE14D";
const RED = "#FF3B3B";
const HOOK_BIG_SECONDS = 3; // hook stays full size, then shrinks into a headline
const CHIP_SECONDS = 4; // each rotating top-bar prompt
const CTA_SECONDS = 7; // comment question, just before the end card
export const END_CARD_SECONDS = 2.5;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** "Nobody tells you *this*" -> words with highlight flags (asterisks may span several words). */
const parseHook = (text: string) => {
  let on = false;
  return text
    .split(/\s+/)
    .filter((raw) => raw.replace(/\*/g, ""))
    .map((raw) => {
      if (raw.startsWith("*")) on = true;
      const word = { text: raw.replace(/\*/g, ""), highlight: on };
      if (raw.length > 1 && raw.endsWith("*")) on = false;
      return word;
    });
};

/** Quick flash + punch-in feel on the first frames to grab attention. */
export const StartFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 7], [0.55, 0], clamp);
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ backgroundColor: "white", opacity }} />;
};

/** Shimmering line on the video's top edge, progress bar on its bottom edge. */
export const VideoEdges: React.FC<{ rect: { top: number; bottom: number } }> = ({ rect }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const progress = frame / Math.max(1, durationInFrames - 1);
  const sweep = ((frame / fps) % 2.5) / 2.5;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: rect.top - 6,
          width: "100%",
          height: 6,
          overflow: "hidden",
          backgroundColor: "rgba(255,225,77,0.35)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${sweep * 140 - 40}%`,
            width: "40%",
            height: "100%",
            background: `linear-gradient(90deg, transparent, ${YELLOW}, transparent)`,
          }}
        />
      </div>
      <div style={{ position: "absolute", top: rect.bottom, width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.15)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", backgroundColor: YELLOW, boxShadow: `0 0 18px ${YELLOW}` }} />
      </div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ text: string; local: number; length: number; y: number; font: string; accent?: boolean }> = ({
  text,
  local,
  length,
  y,
  font,
  accent,
}) => {
  const { fps } = useVideoConfig();
  const enter = spring({ frame: local, fps, config: { damping: 14, stiffness: 160 } });
  const exit = interpolate(local, [length - 8, length], [1, 0], clamp);
  const pulse = 1 + 0.025 * Math.sin((local / fps) * Math.PI * 2);

  return (
    <div style={{ position: "absolute", top: y - 80, height: 160, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          maxWidth: 960,
          padding: "18px 36px",
          borderRadius: accent ? 28 : 999,
          backgroundColor: accent ? YELLOW : "rgba(255,255,255,0.08)",
          border: accent ? "none" : `3px solid ${YELLOW}`,
          color: accent ? "#111" : "white",
          fontFamily: font,
          fontWeight: 800,
          fontSize: text.length > 40 ? 40 : 48,
          lineHeight: 1.2,
          textAlign: "center",
          boxShadow: "0 0 30px rgba(255,225,77,0.35)",
          opacity: Math.min(enter, exit),
          transform: `translateY(${(1 - enter) * 40}px) scale(${pulse})`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Top bar: animated hook that becomes a headline, then rotating prompts, then the comment question. */
export const TopBar: React.FC<{ barHeight: number; hook: string; cta: string; topTexts: string[]; language: Language }> = ({
  barHeight,
  hook,
  cta,
  topTexts,
  language,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const font = fontFor(language);
  const words = useMemo(() => parseHook(hook), [hook]);

  const shrink = spring({ frame: frame - HOOK_BIG_SECONDS * fps, fps, config: { damping: 200 }, durationInFrames: 0.5 * fps });
  const scale = interpolate(shrink, [0, 1], [1, 0.7]);
  const centerY = interpolate(shrink, [0, 1], [barHeight * 0.5, barHeight * 0.4]);

  const endStart = durationInFrames - Math.round(END_CARD_SECONDS * fps);
  const chipStart = Math.round((HOOK_BIG_SECONDS + 0.4) * fps);
  const ctaStart = Math.max(chipStart, endStart - CTA_SECONDS * fps);
  const chipY = barHeight - 95;
  const glow = 0.1 + 0.05 * Math.sin((frame / fps) * Math.PI);

  let row: React.ReactNode = null;
  if (frame < chipStart) {
    const arrowIn = interpolate(frame, [words.length * 4 + 4, words.length * 4 + 10], [0, 1], clamp);
    const bounce = Math.abs(Math.sin((frame / fps) * Math.PI * 2.5)) * 18;
    row = (
      <div style={{ position: "absolute", top: chipY - 50, width: "100%", textAlign: "center", fontSize: 76, opacity: arrowIn, transform: `translateY(${bounce}px)` }}>
        👇
      </div>
    );
  } else if (frame < ctaStart && topTexts.length) {
    const chipLen = CHIP_SECONDS * fps;
    const since = frame - chipStart;
    const local = since % chipLen;
    const length = Math.min(chipLen, ctaStart - (frame - local));
    row = <Chip key={Math.floor(since / chipLen)} text={topTexts[Math.floor(since / chipLen) % topTexts.length]} local={local} length={length} y={chipY} font={font} />;
  } else if (cta && frame >= ctaStart) {
    row = <Chip text={`💬 ${cta}`} local={frame - ctaStart} length={endStart + 8 - ctaStart} y={chipY} font={font} accent />;
  }

  return (
    <AbsoluteFill style={{ opacity: interpolate(frame, [endStart, endStart + 8], [1, 0], clamp) }}>
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: barHeight,
          background: `radial-gradient(ellipse at 50% 55%, rgba(255,225,77,${glow}) 0%, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 40,
          width: 1000,
          top: centerY,
          transform: `translateY(-50%) scale(${scale})`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "10px 20px",
          fontFamily: font,
          fontWeight: 900,
          fontSize: words.length > 7 ? 70 : 82,
          lineHeight: 1.15,
          color: "white",
          textTransform: language === "en" ? "uppercase" : "none",
        }}
      >
        {words.map((w, i) => {
          const s = spring({ frame: frame - i * 4, fps, config: { damping: 11, stiffness: 180 } });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                padding: w.highlight ? "0 14px" : 0,
                borderRadius: 12,
                backgroundColor: w.highlight ? YELLOW : "transparent",
                color: w.highlight ? "#111" : "white",
                textShadow: w.highlight ? "none" : "0 6px 20px rgba(0,0,0,0.6)",
                opacity: interpolate(s, [0, 0.3], [0, 1], clamp),
                transform: `scale(${interpolate(s, [0, 1], [1.9, 1])}) rotate(${w.highlight ? -2 : 0}deg)`,
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
      {row}
    </AbsoluteFill>
  );
};

/** Animated "watch full video" card over the last seconds. */
export const EndCardOverlay: React.FC<{ card: EndCard; language: Language }> = ({ card, language }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const start = durationInFrames - Math.round(END_CARD_SECONDS * fps);
  if (frame < start) return null;

  const f = frame - start;
  const font = fontFor(language);
  const pop = spring({ frame: f, fps, config: { damping: 12, stiffness: 170 } });
  const sub = spring({ frame: f - 6, fps, config: { damping: 14 } });
  const underline = interpolate(f, [8, 20], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const bounce = Math.abs(Math.sin((f / fps) * Math.PI * 2.5)) * 22;
  const wobble = Math.sin((f / fps) * Math.PI * 4) * 12;
  const ring = (f % 24) / 24;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.72)", opacity: interpolate(f, [0, 8], [0, 1], clamp) }} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
          padding: "44px 56px 30px",
          borderRadius: 40,
          backgroundColor: "rgba(12,12,16,0.94)",
          border: `4px solid ${YELLOW}`,
          boxShadow: "0 0 60px rgba(255,225,77,0.35)",
          fontFamily: font,
          opacity: interpolate(pop, [0, 0.2], [0, 1], clamp),
          transform: `scale(${interpolate(pop, [0, 1], [0.4, 1])})`,
        }}
      >
        <div style={{ position: "relative", width: 170, height: 170 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `6px solid ${RED}`,
              transform: `scale(${1 + ring * 0.6})`,
              opacity: 1 - ring,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              backgroundColor: RED,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 40px rgba(255,59,59,0.5)",
            }}
          >
            <div style={{ marginLeft: 12, borderTop: "34px solid transparent", borderBottom: "34px solid transparent", borderLeft: "56px solid white" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ color: "white", fontSize: 78, fontWeight: 900, letterSpacing: 1, textAlign: "center", lineHeight: 1.1 }}>{card.title}</div>
          <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "center" }}>
            <div style={{ width: `${underline * 100}%`, height: 10, borderRadius: 5, backgroundColor: YELLOW }} />
          </div>
        </div>
        <div
          style={{
            padding: "18px 38px",
            borderRadius: 999,
            backgroundColor: YELLOW,
            color: "#111",
            fontSize: 50,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 30}px)`,
          }}
        >
          <span style={{ display: "inline-block", transform: `rotate(${wobble}deg)` }}>📌</span>
          {card.subtitle}
        </div>
        <div style={{ fontSize: 90, transform: `translateY(${bounce}px)`, opacity: sub }}>👇</div>
      </div>
    </AbsoluteFill>
  );
};
