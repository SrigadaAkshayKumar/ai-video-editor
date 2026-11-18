import { writeFileSync } from "node:fs";
const title = "What Is Bench in IT Company? Wipro 180 Day Bench Policy | Fresher Project Allocation Tips";
const desc = `Joining date is fixed, your project is not. Here is what the bench really means in an IT services company, what Wipro's reported new 180-day bench policy tells freshers, and four things to do in your first weeks so you get a project faster.

In this video: what the bench is and why it happens right after training, Wipro's reported bench policy (effective 1 October 2026, Band 2 and below, up to 180 calendar days, separation under contract terms if there is no allocation), four steps to take (ask how allocation works, finish training on time, build one small relevant project, send a short weekly update), and the traps to avoid. This is one company's reported policy, so ask your own company how it works.

Chapters
0:00 Joined, but no project?
0:33 What is the bench?
1:02 Wipro's new bench rule
1:50 Four things to do
2:42 The bench trap
3:04 Sum up

Tell me in the comments: how many weeks did it take you or your friends to get a project after joining? Write the number of weeks, without the company name.

Sources
Trak.in, 2 Oct 2026: Wipro's Junior Employees Can Now Sit On Bench For 6 Months
SightsInPlus, 1 Oct 2026: Wipro Gives Employees Six Months to Find New Projects, Revised Bench Policy
(Policy as reported by news outlets; check your own offer letter and company policy.)

#Bench #Freshers #Wipro #CrackIT`;
const tags = ["what is bench in IT company", "bench period in IT company", "wipro bench policy", "wipro 180 days bench", "bench policy freshers", "project allocation freshers", "how to get project in IT company", "fresher no project after joining", "bench in infosys tcs wipro", "what to do on bench", "bench period salary", "IT services bench explained", "first job software tips", "freshers 2026", "joining IT company freshers", "billable project meaning", "resource allocation IT company", "offer letter bench clause", "campus to corporate", "Crack IT", "software job freshers india", "first week at IT job", "weekly status update to manager", "IT fresher guide"];
const q = []; let n = 0;
for (const t of tags) { const c = (t.includes(" ") ? t.length + 2 : t.length) + (q.length ? 1 : 0); if (n + c > 488) break; q.push(t); n += c; }
console.log("title", title.length, "tags chars", n, "count", q.length);
writeFileSync(new URL("../output/youtube.json", import.meta.url), JSON.stringify({ title, description: desc, tags: q, thumbnail: "output/thumbnails/A.png" }, null, 2));
writeFileSync(new URL("../output/metadata.md", import.meta.url), `# d34 upload package\n\nTitle: ${title}\n\n${desc}\n\nTags: ${q.join(", ")}\n\nPinned comment: How many weeks did it take you to get your first project after joining? Write the number (no company name) so other freshers know what to expect.\n\nThumbnail text: JOINED, NO PROJECT? / BENCH = DANGER? / GET A PROJECT FAST\n`);
