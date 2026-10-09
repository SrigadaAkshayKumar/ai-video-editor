/**
 * One of every overlay type, back to back, on a faceless graphic track.
 * The Doc composition's default props (what Remotion Studio shows) and the
 * fixture used to QA every component in both 16:9 and 9:16 with stills.
 */
import type { DocProps, Overlay } from "./types";

const beats: Omit<Overlay, "start">[] = [
  {
    type: "title_slide",
    duration: 4,
    text: "Is a Degree Still Worth It?",
    eyebrow: "A 6-minute explainer",
    value: "2026",
  },
  {
    type: "speed_hint",
    duration: 3.5,
    text: "Watch at 1.5x for a better experience",
  },
  {
    type: "chapter_open",
    duration: 3.5,
    text: "The Real Numbers",
    eyebrow: "Section 01",
    section: 1,
  },
  {
    type: "big_statement",
    duration: 4,
    text: "Most graduates are not job ready",
    eyebrow: "not",
    section: 1,
  },
  {
    type: "word_swap",
    duration: 4,
    from: "Certificate",
    to: "Skill",
    text: "What employers actually check",
    section: 1,
  },
  {
    type: "quote_pull",
    duration: 4,
    text: "Will an online course get me a job?",
    eyebrow: "Viewer question",
    section: 1,
  },
  {
    type: "number_roll",
    duration: 4,
    value: 25000,
    prefix: "₹",
    text: "Monthly stipend",
    section: 2,
  },
  {
    type: "stat_trio",
    duration: 4,
    section: 2,
    items: [
      { label: "Applicants", value: 1200 },
      { label: "Shortlisted", value: 140 },
      { label: "Hired", value: 12 },
    ],
  },
  {
    type: "flow_diagram",
    duration: 5,
    text: "How it fits together",
    section: 2,
    items: [
      { label: "Register", sublabel: "free" },
      { label: "Prepare", sublabel: "12 weeks" },
      { label: "Exam", sublabel: "proctored" },
      { label: "Certified" },
    ],
  },
  {
    type: "matrix_grid",
    duration: 4,
    text: "Roles that want this",
    section: 2,
    items: [
      { label: "Data Analyst" },
      { label: "QA Engineer" },
      { label: "Cloud Support" },
      { label: "Backend Dev" },
      { label: "SRE" },
      { label: "ML Ops" },
    ],
  },
  {
    type: "checklist",
    duration: 4,
    text: "Why you should join",
    section: 2,
    items: [
      { label: "For college credits", state: "yes" },
      { label: "For a guaranteed job", state: "no" },
      { label: "To build a portfolio", state: "yes" },
    ],
  },
  {
    type: "data_table",
    duration: 4,
    text: "Test pattern",
    section: 0,
    columns: ["Section", "Questions", "Time"],
    rows: [
      { cells: ["Reasoning", "15", "25 min"], at: 0.3, color: "#4fd1ff" },
      { cells: ["Mathematical", "10", "35 min"], at: 0.6, color: "#ffb547" },
      { cells: ["Verbal", "20", "20 min"], at: 0.9, color: "#9be15d" },
      { cells: ["Pseudocode", "5", "10 min"], at: 1.2, color: "#b18cff" },
      { cells: ["Puzzle solving", "4", "10 min"], at: 1.5, color: "#ff6b5b" },
    ],
    footer: "54 Q · ~100 MIN",
    footer_at: 1.9,
  },
  {
    type: "bar_chart",
    duration: 4,
    text: "Placement rate by stream",
    side: "left",
    section: 3,
    items: [
      { label: "CSE", value: 78 },
      { label: "ECE", value: 61 },
      { label: "Mech", value: 34 },
    ],
  },
  {
    type: "line_chart",
    duration: 4,
    text: "Openings per quarter",
    side: "right",
    section: 3,
    items: [
      { label: "Q1", value: 20 },
      { label: "Q2", value: 35 },
      { label: "Q3", value: 30 },
      { label: "Q4", value: 52 },
    ],
  },
  {
    type: "donut_chart",
    duration: 4,
    text: "Where the time goes",
    side: "left",
    section: 3,
    items: [
      { label: "Learning", value: 50 },
      { label: "Projects", value: 30 },
      { label: "Applying", value: 20 },
    ],
  },
  {
    type: "progress_ring",
    duration: 4,
    value: 68,
    text: "Finish the course",
    side: "right",
    section: 3,
  },
  {
    type: "step_progress",
    duration: 4,
    text: "Your roadmap",
    side: "left",
    current_step: 1,
    section: 3,
    items: [
      { label: "Basics" },
      { label: "Projects" },
      { label: "Internship" },
      { label: "Job" },
    ],
  },
  {
    type: "timeline",
    duration: 4,
    text: "How it changed",
    side: "right",
    current: 1,
    section: 4,
    items: [
      { label: "2019", sublabel: "launch" },
      { label: "2022", sublabel: "credits" },
      { label: "2025", sublabel: "jobs board" },
    ],
  },
  {
    type: "bullet_list",
    duration: 4,
    text: "Three mistakes",
    side: "left",
    section: 4,
    items: [
      { label: "Collecting certificates" },
      { label: "Skipping projects" },
      { label: "Applying late" },
    ],
  },
  {
    type: "comparison",
    duration: 4,
    side: "right",
    section: 4,
    left: { label: "Certificate", text: "Proves you attended" },
    right: { label: "Certification", text: "Proves you can do it" },
  },
  {
    type: "term_card",
    duration: 4,
    text: "Swayam",
    eyebrow: "Definition",
    side: "left",
    section: 4,
    items: [
      { label: "A government platform that makes university courses free." },
    ],
  },
  {
    type: "fact_band",
    duration: 4,
    section: 4,
    items: [
      { label: "Free to enrol", sublabel: "Cost" },
      { label: "12 weeks", sublabel: "Length" },
      { label: "₹1000 exam", sublabel: "Fee" },
    ],
  },
  {
    type: "keyword_chip",
    duration: 3,
    text: "NPTEL",
    side: "left",
    section: 0,
  },
  {
    type: "lower_third",
    duration: 3.5,
    text: "Akshay Srigada",
    eyebrow: "Software Engineer",
    side: "left",
    section: 0,
  },
  {
    type: "side_note",
    duration: 3.5,
    text: "Credits transfer to some colleges",
    side: "right",
    section: 0,
  },
  {
    type: "annotation",
    duration: 3.5,
    text: "NPTEL Star",
    shape: "circle",
    side: "left",
    section: 0,
  },
  {
    type: "marquee_strip",
    duration: 3,
    text: "SKILLS OVER CERTIFICATES",
    section: 0,
  },
  {
    type: "poll_prompt",
    duration: 4.5,
    text: "Which one would you pick?",
    eyebrow: "Your turn",
    section: 1,
    items: [
      { label: "Degree", value: 62 },
      { label: "Bootcamp", value: 38 },
    ],
  },
  {
    type: "sample_answer",
    duration: 4.5,
    eyebrow: "Sample answer",
    section: 2,
    text: "I am a [your branch] graduate with hands-on experience in [two tools].\nIn my last project I [what you built], which [the result].",
  },
  {
    type: "question_card",
    duration: 5,
    eyebrow: "Time & Work",
    numeral: "Q3",
    section: 1,
    text: "A finishes a job in 12 days, B in 18 days. Working together, how long will they take?",
    timer: 4,
    timer_at: 0.9,
  },
];

const gap = 0.6;
let t = 0;
const overlays: Overlay[] = beats.map((b) => {
  const ov = { ...b, start: t } as Overlay;
  t += b.duration + gap;
  return ov;
});

export const GALLERY_TIMES = overlays.map((o) => ({
  type: o.type,
  at: o.start + Math.min(1.6, o.duration * 0.55),
}));

export const galleryProps = (width = 1920, height = 1080): DocProps => ({
  mode: "faceless",
  styleVariant: "glass",
  width,
  height,
  fps: 30,
  durationInSeconds: Math.ceil(t),
  scenes: [
    {
      index: 0,
      start: 0,
      end: Math.ceil(t),
      kind: "graphic",
      motion: "static",
    },
  ],
  overlays,
  cameraMoves: [],
});
