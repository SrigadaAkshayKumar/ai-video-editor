/**
 * Dock-mode graphics: the video sits as a card on one side, these take the
 * other. Unlike v1 the column can be EITHER side (`side` on the overlay), so
 * consecutive docked beats push the eye left, then right, instead of parking
 * everything in one panel for seven minutes.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { graphicRegion } from "../stage";
import { MONO_STACK, PORTRAIT, SERIES, TEXT, TEXT_DIM, TEXT_FAINT, TYPE, HEIGHT, glass, liquidPane, slab, withAlpha, fg, ON_ACCENT, RAISED } from "../theme";
import { isLiquid } from "../style";
import type { ChartItem, Overlay } from "../types";
import {
  DrawnPath,
  Words,
  useCountUp,
  useExit,
  useLocal,
  useSettle,
  useStagger,
  useWipe,
} from "./motion";

/** Graphic column, opposite whichever side the video docked to (landscape),
 *  or the strip under the docked card (portrait). Always between the chapter
 *  rail and the caption band, never in the raw frame. */
const column = (side: Overlay["side"]): React.CSSProperties => {
  const r = graphicRegion("dock", side);
  if (isLiquid()) {
    // Liquid: the graphic sits in its own glass pane, hugging its content and
    // centred in the column, instead of drawing straight onto the field.
    const mid = (r.top + (HEIGHT - r.bottom)) / 2;
    return {
      position: "absolute",
      top: mid,
      left: r.left,
      width: r.width,
      maxHeight: HEIGHT - r.bottom - r.top,
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      boxSizing: "border-box",
      ...liquidPane(),
    };
  }
  return {
    position: "absolute",
    top: r.top,
    bottom: r.bottom,
    left: r.left,
    width: r.width,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    boxSizing: "border-box",
  };
};

const Heading: React.FC<{ text?: string; accent: string }> = ({
  text,
  accent,
}) =>
  text ? (
    <div style={{ marginBottom: PORTRAIT ? 22 : 34 }}>
      <div
        style={{
          fontFamily: MONO_STACK,
          fontSize: TYPE.micro,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: accent,
          marginBottom: 12,
        }}
      >
        {"//"}
      </div>
      <div
        style={{
          fontSize: TYPE.headline,
          fontWeight: 800,
          color: TEXT,
          lineHeight: 1.14,
        }}
      >
        <Words text={text} step={0.05} rise={16} />
      </div>
    </div>
  ) : null;

/** Runs the stagger (and optional wipe) hooks in a component, so list rows can
 *  animate from inside a .map() without breaking the rules of hooks. */
const Stagger: React.FC<{
  index: number;
  step?: number;
  delay?: number;
  wipe?: [number, number];
  children: (p: number, wipe: number) => React.ReactNode;
}> = ({ index, step, delay, wipe, children }) => {
  const p = useStagger(index, step, delay);
  const w = useWipe(wipe?.[0] ?? 0.4, wipe?.[1] ?? 0);
  return <>{children(p, w)}</>;
};

/** Horizontal bars that grow from zero, each with its own value readout. */
export const BarChart: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  const max = Math.max(1, ...items.map((i) => i.value ?? 0));
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={column(ov.side)}>
        <Heading text={ov.text} accent={accent} />
        {items.map((it, i) => (
          <Bar
            key={i}
            item={it}
            index={i}
            max={max}
            color={SERIES[i % SERIES.length]}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Bar: React.FC<{
  item: ChartItem;
  index: number;
  max: number;
  color: string;
}> = ({ item, index, max, color }) => {
  const grow = useCountUp(1, 0.85, 0.12 + index * 0.14);
  const p = useStagger(index, 0.14);
  const w = ((item.value ?? 0) / max) * 100 * grow;
  return (
    <div style={{ marginBottom: 30, opacity: p }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: TYPE.body, fontWeight: 600, color: TEXT }}>
          {item.label}
        </span>
        <span
          style={{
            fontSize: TYPE.label,
            color: TEXT_FAINT,
            fontFamily: MONO_STACK,
          }}
        >
          {Math.round((item.value ?? 0) * grow)}
        </span>
      </div>
      <div
        style={{
          height: 22,
          borderRadius: 11,
          backgroundColor: fg(0.08),
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            borderRadius: 11,
            background: `linear-gradient(90deg, ${withAlpha(color, 0.75)}, ${color})`,
          }}
        />
      </div>
    </div>
  );
};

/** A line that draws itself, with dots landing on each vertex. */
export const LineChart: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  const draw = useWipe(0.9, 0.2);
  const w = PORTRAIT ? 860 : 700;
  const h = PORTRAIT ? 260 : 320;
  const max = Math.max(1, ...items.map((i) => i.value ?? 0));
  const pts = items.map((it, i) => ({
    x: (i / Math.max(1, items.length - 1)) * w,
    y: h - ((it.value ?? 0) / max) * h,
  }));
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={column(ov.side)}>
        <Heading text={ov.text} accent={accent} />
        <svg width={w} height={h + 60} style={{ overflow: "visible" }}>
          <DrawnPath
            d={d}
            progress={draw}
            stroke={accent}
            width={5}
            length={2200}
          />
          {pts.map((p, i) => {
            const on = draw > (i + 0.4) / Math.max(1, pts.length);
            return (
              <g key={i} opacity={on ? 1 : 0}>
                <circle cx={p.x} cy={p.y} r={9} fill={accent} />
                <text
                  x={p.x}
                  y={h + 42}
                  fill={TEXT_FAINT}
                  fontSize={22}
                  textAnchor="middle"
                >
                  {items[i].label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/** Donut with a sweep-in arc per slice. */
export const DonutChart: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  const total = items.reduce((s, i) => s + (i.value ?? 0), 0) || 1;
  const sweep = useCountUp(1, 1.0, 0.15);
  const R = 130;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={column(ov.side)}>
        <Heading text={ov.text} accent={accent} />
        <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
          <svg width={320} height={320} viewBox="0 0 320 320">
            <g transform="translate(160,160) rotate(-90)">
              {items.map((it, i) => {
                const frac = (it.value ?? 0) / total;
                const dash = C * frac * sweep;
                const el = (
                  <circle
                    key={i}
                    r={R}
                    fill="none"
                    stroke={SERIES[i % SERIES.length]}
                    strokeWidth={44}
                    strokeDasharray={`${dash} ${C}`}
                    strokeDashoffset={-offset * C * sweep}
                  />
                );
                offset += frac;
                return el;
              })}
            </g>
          </svg>
          <div>
            {items.map((it, i) => (
              <Stagger key={i} index={i} step={0.14} delay={0.4}>
                {(p) => (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 18,
                      opacity: p,
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: SERIES[i % SERIES.length],
                      }}
                    />
                    <span style={{ fontSize: TYPE.label, color: TEXT_DIM }}>
                      {it.label}
                    </span>
                  </div>
                )}
              </Stagger>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A meter that fills round, with the percentage counting up inside it. */
export const ProgressRing: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const target = typeof ov.value === "number" ? ov.value : 0;
  const v = useCountUp(target, 1.15);
  const R = 138;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={{ ...column(ov.side), alignItems: "flex-start" }}>
        <svg width={340} height={340} viewBox="0 0 340 340">
          <g transform="translate(170,170) rotate(-90)">
            <circle
              r={R}
              fill="none"
              stroke={fg(0.10)}
              strokeWidth={26}
            />
            <circle
              r={R}
              fill="none"
              stroke={accent}
              strokeWidth={26}
              strokeLinecap="round"
              strokeDasharray={`${(C * v) / 100} ${C}`}
            />
          </g>
          <text
            x={170}
            y={186}
            fill={TEXT}
            fontSize={82}
            fontWeight={800}
            textAnchor="middle"
          >
            {Math.round(v)}%
          </text>
        </svg>
        <div
          style={{
            marginTop: 26,
            fontSize: TYPE.headline,
            fontWeight: 700,
            color: TEXT,
          }}
        >
          {ov.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Vertical step tracker: a rail draws down, the active step lights up. */
export const StepProgress: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  // Items with `at` (seconds into the overlay) advance the active step in place, so a
  // narrated walk through the steps is ONE overlay instead of a re-entering chain.
  const { t } = useLocal();
  const cur = items.reduce(
    (c, it, i) => (it.at != null && t >= it.at ? i : c),
    ov.current_step ?? 0,
  );
  const rail = useWipe(0.55, 0.1);
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={column(ov.side)}>
        <Heading text={ov.text} accent={accent} />
        <div style={{ position: "relative", paddingLeft: 58 }}>
          <div
            style={{
              position: "absolute",
              left: 21,
              top: 12,
              width: 3,
              height: `${rail * 100}%`,
              backgroundColor: withAlpha(accent, 0.35),
            }}
          />
          {items.map((it, i) => (
            <Stagger key={i} index={i} step={0.09}>
              {(p) => {
                const done = i < cur;
                const active = i === cur;
                return (
                  <div
                    style={{
                      position: "relative",
                      marginBottom: 34,
                      opacity: p * (active ? 1 : done ? 0.72 : 0.4),
                      transform: `translateX(${(1 - p) * 18}px)`,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: -58,
                        top: 4,
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 22,
                        fontWeight: 700,
                        color: active ? ON_ACCENT : TEXT,
                        backgroundColor: active
                          ? accent
                          : fg(0.10),
                        border: `2px solid ${active ? accent : fg(0.22)}`,
                        boxShadow: active
                          ? `0 0 30px ${withAlpha(accent, 0.6)}`
                          : undefined,
                      }}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <div
                      style={{
                        fontSize: active ? TYPE.headline : TYPE.body,
                        fontWeight: active ? 800 : 600,
                        color: active ? TEXT : TEXT_DIM,
                        lineHeight: 1.2,
                      }}
                    >
                      {it.label}
                    </div>
                  </div>
                );
              }}
            </Stagger>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Milestones along a drawn spine. */
export const Timeline: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  const cur = ov.current ?? -1;
  const spine = useWipe(0.7, 0.12);
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={column(ov.side)}>
        <Heading text={ov.text} accent={accent} />
        <div style={{ position: "relative", paddingLeft: 52 }}>
          <div
            style={{
              position: "absolute",
              left: 15,
              top: 10,
              width: 3,
              height: `${spine * 100}%`,
              background: `linear-gradient(180deg, ${accent}, ${withAlpha(accent, 0.15)})`,
            }}
          />
          {items.map((it, i) => (
            <Stagger key={i} index={i} step={0.18} delay={0.15}>
              {(p) => {
                const reached = i <= cur;
                return (
                  <div
                    style={{
                      position: "relative",
                      marginBottom: 40,
                      opacity: p,
                      transform: `translateY(${(1 - p) * 20}px)`,
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: -46,
                        top: 8,
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: reached ? accent : RAISED,
                        border: `3px solid ${accent}`,
                        boxShadow: reached
                          ? `0 0 22px ${withAlpha(accent, 0.7)}`
                          : undefined,
                      }}
                    />
                    <div
                      style={{
                        fontSize: TYPE.body,
                        fontWeight: 700,
                        color: TEXT,
                      }}
                    >
                      {it.label}
                    </div>
                    {it.sublabel ? (
                      <div
                        style={{
                          fontSize: TYPE.label,
                          color: TEXT_FAINT,
                          marginTop: 6,
                        }}
                      >
                        {it.sublabel}
                      </div>
                    ) : null}
                  </div>
                );
              }}
            </Stagger>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Numbered rows sliding in, each with a rule that wipes under it. */
export const BulletList: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={column(ov.side)}>
        <Heading text={ov.text} accent={accent} />
        {items.map((it, i) => (
          <Stagger key={i} index={i} step={0.14} wipe={[0.4, 0.14 * i + 0.16]}>
            {(p, rule) => (
              <div
                style={{
                  marginBottom: 26,
                  opacity: p,
                  transform: `translateX(${(1 - p) * -26}px)`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 18 }}
                >
                  <span
                    style={{
                      fontFamily: MONO_STACK,
                      fontSize: TYPE.label,
                      color: accent,
                      fontWeight: 700,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontSize: TYPE.headline,
                      fontWeight: 600,
                      color: TEXT,
                    }}
                  >
                    {it.label}
                  </span>
                </div>
                <div
                  style={{
                    height: 1,
                    marginTop: 16,
                    backgroundColor: fg(0.16),
                    transform: `scaleX(${rule})`,
                    transformOrigin: "left center",
                  }}
                />
              </div>
            )}
          </Stagger>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Two stacked cards, the second arriving after the first, colour-coded. */
export const Comparison: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
}) => {
  const exit = useExit();
  const cards = [
    { ...(ov.left ?? { label: "", text: "" }), color: SERIES[0] },
    { ...(ov.right ?? { label: "", text: "" }), color: SERIES[1] },
  ];
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={column(ov.side)}>
        {cards.map((c, i) => (
          <Stagger key={i} index={i} step={0.24}>
            {(p) => (
              <div
                style={{
                  ...glass(),
                  padding: "34px 36px",
                  marginBottom: 26,
                  borderLeft: `6px solid ${c.color}`,
                  opacity: p,
                  transform: `translateX(${(1 - p) * (i === 0 ? -36 : 36)}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO_STACK,
                    fontSize: TYPE.micro,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    color: c.color,
                    marginBottom: 12,
                  }}
                >
                  {c.label}
                </div>
                <div
                  style={{
                    fontSize: TYPE.body,
                    fontWeight: 600,
                    color: TEXT,
                    lineHeight: 1.28,
                  }}
                >
                  {c.text}
                </div>
              </div>
            )}
          </Stagger>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Dictionary-style: the term, a rule, then its definition typing in. */
export const TermCard: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const settle = useSettle();
  const rule = useWipe(0.45, 0.22);
  const body = useSettle(0.4);
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div style={column(ov.side)}>
        <div
          style={{
            ...slab(),
            padding: "44px 44px 48px",
            opacity: settle,
            transform: `translateY(${(1 - settle) * 26}px)`,
          }}
        >
          {ov.eyebrow ? (
            <div
              style={{
                fontFamily: MONO_STACK,
                fontSize: TYPE.micro,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: accent,
                marginBottom: 16,
              }}
            >
              {ov.eyebrow}
            </div>
          ) : null}
          <div
            style={{
              fontSize: TYPE.title,
              fontWeight: 800,
              color: TEXT,
              letterSpacing: -1,
            }}
          >
            {ov.text}
          </div>
          <div
            style={{
              height: 4,
              width: 200,
              marginTop: 22,
              marginBottom: 24,
              borderRadius: 2,
              backgroundColor: accent,
              transform: `scaleX(${rule})`,
              transformOrigin: "left center",
            }}
          />
          <div
            style={{
              fontSize: TYPE.body,
              color: TEXT_DIM,
              lineHeight: 1.34,
              opacity: body,
              transform: `translateY(${(1 - body) * 12}px)`,
            }}
          >
            {ov.items?.[0]?.label ?? ov.eyebrow ?? ""}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Wide bottom strip: two or three facts side by side under the video. */
export const FactBand: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const items = ov.items ?? [];
  const rule = useWipe(0.5, 0.05);
  return (
    <AbsoluteFill style={{ opacity: exit }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: graphicRegion("band").top,
          bottom: graphicRegion("band").bottom,
          padding: PORTRAIT ? "0 60px" : "0 120px",
          display: "flex",
          flexDirection: PORTRAIT && items.length > 2 ? "column" : "row",
          alignItems: PORTRAIT && items.length > 2 ? "stretch" : "center",
          justifyContent: "center",
          gap: PORTRAIT ? 34 : 70,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: 3,
            background: `linear-gradient(90deg, ${accent}, ${withAlpha(accent, 0)})`,
            transform: `scaleX(${rule})`,
            transformOrigin: "left center",
          }}
        />
        {items.map((it, i) => (
          <Stagger key={i} index={i} step={0.18} delay={0.12}>
            {(p) => (
              <div
                style={{
                  flex: 1,
                  opacity: p,
                  transform: `translateY(${(1 - p) * 24}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO_STACK,
                    fontSize: TYPE.micro,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    color: accent,
                    marginBottom: 12,
                  }}
                >
                  {it.sublabel ?? `0${i + 1}`}
                </div>
                <div
                  style={{
                    fontSize: TYPE.headline,
                    fontWeight: 700,
                    color: TEXT,
                    lineHeight: 1.2,
                  }}
                >
                  {it.label}
                </div>
              </div>
            )}
          </Stagger>
        ))}
      </div>
    </AbsoluteFill>
  );
};
