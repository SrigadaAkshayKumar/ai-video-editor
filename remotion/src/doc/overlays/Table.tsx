/**
 * data_table -- a real table that builds row by row in sync with the voice.
 *
 * Made for the "screenshot-worthy" moment of an explainer: a test pattern
 * (section / questions / time), a trace table for a loop, a fee schedule.
 * Each row prints in at its own `at` (seconds into the overlay) and the most
 * recent row stays highlighted until the next one lands, so the eye follows
 * the narration down the table. Optional `code` draws a listing beside the
 * table (a trace table next to the loop it traces). Corner layout: the table
 * owns the frame.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { CAPTION_SAFE_Y, HEIGHT, MONO_STACK, PORTRAIT, SAFE_TOP, TEXT, TEXT_DIM, TEXT_FAINT, TYPE, slab, withAlpha, fg } from "../theme";
import type { Overlay } from "../types";
import { Words, useExit, useLocal, useSettle, useStagger } from "./motion";

const Row: React.FC<{
  cells: string[];
  at: number;
  active: boolean;
  color: string;
  widths: string;
  aligns: ("left" | "right")[];
  fontSize: number;
}> = ({ cells, at, active, color, widths, aligns, fontSize }) => {
  const p = useStagger(0, 0.1, at);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: widths,
        alignItems: "center",
        padding: PORTRAIT ? "14px 20px" : "16px 28px",
        borderTop: `1px solid ${fg(0.09)}`,
        backgroundColor: active ? withAlpha(color, 0.2) : "transparent",
        boxShadow: active ? `inset 5px 0 0 ${color}` : "none",
        opacity: p,
        transform: `translateX(${(1 - p) * -26}px)`,
        fontSize,
        color: active ? TEXT : TEXT_DIM,
        fontWeight: active ? 800 : 600,
      }}
    >
      {cells.map((c, j) => (
        <div
          key={j}
          style={{
            textAlign: aligns[j],
            fontFamily: j === 0 ? undefined : MONO_STACK,
            color: j === 0 ? undefined : active ? color : TEXT,
            display: "flex",
            alignItems: "center",
            justifyContent: aligns[j] === "left" ? "flex-start" : "flex-end",
            gap: 14,
          }}
        >
          {j === 0 ? (
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                backgroundColor: color,
                flex: "none",
              }}
            />
          ) : null}
          {c}
        </div>
      ))}
    </div>
  );
};

export const DataTable: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit();
  const { t } = useLocal();
  const card = useSettle(0);
  const cols = ov.columns ?? [];
  const rows = ov.rows ?? [];
  const n = Math.max(1, cols.length);
  // Columns sized and aligned by what they hold: short figures sit right, prose/formulas read left
  // (a long right-aligned cell wrapped into a ragged-left block on the 21-day plan).
  const avg = Array.from({ length: n }, (_, j) =>
    rows.reduce((a, r) => a + (r.cells[j] ?? "").length, 0) / Math.max(1, rows.length),
  );
  const widths = avg.map((l) => `${Math.max(0.8, Math.min(2.6, l / 9)).toFixed(2)}fr`).join(" ");
  const aligns = avg.map((l, j) => (j === 0 || l > 14 ? "left" : "right") as "left" | "right");
  const ats = rows.map((r, i) => r.at ?? 0.35 + i * 0.4);
  let activeIdx = -1;
  ats.forEach((a, i) => {
    if (t >= a) activeIdx = i;
  });
  const footerAt = ov.footer_at ?? (ats.length ? ats[ats.length - 1] + 0.6 : 1);
  const footer = useStagger(0, 0.1, footerAt);
  const hasCode = Boolean(ov.code);
  // Size the listing to its longest line (mono ≈ 0.6em per char) so it never pushes the table
  // into a sliver: font 22-34px, panel ≤ 62% of the 1240px block.
  const codeLen = Math.max(1, ...(ov.code ?? "").split("\n").map((l) => l.length));
  const codeFont = Math.max(22, Math.min(PORTRAIT ? 30 : 34, 560 / (codeLen * 0.6)));
  const codeW = Math.min(640, Math.round(codeLen * 0.6 * codeFont + 80));
  const fontSize = PORTRAIT ? 30 : hasCode ? 29 : rows.length > 5 ? 32 : 36;

  const table = (
    <div
      style={{
        ...slab(),
        overflow: "hidden",
        flex: hasCode ? "1 1 0" : undefined,
        width: hasCode ? undefined : PORTRAIT ? "100%" : 1240,
        opacity: card,
        transform: `translateY(${(1 - card) * 24}px)`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: widths,
          padding: PORTRAIT ? "14px 20px" : "16px 28px",
          fontFamily: MONO_STACK,
          fontSize: TYPE.micro,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: TEXT_FAINT,
          backgroundColor: withAlpha(accent, 0.1),
        }}
      >
        {cols.map((c, j) => (
          <div key={j} style={{ textAlign: aligns[j] }}>
            {c}
          </div>
        ))}
      </div>
      {rows.map((r, i) => (
        <Row
          key={i}
          cells={r.cells}
          at={ats[i]}
          active={i === activeIdx && t < footerAt}
          color={r.color ?? accent}
          widths={widths}
          aligns={aligns}
          fontSize={fontSize}
        />
      ))}
      {ov.footer ? (
        <div
          style={{
            padding: PORTRAIT ? "16px 20px" : "18px 28px",
            borderTop: `2px solid ${accent}`,
            fontFamily: MONO_STACK,
            fontSize: fontSize * 0.86,
            fontWeight: 800,
            letterSpacing: 1,
            color: accent,
            textAlign: "right",
            opacity: footer,
          }}
        >
          {ov.footer}
        </div>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        fontVariantLigatures: "none",
        justifyContent: "center",
        alignItems: PORTRAIT ? "stretch" : "center",
        ...(PORTRAIT
          ? {
              paddingTop: SAFE_TOP + 270,
              paddingBottom: HEIGHT - CAPTION_SAFE_Y,
              paddingLeft: 60,
              paddingRight: 60,
            }
          : // Landscape: hug the left so the corner picture card (bottom-right) stays clear.
            { padding: "110px 560px 150px 120px", alignItems: "flex-start" }),
      }}
    >
      {ov.text ? (
        <div
          style={{
            width: PORTRAIT ? "100%" : 1240,
            fontSize: TYPE.headline,
            fontWeight: 800,
            color: TEXT,
            marginBottom: 30,
          }}
        >
          <Words text={ov.text} step={0.05} />
        </div>
      ) : null}
      {hasCode ? (
        <div
          style={{
            display: "flex",
            flexDirection: PORTRAIT ? "column" : "row",
            gap: 36,
            width: PORTRAIT ? "100%" : 1240,
            alignItems: "stretch",
          }}
        >
          <pre
            style={{
              ...slab(),
              margin: 0,
              flex: PORTRAIT ? "1 1 0" : `0 0 ${codeW}px`,
              padding: PORTRAIT ? "22px 26px" : "30px 36px",
              fontFamily: MONO_STACK,
              fontSize: codeFont,
              lineHeight: 1.55,
              color: TEXT,
              opacity: card,
              whiteSpace: "pre",
              // code must read as typed: no "!=" → "≠" ligature
              fontVariantLigatures: "none",
            }}
          >
            {ov.code}
          </pre>
          {table}
        </div>
      ) : (
        table
      )}
    </AbsoluteFill>
  );
};
