/**
 * Full-frame moments: the graphic owns the screen and the video dims behind.
 *
 * These are the beats v1 had no answer for. A talking head with a caption for
 * seven minutes has no punctuation; these give the edit its full stops.
 */
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CAPTION_SAFE_Y, HEIGHT, MONO_STACK, PORTRAIT, TEXT, TEXT_DIM, TEXT_FAINT, TYPE, WIDTH, withAlpha, shade } from "../theme";
import type { Overlay } from "../types";
import {
  DrawnPath,
  Letters,
  Wipe,
  Words,
  useExit,
  useLocal,
  useSettle,
  useShove,
  useTypewriter,
  useWipe,
} from "./motion";

/**
 * Section opener. A rule wipes across, the section number counts in as a big
 * ghosted numeral, and the title lands letter by letter. Each section gets
 * its own accent, so four openers never look like the same card twice.
 */
export const ChapterOpen: React.FC<{
  ov: Overlay;
  accent: string;
  index: number;
}> = ({ ov, accent, index }) => {
  const { frame, fps } = useLocal();
  const exit = useExit(0.45);
  const rule = useWipe(0.55, 0.12);
  const ghost = useSettle(0.05, 1.2);
  const shift = interpolate(frame, [0, fps * 3], [0, -26], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* oversized ghosted section numeral, drifting */}
      <div
        style={{
          position: "absolute",
          right: PORTRAIT ? 30 : 96,
          bottom: PORTRAIT ? HEIGHT - CAPTION_SAFE_Y + 10 : -110,
          fontSize: PORTRAIT ? 420 : 620,
          fontWeight: 800,
          lineHeight: 0.8,
          color: withAlpha(accent, 0.16),
          opacity: ghost,
          transform: `translateY(${(1 - ghost) * 60}px)`,
          letterSpacing: -20,
        }}
      >
        {ov.numeral ?? (index > 0 ? String(index).padStart(2, "0") : "00")}
      </div>

      <div
        style={{
          transform: `translateY(${shift}px)`,
          textAlign: "center",
          padding: PORTRAIT ? "0 60px" : undefined,
        }}
      >
        {ov.eyebrow ? (
          <div
            style={{
              fontFamily: MONO_STACK,
              fontSize: TYPE.label,
              letterSpacing: 7,
              textTransform: "uppercase",
              color: accent,
              marginBottom: 26,
              opacity: rule,
            }}
          >
            {ov.eyebrow}
          </div>
        ) : null}

        <Letters
          text={ov.text ?? ""}
          style={{
            display: "block",
            fontSize: TYPE.display,
            fontWeight: 800,
            color: TEXT,
            letterSpacing: -2,
            textShadow: `0 8px 40px ${shade(0.6)}`,
            maxWidth: PORTRAIT ? WIDTH - 120 : 1500,
          }}
        />

        <div
          style={{
            marginTop: 34,
            height: 5,
            width: 460,
            marginLeft: "auto",
            marginRight: "auto",
            borderRadius: 3,
            background: `linear-gradient(90deg, ${accent}, ${withAlpha(accent, 0)})`,
            transform: `scaleX(${rule})`,
            transformOrigin: "left center",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * The punchline, at full size. One word can be marked with `eyebrow` to be
 * struck through (for "not"-shaped claims) and the whole line rises in
 * sequence over a vignette.
 */
export const BigStatement: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit(0.4);
  const bar = useWipe(0.45, 0.05);
  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        alignItems: "center",
        justifyContent: "center",
        padding: PORTRAIT ? "0 80px 0 100px" : "0 190px",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: PORTRAIT ? 60 : 190,
          top: "50%",
          width: 6,
          height: 300,
          marginTop: -150,
          borderRadius: 3,
          backgroundColor: accent,
          transform: `scaleY(${bar})`,
          transformOrigin: "center top",
        }}
      />
      <Words
        text={ov.text ?? ""}
        step={0.085}
        rise={40}
        highlight={ov.eyebrow}
        accent={accent}
        style={{
          display: "block",
          fontSize: TYPE.title,
          fontWeight: 800,
          lineHeight: 1.16,
          color: TEXT,
          textAlign: "left",
          maxWidth: PORTRAIT ? WIDTH - 180 : 1360,
          marginLeft: PORTRAIT ? 0 : 60,
          textShadow: `0 6px 34px ${shade(0.65)}`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * "X becomes Y". The first term types in, gets struck through with a drawn
 * stroke, and the replacement slams in beneath it. Built for the two hinge
 * moments in this video: certificate -> certification, course -> skill.
 */
export const WordSwap: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const { fps, frame } = useLocal();
  const exit = useExit(0.36);
  const from = ov.from ?? ov.text ?? "";
  const to = ov.to ?? "";
  const typed = useTypewriter(from, 30, 0.08);
  const strikeStart = 0.15 + from.length / 30;
  const strike = interpolate(
    frame,
    [strikeStart * fps, (strikeStart + 0.32) * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const slam = useShove(strikeStart + 0.2);

  return (
    <AbsoluteFill
      style={{ opacity: exit, alignItems: "center", justifyContent: "center" }}
    >
      <div
        style={{
          textAlign: "center",
          padding: PORTRAIT ? "0 60px" : undefined,
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <span
            style={{
              fontSize: TYPE.title,
              fontWeight: 700,
              color: TEXT_FAINT,
              letterSpacing: -1,
            }}
          >
            {from.slice(0, typed)}
          </span>
          <svg
            width="100%"
            height="24"
            viewBox="0 0 1000 24"
            preserveAspectRatio="none"
            style={{ position: "absolute", left: 0, top: "48%", width: "100%" }}
          >
            <DrawnPath
              d="M 8 12 C 260 4, 700 20, 992 10"
              progress={strike}
              stroke="#e2574c"
              width={9}
              length={1000}
            />
          </svg>
        </div>

        <div
          style={{
            marginTop: 42,
            opacity: slam,
            transform: `scale(${0.82 + slam * 0.18})`,
          }}
        >
          <span
            style={{
              fontSize: TYPE.display,
              fontWeight: 800,
              color: TEXT,
              letterSpacing: -3,
              textShadow: `0 0 60px ${withAlpha(accent, 0.55)}`,
            }}
          >
            {to}
          </span>
        </div>

        {ov.text && ov.from ? (
          <div
            style={{
              marginTop: 30,
              fontSize: TYPE.body,
              color: TEXT_DIM,
              opacity: slam,
            }}
          >
            {ov.text}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** A quoted line -- a viewer's question, pulled up like a magazine pull-quote. */
export const QuotePull: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit(0.36);
  const open = useWipe(0.5, 0.08);
  const settle = useSettle(0.12);
  return (
    <AbsoluteFill
      style={{ opacity: exit, alignItems: "center", justifyContent: "center" }}
    >
      <div
        style={{
          maxWidth: PORTRAIT ? WIDTH - 120 : 1380,
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: PORTRAIT ? 200 : 240,
            lineHeight: 0.6,
            color: withAlpha(accent, 0.45),
            fontWeight: 800,
            opacity: settle,
          }}
        >
          &ldquo;
        </div>
        <Wipe progress={open} dir="left">
          <div
            style={{
              fontSize: TYPE.headline,
              fontWeight: 600,
              lineHeight: 1.32,
              color: TEXT,
              marginTop: -30,
            }}
          >
            {ov.text}
          </div>
        </Wipe>
        {ov.eyebrow ? (
          <div
            style={{
              marginTop: 30,
              fontFamily: MONO_STACK,
              fontSize: TYPE.label,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: accent,
              opacity: settle,
            }}
          >
            {ov.eyebrow}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
