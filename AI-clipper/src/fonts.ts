import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadNotoTelugu } from "@remotion/google-fonts/NotoSansTelugu";
import { loadFont as loadNotoDevanagari } from "@remotion/google-fonts/NotoSansDevanagari";
import type { Language } from "./types";

const latin = loadMontserrat("normal", { weights: ["800", "900"], subsets: ["latin"] }).fontFamily;
const telugu = loadNotoTelugu("normal", { weights: ["700", "800"], subsets: ["telugu", "latin"] }).fontFamily;
const devanagari = loadNotoDevanagari("normal", { weights: ["700", "800"], subsets: ["devanagari", "latin"] }).fontFamily;

/** Font stack per spoken language; Montserrat stays as fallback for Latin words mixed into te/hi speech. */
export const fontFor = (language: Language): string => {
  if (language === "te") return `${telugu}, ${latin}, sans-serif`;
  if (language === "hi") return `${devanagari}, ${latin}, sans-serif`;
  return `${latin}, sans-serif`;
};
