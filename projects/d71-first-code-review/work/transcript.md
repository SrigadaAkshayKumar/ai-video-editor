# Transcript (raw timeline)

- language: eng · engine: whisper.cpp small.en
- duration: 03:25.90 · tokens: 676 · lines: 63
- legend: `L012 [mm:ss.ss–mm:ss.ss] w120–w134 | text` · `word⁽?⁾` = low ASR confidence (possible mispronunciation/mumble) · `[event]` = non-speech audio · `… pause Xs` = gap before the next line
- reference words by id (w120) or ranges (w120–w134) in work/edl.json

L001 [00:00.03–00:04.54] w0–w15 | Your⁽?⁾ first pull request gets 23 comments, and your first thought is, they think I am
L002 [00:04.54–00:05.23] w16–w16 | useless.
L003 [00:05.23–00:08.58] w17–w32 | If you are a fresher in your first year, or about to join in the next
L004 [00:08.58–00:12.76] w33–w48 | 5 minutes, I will explain what a code review really is, the 3⁽?⁾ rules to handle
L005 [00:12.76–00:16.65] w49–w59 | every comment, and the one reply that quietly damages your name.
L006 [00:17.06–00:21.23] w60–w74 | Stay till the end, because the third rule is the one senior engineers notice first.
   … pause 0.61s
L007 [00:21.84–00:24.20] w75–w87 | First, what is a code review when you finish a piece of work?
L008 [00:24.20–00:26.03] w88–w97 | You do not put it straight into the main code.
L009 [00:26.06–00:29.73] w98–w113 | You raise a pull request, your teammates read your changes and leave comments, only after they
L010 [00:29.73–00:33.12] w114–w119 | approved⁽?⁾ as your code go in.
   … pause 3.72s
L011 [00:36.84–00:38.57] w120–w127 | Here is the part nobody tells freshers, reviewers⁽?⁾
   … pause 0.85s
L012 [00:39.42–00:40.53] w128–w133 | are not grading you, they are
   … pause 0.62s
L013 [00:41.15–00:42.84] w134–w138 | protecting the product because after
L014 [00:43.31–00:45.83] w139–w150 | your code goes in, the whole team has to leave with it.
   … pause 0.65s
L015 [00:46.48–00:49.54] w151–w160 | Even senior engineers get comments on almost every pull request,
L016 [00:50.06–00:52.49] w161–w171 | so a long list of comments does not mean you fail,
   … pause 0.65s
L017 [00:53.14–00:55.06] w172–w181 | it means people took the time to read your work.
   … pause 1.73s
L018 [00:56.79–01:00.22] w182–w193 | Rule one, read every comment before you reply to any of them.
L019 [01:00.22–01:03.10] w194–w204 | When you see the first comment, your mind wants to defend.
L020 [01:03.10–01:07.39] w205–w220 | You type a quick answer, and then the next comment explains why that answer was wrong.
L021 [01:07.39–01:09.47] w221–w226 | Now you have a messy thread.
   … pause 0.97s
L022 [01:10.44–01:14.48] w227–w242 | Instead read all the comments once, slowly, sort them in your head into 3 groups, things
L023 [01:14.48–01:17.08] w243–w252 | you must fix like a bug or a missing check.
   … pause 0.72s
L024 [01:17.80–01:20.06] w253–w260 | Things that are style, like names and spacing.
L025 [01:20.64–01:25.59] w261–w276 | And things you do not understand, this takes 5 minutes, but it turns 23 scary comments
L026 [01:25.61–01:27.84] w277–w281 | into maybe 6 real tasks.
   … pause 0.80s
L027 [01:28.64–01:32.49] w282–w297 | Rule two, if you do not understand a comment, ask, do not argue, and do not
L028 [01:32.49–01:33.06] w298–w298 | guess.
L029 [01:33.06–01:35.73] w299–w307 | Suppose the reviewer writes, please⁽?⁾ handle the null case.
L030 [01:35.73–01:37.02] w308–w314 | You do not know what they mean.
L031 [01:37.02–01:39.43] w315–w322 | Do not stay silent and change random lines.
L032 [01:39.43–01:41.28] w323–w329 | Reply like this, thanks for catching this.
L033 [01:41.28–01:44.94] w330–w345 | Do you mean when the user list is empty or when the value itself is missing?
L034 [01:44.94–01:48.72] w346–w355 | A question like that shows you are thinking, not defending.
   … pause 1.20s
L035 [01:49.92–01:53.80] w356–w371 | And if you truly disagree, give a reason and not an opinion, I use this approach
L036 [01:53.80–01:57.18] w372–w382 | because of this case, happy to change it if you prefer.
L037 [01:57.18–01:58.61] w383–w386 | Most reviewers respect that.
L038 [01:58.61–02:03.05] w387–w402 | Now the third rule is coming, and it is the one that decides how they see
L039 [02:03.05–02:03.62] w403–w403 | you.
   … pause 1.06s
L040 [02:04.68–02:08.89] w404–w417 | Rule three, fix it, close the loop and never make the same mistake twice.
L041 [02:08.89–02:13.50] w418–w433 | Fix the comments, push your changes and reply to each one with a short word, done,⁽?⁾
L042 [02:13.50–02:17.24] w434–w449 | or fixed in the latest commit that way the reviewer does not need to hunt through
L043 [02:17.24–02:18.23] w450–w452 | your code again.
   … pause 0.83s
L044 [02:19.06–02:21.35] w453–w460 | Then comes the part that builds your name.
L045 [02:21.38–02:25.97] w461–w476 | Keep a small notes file, every time a reviewer teaches you something, write one line, use
L046 [02:25.95–02:29.51] w477–w485 | meaningful names, add a test, check for empty values.
L047 [02:29.51–02:33.32] w486–w496 | By your third pull request, those same comments should stop coming.
L048 [02:33.32–02:37.33] w497–w508 | That is the moment senior engineers start trusting you with bigger work.
   … pause 0.71s
L049 [02:38.04–02:42.44] w509–w524 | Now the reply that quietly damages your name, it works⁽?⁾ on my machine, or this was
L050 [02:42.44–02:46.85] w525–w540 | already like that, or worst of all saying nothing and merging your own code to avoid
L051 [02:46.85–02:48.04] w541–w542 | more comments.
L052 [02:48.04–02:49.47] w543–w548 | Reviewers do not mind a bug.
L053 [02:49.49–02:54.70] w549–w563 | Things⁽?⁾ happen, what they remember is a fresher who argues, ignores comments, or hides things.
   … pause 0.66s
L054 [02:55.36–02:59.08] w564–w579 | If you made a mistake, say it in one line, you are right, I missed this,
L055 [02:59.08–03:00.07] w580–w582 | fixing it now.
L056 [03:00.07–03:03.40] w583–w594 | That sentence caused nothing, and it makes people want to help you.
L057 [03:03.40–03:07.95] w595–w610 | So to sum up, comments are not about you, they are about the code, read everything
L058 [03:07.95–03:11.80] w611–w623 | first, ask when you are unclear, and fix and reply to every comment.
L059 [03:11.80–03:15.13] w624–w635 | Keep notes and you will grow faster than most of your batch.
   … pause 0.65s
L060 [03:15.78–03:17.68] w636–w643 | Now I want to hear from you guys.
L061 [03:17.71–03:21.54] w644–w659 | Comment⁽?⁾ the toughest review, comment you have ever got, and I will help you word the
L062 [03:21.54–03:22.04] w660–w660 | reply.
L063 [03:22.04–03:25.84] w661–w675 | If this helped, like the video and subscribe so you don't miss the next update.

## Long silences (≥0.8s, -35dB)

- 00:33.12–00:36.13 (3.01s)
- 00:55.06–00:56.64 (1.58s)
- 01:48.72–01:49.79 (1.08s)
- 02:03.62–02:04.47 (0.85s)
