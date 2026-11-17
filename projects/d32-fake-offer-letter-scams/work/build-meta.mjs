import { writeFileSync } from "node:fs";
const title = "Fake Job Offer Letter? 5 Red Flags Freshers Must Check | Backdoor Placement Scam | 1930";
const desc = `A real offer letter never asks you for money. Here are 5 red flags that expose a fake job offer letter, a 2-minute check you can do yourself, and what to do if you have already paid.

Fake job offers and paid "backdoor placement" scams cost freshers lakhs every year. This video walks through a real Cyberabad police case from January 2026, the five red flags (money, look-alike email, a real-looking interview, pressure, WhatsApp-only chats), four steps to verify any offer from the company's own website, and what to do right away if you paid: call 1930 and use the National Cyber Crime Reporting Portal.

Chapters
0:00 A real offer never costs money
0:39 A real case from Hyderabad
1:29 The five red flags
2:41 The two-minute check
3:33 If you already paid
4:12 Sum up

Tell me in the comments: has anyone ever sent you a job offer that felt strange? Write what the message said, with the name removed.

Sources
Newsmeter, 11 Jan 2026: Backdoor job placement scam: Cyberabad police arrest five for cheating unemployed youth https://newsmeter.in/crime/backdoor-job-placement-scam-cyberabad-police-arrest-five-for-cheating-unemployed-youth-761243

#FakeOfferLetter #JobScam #Freshers #CrackIT`;
const tags = ["fake offer letter", "fake job offer", "fake offer letter red flags", "how to identify fake offer letter", "fake job offer scam", "backdoor placement scam", "backdoor job placement", "job fraud", "job scam for freshers", "fresher job scam", "fake offer letter check", "how to verify offer letter", "is my offer letter real", "fake HR email", "fake recruiter WhatsApp", "fake interview scam", "paid placement scam", "registration fee job scam", "never pay for a job", "1930 cyber crime helpline", "cyber crime reporting portal", "cyberabad police job fraud", "offer letter verification", "fresher offer letter", "IT job scam India", "campus to corporate", "Crack IT", "freshers 2026", "first job tips", "job offer scam India"];
const q = []; let n = 0;
for (const t of tags) { const c = (t.includes(" ") ? t.length + 2 : t.length) + (q.length ? 1 : 0); if (n + c > 488) break; q.push(t); n += c; }
console.log("title", title.length, "tags chars", n, "count", q.length);
writeFileSync(new URL("../output/youtube.json", import.meta.url), JSON.stringify({ title, description: desc, tags: q, thumbnail: "output/thumbnails/A.png" }, null, 2));
writeFileSync(new URL("../output/metadata.md", import.meta.url), `# d32 upload package\n\nTitle: ${title}\n\n${desc}\n\nTags: ${q.join(", ")}\n\nPinned comment: Has anyone ever sent you a job offer that felt strange? Write what the message said (name removed) and I will tell you if it looks real or fake.\n\nThumbnail text: OFFER LETTER. FAKE? / A real offer costs nothing / FREE vs FAKE\n`);
