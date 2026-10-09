/**
 * The picture layer for the faceless documentary.
 *
 * In `Main` the picture is one continuous talking head, cut into subclips.
 * Here there is no presenter, so the picture is a SCENE TRACK: stock b-roll,
 * stills, real news-article screenshots, and pure-graphic beats where the
 * motion graphics own the frame outright. Everything downstream of this
 * (stage layouts, docking, overlays, camera moves) is shared with `Main` --
 * a docked b-roll card behaves exactly like a docked face did.
 *
 * Each scene draws into the full 1920x1080 picture rect and is cropped by the
 * stage; it never positions itself against the real frame. Transitions are
 * owned by the INCOMING scene (it fades/whips/flashes in over its
 * predecessor, which is held on screen for the length of the handover), so a
 * scene never needs to know what follows it.
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CAPTION_SAFE_Y, EDGE, HEIGHT, PORTRAIT, SAFE_TOP, TEXT, TEXT_FAINT, TYPE, WIDTH, withAlpha, liquidRim, RAISED, fg, PAPER, shade, CT_PAPER } from "./theme";
import { isBlueprint, isCleantech, isLiquid } from "./style";
import type { Scene, SceneGrade, SceneMotion, SceneTransition } from "./types";

/** Height of the cropped headline band inside the browser frame. */
const bandH = () => (PORTRAIT ? 760 : 640);

/** How long a non-cut handover takes. */
export const TRANSITION: Record<SceneTransition, number> = {
  cut: 0,
  fade: 0.45,
  whip: 0.32,
  flash: 0.22,
};

/**
 * Grades are how the picture carries the tension curve -- the planner escalates
 * neutral -> cool -> noir as a section tightens, and warm/hot on release or on
 * the money shot. Kept mild: b-roll still has to read.
 */
export const GRADE: Record<SceneGrade, string> = {
  neutral: "saturate(1.02) contrast(1.04)",
  cool: "saturate(0.86) contrast(1.12) hue-rotate(-8deg) brightness(0.94)",
  warm: "saturate(1.16) contrast(1.06) hue-rotate(6deg) brightness(1.03)",
  noir: "saturate(0.18) contrast(1.34) brightness(0.82)",
  hot: "saturate(1.3) contrast(1.18) brightness(1.06)",
};

/** Ken Burns: a slow move is the difference between b-roll and a screensaver. */
export const kenBurns = (motion: SceneMotion, p: number): string => {
  const e = interpolate(p, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  switch (motion) {
    case "ken_in":
      return `scale(${1.06 + e * 0.1})`;
    case "ken_out":
      return `scale(${1.18 - e * 0.1})`;
    case "pan_left":
      return `scale(1.14) translateX(${(0.5 - e) * 70}px)`;
    case "pan_right":
      return `scale(1.14) translateX(${(e - 0.5) * 70}px)`;
    default:
      return "scale(1.03)";
  }
};

/* --------------------------------------------------------------------- */
/* News screenshot: a real article, framed as one, with its source visible */
/* --------------------------------------------------------------------- */

const NewsFrame: React.FC<{ scene: Scene; accent: string; p: number }> = ({
  scene,
  accent,
  p,
}) => {
  // The frame lands, then the headline underline draws across it.
  const rise = interpolate(p, [0, 0.06], [46, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const draw = interpolate(p, [0.12, 0.32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hl = (PORTRAIT && scene.highlight_portrait) || scene.highlight;
  // Vertical centre of the cited headline, as a fraction of the screenshot.
  const headlineCentre = hl ? hl.y + hl.h / 2 : 0.3;

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        // Tight margins on purpose: a real headline shot at 1920x1080 is only
        // legible if the frame is close to full width. The bottom inset is the
        // one that stays generous -- the attribution row and the Telugu caption
        // band both live down there.
        // 9:16: below Instagram's top bar, above the caption band.
        padding: PORTRAIT
          ? `${SAFE_TOP}px ${EDGE - 20}px ${HEIGHT - CAPTION_SAFE_Y + 40}px`
          : "58px 84px 168px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxHeight: PORTRAIT ? 900 : 790,
          transform: `translateY(${rise}px) scale(${1 + p * 0.02})`,
          borderRadius: isLiquid() ? 34 : isBlueprint() ? 3 : 16,
          overflow: "hidden",
          backgroundColor: RAISED,
          border: `1px solid ${fg(isLiquid() ? 0.3 : 0.16)}`,
          boxShadow: isLiquid()
            ? `${liquidRim()}, 0 34px 90px rgba(0,0,0,0.62)`
            : `0 34px 90px ${shade(0.62)}`,
        }}
      >
        {/* browser chrome, so a screenshot reads as a real page, not an asset */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 46,
            padding: "0 18px",
            backgroundColor: fg(0.07),
            borderBottom: `1px solid ${fg(0.10)}`,
          }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div
              key={c}
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                backgroundColor: c,
                opacity: 0.85,
              }}
            />
          ))}
          <div
            style={{
              marginLeft: 14,
              flex: 1,
              height: 24,
              borderRadius: 999,
              backgroundColor: isCleantech() ? fg(0.06) : "rgba(0,0,0,0.35)",
              color: TEXT_FAINT,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {scene.url ?? ""}
          </div>
        </div>

        {/* A full-page screenshot wastes most of the frame on nav bars and ad
            slots, and shrinks the headline to something nobody can read at
            1080p. So the shot is cropped to a band centred on `highlight` --
            the headline the scene actually cites -- via object-position, which
            needs no measurement of the image. The band then slowly drifts down
            as the scene plays, which reads as scanning the page rather than
            staring at a static grab. */}
        <div
          style={{ position: "relative", height: bandH(), overflow: "hidden" }}
        >
          {scene.src ? (
            <Img
              src={staticFile((PORTRAIT && scene.src_portrait) || scene.src)}
              style={{
                display: "block",
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                // Park the cited headline in the middle of the band.
                //
                // This used to use object-position, which was wrong: with
                // object-fit:cover the percentage is a fraction of the
                // OVERFLOW, not of the image, so asking for "31%" of a page
                // whose headline sits 31% down landed nowhere near it. A
                // percentage translateY is a fraction of the element's OWN
                // rendered height, so the arithmetic is exact and needs no
                // knowledge of the image's pixel dimensions:
                //   shift = -(centre * imgHeight) + bandHeight / 2
                // clamp so the shot never leaves an empty strip at the top or bottom of the band
                transform: `translateY(clamp(calc(${bandH()}px - 100%), calc(${-headlineCentre * 100}% + ${bandH() / 2 + (0.5 - p) * 14}px), 0px))`,
              }}
            />
          ) : null}
          {/* An accent rule used to sweep across here. It was dropped: once the
              shot is cropped to the headline band, any horizontal rule lands
              ON the headline rather than under it -- the crop is already doing
              the job of pointing at the right words. What remains is a soft
              accent vignette, which frames the band without touching the text. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              boxShadow: `inset 0 0 90px ${withAlpha(accent, 0.3 * draw)}`,
            }}
          />
        </div>
      </div>

      {/* Attribution is not decoration: a screenshot without its source is
          exactly the thing that gets a documentary channel in trouble. */}
      <div
        style={{
          marginTop: 22,
          display: "flex",
          alignItems: "center",
          gap: 14,
          opacity: interpolate(p, [0.05, 0.18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            padding: "7px 16px",
            borderRadius: 999,
            backgroundColor: withAlpha(accent, 0.22),
            border: `1px solid ${withAlpha(accent, 0.6)}`,
            color: TEXT,
            fontSize: TYPE.micro,
            fontWeight: 800,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {scene.source ?? "SOURCE"}
        </div>
        {scene.date ? (
          <div
            style={{ color: TEXT_FAINT, fontSize: TYPE.micro, fontWeight: 600 }}
          >
            {scene.date}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------- type slab ------------------------------ */

/**
 * A graphic scene's card content: one oversized figure or word, centred in the
 * frame so the dock (centre crop) and corner (whole frame, scaled) cards both
 * show it. Faceless edits without stock footage use it to fill the card that
 * would otherwise be an empty field next to a docked chart.
 */
const TypeSlab: React.FC<{
  card: NonNullable<Scene["card"]>;
  accent: string;
  p: number;
}> = ({ card, accent, p }) => {
  const len = Math.max(2, card.value.length);
  const size = Math.min(PORTRAIT ? 300 : 330, (PORTRAIT ? 900 : 780) / (0.6 * len));
  const wipe = interpolate(p, [0, 0.08], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          clipPath: `inset(0 ${100 - wipe}% 0 0)`,
          transform: `translateY(${(0.5 - p) * 18}px)`,
        }}
      >
        <div
          style={{
            fontSize: size,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -size * 0.045,
            color: TEXT,
            textShadow: isCleantech() ? "none" : `0 0 80px ${withAlpha(accent, 0.35)}`,
            whiteSpace: "nowrap",
          }}
        >
          {card.value}
        </div>
        <div style={{ width: size * 1.4, height: 8, backgroundColor: accent, marginTop: 22 }} />
        {card.label ? (
          <div
            style={{
              marginTop: 22,
              fontSize: TYPE.label * 1.5,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: TEXT_FAINT,
              whiteSpace: "nowrap",
            }}
          >
            {card.label}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------- one scene ------------------------------ */

const SceneBody: React.FC<{ scene: Scene; accent: string; p: number }> = ({
  scene,
  accent,
  p,
}) => {
  const { fps } = useVideoConfig();
  const motion = scene.motion ?? "ken_in";
  const grade = GRADE[scene.grade ?? "neutral"];

  if (scene.kind === "graphic" || !scene.src) {
    // No media: a moving accent field, so a pure motion-graphics beat still
    // has depth behind it rather than flat black.
    if (isCleantech())
      return (
        <AbsoluteFill
          style={{
            backgroundColor: CT_PAPER,
            backgroundImage: `radial-gradient(${PORTRAIT ? "1000px 1300px" : "1200px 820px"} at ${
              68 + Math.sin(p * 3.1) * 6
            }% ${40 + Math.cos(p * 2.4) * 8}%, ${withAlpha(accent, 0.10)}, transparent 66%),
              radial-gradient(${fg(0.10)} 1.3px, transparent 1.3px)`,
            backgroundSize: "100% 100%, 34px 34px",
          }}
        >
          {scene.card ? <TypeSlab card={scene.card} accent={accent} p={p} /> : null}
        </AbsoluteFill>
      );
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(${PORTRAIT ? "1100px 1500px" : "1300px 900px"} at ${
            30 + Math.sin(p * 3.1) * 8
          }% ${44 + Math.cos(p * 2.4) * 10}%, ${withAlpha(accent, 0.34)}, transparent 64%),
             linear-gradient(150deg, #070c18 0%, #05070c 58%, #0a1020 100%)`,
        }}
      >
        {scene.card ? <TypeSlab card={scene.card} accent={accent} p={p} /> : null}
      </AbsoluteFill>
    );
  }

  if (scene.kind === "news") {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(150deg, ${withAlpha(accent, isCleantech() ? 0.08 : 0.16)} 0%, ${PAPER} 60%)`,
        }}
      >
        <NewsFrame scene={scene} accent={accent} p={p} />
      </AbsoluteFill>
    );
  }

  const media =
    scene.kind === "broll" ? (
      <OffthreadVideo
        src={staticFile(scene.src)}
        muted
        startFrom={Math.round((scene.media_start ?? 0) * fps)}
        style={{
          width: WIDTH,
          height: HEIGHT,
          objectFit: "cover",
          objectPosition: scene.position ?? "50% 50%",
        }}
      />
    ) : (
      <Img
        src={staticFile((PORTRAIT && scene.src_portrait) || scene.src)}
        style={{
          width: WIDTH,
          height: HEIGHT,
          objectFit: "cover",
          objectPosition: scene.position ?? "50% 50%",
        }}
      />
    );

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER }}>
      <AbsoluteFill style={{ transform: kenBurns(motion, p), filter: grade }}>
        {media}
      </AbsoluteFill>
      {/* A permanent floor under the picture: overlay text sits on top of
          arbitrary stock footage and cannot rely on it being dark. */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(5,7,12,0.46) 0%, rgba(5,7,12,0.10) 34%, rgba(5,7,12,0.14) 62%, rgba(5,7,12,0.62) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------ the track ------------------------------ */

export const SceneTrack: React.FC<{
  scenes: Scene[];
  accentAt: (t: number) => string;
}> = ({ scenes, accentAt }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      {scenes.map((scene, i) => {
        const next = scenes[i + 1];
        // Hold this scene under its successor for the whole handover, so the
        // incoming fade/whip has something real to arrive over.
        const hold = next ? TRANSITION[next.transition ?? "fade"] : 0;
        const from = Math.round(scene.start * fps);
        const to = Math.round((scene.end + hold) * fps);
        return (
          <Sequence
            key={scene.index}
            from={from}
            durationInFrames={Math.max(1, to - from)}
            layout="none"
          >
            <SceneClip scene={scene} accent={accentAt(scene.start)} />
          </Sequence>
        );
      })}
    </>
  );
};

const SceneClip: React.FC<{ scene: Scene; accent: string }> = ({
  scene,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame / fps;
  const dur = Math.max(0.001, scene.end - scene.start);
  const p = Math.min(1, local / dur);

  const kind = scene.transition ?? "fade";
  const T = TRANSITION[kind];
  const k = T > 0 ? Math.min(1, local / T) : 1; // 0..1 through the handover

  const enter: React.CSSProperties =
    kind === "whip"
      ? {
          opacity: Math.min(1, k * 2.2),
          transform: `translateX(${(1 - k) * 190}px)`,
          filter: `blur(${(1 - k) * 22}px)`,
        }
      : kind === "fade"
        ? { opacity: k }
        : {}; // cut / flash arrive instantly

  return (
    <>
      <AbsoluteFill style={enter}>
        <SceneBody scene={scene} accent={accent} p={p} />
      </AbsoluteFill>
      {kind === "flash" ? (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: interpolate(local, [0, T * 0.35, T], [0.85, 0.35, 0], {
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
