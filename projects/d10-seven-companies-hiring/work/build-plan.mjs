import { writeFileSync } from "node:fs";
const END = 202.83;
const S = [];
const sc = (start, end, o) => S.push({ index: S.length, start, end: end ?? END, ...o });
const g = (card, grade = "neutral") => ({ kind: "graphic", grade, ...(card ? { card } : {}) });
const br = (src, ms = 0, motion = "ken_in", grade = "neutral") => ({ kind: "broll", src: `assets/broll/${src}.mp4`, media_start: ms, motion, grade, transition: "fade" });
sc(0, 7.18, br("glass-towers", 0, "ken_in"));
sc(7.18, 15.93, g({ value: "5–6", label: "big names" }));
sc(15.93, 23.5, g({ value: "7", label: "companies" }));
sc(23.5, 27.4, br("corridor", 1, "pan_right"));
sc(27.4, 36.4, br("office-team", 0, "ken_in"));
sc(36.4, 45.5, g({ value: "01", label: "Tech Mahindra" }));
sc(45.5, 52.0, br("open-office", 0, "pan_left"));
sc(52.0, 63.05, g({ value: "02", label: "LTIMindtree" }));
sc(63.05, 71.0, br("code-screen", 0, "ken_in"));
sc(71.0, 79.24, g({ value: "03", label: "Persistent Systems" }));
sc(79.24, 86.0, br("typing", 2, "ken_out"));
sc(86.0, 93.73, g({ value: "04", label: "Mphasis" }));
sc(93.73, 100.0, br("meeting", 0, "ken_in"));
sc(100.0, 104.54, g({ value: "05", label: "Coforge" }));
sc(104.54, 109.5, g({ value: "06", label: "Capgemini" }));
sc(109.5, 114.0, br("campus", 2, "pan_right"));
sc(114.0, 119.83, g({ value: "06", label: "Capgemini" }));
sc(119.83, 126.5, g(null));
sc(126.5, 138.2, g({ value: "07", label: "Product cos & startups" }));
sc(138.2, 143.73, br("code-screen", 7, "ken_out"));
sc(143.73, 150.23, g({ value: "Projects", label: "over certificates" }));
sc(150.23, 153.4, br("typing", 12, "ken_in"));
sc(153.4, 165.2, g({ value: "4", label: "smart rules" }));
sc(165.2, 174.7, g({ value: "Learn", label: "from every test" }));
sc(174.7, 182.41, g({ value: "7", label: "more doors" }));
sc(182.41, 185.61, br("glass-towers", 6, "ken_in"));
sc(185.61, 194.29, g({ value: "Comment", label: "below" }));
sc(194.29, END, g({ value: "Tomorrow", label: "Is your batch too old?" }));

const O = [];
const o = (start, end, type, p) => O.push({ start, duration: +(end - start).toFixed(2), type, ...p });
// hook
o(0.1, 4.2, "title_slide", { text: "7 Companies Still Hiring Freshers", eyebrow: "Crack IT · Day 10", style_hint: "Rejected by TCS, Infosys or Cognizant?" });
o(4.7, 6.9, "keyword_chip", { text: "REJECTED?", side: "right" });
o(7.6, 15.5, "comparison", { side: "right", text: "Where freshers apply", left: { label: "Same 5–6 big names", text: "Most applicants" }, right: { label: "Other companies", text: "Also hiring · often less competition" } });
o(16.4, 20.0, "number_roll", { value: 7, text: "companies still hiring freshers" });
o(20.5, 23.2, "keyword_chip", { text: "WHAT THEY DO · HOW THEY HIRE", side: "left" });
o(23.9, 26.5, "keyword_chip", { text: "NUMBER 7 · OFTEN MISSED", side: "right" });
// 1 Tech Mahindra
o(27.9, 31.6, "lower_third", { text: "Tech Mahindra", eyebrow: "01 · Mahindra Group", side: "left" });
o(32.2, 35.9, "keyword_chip", { text: "TELECOM · NETWORKS", side: "right" });
o(36.8, 39.2, "keyword_chip", { text: "ENTRY-LEVEL ENGINEERING", side: "left" });
o(40.0, 44.9, "flow_diagram", { text: "Process, usually", items: [{ label: "Online assessment" }, { label: "Technical" }, { label: "HR" }] });
// 2 LTIMindtree
o(45.9, 49.7, "lower_third", { text: "LTIMindtree", eyebrow: "02 · Formed in 2022", side: "left" });
o(50.2, 51.9, "keyword_chip", { text: "L&T INFOTECH + MINDTREE", side: "right" });
o(52.3, 55.8, "bullet_list", { side: "right", text: "Many clients in", items: [{ label: "Banking" }, { label: "Manufacturing" }, { label: "Enterprise" }] });
o(56.2, 58.9, "keyword_chip", { text: "CAMPUS + OFF-CAMPUS", side: "left" });
o(59.2, 62.8, "flow_diagram", { text: "Process, usually", items: [{ label: "Aptitude + coding" }, { label: "Interviews" }] });
// 3 Persistent
o(63.3, 67.0, "lower_third", { text: "Persistent Systems", eyebrow: "03 · Headquartered in Pune", side: "left" });
o(67.6, 70.8, "keyword_chip", { text: "PRODUCT ENGINEERING", side: "right" });
o(71.3, 74.0, "keyword_chip", { text: "REAL SOFTWARE DEVELOPMENT", side: "left" });
o(74.4, 78.8, "side_note", { text: "Tip: practise data structures", side: "right" });
// 4 Mphasis
o(79.6, 83.3, "lower_third", { text: "Mphasis", eyebrow: "04 · Headquartered in Bengaluru", side: "left" });
o(83.7, 85.9, "keyword_chip", { text: "BANKING & FINANCE", side: "right" });
o(86.4, 89.9, "side_note", { text: "Interested in banking tech? Keep it on your list", side: "left" });
o(90.4, 93.4, "flow_diagram", { text: "Process, usually", items: [{ label: "Online test" }, { label: "Interviews" }] });
// 5 Coforge
o(94.0, 97.8, "lower_third", { text: "Coforge", eyebrow: "05 · Mid-size and growing", side: "left" });
o(98.2, 99.9, "keyword_chip", { text: "BANKING · INSURANCE · TRAVEL", side: "right" });
o(100.4, 104.3, "side_note", { text: "Mid-size = more responsibility earlier", side: "right" });
// 6 Capgemini
o(104.8, 108.9, "lower_third", { text: "Capgemini", eyebrow: "06 · French multinational", side: "left" });
o(110.0, 113.6, "keyword_chip", { text: "CAMPUS + OFF-CAMPUS DRIVES", side: "right" });
o(114.2, 119.4, "flow_diagram", { text: "Process, usually", items: [{ label: "Technical + aptitude" }, { label: "Communication" }, { label: "Interview" }] });
// 7 product companies
o(119.9, 123.0, "chapter_open", { text: "Number seven", eyebrow: "Section 01", numeral: "07", section: 1 });
o(123.5, 126.4, "big_statement", { text: "Product companies and startups", eyebrow: "startups" });
o(127.0, 133.4, "matrix_grid", { text: "Where they hire", items: [{ label: "Careers pages" }, { label: "LinkedIn" }, { label: "Hiring platforms" }] });
o(134.0, 138.0, "comparison", { side: "left", text: "Selection is usually based on", left: { label: "Not this", text: "Your percentage" }, right: { label: "This", text: "Coding tests + projects" } });
o(138.7, 143.0, "keyword_chip", { text: "REAL WORK FROM MONTH ONE", side: "left" });
o(143.9, 147.3, "checklist", { text: "The key", items: [{ label: "Strong GitHub profile", state: "yes" }, { label: "1–2 real projects", state: "yes" }] });
o(147.6, 150.1, "word_swap", { from: "Certificate", to: "Projects", text: "What matters more" });
// apply smartly
o(150.3, 153.3, "chapter_open", { text: "Apply smartly", eyebrow: "Section 02", numeral: "08", section: 2 });
o(153.6, 164.8, "checklist", { text: "Apply smartly", items: [{ label: "Official careers pages only", state: "yes" }, { label: "Tailor resume with job-post words", state: "yes" }, { label: "Apply in parallel", state: "yes" }, { label: "Rejection = feedback", state: "yes" }] });
o(165.4, 174.5, "flow_diagram", { text: "Every rejection is feedback", items: [{ label: "Test" }, { label: "Feedback" }, { label: "Practise" }, { label: "Next test" }] });
// sum up
o(175.0, 182.3, "step_progress", { side: "right", text: "Seven more doors", current_step: 0, items: [{ label: "Tech Mahindra", at: 0.3 }, { label: "LTIMindtree", at: 1.2 }, { label: "Persistent", at: 2.2 }, { label: "Mphasis", at: 3.0 }, { label: "Coforge", at: 3.8 }, { label: "Capgemini", at: 4.5 }, { label: "Product cos & startups", at: 5.4 }] });
o(182.6, 185.4, "big_statement", { text: "Seven more doors", eyebrow: "doors" });
o(185.9, 194.0, "quote_pull", { text: "Which company rejected you, and which of these seven will you apply to next?", eyebrow: "Comment below" });
o(194.6, 199.8, "lower_third", { text: "Is your batch too old?", eyebrow: "Tomorrow", side: "left" });
o(200.4, 202.6, "keyword_chip", { text: "SUBSCRIBE", side: "right" });

writeFileSync("work/visual-plan.json", JSON.stringify({ style: "cleantech", rail: true, overlays: O, scenes: S, camera_moves: [] }, null, 1));
