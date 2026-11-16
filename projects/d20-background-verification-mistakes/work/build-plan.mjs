import { writeFileSync } from "node:fs";
const S = [];
const sc = (end, o) => { const start = S.length ? S[S.length - 1].end : 0; S.push({ index: S.length, start, end, ...o }); };
const g = (card, grade = "neutral") => ({ kind: "graphic", grade, ...(card ? { card } : {}) });
const br = (src, ms = 0, motion = "ken_in", grade = "cool") => ({ kind: "broll", src: `assets/broll/${src}.mp4`, media_start: ms, motion, grade, transition: "fade" });
// hook
sc(4.0, br("desk-docs", 0, "ken_in", "cool"));
sc(9.9, br("binders", 0, "ken_in", "cool"));
sc(19.73, g({ value: "3", label: "mistakes · stay for #3" }, "cool"));
// 01 what BGV is
sc(27.85, br("office-wide", 0, "ken_in", "neutral"));
sc(34.54, br("woman-window", 0, "ken_out", "neutral"));
sc(44.88, br("laptop-desk", 0, "ken_in", "neutral"));
sc(50.97, g({ value: "4", label: "address · criminal check" }, "neutral"));
sc(58.01, br("desk-docs", 6, "ken_in", "cool"));
sc(61.58, g({ value: "=", label: "make everything match" }, "neutral"));
// 02 mistake 1
sc(67.41, br("writing", 0, "ken_in", "cool"));
sc(75.0, br("laptop-hands", 0, "ken_in", "cool"));
sc(83.95, br("laptop-hands", 10, "ken_out", "cool"));
sc(91.4, br("students", 0, "ken_in", "neutral"));
sc(100.55, br("files", 0, "ken_in", "warm"));
// 03 mistake 2
sc(109.30, br("typing-hands", 0, "ken_in", "cool"));
sc(116.0, br("campus", 0, "ken_in", "cool"));
sc(122.96, br("campus", 6.5, "ken_out", "cool"));
sc(129.3, br("writing", 6.5, "ken_in", "noir"));
sc(135.66, br("charts", 0, "ken_in", "noir"));
sc(143.42, br("office-woman", 0, "ken_in", "warm"));
// 04 mistake 3
sc(150.1, br("square", 0, "ken_in", "cool"));
sc(156.81, g({ value: "SPAM", label: "promotions · unknown sender" }, "cool"));
sc(164.32, br("laptop-side", 0, "ken_in", "cool"));
sc(172.0, br("laptop-hands", 20, "ken_in", "cool"));
sc(178.67, br("laptop-hands", 28, "ken_out", "cool"));
sc(185.82, g({ value: "₹0", label: "real BGV never charges you" }, "noir"));
// 05 checklist
sc(191.6, br("charts", 5.6, "ken_in", "neutral"));
sc(198.0, g({ value: "1 folder", label: "scans, named clearly" }, "cool"));
sc(204.29, g({ value: "10th · 12th", label: "marksheets · degree" }, "neutral"));
sc(210.88, br("square", 10, "ken_in", "neutral"));
sc(217.0, br("campus", 14, "ken_in", "neutral"));
sc(223.58, br("campus", 20.5, "ken_out", "neutral"));
// 06 wrap
sc(233.44, g(null, "cool"));
sc(243.0, g(null, "cool"));
sc(null, g(null, "cool"));
S[S.length - 1].end = 248.83;

const O = [];
const o = (s, e, type, p) => O.push({ start: s, duration: +(e - s).toFixed(2), type, ...p });
// hook
o(0.05, 3.9, "title_slide", { text: "Offer cancelled after BGV?", eyebrow: "Crack IT · Day 20", style_hint: "3 background verification mistakes" });
o(4.3, 7.2, "keyword_chip", { text: "Offer can be withdrawn after BGV", side: "right" });
o(7.6, 10.6, "keyword_chip", { text: "One small mismatch", side: "left" });
o(11.6, 19.3, "fact_band", { items: [{ label: "?", sublabel: "Mistake 1" }, { label: "?", sublabel: "Mistake 2" }, { label: "?", sublabel: "Mistake 3" }] });
// 01
o(19.9, 22.95, "chapter_open", { text: "What BGV checks", eyebrow: "Section 01", numeral: "01", section: 1 });
o(23.1, 32.8, "flow_diagram", { side: "right", text: "How it works", items: [{ label: "Offer accepted" }, { label: "Company", sublabel: "sends your details" }, { label: "Agency", sublabel: "verifies" }, { label: "College + documents", sublabel: "confirm" }, { label: "Report back" }] });
o(33.0, 48.9, "step_progress", { side: "right", text: "Four things checked", current_step: 0, items: [{ label: "Identity", at: 1.5 }, { label: "Education", at: 4.9 }, { label: "Past work", at: 8.4 }, { label: "Address · criminal record", at: 11.9 }] });
o(51.2, 57.8, "quote_pull", { text: "The agency does not judge you. It only compares.", eyebrow: "So make everything match" });
o(58.4, 61.3, "keyword_chip", { text: "Application = documents", side: "left" });
// 02 mistake 1
o(61.7, 64.75, "chapter_open", { text: "Mistake 1: names & dates", eyebrow: "Section 02", numeral: "02", section: 2 });
o(67.6, 83.6, "data_table", { text: "Same person, three spellings (example)", columns: ["Document", "Name", "Date of birth"], rows: [
  { cells: ["10th certificate", "Rahul Kumar", "04-07-2003"], at: 0.5 },
  { cells: ["Aadhaar card", "Rahul Kumar R", "04-07-2003"], at: 4.6, color: "#ff5252" },
  { cells: ["Application form", "Rahul K", "04-07-2003"], at: 8.0, color: "#ff5252" }],
  footer: "Mismatch = a mail asking you to explain", footer_at: 12.5 });
o(84.2, 91.0, "side_note", { text: "Check every spelling and every date", side: "left" });
o(91.6, 100.3, "keyword_chip", { text: "Put all documents side by side today", side: "left" });
// 03 mistake 2
o(100.7, 103.75, "chapter_open", { text: "Mistake 2: hidden gaps", eyebrow: "Section 03", numeral: "03", section: 3 });
o(104.0, 108.9, "keyword_chip", { text: "Backlog · year gap · incomplete degree", side: "left" });
o(109.5, 122.7, "timeline", { side: "right", text: "Ravi's story (illustrative)", current: 2, items: [{ label: "The form", sublabel: "says: no backlogs" }, { label: "College record", sublabel: "one subject pending" }, { label: "Mail from agency", sublabel: "offer stops: false statement" }] });
o(123.4, 127.8, "comparison", { side: "left", text: "Explainable vs not", left: { label: "Backlog or gap", text: "Can be explained" }, right: { label: "False statement", text: "Hard to explain" } });
o(128.2, 135.4, "quote_pull", { text: "A false statement is much harder to explain.", eyebrow: "The rule that matters" });
o(136.2, 143.1, "side_note", { text: "Write it honestly · keep a short reason ready", side: "left" });
// 04 mistake 3
o(143.5, 146.55, "chapter_open", { text: "Mistake 3: silence", eyebrow: "Section 04", numeral: "04", section: 4 });
o(147.2, 155.8, "keyword_chip", { text: "Mail lands in spam or promotions", side: "left" });
o(157.2, 163.8, "keyword_chip", { text: "Open file = delayed joining letter", side: "left" });
o(164.5, 178.4, "checklist", { side: "right", text: "Do three things", items: [{ label: "Check spam + promotions", state: "yes" }, { label: "Search: verification, documents", state: "yes" }, { label: "Reply in 1-2 days", state: "yes" }, { label: "Send clear scans, not blurry photos", state: "yes" }] });
o(179.2, 185.5, "keyword_chip", { text: "Real BGV is never paid by you", side: "right" });
// 05 checklist
o(185.95, 189.0, "chapter_open", { text: "Your checklist this week", eyebrow: "Section 05", numeral: "05", section: 5 });
o(189.6, 214.2, "step_progress", { side: "right", text: "This week", current_step: 0, items: [
  { label: "Folder: 10th, 12th, marksheets", at: 0.2 }, { label: "Degree, Aadhaar, PAN, offer letter", at: 4.0 },
  { label: "Details exactly as on documents", at: 204.9 - 189.6 }, { label: "Save exam office contact", at: 211.0 - 189.6 }] });
o(214.5, 223.0, "side_note", { text: "The agency may call your college to confirm marks", side: "left" });
// 06 wrap
o(223.7, 233.2, "fact_band", { items: [{ label: "Match", sublabel: "names and dates" }, { label: "Be honest", sublabel: "backlogs and gaps" }, { label: "Reply", sublabel: "to the verification mail" }] });
o(233.8, 242.8, "poll_prompt", { text: "Which mistake were you about to make?", items: [{ label: "1 · Names and dates" }, { label: "2 · Backlogs and gaps" }, { label: "3 · Missed mail" }] });
o(243.2, 248.5, "keyword_chip", { text: "SUBSCRIBE", side: "right" });
O.sort((x, y) => x.start - y.start);
writeFileSync("work/visual-plan.json", JSON.stringify({ style: "glass", rail: true, overlays: O, scenes: S, camera_moves: [] }, null, 1));
console.log(S.length, "scenes", O.length, "overlays");
