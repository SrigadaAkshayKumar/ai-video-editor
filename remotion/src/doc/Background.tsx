/**
 * What sits behind the video when it reframes.
 *
 * v1 used drifting blurred blobs. v2 layers three things that respond to the
 * current section's accent, so the negative space is part of the design
 * rather than filler: a wide gradient wash, a fine dot matrix, and a slow
 * diagonal sheen. Everything is low-contrast on purpose -- it must never
 * compete with the graphic sitting on it.
 */
import React from "react";
import { isBlueprint, isBroadcast, isCleantech, isLiquid } from "./style";
import { BlueprintField, BlueprintRail } from "./Blueprint";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTION_SAFE_Y, EDGE, HEIGHT, PORTRAIT, SAFE_TOP, WIDTH, withAlpha, MONO_STACK, PAPER, fg, TEXT, CT_PAPER } from "./theme";

export const Background: React.FC<{ accent: string; reveal: number }> = ({
  accent,
  reveal,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  if (isLiquid()) return <LiquidField accent={accent} reveal={reveal} t={t} />;
  if (isBlueprint()) return <BlueprintField accent={accent} reveal={reveal} t={t} />;
  if (isCleantech()) return <CleanField accent={accent} reveal={reveal} t={t} />;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      {/* gradient wash, drifting very slowly */}
      <AbsoluteFill
        style={{
          opacity: 0.55 + reveal * 0.45,
          background: `radial-gradient(1200px 900px at ${
            22 + Math.sin(t * 0.07) * 6
          }% ${38 + Math.cos(t * 0.05) * 8}%, ${withAlpha(accent, 0.3)}, transparent 62%),
             radial-gradient(1000px 800px at ${
               84 + Math.cos(t * 0.06) * 5
             }% ${72 + Math.sin(t * 0.045) * 7}%, ${withAlpha(
               accent,
               0.16,
             )}, transparent 66%),
             linear-gradient(160deg, #070c18 0%, #05070c 55%, #0a0f1c 100%)`,
        }}
      />

      {/* dot matrix */}
      <AbsoluteFill
        style={{
          opacity: 0.5 * reveal,
          backgroundImage: `radial-gradient(${withAlpha(
            "#ffffff",
            0.14,
          )} 1.4px, transparent 1.4px)`,
          backgroundSize: "46px 46px",
          backgroundPosition: `${(t * 5) % 46}px ${(t * 3) % 46}px`,
          maskImage: `radial-gradient(1100px 800px at ${PORTRAIT ? "50% 65%" : "30% 50%"}, rgba(0,0,0,0.9), transparent 75%)`,
          WebkitMaskImage: `radial-gradient(1100px 800px at ${PORTRAIT ? "50% 65%" : "30% 50%"}, rgba(0,0,0,0.9), transparent 75%)`,
        }}
      />

      {/* diagonal sheen sweeping across every ~14s */}
      <AbsoluteFill
        style={{
          opacity: 0.35 * reveal,
          background: `linear-gradient(115deg, transparent 40%, ${withAlpha(
            accent,
            0.16,
          )} 50%, transparent 60%)`,
          transform: `translateX(${(((t % 14) / 14) * 2 - 1) * WIDTH * 0.6}px)`,
        }}
      />

      {/* vignette so full-frame type always has a floor of contrast */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(${WIDTH}px ${HEIGHT}px at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * CLEANTECH: paper, not a void. An off-white floor, a fine dot grid that
 * fades out toward the edges, and one very soft accent glow drifting in the
 * upper right -- the only colour in the field. No vignette, no sheen.
 */
const CleanField: React.FC<{ accent: string; reveal: number; t: number }> = ({
  accent,
  reveal,
  t,
}) => (
  <AbsoluteFill style={{ backgroundColor: CT_PAPER }}>
    <AbsoluteFill
      style={{
        opacity: 0.6 + reveal * 0.4,
        background: `radial-gradient(1100px 800px at ${74 + Math.sin(t * 0.05) * 5}% ${22 + Math.cos(t * 0.04) * 6}%, ${withAlpha(accent, 0.11)}, transparent 68%),
          radial-gradient(900px 700px at ${16 + Math.cos(t * 0.045) * 4}% ${88 + Math.sin(t * 0.05) * 4}%, ${withAlpha(accent, 0.05)}, transparent 70%)`,
      }}
    />
    <AbsoluteFill
      style={{
        opacity: 0.55 + reveal * 0.45,
        backgroundImage: "radial-gradient(rgba(15,23,42,0.11) 1.3px, transparent 1.3px)",
        backgroundSize: "34px 34px",
        maskImage: `radial-gradient(${WIDTH * 0.7}px ${HEIGHT * 0.75}px at 50% 50%, rgba(0,0,0,1), transparent 100%)`,
        WebkitMaskImage: `radial-gradient(${WIDTH * 0.7}px ${HEIGHT * 0.75}px at 50% 50%, rgba(0,0,0,1), transparent 100%)`,
      }}
    />
  </AbsoluteFill>
);

/**
 * Cleantech's chapter rail: a small white tab top-left -- the chapter number
 * in the accent, the name in slate, and a hairline segmented progress track
 * underneath (one segment per chapter). Hidden before the first chapter.
 */
const CleanRail: React.FC<{
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
  return (
    <div
      style={{
        position: "absolute",
        top: PORTRAIT ? SAFE_TOP - 92 : 34,
        left: EDGE,
        padding: PORTRAIT ? "12px 18px 12px" : "13px 20px 13px",
        borderRadius: 14,
        backgroundColor: "#ffffff",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 1px 2px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.08)",
        opacity: Math.min(1, opacity * 1.15),
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontFamily: MONO_STACK, fontSize: PORTRAIT ? 16 : 18, fontWeight: 700, color: accent }}>
          {String(idx + 1).padStart(2, "0")}
          <span style={{ color: "rgba(15,23,42,0.35)" }}>/{String(chapters.length).padStart(2, "0")}</span>
        </span>
        <span
          style={{
            fontSize: PORTRAIT ? 17 : 19,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: TEXT,
          }}
        >
          {cur.title}
        </span>
      </div>
      <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
        {chapters.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 22,
              height: 3,
              borderRadius: 2,
              backgroundColor: i < idx ? withAlpha(accent, 0.45) : "rgba(15,23,42,0.10)",
              overflow: "hidden",
            }}
          >
            {i === idx ? <div style={{ width: `${p * 100}%`, height: "100%", backgroundColor: accent }} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * LIQUID: the field behind the glass. Clear glass has no colour of its own, so
 * the field has to carry it: three slow, large accent blobs (accent, a hue-
 * shifted partner, and white light) drifting on different periods, over a deep
 * navy floor. Radial gradients only -- no CSS blur filter, which is costly on
 * the no-GPU render box.
 */
const LiquidField: React.FC<{ accent: string; reveal: number; t: number }> = ({
  accent,
  reveal,
  t,
}) => {
  const blob = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    color: string,
  ) => `radial-gradient(${rx}px ${ry}px at ${cx}% ${cy}%, ${color}, transparent 70%)`;
  return (
    <AbsoluteFill style={{ backgroundColor: "#060814" }}>
      <AbsoluteFill
        style={{
          opacity: 0.7 + reveal * 0.3,
          background: [
            blob(18 + Math.sin(t * 0.11) * 9, 30 + Math.cos(t * 0.08) * 12, 900, 760, withAlpha(accent, 0.55)),
            blob(82 + Math.cos(t * 0.09) * 8, 74 + Math.sin(t * 0.07) * 10, 980, 820, withAlpha(accent, 0.32)),
            blob(58 + Math.sin(t * 0.05) * 14, 12 + Math.cos(t * 0.06) * 8, 760, 520, "rgba(170,140,255,0.22)"),
            blob(40 + Math.cos(t * 0.04) * 10, 88 + Math.sin(t * 0.05) * 6, 700, 460, fg(0.07)),
            "linear-gradient(165deg, #0b1024 0%, #060814 60%, #0a0d1e 100%)",
          ].join(", "),
        }}
      />
      {/* fine caustic lines: a slow diagonal of light, like a lens edge passing */}
      <AbsoluteFill
        style={{
          opacity: 0.45 * reveal,
          background: `linear-gradient(118deg, transparent 44%, ${fg(0.07)} 49%, ${fg(0.02)} 51%, transparent 56%)`,
          transform: `translateX(${(((t % 18) / 18) * 2 - 1) * WIDTH * 0.7}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${WIDTH}px ${HEIGHT}px at 50% 50%, transparent 58%, rgba(0,0,0,0.5) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * The lens every liquid surface refers to via backdrop-filter: url(#liquid-lens).
 * Low-frequency turbulence displaces the backdrop a few px, so the field and
 * footage behind a pane bend like they are seen through thick glass. Static
 * seed -> deterministic across frames.
 */
export const LiquidDefs: React.FC = () =>
  isLiquid() ? (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="liquid-lens" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.009" numOctaves="1" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="38" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  ) : null;

/**
 * Liquid's chapter rail: one floating glass capsule, top-centre -- a dot per
 * chapter (the current one stretched into a lozenge that fills as the chapter
 * plays) and the chapter name. Neither glass's hairline row nor broadcast's
 * numeral; the most visible tell of this style.
 */
const LiquidRail: React.FC<{
  chapters: { title: string; start: number }[];
  t: number;
  accent: string;
  duration: number;
  opacity: number;
}> = ({ chapters, t, accent, duration, opacity }) => {
  // Nothing before the first chapter (the cold open has no chapter of its own).
  if (chapters.length === 0 || opacity <= 0.01 || t < chapters[0].start) return null;
  const idx = Math.max(0, chapters.filter((c) => c.start <= t + 0.001).length - 1);
  const cur = chapters[idx];
  const end = idx + 1 < chapters.length ? chapters[idx + 1].start : duration;
  const p = Math.max(0, Math.min(1, (t - cur.start) / Math.max(0.001, end - cur.start)));
  return (
    <div
      style={{
        position: "absolute",
        top: PORTRAIT ? SAFE_TOP - 84 : 34,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: PORTRAIT ? "12px 22px" : "13px 26px",
        borderRadius: 999,
        backgroundColor: fg(0.07),
        backgroundImage: `linear-gradient(180deg, ${fg(0.16)}, ${fg(0.02)})`,
        backdropFilter: "blur(10px) saturate(180%) brightness(1.1)",
        WebkitBackdropFilter: "blur(10px) saturate(180%) brightness(1.1)",
        border: `1px solid ${fg(0.24)}`,
        boxShadow:
          `inset 1.5px 2px 0 ${fg(0.55)}, inset -1px -1px 0 ${fg(0.2)}, 0 10px 30px rgba(0,0,0,0.35)`,
        opacity,
        whiteSpace: "nowrap",
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {chapters.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === idx ? 54 : 9,
              height: 9,
              borderRadius: 999,
              backgroundColor: i < idx ? fg(0.75) : fg(0.22),
              overflow: "hidden",
            }}
          >
            {i === idx ? (
              <div style={{ width: `${p * 100}%`, height: "100%", backgroundColor: accent, borderRadius: 999 }} />
            ) : null}
          </div>
        ))}
      </div>
      <span
        style={{
          fontSize: PORTRAIT ? 17 : 19,
          fontWeight: 700,
          letterSpacing: 2.2,
          textTransform: "uppercase",
          color: TEXT,
        }}
      >
        {cur.title}
      </span>
    </div>
  );
};

/**
 * A hairline rail across the top showing the four questions and how far in we
 * are. It is the one persistent element in the frame -- it gives a
 * seven-minute explainer a sense of place, which no single overlay can.
 */
export const ChapterRail: React.FC<{
  chapters: { title: string; start: number }[];
  t: number;
  accent: string;
  duration: number;
  opacity: number;
}> = ({ chapters, t, accent, duration, opacity }) => {
  if (isLiquid())
    return <LiquidRail chapters={chapters} t={t} accent={accent} duration={duration} opacity={opacity} />;
  if (isCleantech())
    return <CleanRail chapters={chapters} t={t} accent={accent} duration={duration} opacity={opacity} />;
  if (isBlueprint())
    return <BlueprintRail chapters={chapters} t={t} accent={accent} duration={duration} opacity={opacity} />;
  if (isBroadcast()) {
    // Broadcast drops the top rail entirely. Instead: an oversized section
    // numeral bottom-left, the chapter name beside it, and a single hairline
    // progress bar pinned to the very bottom of frame. Nothing across the top,
    // which is the most obvious tell between the two styles.
    const idx = Math.max(
      0,
      chapters.filter((c) => c.start <= t + 0.001).length - 1,
    );
    const cur = chapters[idx];
    const p = Math.max(0, Math.min(1, t / Math.max(1, duration)));
    return (
      <>
        <div
          style={{
            position: "absolute",
            // Must clear CAPTION_SAFE_Y: the caption band is drawn by the
            // later HyperFrames pass and is invisible to Remotion.
            left: EDGE,
            bottom: HEIGHT - CAPTION_SAFE_Y + 48,
            display: "flex",
            alignItems: "flex-end",
            gap: 20,
            opacity: opacity * 0.92,
          }}
        >
          <span
            style={{
              fontSize: PORTRAIT ? 80 : 96,
              lineHeight: 0.78,
              fontWeight: 800,
              letterSpacing: -5,
              color: accent,
            }}
          >
            {String(idx + 1).padStart(2, "0")}
          </span>
          <span
            style={{
              fontFamily: MONO_STACK,
              fontSize: 22,
              letterSpacing: 5,
              textTransform: "uppercase",
              color: fg(0.72),
              paddingBottom: 8,
              whiteSpace: "nowrap",
            }}
          >
            {cur ? cur.title : ""}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 6,
            backgroundColor: fg(0.10),
            opacity,
          }}
        >
          <div
            style={{
              width: `${p * 100}%`,
              height: "100%",
              backgroundColor: accent,
            }}
          />
        </div>
      </>
    );
  }

  if (chapters.length === 0 || opacity <= 0.01) return null;
  const bounds = chapters.map((c, i) => ({
    ...c,
    end: i + 1 < chapters.length ? chapters[i + 1].start : duration,
  }));

  return (
    <div
      style={{
        position: "absolute",
        // 9:16: just under Instagram's top bar, above SAFE_TOP content.
        top: PORTRAIT ? SAFE_TOP - 64 : 46,
        left: EDGE,
        right: EDGE,
        display: "flex",
        gap: PORTRAIT ? 8 : 14,
        opacity,
      }}
    >
      {bounds.map((c, i) => {
        const active = t >= c.start && t < c.end;
        const done = t >= c.end;
        const p = active
          ? Math.min(
              1,
              Math.max(0, (t - c.start) / Math.max(0.001, c.end - c.start)),
            )
          : done
            ? 1
            : 0;
        return (
          <div key={i} style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                height: 3,
                borderRadius: 2,
                backgroundColor: fg(0.16),
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${p * 100}%`,
                  height: "100%",
                  backgroundColor: active ? accent : fg(0.45),
                }}
              />
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: PORTRAIT ? 14 : 17,
                letterSpacing: PORTRAIT ? 1.4 : 2.4,
                textTransform: "uppercase",
                color: active ? "#ffffff" : fg(0.42),
                fontWeight: active ? 700 : 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.title}
            </div>
          </div>
        );
      })}
    </div>
  );
};
