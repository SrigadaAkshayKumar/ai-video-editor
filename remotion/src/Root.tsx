import "./index.css";
import { Composition, Folder } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Doc } from "./doc/Doc";
import { galleryProps } from "./doc/gallery";
import type { DocProps } from "./doc/types";
import { Thumbnail, thumbnailDefaults } from "./thumbnail/Thumbnail";
import type { ThumbnailProps } from "./thumbnail/Thumbnail";

// `Doc` is the picture pass for every edit (talking head + faceless), fed
// projects/<p>/work/props-<fmt>.json by tools/render-visuals.mjs. Size, fps and
// length come from the props, so one composition serves 16:9 and 9:16.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Doc"
        component={Doc}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
        defaultProps={galleryProps() as DocProps}
        calculateMetadata={({ props }) => ({
          width: props.width,
          height: props.height,
          fps: props.fps,
          durationInFrames: Math.max(1, Math.round(props.durationInSeconds * props.fps)),
        })}
      />
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        width={1280}
        height={720}
        fps={30}
        durationInFrames={1}
        defaultProps={thumbnailDefaults as ThumbnailProps}
        calculateMetadata={({ props }) => ({ width: props.width, height: props.height })}
      />
      <Folder name="Starter">
        <Composition
          id="HelloWorld"
          component={HelloWorld}
          durationInFrames={150}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ titleText: "Welcome to Remotion", titleColor: "#000000" }}
        />
      </Folder>
    </>
  );
};
