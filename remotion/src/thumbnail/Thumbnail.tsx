/**
 * Thumbnail compositor (YouTube 1280x720, Instagram cover 1080x1920).
 *
 * The youtube-thumbnail skill's rule: an image model can neither produce the
 * creator's real face nor shape type (Telugu least of all), so a thumbnail is
 * LAYERS: an optional generated/photographic background, a real face cut-out
 * pulled from the footage, and type set here with real fonts. Layout follows
 * the skill: face on one third, text on the other, two type sizes only, the
 * bottom-right corner left clear for YouTube's duration stamp.
 *
 * Paths are relative to --public-dir (tools/thumbnail.mjs uses the project dir).
 */
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadTelugu } from "@remotion/google-fonts/NotoSansTelugu";
import { loadFont as loadDevanagari } from "@remotion/google-fonts/NotoSansDevanagari";

const inter = loadInter("normal", { weights: ["700", "800", "900"], subsets: ["latin"] });
loadTelugu("normal", { weights: ["700", "800", "900"], subsets: ["telugu"] });
loadDevanagari("normal", { weights: ["700", "800", "900"], subsets: ["devanagari"] });
const FONT = `${inter.fontFamily}, "Noto Sans Telugu", "Noto Sans Devanagari", sans-serif`;

export type ThumbnailProps = {
  width: number;
  height: number;
  /** Optional background image (generated or a frame); otherwise an accent gradient. */
  background?: string;
  /** Darken the background so type always wins (0..1). */
  backgroundDim?: number;
  /** Transparent PNG of the face/subject. */
  cutout?: string;
  cutoutSide?: "left" | "right";
  /** The ONE huge word/phrase. */
  big: string;
  /** Supporting words, smaller. Optional. */
  small?: string;
  /** Second line in the native script (Telugu/Hindi) — a strong pairing with an English title. */
  native?: string;
  accent?: string;
  /** CSS object-position for a cropped background photo, e.g. "50% 20%" keeps a face near the top. */
  backgroundPosition?: string;
  /** Put `small` above `big` instead of below. */
  smallFirst?: boolean;
};

export const thumbnailDefaults: ThumbnailProps = {
  width: 1280,
  height: 720,
  big: "NOT ENOUGH",
  small: "Certificates alone",
  native: "ఉద్యోగం రాదు",
  accent: "#ffcc00",
  cutoutSide: "right",
};

export const Thumbnail: React.FC<ThumbnailProps> = ({
  width,
  height,
  background,
  backgroundDim = 0.35,
  backgroundPosition = "50% 50%",
  cutout,
  cutoutSide = "right",
  big,
  small,
  native,
  accent = "#ffcc00",
  smallFirst = false,
}) => {
  const portrait = height > width;
  const textSide = cutoutSide === "right" ? "left" : "right";
  const bigSize = portrait ? Math.min(210, 1700 / Math.max(4, big.length)) : Math.min(190, 1500 / Math.max(4, big.length));
  const smallSize = portrait ? 64 : 54;

  const text = (
    <div
      style={{
        position: "absolute",
        ...(portrait
          ? { left: 70, right: 70, top: 220, textAlign: "center" as const }
          : { [textSide]: 64, top: 0, bottom: 0, width: width * 0.58, textAlign: textSide as "left" | "right" }),
        display: "flex",
        flexDirection: "column",
        justifyContent: portrait ? "flex-start" : "center",
        gap: 10,
        fontFamily: FONT,
      }}
    >
      {small && smallFirst ? <Small text={small} size={smallSize} /> : null}
      <div
        style={{
          fontSize: bigSize,
          fontWeight: 900,
          lineHeight: 0.95,
          letterSpacing: -2,
          color: accent,
          textTransform: "uppercase",
          WebkitTextStroke: "3px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
          textShadow: "0 10px 40px rgba(0,0,0,0.7)",
        }}
      >
        {big}
      </div>
      {small && !smallFirst ? <Small text={small} size={smallSize} /> : null}
      {native ? (
        <div
          style={{
            marginTop: 12,
            fontSize: smallSize * 1.05,
            fontWeight: 800,
            color: "#ffffff",
            textShadow: "0 6px 24px rgba(0,0,0,0.8)",
          }}
        >
          {native}
        </div>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#07090f", overflow: "hidden" }}>
      {background ? (
        <Img src={staticFile(background)} style={{ width, height, objectFit: "cover", objectPosition: backgroundPosition }} />
      ) : (
        <AbsoluteFill
          style={{
            background: `radial-gradient(${width * 0.9}px ${height * 0.9}px at ${cutoutSide === "right" ? "72%" : "28%"} 45%, ${accent}55, transparent 60%), linear-gradient(135deg, #0b1020, #05070c)`,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          background: portrait
            ? `linear-gradient(180deg, rgba(0,0,0,${backgroundDim + 0.25}) 0%, rgba(0,0,0,${backgroundDim * 0.4}) 45%, rgba(0,0,0,0) 70%)`
            : `linear-gradient(${textSide === "left" ? 90 : 270}deg, rgba(0,0,0,${backgroundDim + 0.3}) 0%, rgba(0,0,0,${backgroundDim}) 45%, rgba(0,0,0,0) 75%)`,
        }}
      />
      {cutout ? (
        <Img
          src={staticFile(cutout)}
          style={{
            position: "absolute",
            bottom: 0,
            height: portrait ? height * 0.62 : height * 1.0,
            ...(portrait ? { left: "50%", transform: "translateX(-50%)" } : { [cutoutSide]: -20 }),
            objectFit: "contain",
            filter: `drop-shadow(0 0 30px ${accent}66) drop-shadow(0 20px 40px rgba(0,0,0,0.6))`,
          }}
        />
      ) : null}
      {text}
    </AbsoluteFill>
  );
};

const Small: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <div
    style={{
      fontSize: size,
      fontWeight: 800,
      color: "#ffffff",
      lineHeight: 1.05,
      textShadow: "0 6px 24px rgba(0,0,0,0.8)",
    }}
  >
    {text}
  </div>
);
