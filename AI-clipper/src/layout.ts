/** Where a contained source sits inside the 9:16 frame (black framing). */
export const videoRect = (srcWidth: number, srcHeight: number, width: number, height: number) => {
  const h = Math.min(height, (width * srcHeight) / srcWidth);
  const top = (height - h) / 2;
  return { top, bottom: top + h, height: h };
};

/** Below this the bars are too thin to hold the hook/captions, so the classic overlays are used. */
export const MIN_BAR = 300;

/** Strip the *highlight* markers for layouts that don't use them. */
export const plainHook = (text: string) => text.replace(/\*/g, "");
