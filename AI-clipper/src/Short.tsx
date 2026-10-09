import { AbsoluteFill, useVideoConfig } from "remotion";
import { EndCardOverlay, StartFlash, TopBar, VideoEdges } from "./BlackBars";
import { Captions } from "./Captions";
import { Framing } from "./Framing";
import { MIN_BAR, plainHook, videoRect } from "./layout";
import { CallToAction, Hook } from "./Overlays";
import type { ShortProps } from "./types";

const DEFAULT_TOP_TEXTS = ["📌 Full video link in pinned comment", "💬 Comment your thoughts below"];
const DEFAULT_END_CARD = { title: "WATCH FULL VIDEO", subtitle: "Link in the pinned comment" };

export const Short: React.FC<ShortProps> = ({
  src,
  srcWidth,
  srcHeight,
  framing,
  language,
  hook,
  cta,
  captions,
  track,
  topTexts,
  endCard,
}) => {
  const { width, height } = useVideoConfig();
  const rect = videoRect(srcWidth, srcHeight, width, height);

  // Black letterbox: hook + prompts live in the top bar, captions in the bottom bar, end card at the close.
  if (framing === "black" && rect.top >= MIN_BAR) {
    return (
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        <Framing src={src} framing={framing} srcWidth={srcWidth} srcHeight={srcHeight} track={track} />
        <VideoEdges rect={rect} />
        <TopBar
          barHeight={rect.top}
          hook={hook}
          cta={cta}
          topTexts={topTexts?.length ? topTexts : DEFAULT_TOP_TEXTS}
          language={language}
        />
        <StartFlash />
        <EndCardOverlay card={endCard ?? DEFAULT_END_CARD} language={language} />
        <Captions top={rect.bottom + 70} captions={captions} language={language} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Framing src={src} framing={framing} srcWidth={srcWidth} srcHeight={srcHeight} track={track} />
      <Captions captions={captions} language={language} />
      <Hook text={plainHook(hook)} language={language} />
      <CallToAction text={cta} language={language} />
    </AbsoluteFill>
  );
};
