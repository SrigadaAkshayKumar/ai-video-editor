import { Composition, type CalculateMetadataFunction } from "remotion";
import { Short } from "./Short";
import type { ShortProps } from "./types";

const FPS = 30;

const calculateMetadata: CalculateMetadataFunction<ShortProps> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.ceil(props.durationInSeconds * FPS)),
});

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Short"
      component={Short}
      durationInFrames={10 * FPS}
      fps={FPS}
      width={1080}
      height={1920}
      calculateMetadata={calculateMetadata}
      defaultProps={{
        src: "https://remotion.media/video.mp4",
        durationInSeconds: 10,
        srcWidth: 1920,
        srcHeight: 1080,
        framing: "blur",
        language: "en",
        hook: "Nobody tells you this about editing",
        cta: "Would you try this? Comment below 👇",
        captions: [
          { text: " This", startMs: 3200, endMs: 3500, timestampMs: null, confidence: null },
          { text: " is", startMs: 3500, endMs: 3700, timestampMs: null, confidence: null },
          { text: " a", startMs: 3700, endMs: 3800, timestampMs: null, confidence: null },
          { text: " caption", startMs: 3800, endMs: 4400, timestampMs: null, confidence: null },
          { text: " preview", startMs: 4400, endMs: 5200, timestampMs: null, confidence: null },
        ],
        track: null,
      } satisfies ShortProps}
    />
  );
};
