import { writeFileSync } from "node:fs";
const END = 221.93;
const S = [];
const sc = (start, end, o) => S.push({ index: S.length, start, end: end ?? END, ...o });
const g = (card, grade = "cool") => ({ kind: "graphic", grade, ...(card ? { card } : {}) });
const br = (src, ms = 0, motion = "ken_in", grade = "cool") => ({ kind: "broll", src: `assets/broll/${src}.mp4`, media_start: ms, motion, grade, transition: "fade" });
sc(0, 4.38, g({ value: "₹4,00,000", label: "CTC per annum" }, "warm"));
sc(4.38, 6.71, g({ value: "÷ 12", label: "= ₹33,333 a month?" }, "warm"));
sc(6.71, 10.35, br("phone", 0, "ken_in", "cool"));
sc(10.35, 13.12, g(null, "hot"));
sc(13.12, 19.29, br("office", 0, "ken_in", "cool"));
sc(19.29, 26.82, g({ value: "CTC → ₹", label: "what actually arrives" }, "cool"));
sc(26.82, 30.06, g(null, "neutral"));
sc(30.06, 35.43, br("keys", 0, "pan_right", "cool"));
sc(35.43, 44.87, g({ value: "TCS", label: "₹3.36–7 LPA · reported" }, "cool"));
sc(44.87, 51.85, g({ value: "Infosys", label: "₹3.6–9.5 LPA · reported" }, "warm"));
sc(51.85, 56.61, g({ value: "Wipro", label: "₹3.5–6.5 LPA · reported" }, "cool"));
sc(56.61, 59.83, g({ value: "HCLTech", label: "₹3.5–5 LPA · reported" }, "warm"));
sc(59.83, 65.29, g({ value: "Cognizant", label: "GenC · GenC Next" }, "cool"));
sc(65.29, 70.9, br("code", 0, "ken_out", "cool"));
sc(70.9, 73.6, g(null, "neutral"));
sc(73.6, 77.55, g(null, "neutral"));
sc(77.55, 80.54, g({ value: "CTC", label: "Cost To Company" }, "cool"));
sc(80.54, 82.88, g(null, "hot"));
sc(82.88, 85.59, g({ value: "≠ paid", label: "every month" }, "warm"));
sc(85.59, 97.25, g({ value: "CTC", label: "more than your monthly pay" }, "cool"));
sc(97.25, 106.58, g({ value: "−", label: "deducted every month" }, "warm"));
sc(106.58, 109.7, g(null, "neutral"));
sc(109.7, 113.7, g({ value: "₹4 LPA", label: "illustrative example" }, "cool"));
sc(113.7, 121.9, g({ value: "₹1.6L", label: "basic · 40% of CTC" }, "cool"));
sc(121.9, 124.5, g({ value: "−₹19,200", label: "employer PF" }, "warm"));
sc(124.5, 133.4, g({ value: "−₹7,696", label: "gratuity · ~4.81%" }, "warm"));
sc(133.4, 136.0, g({ value: "₹3,73,104", label: "gross · a year" }, "cool"));
sc(136.0, 139.6, g({ value: "₹31,092", label: "gross · a month" }, "cool"));
sc(139.6, 144.0, g({ value: "−₹1,600", label: "your PF · monthly" }, "warm"));
sc(144.0, 148.5, g({ value: "−₹200", label: "professional tax · varies" }, "warm"));
sc(148.5, 152.4, g({ value: "₹0", label: "income tax · new regime" }, "cool"));
sc(152.4, 156.75, g({ value: "≈ ₹29,292", label: "in-hand · a month" }, "hot"));
sc(156.75, 159.82, g(null, "hot"));
sc(159.82, 163.1, g(null, "neutral"));
sc(163.1, 172.75, g({ value: "Harder", label: "work, sooner" }, "cool"));
sc(172.75, 179.02, g({ value: "Coding", label: "round + interview" }, "warm"));
sc(179.02, 185.55, g({ value: "5 topics", label: "arrays → SQL" }, "cool"));
sc(185.55, 191.76, g({ value: "₹3.5L → ₹6.5L", label: "from day one" }, "warm"));
sc(191.76, 196.08, g(null, "cool"));
sc(196.08, 201.49, g({ value: "≈ ₹29k", label: "₹4 LPA in hand (example)" }, "cool"));
sc(201.49, 205.62, g({ value: "Coding", label: "the fastest way up" }, "warm"));
sc(205.62, 211.44, g(null, "cool"));
sc(211.44, 213.82, g({ value: "Real", label: "numbers help others" }, "warm"));
sc(213.82, 217.04, g(null, "warm"));
sc(217.04, 220.21, g(null, "hot"));
sc(220.21, END, g(null, "neutral"));

const O = [];
const o = (start, end, type, p) => O.push({ start, duration: +(end - start).toFixed(2), type, ...p });
const FOOT = "Illustrative example · structures differ";
o(0.1, 4.0, "title_slide", { text: "Fresher Salary Reality", eyebrow: "Crack IT · Day 07", style_hint: "₹4 LPA is not ₹33,333 a month", value: "2026" });
o(4.45, 6.65, "big_statement", { text: "₹4,00,000 ÷ 12 = ₹33,333", eyebrow: "33,333" });
o(6.8, 10.3, "number_roll", { value: 29000, prefix: "₹", text: "Your first salary: closer to…" });
o(10.4, 13.05, "big_statement", { text: "You read CTC the wrong way", eyebrow: "wrong" });
o(13.4, 15.8, "keyword_chip", { text: "REPORTED PACKAGES", side: "right" });
o(16.0, 19.2, "matrix_grid", { text: "5 companies", items: [{ label: "TCS" }, { label: "Infosys" }, { label: "Wipro" }, { label: "HCLTech" }, { label: "Cognizant" }] });
o(19.4, 23.6, "flow_diagram", { text: "CTC → in-hand", items: [{ label: "CTC", sublabel: "company's cost" }, { label: "Deductions", sublabel: "PF · tax" }, { label: "In-hand", sublabel: "what you get" }] });
o(23.8, 26.7, "keyword_chip", { text: "HIGHER PAYING TRACKS", side: "left" });
o(27.3, 30.3, "chapter_open", { text: "Reported Packages", eyebrow: "Section 01", numeral: "01", section: 1 });
o(30.5, 35.3, "keyword_chip", { text: "REPORTED RANGES · 2026", side: "right" });
o(35.4, 65.2, "data_table", {
  text: "Reported fresher packages (LPA)", section: 1,
  columns: ["Company", "Regular", "Higher track"],
  rows: [
    { cells: ["TCS", "₹3.36L", "₹7L"], at: 0.1, color: "#4fd1ff" },
    { cells: ["Infosys", "₹3.6L", "₹9.5L"], at: 9.5, color: "#ffb547" },
    { cells: ["Wipro", "₹3.5L", "₹6.5L"], at: 16.5, color: "#9be15d" },
    { cells: ["HCLTech", "₹3.5L", "₹5L"], at: 21.3, color: "#b18cff" },
    { cells: ["Cognizant", "~₹4L GenC", "~₹6.5L Next"], at: 24.5, color: "#ff6b5b" },
  ],
  footer: "Reported ranges · your offer letter is final", footer_at: 29 });
o(65.5, 70.8, "comparison", { side: "left", left: { label: "Regular band", text: "Most freshers start here" }, right: { label: "Higher band", text: "Stronger coders · specialists" } });
o(71.0, 73.5, "keyword_chip", { text: "REMEMBER THIS", side: "right" });
o(73.7, 76.9, "chapter_open", { text: "CTC Is Not Salary", eyebrow: "Section 02", numeral: "02", section: 2 });
o(77.1, 80.5, "term_card", { side: "right", text: "CTC", eyebrow: "Cost To Company", items: [{ label: "The total the company spends on you in a year" }] });
o(80.7, 82.8, "big_statement", { text: "Not your bank credit", eyebrow: "Not" });
o(82.95, 85.5, "keyword_chip", { text: "NOT PAID MONTHLY", side: "left" });
o(85.7, 96.9, "flow_diagram", { text: "Inside your CTC", items: [{ label: "Monthly gross", sublabel: "reaches you" }, { label: "Employer PF", sublabel: "company's share" }, { label: "Gratuity", sublabel: "only after 5 years" }, { label: "Variable pay", sublabel: "later · not guaranteed" }] });
o(97.3, 100.7, "keyword_chip", { text: "DEDUCTED MONTHLY", side: "right" });
o(100.8, 106.5, "bullet_list", { side: "left", text: "Monthly deductions", items: [{ label: "Your own PF" }, { label: "Professional tax (many states)" }, { label: "Income tax (if high enough)" }] });
o(106.65, 109.72, "chapter_open", { text: "₹4 LPA Breakdown", eyebrow: "Section 03", numeral: "03", section: 3 });
o(109.8, 113.6, "keyword_chip", { text: "ILLUSTRATIVE EXAMPLE", side: "left" });
o(113.7, 135.9, "data_table", {
  text: "₹4 LPA · the year", section: 3,
  columns: ["Step", "Amount / year"],
  rows: [
    { cells: ["CTC", "₹4,00,000"], at: 0.1, color: "#4fd1ff" },
    { cells: ["Basic · 40%", "₹1,60,000"], at: 3.3, color: "#9be15d" },
    { cells: ["− Employer PF · 12% of basic", "₹19,200"], at: 8.4, color: "#ffb547" },
    { cells: ["− Gratuity · ~4.81%", "₹7,696"], at: 11.0, color: "#ff6b5b" },
    { cells: ["= Gross", "₹3,73,104"], at: 19.8, color: "#b18cff" },
  ],
  footer: FOOT, footer_at: 1.5 });
o(136.0, 156.6, "data_table", {
  text: "Gross → in-hand · the month", section: 3,
  columns: ["Step", "Amount / month"],
  rows: [
    { cells: ["Gross", "₹31,092"], at: 0.2, color: "#4fd1ff" },
    { cells: ["− Your PF · 12% of basic", "₹1,600"], at: 4.4, color: "#ffb547" },
    { cells: ["− Professional tax (varies)", "~₹200"], at: 9.0, color: "#ff6b5b" },
    { cells: ["− Income tax · new regime", "₹0"], at: 13.0, color: "#9be15d" },
    { cells: ["= In-hand", "≈ ₹29,292"], at: 16.7, color: "#ffd400" },
  ],
  footer: FOOT, footer_at: 1.0 });
o(156.8, 159.75, "word_swap", { from: "₹33,333", to: "₹29,292", text: "In-hand, per month" });
o(159.9, 163.0, "chapter_open", { text: "Why Higher Tracks Pay More", eyebrow: "Section 04", numeral: "04", section: 4 });
o(163.2, 165.2, "keyword_chip", { text: "GEN C NEXT · DIGITAL", side: "right" });
o(165.6, 172.6, "bullet_list", { side: "right", text: "What they expect", items: [{ label: "Better coding" }, { label: "Faster problem solving" }, { label: "Specialist skills" }] });
o(172.85, 178.9, "flow_diagram", { text: "How you get in", items: [{ label: "Coding round", sublabel: "performance" }, { label: "Technical interview", sublabel: "depth" }, { label: "Higher track", sublabel: "bigger package" }] });
o(179.1, 185.5, "matrix_grid", { text: "Practice these", items: [{ label: "Arrays" }, { label: "Strings" }, { label: "Hashing" }, { label: "Basic DP" }, { label: "SQL" }] });
o(185.6, 191.6, "comparison", { side: "left", left: { label: "Regular track", text: "~₹3.5L" }, right: { label: "Higher track", text: "~₹6.5L" } });
o(191.9, 195.9, "big_statement", { text: "CTC ≠ monthly salary", eyebrow: "≠" });
o(196.2, 201.3, "number_roll", { value: 29, prefix: "₹", suffix: "k", text: "₹4 LPA ≈ in hand, per month (example)" });
o(201.6, 205.5, "keyword_chip", { text: "HIGHER CODING TRACK", side: "left" });
o(205.7, 211.3, "quote_pull", { text: "CTC: ₹__  ·  In-hand: ₹__", eyebrow: "Comment yours below" });
o(211.5, 213.75, "keyword_chip", { text: "REAL NUMBERS", side: "right" });
o(213.9, 217.0, "big_statement", { text: "Tomorrow: can an offer be cancelled?", eyebrow: "Tomorrow" });
o(217.15, 220.15, "word_swap", { from: "Offer letter", to: "LOI → cancelled?", text: "The scary question" });
o(220.3, 221.9, "keyword_chip", { text: "SUBSCRIBE", side: "right" });

writeFileSync("work/visual-plan.json", JSON.stringify({ style: "liquid", rail: true, overlays: O, scenes: S, camera_moves: [] }, null, 1));
const sfx = [];
const f = (time, name, reason, gain) => sfx.push({ time, sfx: name, reason, ...(gain ? { gain } : {}) });
f(0.1, "impact", "title lands", 4);
f(4.45, "pop", "÷12 reveal");

f(10.4, "impact", "nobody cheated you", 4);

f(25.8, "riser", "builds into section 01", 3);
f(27.3, "impact", "section 01", 4);
f(35.4, "sub_drop", "table opens", 4);
f(44.9, "pop", "Infosys row");
f(65.4, "sub_drop", "regular vs higher", 4);
f(72.2, "riser", "builds into section 02", 3);
f(73.7, "impact", "section 02", 4);
f(80.7, "pop", "not your bank credit");
f(85.6, "sub_drop", "inside your CTC", 4);
f(104.6, "riser", "builds into section 03", 3);
f(106.7, "impact", "section 03", 4);
f(113.6, "sub_drop", "yearly table", 4);
f(135.9, "sub_drop", "monthly table", 4);
f(152.4, "ding", "in-hand row resolves", 2);
f(156.8, "impact", "33,333 → 29,292", 4);
f(158.3, "riser", "builds into section 04", 3);
f(159.9, "impact", "section 04", 4);
f(172.8, "sub_drop", "how you get in", 4);
f(179.1, "pop", "practice topics");
f(185.6, "sub_drop", "regular vs higher", 4);
f(191.9, "impact", "CTC ≠ salary", 4);

f(213.9, "impact", "tomorrow", 4);
f(220.3, "pop", "subscribe");
writeFileSync("work/audio-plan.json", JSON.stringify({ music_cues: [], sfx_events: sfx }, null, 1));
