/**
 * Corner-mode graphics: these own the whole frame while the video shrinks to
 * a small card in the bottom-right. Use for the moments where the number or
 * the diagram IS the content and the face is just reassurance.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import {
  CAPTION_SAFE_Y,
  HEIGHT,
  MONO_STACK,
  PORTRAIT,
  SAFE_TOP,
  SERIES,
  WIDTH,
  TEXT,
  TEXT_DIM,
  TEXT_FAINT,
  TYPE,
  slab,
  withAlpha,
  radius,
} from "../theme";
import type { ChartItem, Overlay } from "../types";
import {
  DrawnPath,
  Odometer,
  Words,
  useCountUp,
  useExit,
  useSettle,
  useStagger,
  useWipe,
} from "./motion";

/** Corner mode owns the frame; in 9:16 the video card sits top-right, so the
 *  graphic is centred in the space between that card and the caption band. */
const fullPad = (landscape: string): React.CSSProperties =>
  PORTRAIT
    ? {
        paddingTop: SAFE_TOP + 270,
        paddingBottom: HEIGHT - CAPTION_SAFE_Y,
        paddingLeft: 70,
        paddingRight: 70,
      }
    : { padding: landscape };

/** One enormous figure, rolling up, with a rule that sweeps under it. */
export const NumberRoll: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const n = typeof ov.value === "number" ? ov.value : 0;
  const shown = useCountUp(n, 1.05);
  const rule = useWipe(0.5, 0.5);
  const label = useSettle(0.6);

  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        ...fullPad("0 0 0 150px"),
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {ov.prefix ? (
          <span
            style={{ fontSize: TYPE.display, fontWeight: 700, color: accent }}
          >
            {ov.prefix}
          </span>
        ) : null}
        <Odometer
          value={
            Math.round(shown * 10 ** (ov.decimals ?? 0)) /
            10 ** (ov.decimals ?? 0)
          }
          decimals={ov.decimals ?? 0}
          style={{
            fontSize: TYPE.hero,
            fontWeight: 800,
            color: TEXT,
            letterSpacing: -6,
            lineHeight: 1,
            textShadow: `0 10px 60px ${withAlpha(accent, 0.4)}`,
          }}
        />
        {ov.suffix ? (
          <span
            style={{ fontSize: TYPE.title, fontWeight: 700, color: accent }}
          >
            {ov.suffix}
          </span>
        ) : null}
      </div>
      <div
        style={{
          height: 5,
          width: PORTRAIT ? 520 : 620,
          marginTop: 26,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${accent}, ${withAlpha(accent, 0)})`,
          transform: `scaleX(${rule})`,
          transformOrigin: "left center",
        }}
      />
      <div
        style={{
          marginTop: 26,
          fontSize: TYPE.headline,
          fontWeight: 600,
          color: TEXT_DIM,
          opacity: label,
          transform: `translateY(${(1 - label) * 16}px)`,
          maxWidth: 1100,
        }}
      >
        {ov.text}
      </div>
    </AbsoluteFill>
  );
};

/** Three figures landing one after another, left to right. */
export const StatTrio: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = (ov.items ?? []).slice(0, 3);
  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        flexDirection: PORTRAIT ? "column" : "row",
        alignItems: PORTRAIT ? "stretch" : "center",
        justifyContent: PORTRAIT ? "center" : "flex-start",
        gap: PORTRAIT ? 28 : 56,
        ...fullPad("0 150px"),
      }}
    >
      {items.map((it, i) => (
        <TrioCard key={i} item={it} index={i} accent={accent} />
      ))}
    </AbsoluteFill>
  );
};

const TrioCard: React.FC<{
  item: ChartItem;
  index: number;
  accent: string;
}> = ({ item, index, accent }) => {
  const p = useStagger(index, 0.26);
  const val = useCountUp(item.value ?? 0, 0.9, 0.15 + index * 0.26);
  return (
    <div
      style={{
        ...slab(),
        flex: PORTRAIT ? "none" : 1,
        maxWidth: PORTRAIT ? undefined : 420,
        padding: PORTRAIT ? "30px 36px" : "42px 40px",
        opacity: p,
        transform: `translateY(${(1 - p) * 42}px) scale(${0.94 + p * 0.06})`,
        borderTop: `4px solid ${accent}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span style={{ fontSize: TYPE.title, fontWeight: 800, color: accent }}>
          {item.sublabel ?? ""}
        </span>
        <Odometer
          value={Math.round(val)}
          style={{
            fontSize: TYPE.title,
            fontWeight: 800,
            color: TEXT,
            letterSpacing: -2,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 16,
          fontSize: TYPE.label,
          color: TEXT_FAINT,
          letterSpacing: 1,
        }}
      >
        {item.label}
      </div>
    </div>
  );
};

/**
 * Nodes joined by arrows that draw themselves on. This is the one v1 was
 * missing most: the video keeps describing PIPELINES (Swayam hosts NPTEL
 * hosts the course; register -> prepare -> exam -> certified) and a list of
 * chips can't show a flow.
 */
export const FlowDiagram: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  const n = Math.max(1, items.length);
  if (PORTRAIT)
    return <FlowDiagramVertical ov={ov} accent={accent} exit={exit} />;
  const boxW = 300;
  const gap = 96;
  const totalW = n * boxW + (n - 1) * gap;
  const startX = (WIDTH - totalW) / 2;
  const y = 430;

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {ov.text ? (
        <div
          style={{
            position: "absolute",
            top: 210,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: MONO_STACK,
            fontSize: TYPE.label,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {ov.text}
        </div>
      ) : null}

      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{ position: "absolute", inset: 0 }}
      >
        {items.slice(0, -1).map((_, i) => {
          const x1 = startX + (i + 1) * boxW + i * gap;
          return (
            <Arrow
              key={i}
              x={x1}
              y={y + 84}
              len={gap}
              index={i}
              accent={accent}
            />
          );
        })}
      </svg>

      {items.map((it, i) => (
        <FlowNode
          key={i}
          item={it}
          index={i}
          accent={accent}
          x={startX + i * (boxW + gap)}
          y={y}
          w={boxW}
        />
      ))}
    </AbsoluteFill>
  );
};

/** 9:16: the same nodes stacked top to bottom, arrows drawing downward. */
const FlowDiagramVertical: React.FC<{
  ov: Overlay;
  accent: string;
  exit: number;
}> = ({ ov, accent, exit }) => {
  const items = (ov.items ?? []).slice(0, 5);
  const n = Math.max(1, items.length);
  const boxW = WIDTH - 220;
  const boxH = n > 4 ? 100 : 118;
  const gap = n > 4 ? 40 : 70;
  const labelTop = SAFE_TOP + 270;
  const top0 = labelTop + (ov.text ? 70 : 0);
  const avail = CAPTION_SAFE_Y - 30 - top0;
  const totalH = n * boxH + (n - 1) * gap;
  const y0 = top0 + Math.max(0, (avail - totalH) / 2);
  const x = (WIDTH - boxW) / 2;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      {ov.text ? (
        <div
          style={{
            position: "absolute",
            top: labelTop,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: MONO_STACK,
            fontSize: TYPE.label,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {ov.text}
        </div>
      ) : null}
      <svg
        width={WIDTH}
        height={HEIGHT}
        style={{ position: "absolute", inset: 0 }}
      >
        {items.slice(0, -1).map((_, i) => {
          const yTop = y0 + (i + 1) * boxH + i * gap;
          return (
            <ArrowDown
              key={i}
              x={WIDTH / 2}
              y={yTop}
              len={gap}
              index={i}
              accent={accent}
            />
          );
        })}
      </svg>
      {items.map((it, i) => (
        <FlowNode
          key={i}
          item={it}
          index={i}
          accent={accent}
          x={x}
          y={y0 + i * (boxH + gap)}
          w={boxW}
          h={boxH}
        />
      ))}
    </AbsoluteFill>
  );
};

const ArrowDown: React.FC<{
  x: number;
  y: number;
  len: number;
  index: number;
  accent: string;
}> = ({ x, y, len, index, accent }) => {
  const p = useWipe(0.3, 0.34 + index * 0.3);
  return (
    <g>
      <DrawnPath
        d={`M ${x} ${y + 8} L ${x} ${y + len - 14}`}
        progress={p}
        stroke={withAlpha(accent, 0.9)}
        width={4}
        length={len}
      />
      <DrawnPath
        d={`M ${x - 11} ${y + len - 28} L ${x} ${y + len - 12} L ${x + 11} ${y + len - 28}`}
        progress={p}
        stroke={withAlpha(accent, 0.9)}
        width={4}
        length={40}
      />
    </g>
  );
};

const Arrow: React.FC<{
  x: number;
  y: number;
  len: number;
  index: number;
  accent: string;
}> = ({ x, y, len, index, accent }) => {
  const p = useWipe(0.3, 0.34 + index * 0.3);
  return (
    <g>
      <DrawnPath
        d={`M ${x + 12} ${y} L ${x + len - 20} ${y}`}
        progress={p}
        stroke={withAlpha(accent, 0.9)}
        width={4}
        length={len}
      />
      <DrawnPath
        d={`M ${x + len - 34} ${y - 11} L ${x + len - 18} ${y} L ${x + len - 34} ${y + 11}`}
        progress={p}
        stroke={withAlpha(accent, 0.9)}
        width={4}
        length={40}
      />
    </g>
  );
};

const FlowNode: React.FC<{
  item: ChartItem;
  index: number;
  accent: string;
  x: number;
  y: number;
  w: number;
  h?: number;
}> = ({ item, index, accent, x, y, w, h }) => {
  const p = useStagger(index, 0.3);
  return (
    <div
      style={{
        ...slab(),
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        boxSizing: "border-box",
        display: h ? "flex" : undefined,
        flexDirection: "column",
        justifyContent: "center",
        padding: h ? "0 26px" : "30px 26px",
        textAlign: "center",
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + p * 0.1})`,
        borderBottom: `3px solid ${withAlpha(accent, 0.85)}`,
      }}
    >
      <div style={{ fontSize: TYPE.body, fontWeight: 700, color: TEXT }}>
        {item.label}
      </div>
      {item.sublabel ? (
        <div style={{ marginTop: 10, fontSize: TYPE.micro, color: TEXT_FAINT }}>
          {item.sublabel}
        </div>
      ) : null}
    </div>
  );
};

/** A grid of chips popping in -- good for "all the roles that want this". */
export const MatrixGrid: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  return (
    <AbsoluteFill
      style={{ opacity: exit, ...fullPad("0 150px"), justifyContent: "center" }}
    >
      {ov.text ? (
        <div
          style={{
            fontSize: TYPE.headline,
            fontWeight: 800,
            color: TEXT,
            marginBottom: 44,
          }}
        >
          <Words text={ov.text} step={0.05} />
        </div>
      ) : null}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 20, maxWidth: 1240 }}
      >
        {items.map((it, i) => (
          <Chip key={i} label={it.label} index={i} accent={accent} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ label: string; index: number; accent: string }> = ({
  label,
  index,
  accent,
}) => {
  const p = useStagger(index, 0.085);
  return (
    <div
      style={{
        padding: "18px 30px",
        borderRadius: radius("card") ? 14 : 2,
        backgroundColor: withAlpha(accent, 0.16),
        border: `1px solid ${withAlpha(accent, 0.55)}`,
        color: TEXT,
        fontSize: TYPE.body,
        fontWeight: 600,
        opacity: p,
        transform: `translateY(${(1 - p) * 22}px) scale(${0.9 + p * 0.1})`,
      }}
    >
      {label}
    </div>
  );
};

/** Ticks and crosses -- what counts, what doesn't. */
export const Checklist: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  return (
    <AbsoluteFill
      style={{ opacity: exit, ...fullPad("0 150px"), justifyContent: "center" }}
    >
      {ov.text ? (
        <div
          style={{
            fontSize: TYPE.headline,
            fontWeight: 800,
            color: TEXT,
            marginBottom: 40,
          }}
        >
          <Words text={ov.text} step={0.05} />
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          maxWidth: 1180,
        }}
      >
        {items.map((it, i) => (
          <CheckRow key={i} item={it} index={i} accent={accent} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const CheckRow: React.FC<{
  item: ChartItem;
  index: number;
  accent: string;
}> = ({ item, index }) => {
  const p = useStagger(index, 0.16);
  const draw = useWipe(0.3, 0.16 * index + 0.18);
  const no = item.state === "no";
  const color = no ? "#e2574c" : SERIES[2];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 26,
        opacity: p,
        transform: `translateX(${(1 - p) * -30}px)`,
      }}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ flex: "none" }}>
        <circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke={withAlpha(color, 0.45)}
          strokeWidth="2"
        />
        {no ? (
          <>
            <DrawnPath
              d="M 17 17 L 35 35"
              progress={draw}
              stroke={color}
              width={5}
              length={30}
            />
            <DrawnPath
              d="M 35 17 L 17 35"
              progress={draw}
              stroke={color}
              width={5}
              length={30}
            />
          </>
        ) : (
          <DrawnPath
            d="M 15 27 L 23 35 L 38 18"
            progress={draw}
            stroke={color}
            width={5}
            length={50}
          />
        )}
      </svg>
      <div
        style={{
          fontSize: TYPE.body,
          fontWeight: 600,
          color: no ? TEXT_FAINT : TEXT,
          textDecoration: no ? "line-through" : "none",
          textDecorationColor: withAlpha("#e2574c", 0.8),
        }}
      >
        {item.label}
      </div>
    </div>
  );
};
