import { writeFileSync } from "node:fs";
const END = 197.87;
const S = [];
const g = (card, grade = "neutral") => ({ kind: "graphic", grade, ...(card ? { card } : {}) });
const br = (src, ms = 0, motion = "ken_in", grade = "neutral") => ({ kind: "broll", src: `assets/broll/${src}.mp4`, media_start: ms, motion, grade, transition: "fade" });
const ST = (t, o) => S.push({ start: +t, ...o });
ST(0, br("office", 0, "ken_in", "cool"));
ST(3.6, { kind: "news", url: "https://upstox.com/news/personal-finance/latest-updates/epf-swp-10-minimum-balance-to-final-withdrawal-after-2-months-7-big-decisions-by-epfo-board/article-203722/", source: "Upstox", headline: "EPF SWP, 10% minimum balance to final withdrawal after 2 months: 7 big decisions by EPFO Board", date: "19 Nov 2026", highlight: { x: 0.17, y: 0.085, w: 0.37, h: 0.085 }, motion: "ken_in", grade: "cool", transition: "cut" });
ST(12.88, g({ value: "5 MIN", label: "3 points, 1 mistake" }, "cool"));
ST(21.35, g(null, "cool"));
ST(25.62, g({ value: "240th", label: "EPFO board meeting, 19 Nov 2026" }));
ST(37.29, g({ value: "12 → 2", label: "months wait for final withdrawal" }));
ST(51.0, br("phone2", 0, "ken_in"));
ST(63.26, g({ value: "NOT LIVE", label: "approved, not notified yet" }, "warm"));
ST(74.02, g({ value: "₹10 LAKH", label: "eligible balance (example)" }));
ST(80.2, br("laptop", 2, "ken_out"));
ST(91.43, g(null, "cool"));
ST(106.0, br("laptop", 0, "ken_in", "cool"));
ST(114.8, g({ value: "UAN", label: "stays with you for life" }));
ST(127.45, g(null));
ST(142.74, g({ value: "THIS WEEK", label: "3 steps" }));
ST(153.0, g({ value: "UAN", label: "check it today" }));
ST(160.77, br("phone", 0, "ken_in", "warm"));
ST(169.28, g({ value: "2 · 10%", label: "may change, not live yet" }, "warm"));
ST(183.71, g(null, "warm"));
ST(192.82, g({ value: "CRACK IT", label: "subscribe · share" }, "warm"));
S.forEach((x, i) => { x.end = i + 1 < S.length ? S[i + 1].start : END; x.index = i; });
const O = [];
const o = (s, e, type, p) => O.push({ start: +s, duration: +(e - s).toFixed(2), type, ...p });
const chip = (s, e, text, side = "right") => o(s, e, "keyword_chip", { text, side });
const note = (s, e, text, side = "right") => o(s, e, "side_note", { text, side });
const chap = (s, text, eyebrow, numeral, section) => o(s, s + 3.1, "chapter_open", { text, eyebrow, numeral, section });
o(0.05, 3.5, "title_slide", { text: "PF withdrawal rules changed", eyebrow: "Crack IT · Day 75", style_hint: "What freshers must do before switching jobs" });
chip(5.0, 9.0, "EPFO board: new PF rules");
note(10.4, 12.5, "One wrong move with PF");
o(13.2, 20.8, "stat_trio", { text: "In this video", items: [{ label: "points", sublabel: "", value: 3 }, { label: "minutes", sublabel: "", value: 5 }, { label: "mistake to avoid", sublabel: "", value: 1 }] });
note(22.0, 25.2, "Third point: the one learned too late");
chap(25.7, "What the board decided", "Section 01", "01", 0);
chip(30.0, 36.5, "EPFO CBT · 240th meeting");
o(38.0, 62.8, "data_table", { text: "Approved on 19 Nov 2026", columns: ["Rule", "Before", "Approved"], rows: [
  { cells: ["Wait, final withdrawal", "12 months", "2 months"], at: 5.3 },
  { cells: ["Minimum balance kept", "25%", "10%"], at: 11.3 },
  { cells: ["Accessible share", "75%", "90%"], at: 13.6 },
  { cells: ["Retirees", "lump sum", "optional instalments"], at: 17.9 }], footer: "board-approved · not yet notified", footer_at: 23 });
chap(63.4, "Approved, not live", "Section 02", "02", 1);
o(67.3, 73.9, "big_statement", { text: "Approved, not live", eyebrow: "reported by PTI, Scroll" });
o(76.0, 79.7, "big_statement", { text: "₹10 lakh eligible balance", eyebrow: "example" });
o(80.2, 89.8, "data_table", { text: "₹10 lakh, old rule vs new", columns: ["Rule", "You keep", "You can take"], rows: [
  { cells: ["Old (25%)", "₹2.5 lakh", "₹7.5 lakh"], at: 3.4 },
  { cells: ["New (10%)", "₹1 lakh", "₹9 lakh"], at: 6.0 }], footer: "illustration, once notified", footer_at: 8.5 });
chap(91.5, "What has not changed", "Section 03", "03", 2);
o(94.8, 103.4, "fact_band", { text: "Still the same", items: [{ label: "36 months", sublabel: "EPS pension wait" }, { label: "12 months", sublabel: "service for partial withdrawal" }] });
note(103.6, 105.7, "First year? No partial withdrawal");
chap(106.1, "The mistake", "Section 04", "04", 3);
chip(110.2, 114.5, "Withdraw by habit? Don't");
o(116.0, 126.9, "flow_diagram", { text: "Transfer, don't withdraw", items: [{ label: "Old job PF", sublabel: "" }, { label: "Same UAN", sublabel: "" }, { label: "New job PF", sublabel: "online transfer" }, { label: "Keeps earning", sublabel: "interest" }] });
o(127.6, 135.6, "checklist", { text: "Three reasons not to withdraw", items: [{ label: "UAN stays for life", state: "yes" }, { label: "Compounding stops when you take it out", state: "yes" }, { label: "Tax may be deducted", state: "yes" }] });
note(135.8, 141.8, "Early withdrawal can mean tax deducted");
chap(142.8, "Do this week", "Section 05", "05", 4);
o(146.0, 160.5, "checklist", { text: "This week", items: [{ label: "UAN active, mobile + Aadhaar linked", state: "yes" }, { label: "Switching jobs: transfer, don't withdraw", state: "yes" }, { label: "Wait for Labour Ministry notification", state: "yes" }] });
o(160.9, 164.3, "big_statement", { text: "Approved is not notified", eyebrow: "rule" });
chip(164.7, 168.8, "Follow the notified rule, not the headline");
o(169.7, 182.8, "fact_band", { text: "To sum up", items: [{ label: "2 months", sublabel: "final withdrawal wait" }, { label: "10%", sublabel: "minimum balance" }, { label: "NOT LIVE", sublabel: "until notified" }] });
o(184.0, 187.9, "poll_prompt", { text: "Do you know your UAN number?", items: [{ label: "Yes" }, { label: "No" }] });
o(188.3, 192.6, "poll_prompt", { text: "Old PF: transfer or withdraw?", items: [{ label: "Transferred" }, { label: "Withdrew" }] });
chip(193.0, 197.6, "Subscribe · Share");
O.sort((a, b) => a.start - b.start);
writeFileSync(new URL("./visual-plan.json", import.meta.url), JSON.stringify({ style: "blueprint", rail: true, overlays: O, scenes: S, camera_moves: [] }, null, 1));
console.log(S.length, "scenes", O.length, "overlays");
