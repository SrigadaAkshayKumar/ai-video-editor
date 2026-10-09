/**
 * Audience-involvement beats. Faceless documentary has no presenter to look
 * down the lens and ask the viewer something, so the graphic has to do it.
 *
 * `poll_prompt` is a takeover: a question put directly to the viewer, with two
 * or three answers whose bars fill part-way and then stop. The bars are
 * deliberately unresolved -- the point is to make the viewer pick one and say
 * so, not to report a real result. Give each item a `value` (0-100) only as a
 * visual weight; never label it as real polling data.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { CAPTION_SAFE_Y, HEIGHT, PORTRAIT, SAFE_TOP, TEXT, TEXT_DIM, TEXT_FAINT, TYPE, glass, withAlpha, fg } from "../theme";
import type { Overlay } from "../types";
import { Words, useExit, useSettle, useStagger, useWipe } from "./motion";

export const PollPrompt: React.FC<{ ov: Overlay; accent: string }> = ({
  ov,
  accent,
}) => {
  const exit = useExit(0.4);
  const card = useSettle(0, 0.85);
  // Up to five options; past three they flow into two columns so the card
  // keeps its height (the comment-ask "which of these five" beat).
  const items = (ov.items ?? []).slice(0, 5);
  const twoCol = items.length > 3 && !PORTRAIT;

  return (
    <AbsoluteFill
      style={{
        opacity: exit,
        alignItems: "center",
        justifyContent: "center",
        padding: PORTRAIT
          ? `${SAFE_TOP}px 50px ${HEIGHT - CAPTION_SAFE_Y + 20}px`
          : "0 180px 170px",
      }}
    >
      <div
        style={{
          ...glass(),
          width: "100%",
          maxWidth: 1320,
          padding: PORTRAIT ? "44px 44px 46px" : "58px 68px 62px",
          opacity: card,
          transform: `translateY(${(1 - card) * 34}px)`,
        }}
      >
        {ov.eyebrow ? (
          <div
            style={{
              fontSize: TYPE.label,
              fontWeight: 800,
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
            lineHeight: 1.12,
            marginBottom: items.length ? 44 : 0,
          }}
        >
          <Words text={ov.text ?? ""} delay={0.08} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: twoCol ? "1fr 1fr" : "1fr",
            columnGap: 56,
          }}
        >
          {items.map((it, i) => (
            <PollBar key={it.label} item={it} index={i} accent={accent} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const PollBar: React.FC<{
  item: { label: string; value?: number; sublabel?: string };
  index: number;
  accent: string;
}> = ({ item, index, accent }) => {
  const appear = useStagger(index, 0.14, 0.3);
  const fill = useWipe(0.9, 0.5 + index * 0.14);
  const width = Math.max(8, Math.min(100, item.value ?? 50));

  return (
    <div
      style={{
        opacity: appear,
        transform: `translateX(${(1 - appear) * 26}px)`,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 9,
        }}
      >
        <span style={{ fontSize: TYPE.body, fontWeight: 700, color: TEXT_DIM }}>
          {item.label}
        </span>
        {item.sublabel ? (
          <span
            style={{ fontSize: TYPE.micro, color: TEXT_FAINT, fontWeight: 600 }}
          >
            {item.sublabel}
          </span>
        ) : null}
      </div>
      <div
        style={{
          height: 18,
          borderRadius: 999,
          backgroundColor: fg(0.10),
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width * fill}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${withAlpha(accent, 0.55)}, ${accent})`,
            boxShadow: `0 0 22px ${withAlpha(accent, 0.5)}`,
          }}
        />
      </div>
    </div>
  );
};
