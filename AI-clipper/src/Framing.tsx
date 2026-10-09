import { Video } from "@remotion/media";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { ShortProps } from "./types";

const resolveSrc = (src: string) => (/^https?:\/\//.test(src) ? src : staticFile(src));

/** Places the 16:9 (or any) source into the 9:16 frame according to the chosen framing. */
export const Framing: React.FC<Pick<ShortProps, "src" | "framing" | "srcWidth" | "srcHeight" | "track">> = ({
  src,
  framing,
  srcWidth,
  srcHeight,
  track,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const url = resolveSrc(src);

  if (framing === "black") {
    // Short punch-in on the first frames: an attention grab that settles before the hook finishes.
    const punch = interpolate(frame, [0, 10], [1.08, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    return (
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        <Video name="Video" src={url} objectFit="contain" style={{ width: "100%", height: "100%", scale: String(punch) }} />
      </AbsoluteFill>
    );
  }

  if (framing === "blur") {
    return (
      <AbsoluteFill style={{ backgroundColor: "black" }}>
        <Video
          name="Blurred background"
          src={url}
          muted
          objectFit="cover"
          style={{ width: "100%", height: "100%", scale: "1.15", filter: "blur(40px) brightness(0.55)" }}
        />
        <Video name="Video" src={url} objectFit="contain" style={{ position: "absolute", width: "100%", height: "100%" }} />
      </AbsoluteFill>
    );
  }

  if (framing === "track" && track && track.length > 0) {
    // Scale the source to fill the height, then slide it so the speaker stays centred.
    const scaledWidth = (height * srcWidth) / srcHeight;
    const t = frame / fps;
    const x =
      track.length === 1
        ? track[0].x
        : interpolate(
            t,
            track.map((k) => k.t),
            track.map((k) => k.x),
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
    const left = Math.min(0, Math.max(width - scaledWidth, width / 2 - x * scaledWidth));
    return (
      <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
        <Video
          name="Video"
          src={url}
          objectFit="fill"
          style={{ position: "absolute", top: 0, left, width: scaledWidth, height }}
        />
      </AbsoluteFill>
    );
  }

  // "center" (and "track" without tracking data): plain centre crop.
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Video name="Video" src={url} objectFit="cover" style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
