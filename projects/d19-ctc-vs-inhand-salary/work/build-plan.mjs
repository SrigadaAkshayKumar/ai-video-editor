import { writeFileSync } from "node:fs";
const SCC = "https://www.scconline.com/blog/post/2026/09/19/labour-ministry-notifies-25000-wage-ceiling-under-social-security-code/";
const BT1 = "https://www.businesstoday.in/personal-finance/story/epfo-rs25000-ceiling-how-much-pf-will-be-deducted-from-your-salary-from-october-2026-558033-2026-09-27";
const BT2 = "https://www.businesstoday.in/personal-finance/story/from-rs1800-to-rs3000-how-epf-contributions-change-under-the-new-rs25000-wage-ceiling-559855-2026-10-06";
const BS = "https://www.business-standard.com/finance/personal-finance/new-rules-from-april-1-zero-tax-on-income-up-to-rs-12l-see-all-changes-125040200823_1.html";
const S = [];
const sc = (end, o) => { const start = S.length ? S[S.length - 1].end : 0; S.push({ index: S.length, start, end, ...o }); };
const g = (card, grade = "neutral") => ({ kind: "graphic", grade, ...(card ? { card } : {}) });
const br = (src, ms = 0, motion = "ken_in", grade = "cool") => ({ kind: "broll", src: `assets/broll/${src}.mp4`, media_start: ms, motion, grade, transition: "fade" });
const news = (url, source, headline, date, extra = {}) => ({ kind: "news", url, source, headline, date, grade: "neutral", ...extra });
const N_SCC = () => news(SCC, "SCC Online", "EPFO wage ceiling raised to ₹25,000; more employees to get PF, pension benefits", "19 Sep 2026", { highlight: { x: 0.06, y: 0.128, w: 0.52, h: 0.04 } });
const N_BT1 = () => news(BT1, "Business Today", "EPFO ₹25,000 ceiling: How much PF will be deducted from your salary from October 2026?", "27 Sep 2026", { highlight: { x: 0.07, y: 0.105, w: 0.66, h: 0.05 } });
const N_BT2 = () => news(BT2, "Business Today", "From ₹1,800 to ₹3,000: How EPF contributions change under the new ₹25,000 wage ceiling", "6 Oct 2026", { highlight: { x: 0.07, y: 0.105, w: 0.67, h: 0.05 } });
const N_BS = () => news(BS, "Business Standard", "New rules from April 1: Zero tax on income up to Rs 12L, see all changes", "2 Apr 2025", { highlight: { x: 0.09, y: 0.238, w: 0.6, h: 0.042 } });

sc(3.0, g({ value: "₹6 LPA", label: "the offer letter says" }, "cool"));
sc(7.5, g({ value: "₹50,000", label: "per month … really?" }, "cool"));
sc(11.8, br("woman-laptop", 0, "ken_in", "cool"));
sc(15.4, g({ value: "?", label: "where does the money go" }, "cool"));
sc(19.8, N_SCC());
sc(23.9, g({ value: "3", label: "deductions — stay for #3" }, "cool"));
// 01
sc(28.8, g(null, "neutral"));
sc(33.2, g({ value: "C.T.C.", label: "cost to company" }, "neutral"));
sc(41.4, br("office-desk", 0, "ken_in", "cool"));
sc(45.9, g({ value: "÷ 12", label: "≠ your monthly pay" }, "cool"));
sc(51.0, br("keyboard", 0, "ken_in", "cool"));
sc(57.5, g(null, "neutral"));
// 02
sc(65.5, g(null, "cool"));
sc(74.6, g({ value: "1", label: "company PF share" }, "cool"));
sc(79.3, g(null, "cool"));
sc(91.0, g({ value: "2", label: "your PF share" }, "cool"));
sc(96.6, g({ value: "3", label: "professional tax" }, "warm"));
sc(102.7, g({ value: "~₹200", label: "state tax / month" }, "warm"));
sc(113.7, g(null, "neutral"));
// 03
sc(116.9, g(null, "cool"));
sc(126.5, N_SCC());
sc(130.4, N_BT1());
sc(140.2, N_BT2());
sc(146.3, g(null, "noir"));
sc(150.3, g({ value: "The catch", label: "depends on your structure" }, "noir"));
sc(158.2, g(null, "cool"));
sc(160.9, g(null, "neutral"));
// 04
sc(167.8, g(null, "warm"));
sc(177.7, N_BS());
sc(182.3, g({ value: "₹0", label: "income tax, typical fresher" }, "warm"));
sc(189.5, br("office-desk", 6, "ken_out", "warm"));
sc(196.1, g({ value: "PF", label: "is yours — with interest" }, "warm"));
// 05
sc(199.4, g(null, "neutral"));
sc(209.4, g(null, "cool"));
sc(214.9, br("keyboard", 5, "ken_in", "cool"));
sc(221.8, g(null, "cool"));
sc(228.9, br("office-walk", 8, "ken_out", "cool"));
sc(236.0, g(null, "cool"));
sc(247.5, g(null, "neutral"));
sc(256.9, g(null, "cool"));
sc(null, g(null, "cool"));
// fix: last scene end
S[S.length - 1].end = 261.43; S[S.length - 2].end = 256.9;

const O = [];
const o = (s, e, type, p) => O.push({ start: s, duration: +(e - s).toFixed(2), type, ...p });
// hook
o(0.05, 2.9, "title_slide", { text: "Why salary < C.T.C.", eyebrow: "Crack IT · Day 19", style_hint: "Freshers: the 3 deductions" });
o(3.3, 7.3, "keyword_chip", { text: "₹6 LPA ≠ ₹50,000 / month", side: "right" });
o(7.9, 11.6, "keyword_chip", { text: "Offer letter in hand?", side: "left" });
o(12.1, 15.2, "side_note", { text: "Where does the money go?", side: "left" });
o(16.0, 19.6, "keyword_chip", { text: "Changed in September", side: "left" });
o(20.2, 23.6, "keyword_chip", { text: "Deduction #3: hold on", side: "right" });
// 01 CTC
o(24.1, 27.3, "chapter_open", { text: "C.T.C. is not salary", eyebrow: "Section 01", numeral: "01", section: 1 });
o(28.9, 40.8, "flow_diagram", { text: "Two different numbers", items: [{ label: "C.T.C.", sublabel: "what the company spends" }, { label: "Salary + PF + insurance + variable", sublabel: "inside the C.T.C." }, { label: "In-hand", sublabel: "what you receive" }] });
o(41.6, 45.3, "keyword_chip", { text: "Don't plan rent on ÷ 12", side: "left" });
o(46.2, 50.8, "side_note", { text: "÷ 12 = the company's monthly cost", side: "left" });
o(51.2, 54.2, "keyword_chip", { text: "Example only", side: "right" });
o(54.5, 57.2, "side_note", { text: "Every company structures pay differently", side: "left" });
// 02 deductions
o(57.6, 60.6, "chapter_open", { text: "The 3 deductions", eyebrow: "Section 02", numeral: "02", section: 2 });
o(60.7, 63.3, "number_roll", { value: 25000, prefix: "₹", text: "basic pay (half of ₹50,000 C.T.C.)" });
o(63.5, 65.4, "keyword_chip", { text: "3 things come out", side: "right" });
o(65.6, 68.9, "keyword_chip", { text: "Deduction 1 · Company PF", side: "right" });
o(69.2, 74.4, "side_note", { text: "12% of wages · inside C.T.C., never in your bank", side: "left" });
o(74.7, 78.9, "number_roll", { value: 3000, prefix: "₹", text: "company PF share / month" });
o(79.4, 82.8, "keyword_chip", { text: "Deduction 2 · Your PF", side: "right" });
o(83.1, 85.8, "side_note", { text: "Another 12% = ₹3,000", side: "left" });
o(86.0, 90.4, "keyword_chip", { text: "Yours, locked in your PF account", side: "left" });
o(90.6, 93.1, "keyword_chip", { text: "Deduction 3 · The quiet one", side: "right" });
o(93.3, 96.5, "side_note", { text: "Professional tax: a small state tax", side: "left" });
o(96.8, 102.4, "side_note", { text: "Depends on your state — check yours", side: "left" });
o(102.9, 113.5, "bar_chart", { side: "left", text: "₹50,000 C.T.C., example", items: [{ label: "Company PF", value: 3000 }, { label: "Your PF", value: 3000 }, { label: "Prof. tax", value: 200 }, { label: "In-hand ≈", value: 43800 }] });
// 03 September
o(113.8, 116.8, "chapter_open", { text: "What changed in September", eyebrow: "Section 03", numeral: "03", section: 3 });
o(117.0, 121.0, "keyword_chip", { text: "Notified 17 Sep 2026", side: "right" });
o(121.5, 126.2, "keyword_chip", { text: "PF wage ceiling: ₹15,000 → ₹25,000", side: "right" });
o(126.8, 130.1, "keyword_chip", { text: "Reported · 27 Sep 2026", side: "right" });
o(130.7, 135.0, "keyword_chip", { text: "Before: ₹1,800 a month", side: "right" });
o(136.2, 139.9, "keyword_chip", { text: "Now: up to ₹3,000", side: "right" });
o(140.4, 146.1, "number_roll", { value: 14400, prefix: "₹", text: "less in your bank every year (₹1,200 a month)" });
o(146.5, 150.2, "keyword_chip", { text: "The catch: your salary structure", side: "right" });
o(150.5, 158.0, "comparison", { side: "left", text: "Does your take-home change?", left: { label: "PF on ₹15,000 only", text: "Deduction rises" }, right: { label: "PF on full basic, above ₹25,000", text: "No change" } });
o(158.4, 160.8, "side_note", { text: "Check your salary slip", side: "left" });
// 04 tax
o(161.0, 164.0, "chapter_open", { text: "Income tax: good news", eyebrow: "Section 04", numeral: "04", section: 4 });
o(164.1, 167.6, "number_roll", { value: 75000, prefix: "₹", text: "standard deduction, new regime" });
o(168.2, 172.6, "keyword_chip", { text: "Standard deduction ₹75,000", side: "left" });
o(173.3, 177.4, "keyword_chip", { text: "Rebate to ₹12 lakh · Sec 87A", side: "left" });
o(178.0, 182.1, "keyword_chip", { text: "Reported · WION", side: "left" });
o(182.5, 186.4, "side_note", { text: "Ask payroll which regime they used", side: "left" });
o(186.8, 189.3, "keyword_chip", { text: "Choose in company portal", side: "right" });
o(189.8, 192.9, "keyword_chip", { text: "PF is not lost", side: "left" });
o(193.1, 196.0, "side_note", { text: "Earns interest · yours when you leave", side: "left" });
// 05 checklist
o(196.2, 199.2, "chapter_open", { text: "Before you sign", eyebrow: "Section 05", numeral: "05", section: 5 });
o(199.3, 235.8, "step_progress", { side: "right", text: "Your checklist", current_step: 0, items: [
  { label: "Salary breakup in writing", at: 0.4 }, { label: "Fixed vs variable pay", at: 209.9 - 199.3 },
  { label: "PF on full basic or ceiling?", at: 214.9 - 199.3 }, { label: "Bond / notice / clawback", at: 221.8 - 199.3 },
  { label: "Compare your first slip", at: 229.2 - 199.3 }] });
o(205.6, 209.2, "keyword_chip", { text: "One number only? Ask the breakup", side: "left" });
o(212.9, 214.5, "keyword_chip", { text: "Variable ≠ guaranteed", side: "left" });
o(218.9, 221.3, "keyword_chip", { text: "Changes your take-home", side: "left" });
o(225.5, 228.6, "keyword_chip", { text: "Money owed back = real salary", side: "left" });
o(233.0, 235.8, "keyword_chip", { text: "Fix mistakes in month 1", side: "left" });
// 06 outro
o(236.2, 247.2, "flow_diagram", { text: "To sum up", items: [{ label: "C.T.C.", sublabel: "what the company spends" }, { label: "2 × PF + state tax", sublabel: "the gap · wider after September" }, { label: "In-hand", sublabel: "what you receive" }] });
o(247.8, 256.7, "lower_third", { text: "Offer C.T.C. · First slip in-hand", eyebrow: "Comment below", side: "right" });
o(257.1, 260.9, "keyword_chip", { text: "SUBSCRIBE", side: "right" });
O.sort((x, y) => x.start - y.start);
writeFileSync("work/visual-plan.json", JSON.stringify({ style: "broadcast", rail: true, overlays: O, scenes: S, camera_moves: [] }, null, 1));
console.log(S.length, "scenes", O.length, "overlays");
