import { writeFileSync } from "node:fs";
const title = "CTC vs In-Hand Salary Explained for Freshers | Why Your First Salary Is Lower Than 12 Lakh CTC";
const desc = `Your offer letter says 12 lakh CTC, but your first salary will not be 1 lakh a month. Here are the 5 hidden parts inside your CTC, a simple way to estimate your in-hand salary before you sign, and the one question to ask HR about variable pay.

In this video: what CTC (cost to company) really means, the five parts that never reach your account every month (company PF share, gratuity, insurance and benefits, variable pay, joining or retention bonus), an illustration of how a 12 lakh CTC becomes roughly 75,000 to 82,000 rupees in hand (illustration only, your company's numbers will differ), what the new labour code's wage rule can change, and four steps to take before you sign.

Chapters
0:00 12 lakh is not 1 lakh a month
0:40 What CTC really means
1:09 The five hidden parts
2:06 From CTC to take-home (example)
2:49 The new wage rule
3:20 What to do before you sign
3:53 Sum up

Tell me in the comments: did you get an offer where the in-hand was far lower than you expected? Write the CTC you were told and the rough in-hand you got, without the company name.

Sources
Zee Business, 17 Sep 2026: Salary Breakup Explained: Why your CTC and take-home salary are so different (illustrative figures)
Moneycontrol, 22 Apr 2026: New labour code explained
Free Press Journal, 23 Apr 2026: new wage rule and take-home pay

#CTC #InHandSalary #Freshers #CrackIT`;
const tags = ["ctc vs in hand salary", "ctc vs take home salary", "ctc meaning", "what is ctc", "ctc explained for freshers", "in hand salary calculation", "how to calculate in hand salary from ctc", "salary breakup", "salary structure explained", "12 lakh ctc in hand salary", "fresher salary in hand", "first salary freshers", "variable pay explained", "gratuity explained", "pf employer contribution", "new labour code salary", "new labour code take home", "offer letter salary breakup", "questions to ask hr before joining", "it fresher salary india", "freshers 2026", "first job tips", "campus to corporate", "Crack IT", "software job salary"];
const q = []; let n = 0;
for (const t of tags) { const c = (t.includes(" ") ? t.length + 2 : t.length) + (q.length ? 1 : 0); if (n + c > 488) break; q.push(t); n += c; }
console.log("title", title.length, "tags chars", n, "count", q.length);
writeFileSync(new URL("../output/youtube.json", import.meta.url), JSON.stringify({ title, description: desc, tags: q, thumbnail: "output/thumbnails/A.png" }, null, 2));
writeFileSync(new URL("../output/metadata.md", import.meta.url), `# d33 upload package\n\nTitle: ${title}\n\n${desc}\n\nTags: ${q.join(", ")}\n\nPinned comment: Did your in-hand salary come in far below your CTC? Write the CTC you were told and the in-hand you got (no company name) so other freshers can learn.\n\nThumbnail text: 12 LAKH. NOT 1 LAKH. / 12 LAKH CTC, IN-HAND LOWER / CTC TOLD vs IN-HAND ?\n`);
