import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const T = JSON.parse(readFileSync("work/timeline.json", "utf8"));
const W = JSON.parse(readFileSync("work/words.json", "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const at = (phrase, from = 0) => { const p = phrase.split(" ").map(norm);
  for (let i = 0; i < W.length; i++) { if (W[i].start < from) continue; if (p.every((x, j) => W[i + j] && norm(W[i + j].text) === x)) return W[i].start; }
  throw new Error("phrase not found: " + phrase + " from " + from); };
const c = (r) => { for (const s of T) if (r >= s.raw_start && r <= s.raw_end) return +(s.start + r - s.raw_start).toFixed(2); let b = T[0]; for (const s of T) if (s.raw_start <= r) b = s; return +Math.min(b.end, b.start + Math.max(0, r - b.raw_start)).toFixed(2); };
const END = T[T.length - 1].end;
const dur = {}; const clipLen = (n) => dur[n] ??= +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `assets/broll/${n}.mp4`]).toString().trim();
const S = [];
const sc = (r1, o) => { const start = S.length ? S[S.length - 1].end : 0, end = r1 == null ? END : c(r1);
  if (o.src) { const n = o.src.match(/broll\/(.*)\.mp4/)[1]; if ((o.media_start || 0) + (end - start) > clipLen(n) - 0.05) console.warn("CLIP TOO SHORT", n, o.media_start, +(end - start).toFixed(1), clipLen(n)); }
  S.push({ index: S.length, start, end, ...o }); };
const g = (card, grade = "neutral") => ({ kind: "graphic", grade, ...(card ? { card } : {}) });
const br = (src, ms = 0, motion = "ken_in", grade = "warm") => ({ kind: "broll", src: `assets/broll/${src}.mp4`, media_start: ms, motion, grade, transition: "fade" });

const a = {
  friends: at("Your friends"), itco: at("In I.T. companies"), howuse: at("But how you use"), inthis: at("In this video"),
  simply: at("The bench simply means"), earn: at("I.T. services companies earn"), cost: at("So for the company"), good: at("That is actually good"),
  why: at("Why do freshers"), one: at("One the project", 50), two: at("Two there are", 55), three: at("Three many", 60), some: at("And sometimes", 65),
  what: at("So what usually happens"), many: at("Many companies have", 80), pm: at("Project managers", 90), every: at("Every company has", 100), soread: at("So read", 105),
  risks: at("Now the risks"), first: at("First your"), second: at("Second you"), third: at("And third"), sothe: at("So the bench is not"),
  here: at("So here is how"), chk: at("Check the internal"), t2: at("Two use the time"), t3: at("Three prepare"), t4: at("Four talk"), t5: at("And five"),
  sum: at("To sum up"), checkp: at("So check the portal"), comment: at("If you are on"), tmrw: at("Tomorrow an important"),
};
// ---- scenes (broll leads; graphics docked). sc(r1, ...) = scene ENDS at r1 ----
const andyou = at("And you are still", 0), itis = at("It is very common", 0);
sc(a.friends, br("man-thinking", 0, "ken_in", "cool"));
sc(andyou, br("office-desk", 0, "pan_right"));
sc(a.itco, br("woman-yellow-phone", 0, "ken_out", "cool"));
sc(a.howuse, br("bench-window", 0, "ken_in", "cool"));
sc(a.inthis, br("woman-laptop", 0, "ken_out"));
sc(a.simply, br("office-blur", 0, "ken_in", "cool"));            // agenda
sc(a.earn, br("notebook-writing", 9, "static", "cool"));          // ch01 + term
sc(a.cost, br("glass-towers", 0, "pan_left", "cool"));            // billable vs bench
sc(a.good, br("desk-topdown", 6, "ken_in", "warm"));              // cost
sc(a.why, br("students-park", 2, "ken_in", "warm"));              // same thing
sc(a.one, br("woman-phone", 0, "ken_in", "cool"));                // ch02
sc(a.two, br("office-blur", 8, "pan_right", "cool"));             // delayed
sc(a.three, br("code-laptop", 1, "ken_in", "cool"));              // technology
sc(a.some, br("desk-topdown", 30, "ken_out", "cool"));            // experienced first
sc(a.what, br("man-thinking", 2, "ken_out", "noir"));             // inside control
sc(a.many, br("woman-laptop", 0, "ken_in", "warm"));              // ch03
sc(a.pm, br("typing-hands", 0, "ken_in", "cool"));                // portal
sc(a.every, br("code-laptop", 5, "pan_left", "warm"));            // path off the bench
sc(a.soread, br("office-desk", 3, "ken_in", "warm"));             // policy
sc(a.risks, br("office-blur", 12, "ken_out", "cool"));            // HR portal
sc(a.first, br("bench-window", 1, "ken_out", "noir"));            // ch04
sc(a.second, br("man-thinking", 5, "ken_in", "noir"));            // rusty
sc(a.third, br("woman-phone", 0.5, "pan_right", "noir"));         // wrong project
sc(a.here, br("office-blur", 3, "ken_in", "noir"));               // reviewed + quote
sc(a.chk, br("desk-topdown", 20, "ken_in", "warm"));              // ch05
sc(a.t2, br("typing-hands", 5, "ken_out", "warm"));               // portal daily
sc(a.t2 + 8.5, br("woman-laptop", 2.5, "ken_in", "warm"));        // certification
sc(a.t3, br("notebook-writing", 0, "ken_in", "warm"));            // learn
sc(a.t4, br("interview-talk", 0.5, "ken_in", "warm"));            // prep
sc(a.t5 - 4.4, br("students-park", 8, "ken_in", "warm"));         // talk to people
sc(a.t5, br("desk-topdown", 12, "ken_in", "warm"));               // recommendations
sc(a.sum, br("man-street-phone", 0, "ken_in", "neutral"));        // flexible
sc(a.checkp, br("woman-laptop", 0, "ken_out", "warm"));           // sum up
sc(a.comment, br("office-desk", 2, "ken_in", "warm"));            // recap
sc(a.tmrw, br("woman-yellow-phone", 4, "ken_in", "warm"));        // comment cta
sc(null, br("students-park", 3, "ken_out", "cool"));              // tomorrow

// ---- overlays ----
const O = [];
const o = (r0, r1, type, p) => { const s = c(r0), e = c(r1); O.push({ start: s, duration: +(e - s).toFixed(2), type, ...p }); };
const oc = (s, d, type, p) => O.push({ start: +s.toFixed(2), duration: d, type, ...p });
// hook
oc(0.05, 3.4, "title_slide", { text: "On the bench?", eyebrow: "Crack IT · Day 13", style_hint: "No project after training" });
oc(c(a.friends) + 0.2, 3.4, "checklist", { text: "Your batch", items: [{ label: "Friends · project", state: "yes" }, { label: "You · waiting", state: "no" }] });
oc(c(a.itco) + 0.2, 4.2, "big_statement", { text: "This is called being on the bench", eyebrow: "bench" });
oc(c(a.howuse) + 0.5, 3.2, "side_note", { text: "How you use this time sets your first year", side: "right" });
oc(c(a.inthis) + 0.3, c(a.simply) - c(a.inthis) - 0.5, "step_progress", { side: "right", text: "In this video", current_step: 0,
  items: [{ label: "What the bench is", at: 0.4 }, { label: "Why freshers land there", at: at("why freshers end up", a.inthis) - a.inthis }, { label: "What happens", at: at("what usually happens", a.inthis) - a.inthis }, { label: "The risks", at: at("the risks and", a.inthis) - a.inthis }, { label: "How to get out", at: at("exactly how", a.inthis) - a.inthis }] });
// 01 what the bench is
o(a.simply + 0.1, a.simply + 3.2, "chapter_open", { text: "What the bench is", eyebrow: "Section 01", numeral: "01", section: 1 });
o(a.simply + 3.5, a.earn - 0.2, "term_card", { side: "left", text: "On the bench", eyebrow: "in simple words", items: [{ label: "Paid, but no client project" }] });
o(a.earn + 0.6, a.cost - 0.4, "comparison", { side: "right", text: "Billable vs bench", left: { label: "Billable", text: "On a client project" }, right: { label: "Bench", text: "Paid, not billable" } });
o(a.cost + 0.4, a.good - 0.5, "big_statement", { text: "For the company, the bench is a cost", eyebrow: "cost" });
o(a.good + 0.4, a.why - 0.4, "quote_pull", { text: "You and the company want the same thing: a project.", eyebrow: "Good news" });
// 02 why
o(a.why + 0.1, a.why + 3.2, "chapter_open", { text: "Why freshers land there", eyebrow: "Section 02", numeral: "02", section: 2 });
o(a.one + 0.2, a.some - 0.5, "step_progress", { side: "left", text: "Outside your control", current_step: 0,
  items: [{ label: "Planned project delayed or cancelled", at: 0.3 }, { label: "No project matching your tech", at: a.two - a.one }, { label: "Experienced people first", at: a.three - a.one }] });
o(a.some + 0.6, a.what - 0.5, "term_card", { side: "right", text: "Inside your control", eyebrow: "sometimes", items: [{ label: "Low training scores or a weak project interview" }] });
// 03 what happens
o(a.what + 0.1, a.what + 3.1, "chapter_open", { text: "What happens on the bench", eyebrow: "Section 03", numeral: "03", section: 3 });
o(a.many + 0.3, a.pm - 0.4, "bullet_list", { side: "right", text: "While on the bench", items: [{ label: "Stay available" }, { label: "Keep learning" }, { label: "Apply on the internal portal" }] });
o(a.pm + 0.4, a.every - 0.3, "flow_diagram", { text: "Path off the bench", items: [{ label: "Bench" }, { label: "Job portal" }, { label: "Project interview" }, { label: "Allocated" }] });
o(a.every + 0.4, a.soread - 0.2, "side_note", { text: "Every company's bench policy is different", side: "left" });
o(a.soread + 0.3, a.risks - 0.4, "lower_third", { text: "Your company's HR policy portal", eyebrow: "Know your own rules", side: "left" });
// 04 risks
o(a.risks + 0.1, a.risks + 3.1, "chapter_open", { text: "The risks of a long bench", eyebrow: "Section 04", numeral: "04", section: 4 });
o(a.first + 0.2, a.third - 0.4, "step_progress", { side: "left", text: "A long bench", current_step: 0,
  items: [{ label: "Rusty skills, lower confidence", at: 0.3 }, { label: "Mismatched project, out of desperation", at: a.second - a.first }, { label: "Reviewed in tough times", at: a.third - a.first }] });
o(a.sothe + 0.2, a.here - 0.2, "quote_pull", { text: "Don't stay on the bench quietly.", eyebrow: "Reality check" });
// 05 how to get out
o(a.here + 0.1, a.here + 3.1, "chapter_open", { text: "How to get out fast", eyebrow: "Section 05", numeral: "05", section: 0 });
o(a.here + 3.4, a.sum - 0.5, "step_progress", { side: "right", text: "5 steps", current_step: 0,
  items: [{ label: "Check the portal daily, apply", at: 0.3 }, { label: "One in-demand certification", at: a.t2 - a.chk }, { label: "Prepare for project interviews", at: a.t3 - a.chk }, { label: "Talk to people", at: a.t4 - a.chk }, { label: "Flexible, not desperate", at: a.t5 - a.chk }] });
// sum up
o(a.sum + 0.3, a.checkp - 0.3, "checklist", { text: "To sum up", items: [{ label: "Bench = paid, no project", state: "yes" }, { label: "Common, not your fault", state: "yes" }, { label: "A long bench has real risks", state: "yes" }] });
o(a.checkp + 0.4, a.comment - 0.4, "bullet_list", { side: "right", text: "Get out of the bench", items: [{ label: "Portal daily" }, { label: "Learn a skill" }, { label: "Interview prep" }, { label: "Network" }, { label: "Stay flexible" }] });
o(a.comment + 0.4, a.comment + 4.6, "lower_third", { text: "Bench time + your technology", eyebrow: "Comment below", side: "left" });
o(a.tmrw + 0.3, a.tmrw + 3.6, "lower_third", { text: "Fake I.T. job offers: 5 red flags", eyebrow: "Tomorrow", side: "left" });
oc(END - 3.6, 3.2, "keyword_chip", { text: "SUBSCRIBE", side: "right" });
O.sort((x, y) => x.start - y.start);
writeFileSync("work/visual-plan.json", JSON.stringify({ style: "glass", rail: true, overlays: O, scenes: S, camera_moves: [] }, null, 1));
console.log(S.length, "scenes", O.length, "overlays", END);
