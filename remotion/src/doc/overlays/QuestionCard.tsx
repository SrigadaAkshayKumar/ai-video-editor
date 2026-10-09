/**
 * question_card -- a solved-question explainer's "here is the problem" beat,
 * with an optional THINK TIMER.
 *
 * A takeover: topic tag (eyebrow) + numeral ("Q4") + the question, words
 * rising in with the narration, optional answer options as chips. When `timer`
 * is set, a ring countdown labelled "Pause & solve" lands at `timer_at`
 * (seconds into the overlay) and drains over `timer` seconds -- it is meant to
 * sit over a silence the cut inserted (edl.json "gaps"), so the viewer can
 * pause and try. The ring stops at zero and holds; the overlay should end a
 * beat after the narration resumes.
 */
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { CAPTION_SAFE_Y, HEIGHT, MONO_STACK, PORTRAIT, SAFE_TOP, TEXT, TEXT_DIM, TEXT_FAINT, TYPE, glass, withAlpha, fg, ON_ACCENT } from "../theme";
import type { Overlay } from "../types";
import { Words, useExit, useLocal, useSettle, useStagger } from "./motion";

const ThinkTimer: React.FC<{ seconds: number; at: number; accent: string }> = ({
  seconds,
  at,
  accent,
}) => {
  const { t } = useLocal();
  const appear = useSettle(at, 0.6);
  const left = Math.max(0, seconds - Math.max(0, t - at));
  const drain = left / seconds;
  const size = PORTRAIT ? 230 : 250;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = left <= 0;
  // A soft pulse on each whole second so the countdown reads as ticking.
  const pulse = done ? 0 : interpolate((t - at) % 1, [0, 0.25], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: appear,
        transform: `scale(${0.85 + 0.15 * appear})`,
      }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fg(0.12)} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - drain)}
            style={{ filter: `drop-shadow(0 0 ${10 + 14 * pulse}px ${withAlpha(accent, 0.7)})` }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: MONO_STACK,
            fontSize: PORTRAIT ? 96 : 104,
            fontWeight: 800,
            color: done ? accent : TEXT,
            transform: `scale(${1 + 0.06 * pulse})`,
          }}
        >
          {done ? "✓" : Math.ceil(left)}
        </div>
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: TYPE.label,
          fontWeight: 800,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: accent,
        }}
      >
        {done ? "Now check" : "Pause & solve"}
      </div>
    </div>
  );
};

export const QuestionCard: React.FC<{ ov: Overlay; accent: string }> = ({ ov, accent }) => {
  const exit = useExit(0.4);
  const card = useSettle(0, 0.85);
  const tag = useStagger(0, 0.1, 0.15);
  const items = (ov.items ?? []).slice(0, 4);
  const timer = Number(ov.timer) || 0;
  const len = (ov.text ?? "").length;
  const qSize = len > 170 ? TYPE.body * 1.05 : len > 100 ? TYPE.headline : TYPE.title;

  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        alignItems: "center",
        justifyContent: "center",
        padding: PORTRAIT ? `${SAFE_TOP}px 50px ${HEIGHT - CAPTION_SAFE_Y + 20}px` : "0 140px 120px",
      }}
    >
      <div
        style={{
          ...glass(),
          width: "100%",
          maxWidth: 1560,
          padding: PORTRAIT ? "44px 44px 46px" : "56px 66px 60px",
          opacity: card,
          transform: `translateY(${(1 - card) * 34}px)`,
          display: "flex",
          flexDirection: PORTRAIT ? "column" : "row",
          alignItems: PORTRAIT ? "stretch" : "center",
          gap: PORTRAIT ? 40 : 64,
        }}
      >
        <div style={{ flex: "1 1 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 26,
              opacity: tag,
              transform: `translateX(${(1 - tag) * -20}px)`,
            }}
          >
            {ov.numeral ? (
              <span
                style={{
                  fontFamily: MONO_STACK,
                  fontSize: TYPE.label,
                  fontWeight: 800,
                  color: ON_ACCENT,
                  backgroundColor: accent,
                  borderRadius: 10,
                  padding: "6px 14px",
                }}
              >
                {ov.numeral}
              </span>
            ) : null}
            {ov.eyebrow ? (
              <span
                style={{
                  fontSize: TYPE.label,
                  fontWeight: 800,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: accent,
                }}
              >
                {ov.eyebrow}
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: qSize, fontWeight: 800, color: TEXT, lineHeight: 1.18, whiteSpace: "pre-line" }}>
            <Words text={ov.text ?? ""} delay={0.12} step={0.045} />
          </div>
          {items.length ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 34 }}>
              {items.map((it, i) => (
                <Option key={i} label={it.label} index={i} accent={accent} />
              ))}
            </div>
          ) : null}
          {ov.footer ? (
            <div style={{ marginTop: 26, fontFamily: MONO_STACK, fontSize: TYPE.micro, color: TEXT_FAINT, letterSpacing: 1 }}>
              {ov.footer}
            </div>
          ) : null}
        </div>
        {timer > 0 ? <ThinkTimer seconds={timer} at={Number(ov.timer_at) || 0} accent={accent} /> : null}
      </div>
    </AbsoluteFill>
  );
};

const Option: React.FC<{ label: string; index: number; accent: string }> = ({ label, index, accent }) => {
  const p = useStagger(index, 0.16, 0.5);
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 16}px)`,
        fontSize: TYPE.body,
        fontWeight: 700,
        color: TEXT_DIM,
        padding: "12px 26px",
        borderRadius: 999,
        border: `2px solid ${withAlpha(accent, 0.55)}`,
        backgroundColor: withAlpha(accent, 0.08),
      }}
    >
      <span style={{ fontFamily: MONO_STACK, color: accent, marginRight: 12 }}>{String.fromCharCode(65 + index)}</span>
      {label}
    </div>
  );
};
