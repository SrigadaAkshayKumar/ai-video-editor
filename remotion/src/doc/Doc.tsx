/**
 * The Doc composition: the whole picture pass for both pipelines.
 *
 * Merges the template's `Main` (talking head) and `Faceless` (scene track)
 * compositions. Both share the stage machinery (stage.ts), the overlay
 * vocabulary (overlays/), the per-chapter accent system and the camera moves;
 * they differ only in what fills the stage rect:
 *   talking  -- the clean-cut a-roll (one frame-accurate file from tools/cut.mjs)
 *               plus b-roll islands (Broll.tsx) cropped by the same rect
 *   faceless -- the scene track (Scenes.tsx)
 *
 * The render is deliberately MUTED. The template's incident log records
 * dialogue corruption every time audio was embedded in a render pass, so all
 * audio is mixed afterwards by tools/mix.mjs from the clean-cut source.
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Background, ChapterRail, LiquidDefs } from "./Background";
import { BRollTrack } from "./Broll";
import { OverlayRenderer, isRenderable } from "./overlays";
import { SceneTrack } from "./Scenes";
import {
  cameraScale,
  fillGaps,
  sectionAt,
  stageAt,
  stageWindows,
  validCameraMoves,
} from "./stage";
import { rootFont, HEIGHT, PORTRAIT, WIDTH, accents, liquidRim, setFrame, PAPER, fg, shade } from "./theme";
import { isBlueprint, isCleantech, isLiquid, setStyle } from "./style";
import { BlueprintPictureFrame } from "./Blueprint";
import type { DocProps } from "./types";

export const Doc: React.FC<DocProps> = ({
  mode,
  styleVariant,
  width,
  height,
  aroll,
  scenes = [],
  overlays,
  brolls = [],
  cameraMoves,
  durationInSeconds,
  rail = true,
}) => {
  // Set before any child reads a surface, rect, type size or motion curve.
  setStyle(styleVariant);
  setFrame(width, height);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const { plan, windows, moves, chapters } = useMemo(() => {
    // Gap-filling holds the LAYOUT steady between nearby same-layout beats (no bounce out and
    // back), but each graphic still leaves when its own moment ends: stretching the overlay itself
    // kept a punchline on screen seconds after the narration had moved on.
    const plan = overlays.filter(isRenderable);
    const windows = stageWindows(fillGaps(plan), durationInSeconds);
    const chapters = plan
      .filter((o) => o.type === "chapter_open")
      .sort((a, b) => a.start - b.start)
      .map((o) => ({ title: o.railLabel ?? o.text ?? "", start: o.start }));
    return {
      plan,
      windows,
      moves: validCameraMoves(cameraMoves, windows),
      chapters,
    };
  }, [overlays, cameraMoves, durationInSeconds]);

  const stage = stageAt(t, windows);
  const chapterIndex = sectionAt(t, plan);
  const accent = accents()[chapterIndex % accents().length];
  const zoom = cameraScale(t, moves);

  // One scale factor for both axes: the picture crops like object-fit:cover,
  // it is never squeezed into a docked card (a squeezed face was a real complaint).
  const cover = Math.max(stage.w / WIDTH, stage.h / HEIGHT);
  const scale = cover * (stage.reframed > 0.02 ? 1 : zoom);

  // NO EMPTY DOCKS (faceless): a `graphic` scene has no footage, so docking it
  // would park an empty blurred card beside the graphic. Fade the card out in
  // proportion to the reframe and let the graphic own the frame instead.
  const activeScene = useMemo(() => {
    let cur = scenes[0];
    for (const s of scenes) if (s.start <= t) cur = s;
    return cur;
  }, [scenes, t]);
  const emptyCard = mode === "faceless" && activeScene?.kind === "graphic" && !activeScene.card;
  // A type slab fills the card when docked, but must not sit blurred behind a takeover's type.
  const slabCard = mode === "faceless" && activeScene?.kind === "graphic" && Boolean(activeScene.card);
  const pictureOpacity = emptyCard ? 1 - stage.reframed : slabCard ? 1 - stage.dim : 1;

  const frameStyle: React.CSSProperties = {
    position: "absolute",
    left: stage.x,
    top: stage.y,
    width: stage.w,
    height: stage.h,
    borderRadius: stage.r,
    overflow: "hidden",
    opacity: pictureOpacity,
    boxShadow:
      stage.reframed > 0.02 && !emptyCard
        ? isCleantech()
          ? // a printed photo on the page: white mat, hairline, soft lift
            `0 0 0 8px rgba(255,255,255,${stage.reframed}), 0 0 0 9px rgba(15,23,42,${0.1 * stage.reframed}), 0 24px 60px ${shade(0.5 * stage.reframed)}`
          : `0 30px 90px rgba(0,0,0,${0.5 * stage.reframed})`
        : undefined,
    filter: stage.blur > 0 ? `blur(${stage.blur * 16}px)` : undefined,
  };

  // A card crops the picture vertically; follow the plan's framing Y (where the face is) when one is set.
  const focusY = aroll?.position
    ? Math.min(1, Math.max(0, (parseFloat(aroll.position.split(/\s+/)[1] ?? "50") || 50) / 100))
    : 0.5;
  const pictureStyle: React.CSSProperties = {
    position: "absolute",
    width: WIDTH,
    height: HEIGHT,
    transformOrigin: "0 0",
    transform: `translate(${-(WIDTH * scale - stage.w) / 2}px, ${-(HEIGHT * scale - stage.h) * focusY}px) scale(${scale})`,
  };

  // The rail hides during a takeover (nothing shares the frame with those).
  const railOpacity = interpolate(stage.dim, [0, 0.5], [0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Scene accents follow the chapter the scene starts in.
  const accentAt = useMemo(
    () => (time: number) => accents()[sectionAt(time, plan) % accents().length],
    [plan],
  );

  return (
    <AbsoluteFill
      style={{ fontFamily: rootFont(), backgroundColor: PAPER }}
    >
      <LiquidDefs />
      <Background accent={accent} reveal={stage.reframed} />

      <div style={frameStyle}>
        <div style={pictureStyle}>
          {mode === "talking" && aroll ? (
            <OffthreadVideo
              src={staticFile(aroll.src)}
              muted
              style={{
                width: WIDTH,
                height: HEIGHT,
                objectFit: "cover",
                objectPosition: aroll.position ?? "50% 40%",
              }}
            />
          ) : null}
          {mode === "faceless" ? (
            <SceneTrack scenes={scenes} accentAt={accentAt} />
          ) : null}
          {/* Cutaways sit inside the same picture rect, so the stage crops them exactly as it crops the face. */}
          {mode === "talking" ? <BRollTrack brolls={brolls} /> : null}
        </div>
      </div>

      {/* Liquid: the docked picture is a pane of glass too -- a specular rim over its edge. */}
      {isLiquid() && stage.reframed > 0.02 && pictureOpacity > 0.02 ? (
        <div
          style={{
            position: "absolute",
            left: stage.x,
            top: stage.y,
            width: stage.w,
            height: stage.h,
            borderRadius: stage.r,
            pointerEvents: "none",
            opacity: stage.reframed * pictureOpacity,
            border: `1px solid ${fg(0.28)}`,
            boxShadow: liquidRim(1.15),
            backgroundImage:
              `linear-gradient(150deg, ${fg(0.14)} 0%, ${fg(0)} 26%, ${fg(0)} 80%, ${fg(0.06)} 100%)`,
          }}
        />
      ) : null}

      {isBlueprint() && stage.reframed > 0.02 && pictureOpacity > 0.02 && stage.w < WIDTH ? (
        <BlueprintPictureFrame
          x={stage.x}
          y={stage.y}
          w={stage.w}
          h={stage.h}
          opacity={stage.reframed * pictureOpacity}
          accent={accent}
        />
      ) : null}

      {/* scrim for takeovers, so full-frame type always has its floor */}
      {stage.dim > 0.01 ? (
        <AbsoluteFill
          style={{
            backgroundColor: isCleantech()
              ? `rgba(244,246,249,${0.9 * stage.dim})`
              : `rgba(5,7,12,${0.66 * stage.dim})`,
            backdropFilter: `saturate(${1 - 0.4 * stage.dim})`,
          }}
        />
      ) : null}

      {/* Soft top scrim: the rail's dim labels sit over live footage and must not wash out. */}
      {rail && chapters.length && !isCleantech() ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: PORTRAIT ? 330 : 190,
            background:
              "linear-gradient(180deg, rgba(5,7,12,0.62) 0%, rgba(5,7,12,0.28) 55%, rgba(5,7,12,0) 100%)",
            opacity: railOpacity,
          }}
        />
      ) : null}

      {rail ? (
        <ChapterRail
          chapters={chapters}
          t={t}
          accent={accent}
          duration={durationInSeconds}
          opacity={railOpacity}
        />
      ) : null}

      {plan.map((ov, i) => {
        const from = Math.round(ov.start * fps);
        const to = Math.round((ov.start + ov.duration) * fps);
        const idx = ov.section ?? sectionAt(ov.start, plan);
        return (
          <Sequence
            key={`${ov.type}-${ov.start}-${i}`}
            from={from}
            durationInFrames={Math.max(1, to - from)}
            layout="none"
          >
            <OverlayRenderer
              ov={ov}
              accent={accents()[idx % accents().length]}
              chapterIndex={idx}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
