import { writeFileSync } from "node:fs";
const S = [];
const sc = (end, o) => { const start = S.length ? S[S.length - 1].end : 0; S.push({ index: S.length, start, end, ...o }); };
const g = (card, grade = "neutral") => ({ kind: "graphic", grade, ...(card ? { card } : {}) });
const br = (src, ms = 0, motion = "ken_in", grade = "cool") => ({ kind: "broll", src: `assets/broll/${src}.mp4`, media_start: ms, motion, grade, transition: "fade" });
sc(4.5, br("nervous-foot", 0, "ken_in", "cool"));
sc(10.65, g({ value: "H.R.", label: "the last 10 minutes" }, "cool"));
sc(19.83, g({ value: "3", label: "answers · 1 method" }, "cool"));
sc(25.81, br("office-desk", 0, "ken_in", "neutral"));
sc(32.0, g({ value: "STAY?", label: "learn · fit in" }, "neutral"));
sc(39.58, g({ value: "RISK", label: "check, not a formality" }, "neutral"));
sc(50.92, g({ value: "100×", label: "same sentences heard" }, "cool"));
sc(59.74, br("writing-desk", 0, "ken_in", "cool"));
sc(66.4, g({ value: "Who", label: "proof · next" }, "cool"));
sc(75.04, g({ value: "30-40s", label: "then stop" }, "neutral"));
sc(86.08, br("notes-desk", 0, "ken_in", "neutral"));
sc(95.28, g(null, "cool"));
sc(103.0, g({ value: "₹", label: "expected pay" }, "cool"));
sc(110.0, g({ value: "OPEN", label: "to the standard range" }, "neutral"));
sc(118.45, g({ value: "LEARN", label: "a good project" }, "cool"));
sc(124.27, g(null, "cool"));
sc(136.0, g({ value: "0", label: "weight in adjectives" }, "noir"));
sc(140.0, g({ value: "1", label: "real story" }, "cool"));
sc(150.0, br("laptop-hands", 0, "ken_in", "cool"));
sc(158.31, g({ value: "real", label: "lab · event · course" }, "neutral"));
sc(166.0, g(null, "neutral"));
sc(177.0, g({ value: "3", label: "things this week" }, "neutral"));
sc(186.78, g({ value: "calm", label: "even on a new question" }, "cool"));
sc(194.55, g({ value: "1", label: "real story" }, "neutral"));
sc(202.0, g(null, "warm"));
sc(210.8, g(null, "cool"));

const O = [];
const o = (s, e, type, p) => O.push({ start: s, duration: +(e - s).toFixed(2), type, ...p });
// hook
o(0.05, 4.4, "title_slide", { text: "Rejected in the H.R. round?", eyebrow: "Crack IT · Day 21", style_hint: "3 H.R. answers that get freshers rejected" });
o(4.7, 8.0, "keyword_chip", { text: "Rejected in the H.R. round", side: "right" });
o(8.4, 10.5, "keyword_chip", { text: "Campus or off-campus", side: "left" });
o(10.9, 19.6, "fact_band", { items: [{ label: "?", sublabel: "Answer 1" }, { label: "?", sublabel: "Answer 2" }, { label: "?", sublabel: "Answer 3" }] });
// 01 why
o(19.95, 23.0, "chapter_open", { text: "Why H.R. exists", eyebrow: "Section 01", numeral: "01", section: 1 });
o(23.2, 35.4, "flow_diagram", { text: "Two different questions", items: [{ label: "Technical round", sublabel: "can you do it?" }, { label: "H.R. round", sublabel: "will you stay and learn?" }, { label: "Offer" }] });
o(35.7, 39.2, "keyword_chip", { text: "H.R. = risk check", side: "left" });
o(41.2, 47.5, "matrix_grid", { text: "Heard 100 times", items: [{ label: "Hard-working" }, { label: "Hard-working" }, { label: "Hard-working" }, { label: "Hard-working" }, { label: "Hard-working" }, { label: "Hard-working" }] });
o(47.7, 50.8, "big_statement", { text: "Be specific. Be true.", eyebrow: "specific" });
// 02 answer 1
o(50.95, 54.0, "chapter_open", { text: "Reading your resume", eyebrow: "Wrong answer 01", numeral: "01", section: 2 });
o(56.3, 59.6, "keyword_chip", { text: "Name · college · marks", side: "left" });
o(59.9, 66.2, "comparison", { side: "left", left: { label: "Resume reading ✗", text: "Nothing new" }, right: { label: "Who · Proof · Next ✓", text: "30-40 seconds" } });
o(66.5, 74.9, "flow_diagram", { text: "Tell me about yourself", items: [{ label: "Who you are", sublabel: "one line" }, { label: "Proud of", sublabel: "built or learned" }, { label: "Next", sublabel: "work you want" }] });
o(75.2, 85.9, "quote_pull", { text: "I built a small attendance app for my class and learned how to fix bugs after real users complained.", eyebrow: "Sample answer · change it to your own story" });
// 03 answer 2
o(86.1, 89.2, "chapter_open", { text: "Salary answers", eyebrow: "Wrong answer 02", numeral: "02", section: 3 });
o(89.5, 94.0, "comparison", { side: "right", left: { label: "Too high", text: "big number" }, right: { label: "Anything is fine", text: "no value" } });
o(95.4, 98.2, "keyword_chip", { text: "Unaware of fresher pay", side: "left" });
o(98.5, 101.9, "side_note", { text: "No sense of your own value", side: "right" });
o(103.0, 115.2, "flow_diagram", { text: "A safer answer", items: [{ label: "Do homework" }, { label: "Open to standard range" }, { label: "Shift to learning" }] });
o(115.6, 118.6, "keyword_chip", { text: "Mistake 3 next", side: "right" });
// 04 answer 3
o(120.3, 123.4, "chapter_open", { text: "Why hire you?", eyebrow: "Wrong answer 03", numeral: "03", section: 4 });
o(123.7, 133.1, "checklist", { text: "Why should we hire you?", items: [{ label: "Hardworking", state: "no" }, { label: "Quick learner", state: "no" }, { label: "Team player", state: "no" }] });
o(133.4, 135.9, "keyword_chip", { text: "Claim ≠ proof", side: "right" });
o(136.1, 139.8, "flow_diagram", { text: "Proof method", items: [{ label: "One quality" }, { label: "Small real story" }, { label: "Show it" }] });
o(140.0, 149.7, "quote_pull", { text: "In my third year I had never used databases. In two weeks I built a project with one, and I can show it to you.", eyebrow: "Sample proof · use your own" });
o(150.1, 152.5, "big_statement", { text: "One story beats ten adjectives", eyebrow: "story" });
o(152.8, 158.2, "bullet_list", { side: "right", text: "No project yet?", items: [{ label: "A lab" }, { label: "A college event" }, { label: "A course you finished" }, { label: "Just keep it real" }] });
// 05 method
o(158.35, 161.4, "chapter_open", { text: "The one-minute method", eyebrow: "Section 04", numeral: "04", section: 0 });
o(161.6, 165.8, "flow_diagram", { text: "Any H.R. question", items: [{ label: "Answer", sublabel: "one sentence" }, { label: "Proof", sublabel: "one sentence" }, { label: "Link to job", sublabel: "one sentence" }] });
o(166.1, 182.9, "step_progress", { side: "left", text: "This week", current_step: 0, items: [{ label: "Write your 3 answers", at: 0 }, { label: "Record yourself once", at: 7.7 }, { label: "Surprise questions", at: 11.0 }] });
o(183.3, 186.2, "keyword_chip", { text: "Sound calm", side: "right" });
// 06 wrap
o(186.9, 194.4, "checklist", { text: "To sum up", items: [{ label: "Reading your resume", state: "no" }, { label: "Shouting a number", state: "no" }, { label: "Show one real story", state: "yes" }] });
o(194.7, 201.9, "poll_prompt", { text: "Which answer were you about to give?", eyebrow: "Tell me in the comments", items: [{ label: "Resume reading", value: 40 }, { label: "Big number", value: 30 }, { label: "Team player", value: 60 }] });
o(202.2, 205.8, "big_statement", { text: "Hardest H.R. question?", eyebrow: "Hardest" });
o(206.3, 210.5, "big_statement", { text: "Subscribe and share", eyebrow: "share" });

writeFileSync(new URL("./visual-plan.json", import.meta.url), JSON.stringify({ style: "blueprint", rail: true, overlays: O, scenes: S, camera_moves: [] }, null, 1));
console.log(S.length, "scenes", O.length, "overlays");
