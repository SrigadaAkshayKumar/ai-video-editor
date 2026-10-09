/**
 * Cutaways over the talking head.
 *
 * The faceless film has a scene TRACK -- the picture is stock footage from end
 * to end. This is the opposite case: the picture is a continuous face, and
 * b-roll is a set of islands punched into it. So this renders as a layer ON TOP
 * of the subclip track rather than in place of it, and each island fades itself
 * in and back out. The dialogue is muxed with the subclips underneath and is
 * never touched, which is the whole reason a cutaway is safe to schedule
 * anywhere the speaker is describing something concrete.
 *
 * It is mounted INSIDE the same cropped picture rect as the face (see Doc),
 * so the stage reframes it for free -- a cutaway that overlaps a docked beat
 * plays inside the video card at the right crop instead of escaping the layout.
 */
import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { GRADE, TRANSITION, kenBurns } from "./Scenes";
import { HEIGHT, WIDTH, PAPER } from "./theme";
import type { BRoll } from "./types";

/** A cut back to the face is always a quick dissolve, never a hard chop: the
 *  face is mid-sentence, so a hard return reads as a glitch. */
const OUT = 0.32;

const BRollCut: React.FC<{ cut: BRoll }> = ({ cut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame / fps;
  const dur = Math.max(0.001, cut.duration);
  const p = Math.min(1, local / dur);

  const kind = cut.transition ?? "fade";
  const T = Math.max(0.001, TRANSITION[kind]);
  const k = kind === "cut" ? 1 : Math.min(1, local / T);

  // Enter on `k`, leave on the last OUT seconds. Held separately so a whip can
  // arrive sideways and still leave as a plain dissolve.
  const leave = interpolate(local, [dur - OUT, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const enter: React.CSSProperties =
    kind === "whip"
      ? {
          transform: `translateX(${(1 - k) * 220}px)`,
          filter: `blur(${(1 - k) * 24}px)`,
        }
      : {};

  return (
    <>
      <AbsoluteFill
        style={{
          ...enter,
          opacity: (kind === "fade" ? k : Math.min(1, k * 3)) * leave,
          overflow: "hidden",
          backgroundColor: PAPER,
        }}
      >
        <AbsoluteFill
          style={{
            transform: kenBurns(cut.motion ?? "ken_in", p),
            filter: GRADE[cut.grade ?? "neutral"],
          }}
        >
          <OffthreadVideo
            src={staticFile(cut.src)}
            muted
            startFrom={Math.round((cut.media_start ?? 0) * fps)}
            style={{
              width: WIDTH,
              height: HEIGHT,
              objectFit: "cover",
              objectPosition: cut.position ?? "50% 50%",
            }}
          />
        </AbsoluteFill>
        {/* Stock footage is arbitrarily bright; the caption band and any side
            marks have to stay legible over whatever turns up. */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(5,7,12,0.42) 0%, rgba(5,7,12,0.06) 30%, rgba(5,7,12,0.12) 60%, rgba(5,7,12,0.60) 100%)",
          }}
        />
      </AbsoluteFill>
      {kind === "flash" ? (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: interpolate(local, [0, T * 0.35, T], [0.8, 0.3, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            pointerEvents: "none",
          }}
        />
      ) : null}
    </>
  );
};

export const BRollTrack: React.FC<{ brolls: BRoll[] }> = ({ brolls }) => {
  const { fps } = useVideoConfig();
  return (
    <>
      {brolls.map((cut, i) => {
        const from = Math.round(cut.start * fps);
        const to = Math.round((cut.start + cut.duration) * fps);
        return (
          <Sequence
            key={`broll-${cut.start}-${i}`}
            from={from}
            durationInFrames={Math.max(1, to - from)}
            layout="none"
          >
            <BRollCut cut={cut} />
          </Sequence>
        );
      })}
    </>
  );
};
