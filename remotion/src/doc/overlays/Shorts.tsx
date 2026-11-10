/**
 * Shorts graphics: story-telling diagrams that sit ON the full-bleed footage instead of reframing it.
 *
 * The documentary components (flow_diagram, checklist, comparison, number_roll) dock or corner the
 * picture; in a 9:16 Short that reads as a thumbnail in an empty dark frame (amul, 2026-11-10). These
 * keep the footage playing full-frame under a soft scrim and draw big type over it:
 *   story_flow -- 2-4 big pills top-to-bottom, arrows drawing between them; an item with
 *                 state "no" gets struck through in red (Farmers -> ~Polson~ -> Customers).
 *   vs_card    -- two stacked cards with a VS between them, each with a ✓ / ✗ badge from `state`.
 * Items appear on cue: `at` = seconds into the overlay (default: staggered 0.35s).
 */
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { EDGE, FONT_STACK, HEIGHT, ON_ACCENT, PORTRAIT, WIDTH, withAlpha } from "../theme";
import type { ChartItem, Overlay } from "../types";
import { useExit, useLocal } from "./motion";

const RED = "#ff4d4f";
const GREEN = "#2ecc71";

/** 0..1 pop for an element that lands at `at` seconds into the overlay (fast overshoot settle). */
const usePop = () => {
  const { t } = useLocal();
  return (at: number, dur = 0.32) => {
    const k = interpolate(t, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    // easeOutBack: lands a touch big, settles.
    const c = 1.7;
    return k === 0 ? 0 : 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
  };
};

const Scrim: React.FC<{ strength?: number }> = ({ strength = 0.62 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(${PORTRAIT ? "900px 1100px" : "1300px 800px"} at 50% 52%, rgba(5,7,12,${strength}) 0%, rgba(5,7,12,${strength * 0.55}) 55%, rgba(5,7,12,0) 100%)`,
    }}
  />
);

const Title: React.FC<{ text?: string; accent: string; pop: number }> = ({ text, accent, pop }) =>
  text ? (
    <div
      style={{
        alignSelf: "center",
        marginBottom: 26,
        padding: "10px 26px",
        borderRadius: 12,
        background: accent,
        color: ON_ACCENT,
        fontFamily: FONT_STACK,
        fontWeight: 800,
        fontSize: PORTRAIT ? 40 : 34,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        transform: `scale(${0.6 + 0.4 * pop})`,
        opacity: Math.min(1, pop * 1.5),
      }}
    >
      {text}
    </div>
  ) : null;

const stagger = (items: ChartItem[], i: number, step: number, lead: number) => items[i]?.at ?? lead + i * step;

export const StoryFlow: React.FC<{ ov: Overlay; accent: string }> = ({ ov, accent }) => {
  const exit = useExit(0.2);
  const pop = usePop();
  const { t } = useLocal();
  const items = (ov.items ?? []).slice(0, 4);
  const big = PORTRAIT ? 66 : 54;
  const width = Math.min(WIDTH - 2 * EDGE, PORTRAIT ? 860 : 760);
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Scrim />
      <div
        style={{
          position: "absolute",
          left: (WIDTH - width) / 2,
          width,
          top: PORTRAIT ? HEIGHT * 0.26 : HEIGHT * 0.12,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Title text={ov.text} accent={accent} pop={pop(0)} />
        {items.map((it, i) => {
          const at = stagger(items, i, 0.38, 0.12);
          const k = pop(at);
          const struck = it.state === "no";
          const strike = interpolate(t, [at + 0.35, at + 0.62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const arrow = i < items.length - 1 ? interpolate(t, [at + 0.12, at + 0.36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: "relative",
                  padding: "22px 30px",
                  borderRadius: 22,
                  background: struck ? withAlpha("#1a0b0d", 0.86) : "rgba(10,14,24,0.86)",
                  border: `4px solid ${struck ? withAlpha(RED, 0.9) : withAlpha(accent, 0.95)}`,
                  boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 40px ${withAlpha(struck ? RED : accent, 0.25)}`,
                  textAlign: "center",
                  transform: `scale(${0.4 + 0.6 * k})`,
                  opacity: Math.min(1, k * 1.6),
                }}
              >
                <div style={{ fontFamily: FONT_STACK, fontWeight: 900, fontSize: big, lineHeight: 1.05, color: "#fff", opacity: struck ? 0.55 + 0.45 * (1 - strike) : 1 }}>
                  {it.label}
                </div>
                {it.sublabel ? (
                  <div style={{ marginTop: 6, fontFamily: FONT_STACK, fontWeight: 700, fontSize: Math.round(big * 0.5), color: struck ? RED : accent }}>
                    {it.sublabel}
                  </div>
                ) : null}
                {struck ? (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: "6%",
                        top: "50%",
                        height: 10,
                        width: `${88 * strike}%`,
                        background: RED,
                        borderRadius: 6,
                        transform: "rotate(-8deg)",
                        transformOrigin: "left center",
                        boxShadow: `0 0 18px ${withAlpha(RED, 0.7)}`,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: -22,
                        top: -22,
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        background: RED,
                        color: "#fff",
                        fontFamily: FONT_STACK,
                        fontWeight: 900,
                        fontSize: 40,
                        lineHeight: "64px",
                        transform: `scale(${strike})`,
                      }}
                    >
                      ✕
                    </div>
                  </>
                ) : null}
              </div>
              {i < items.length - 1 ? (
                <div style={{ height: PORTRAIT ? 84 : 60, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start" }}>
                  <div style={{ width: 10, height: `${(PORTRAIT ? 56 : 36) * arrow}px`, background: accent, borderRadius: 5 }} />
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: "20px solid transparent",
                      borderRight: "20px solid transparent",
                      borderTop: `24px solid ${accent}`,
                      opacity: arrow,
                    }}
                  />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const VsCard: React.FC<{ ov: Overlay; accent: string }> = ({ ov, accent }) => {
  const exit = useExit(0.2);
  const pop = usePop();
  const items = (ov.items ?? []).slice(0, 2);
  const width = Math.min(WIDTH - 2 * EDGE, PORTRAIT ? 880 : 760);
  const big = PORTRAIT ? 70 : 56;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <Scrim strength={0.66} />
      <div
        style={{
          position: "absolute",
          left: (WIDTH - width) / 2,
          width,
          top: PORTRAIT ? HEIGHT * 0.25 : HEIGHT * 0.1,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        <Title text={ov.text} accent={accent} pop={pop(0)} />
        {items.map((it, i) => {
          const at = stagger(items, i, 0.55, 0.15);
          const k = pop(at);
          const good = it.state === "yes";
          const tone = good ? GREEN : it.state === "no" ? RED : accent;
          const badge = pop(at + 0.3);
          return (
            <React.Fragment key={i}>
              {i === 1 ? (
                <div
                  style={{
                    alignSelf: "center",
                    margin: "18px 0",
                    fontFamily: FONT_STACK,
                    fontWeight: 900,
                    fontSize: PORTRAIT ? 64 : 50,
                    color: "#fff",
                    textShadow: "0 6px 24px rgba(0,0,0,0.8)",
                    transform: `scale(${pop(at - 0.12)})`,
                  }}
                >
                  VS
                </div>
              ) : null}
              <div
                style={{
                  position: "relative",
                  padding: "26px 34px",
                  borderRadius: 24,
                  background: "rgba(10,14,24,0.88)",
                  border: `5px solid ${withAlpha(tone, 0.95)}`,
                  boxShadow: `0 18px 50px rgba(0,0,0,0.55), 0 0 44px ${withAlpha(tone, 0.28)}`,
                  transform: `translateX(${(1 - k) * (i === 0 ? -260 : 260)}px) scale(${0.7 + 0.3 * k})`,
                  opacity: Math.min(1, k * 1.6),
                }}
              >
                <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: Math.round(big * 0.48), letterSpacing: 2, textTransform: "uppercase", color: tone }}>
                  {it.label}
                </div>
                <div style={{ marginTop: 6, fontFamily: FONT_STACK, fontWeight: 900, fontSize: big, lineHeight: 1.05, color: "#fff" }}>
                  {it.sublabel}
                </div>
                {it.state ? (
                  <div
                    style={{
                      position: "absolute",
                      right: 26,
                      top: "50%",
                      marginTop: -42,
                      width: 84,
                      height: 84,
                      borderRadius: 42,
                      background: tone,
                      color: "#fff",
                      textAlign: "center",
                      lineHeight: "84px",
                      fontFamily: FONT_STACK,
                      fontWeight: 900,
                      fontSize: 52,
                      transform: `scale(${badge})`,
                    }}
                  >
                    {good ? "✓" : "✕"}
                  </div>
                ) : null}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
