import React from "react";
import type { Overlay } from "../types";
import {
  Annotation,
  KeywordChip,
  LowerThird,
  MarqueeStrip,
  SideNote,
} from "./Accents";
import {
  Checklist,
  FlowDiagram,
  MatrixGrid,
  NumberRoll,
  StatTrio,
} from "./FullFrame";
import {
  BarChart,
  BulletList,
  Comparison,
  DonutChart,
  FactBand,
  LineChart,
  ProgressRing,
  StepProgress,
  TermCard,
  Timeline,
} from "./Panels";
import { PollPrompt } from "./Involve";
import { DataTable } from "./Table";
import { SampleAnswer } from "./SampleAnswer";
import { QuestionCard } from "./QuestionCard";
import { SpeedHint, TitleSlide } from "./Title";
import { BigStatement, ChapterOpen, QuotePull, WordSwap } from "./Takeover";

/** Everything the planner may emit; anything else is dropped, loudly. */
const REGISTRY: Record<
  string,
  React.FC<{ ov: Overlay; accent: string; index: number }>
> = {
  chapter_open: ChapterOpen,
  big_statement: BigStatement,
  word_swap: WordSwap,
  quote_pull: QuotePull,
  number_roll: NumberRoll,
  stat_trio: StatTrio,
  flow_diagram: FlowDiagram,
  matrix_grid: MatrixGrid,
  checklist: Checklist,
  data_table: DataTable,
  bar_chart: BarChart,
  line_chart: LineChart,
  donut_chart: DonutChart,
  progress_ring: ProgressRing,
  step_progress: StepProgress,
  timeline: Timeline,
  bullet_list: BulletList,
  comparison: Comparison,
  term_card: TermCard,
  fact_band: FactBand,
  keyword_chip: KeywordChip,
  lower_third: LowerThird,
  side_note: SideNote,
  annotation: Annotation,
  marquee_strip: MarqueeStrip,
  poll_prompt: PollPrompt,
  title_slide: TitleSlide,
  sample_answer: SampleAnswer,
  speed_hint: SpeedHint,
  question_card: QuestionCard,
};

export const isRenderable = (ov: Overlay): boolean => {
  if (REGISTRY[ov.type]) return true;
  console.warn(
    `[overlays] unknown type "${ov.type}" at ${ov.start}s -- skipped`,
  );
  return false;
};

export const OverlayRenderer: React.FC<{
  ov: Overlay;
  accent: string;
  chapterIndex: number;
}> = ({ ov, accent, chapterIndex }) => {
  const Comp = REGISTRY[ov.type];
  if (!Comp) return null;
  return <Comp ov={ov} accent={accent} index={chapterIndex} />;
};
