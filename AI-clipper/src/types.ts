import type { Caption } from "@remotion/captions";

export type Framing = "black" | "blur" | "center" | "track";
export type Language = "en" | "te" | "hi";

export type EndCard = { title: string; subtitle: string };

export type ShortProps = {
  /** File in the job's public/ folder, or a remote URL. */
  src: string;
  durationInSeconds: number;
  srcWidth: number;
  srcHeight: number;
  framing: Framing;
  language: Language;
  /** Wrap words in *asterisks* to highlight them in the black-bar hook. */
  hook: string;
  cta: string;
  captions: Caption[];
  /** Speaker crop path for framing="track": x is the normalised face centre. */
  track: { t: number; x: number }[] | null;
  /** Black framing only: prompts that rotate in the top bar after the hook. */
  topTexts?: string[];
  /** Black framing only: the animated card over the last seconds. */
  endCard?: EndCard;
};
