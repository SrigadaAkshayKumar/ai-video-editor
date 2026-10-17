import { readFileSync, writeFileSync } from "node:fs";
const T = JSON.parse(readFileSync("work/timeline.json", "utf8"));
const c = (r) => { for (const s of T) if (r >= s.raw_start && r <= s.raw_end) return +(s.start + r - s.raw_start).toFixed(2); // inside kept
  let best = T[0]; for (const s of T) if (s.raw_start <= r) best = s; return +(Math.min(best.end, best.start + Math.max(0, r - best.raw_start))).toFixed(2); };
const END = T[T.length - 1].end;
const S = [];
const sc = (r0, r1, o) => S.push({ index: S.length, start: S.length ? S[S.length - 1].end : 0, end: r1 == null ? END : c(r1), ...o });
const g = (card, grade = "neutral") => ({ kind: "graphic", grade, ...(card ? { card } : {}) });
const br = (src, ms = 0, motion = "ken_in", grade = "neutral") => ({ kind: "broll", src: `assets/broll/${src}.mp4`, media_start: ms, motion, grade, transition: "cut" });
const news = (o) => ({ kind: "news", motion: "ken_in", grade: "cool", transition: "cut", ...o });
const DH = { url: "https://www.deccanherald.com/india/it-fresher-hiring-at-3-yr-low-in-fy24-dim-outlook-for-q1-fy25-overall-2902804", source: "Deccan Herald", headline: "IT fresher hiring at 3-yr low in FY24, dim outlook for Q1 FY25 overall", date: "20 Feb 2024", highlight: { x: 0.065, y: 0.235, w: 0.52, h: 0.06 } };
const BS = { url: "https://www.business-standard.com/industry/news/indian-it-sector-turns-to-campus-placements-after-a-year-long-pause-124092100163_1.html", source: "Business Standard", headline: "Indian IT sector turns to campus placements after a year-long pause", date: "21 Sep 2024", highlight: { x: 0.09, y: 0.235, w: 0.58, h: 0.04 } };
sc(0, 5.2, br("woman-laptop", 1, "ken_in"));
sc(0, 10.8, g({ value: "2024 · 2025", label: "graduates" }));
sc(0, 16.7, news(DH));
sc(0, 23.0, g({ value: "4", label: "things to know" }));
sc(0, 28.0, br("laptop-browse", 2, "pan_right"));
sc(0, 39.5, g({ value: "01", label: "Eligibility line" }, "cool"));
sc(0, 45.6, g({ value: "No rule", label: "one for all" }));
sc(0, 50.1, g({ value: "3", label: "kinds of drives" }, "cool"));
sc(0, 59.3, g({ value: "?", label: "Too old" }));
sc(0, 63.2, g({ value: "02", label: "What is still open" }, "cool"));
sc(0, 70.4, g({ value: "1", label: "Off-campus drives" }));
sc(0, 72.9, g({ value: "2", label: "Mid-size · product" }, "cool"));
sc(0, 77.2, news(BS));
sc(0, 84.5, g({ value: "3", label: "Internships" }));
sc(0, 92.0, br("office-desks", 0, "ken_in"));
sc(0, 97.4, g({ value: "1 yr", label: "no longer a fresher" }, "cool"));
sc(0, 104.0, br("office-desks", 3, "ken_out"));
sc(0, 108.2, g({ value: "✗", label: "I was just preparing" }, "noir"));
sc(0, 114.0, g({ value: "✓", label: "Proof of learning" }));
sc(0, 120.4, br("laptop-browse", 6, "ken_in"));
sc(0, 128.0, br("girl-writing", 0, "ken_in"));
sc(0, 133.0, g({ value: "Gap + proof", label: "= fine" }, "cool"));
sc(0, 143.8, g({ value: "04", label: "This month's plan" }));
sc(0, 151.0, g({ value: "W2", label: "20 companies" }, "cool"));
sc(0, 153.8, g({ value: "W3", label: "5 backups" }));
sc(0, 160.2, br("keyboard", 3, "ken_out"));
sc(0, 164.4, g({ value: "Consistency", label: "beats luck" }, "cool"));
sc(0, 174.6, g(null));
sc(0, 181.0, g({ value: "Comment", label: "your batch year" }));
sc(0, null, g(null, "cool"));

const O = [];
const o = (r0, r1, type, p) => { const s = c(r0), e = c(r1); O.push({ start: s, duration: +(e - s).toFixed(2), type, ...p }); };
// hook
o(0.05, 4.8, "title_slide", { text: "Is Your Batch Too Old?", eyebrow: "Crack IT · Day 11", style_hint: "2024 · 2025 graduates" });
o(5.5, 9.8, "word_swap", { from: "Too late?", to: "Still a fresher?", text: "The question" });
o(10.9, 12.8, "keyword_chip", { text: "FY24 · 3-YEAR LOW", side: "right" });
o(13.0, 16.2, "keyword_chip", { text: "YOU ARE NOT ALONE", side: "left" });
o(17.3, 27.9, "step_progress", { side: "right", text: "In this video", current_step: 0, items: [{ label: "How eligibility works", at: 0.3 }, { label: "What is still open", at: 3.4 }, { label: "Explaining your gap", at: 7.0 }, { label: "This month's plan", at: 9.0 }] });
// 01 eligibility
o(28.0, 31.0, "chapter_open", { text: "How eligibility works", eyebrow: "Section 01", numeral: "01", section: 1 });
o(31.9, 38.7, "data_table", { text: "A drive's eligibility line (sample)", columns: ["Graduation years", "Minimum %", "Backlogs"], rows: [{ cells: ["20XX · 20XX", "60%", "None active"], at: 0.6 }], footer: "Placeholder values, not a real company", footer_at: 3.5 });
o(39.6, 42.2, "big_statement", { text: "No single rule", eyebrow: "industry" });
o(42.5, 50.0, "bullet_list", { side: "right", text: "Three kinds of drive", items: [{ label: "Current batch only" }, { label: "Last 1–2 batches" }, { label: "Open to all meeting criteria" }] });
o(50.3, 56.0, "big_statement", { text: "Not yes or no. Read each eligibility line.", eyebrow: "the answer" });
o(56.2, 59.2, "keyword_chip", { text: "MANY GIVE UP WITHOUT CHECKING", side: "left" });
// 02 what is open
o(59.4, 62.8, "chapter_open", { text: "What is still open", eyebrow: "Section 02", numeral: "02", section: 2 });
o(63.3, 66.0, "lower_third", { text: "Off-campus drives", eyebrow: "01 · Previous batches", side: "left" });
o(66.2, 70.2, "keyword_chip", { text: "CHECK EVERY CAREERS PAGE", side: "right" });
o(70.6, 72.8, "lower_third", { text: "Mid-size & product companies", eyebrow: "02 · Skills over year", side: "left" });
o(73.2, 77.0, "keyword_chip", { text: "REPORTED · SKILLS FIRST · SEP 2024", side: "left" });
o(77.4, 80.0, "lower_third", { text: "Internships & apprenticeships", eyebrow: "03 · Can convert", side: "left" });
o(80.4, 84.3, "flow_diagram", { text: "A very real path", items: [{ label: "Internship" }, { label: "Convert" }, { label: "Full-time job" }] });
o(84.7, 88.2, "lower_third", { text: "Contract & service desk", eyebrow: "04 · Real experience", side: "left" });
o(88.5, 91.9, "keyword_chip", { text: "NOT YOUR DREAM JOB · REAL WORK", side: "right" });
o(92.1, 97.3, "comparison", { side: "right", text: "After one year", left: { label: "Fresher queue", text: "Crowded" }, right: { label: "1 year experience", text: "A different set of jobs" } });
// 03 gap
o(97.6, 101.1, "chapter_open", { text: "Explain your gap", eyebrow: "Section 03", numeral: "03", section: 3 });
o(101.3, 103.9, "keyword_chip", { text: "EVERY INTERVIEWER ASKS", side: "left" });
o(104.1, 108.1, "quote_pull", { text: "I was just preparing.", eyebrow: "Never say this ✗" });
o(108.4, 120.3, "step_progress", { side: "right", text: "Show proof", current_step: 0, items: [{ label: "Preparing for placements", at: 0.3 }, { label: "Certification (SQL)", at: 3.8 }, { label: "Project: sales dashboard", at: 7.2 }, { label: "On GitHub", at: 10.4 }] });
o(120.7, 125.8, "side_note", { text: "Personal reason? Brief + honest, then what you learned", side: "left" });
o(126.0, 128.0, "keyword_chip", { text: "MOVE TO WHAT YOU LEARNED", side: "right" });
o(128.3, 133.0, "comparison", { side: "left", text: "A gap with…", left: { label: "Proof of learning", text: "Not a weakness" }, right: { label: "No explanation", text: "A weakness" } });
// 04 plan
o(133.0, 136.3, "chapter_open", { text: "This month's plan", eyebrow: "Section 04", numeral: "04", section: 4 });
o(136.6, 160.4, "step_progress", { side: "right", text: "Four weeks", current_step: 0, items: [{ label: "Week 1 · Resume + one project", at: 0.3 }, { label: "Week 2 · 20 companies, check eligibility", at: 7.0 }, { label: "Week 3 · 5 internships / contract roles", at: 14.2 }, { label: "Week 4 · Interview practice", at: 16.6 }] });
o(160.6, 162.4, "keyword_chip", { text: "TRACK YOUR APPLICATIONS", side: "left" });
o(162.6, 164.4, "big_statement", { text: "Consistency beats luck", eyebrow: "every month" });
// sum up
o(164.8, 174.0, "checklist", { text: "To sum up", items: [{ label: "Read each eligibility line", state: "yes" }, { label: "Skills beat batch year", state: "yes" }, { label: "Gap + proof = fine", state: "yes" }] });
o(175.0, 181.0, "quote_pull", { text: "Your graduation year, and what you are doing right now?", eyebrow: "Comment below" });
o(181.6, 188.6, "lower_third", { text: "Frontier engineer roles at Infosys & Cognizant", eyebrow: "Tomorrow", side: "left" });
o(189.0, 191.0, "keyword_chip", { text: "SUBSCRIBE", side: "right" });

writeFileSync("work/visual-plan.json", JSON.stringify({ style: "broadcast", rail: true, overlays: O, scenes: S, camera_moves: [] }, null, 1));
console.log(S.length, "scenes", O.length, "overlays", END);
