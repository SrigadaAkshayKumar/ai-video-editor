# Transcript (raw timeline)

- language: eng · engine: whisper.cpp small.en
- duration: 04:03.90 · tokens: 781 · lines: 84
- legend: `L012 [mm:ss.ss–mm:ss.ss] w120–w134 | text` · `word⁽?⁾` = low ASR confidence (possible mispronunciation/mumble) · `[event]` = non-speech audio · `… pause Xs` = gap before the next line
- reference words by id (w120) or ranges (w120–w134) in work/edl.json

L001 [00:00.02–00:04.70] w0–w15 | Most freshers spend months learning a big programming language before joining, and then, in the first
L002 [00:04.70–00:09.27] w16–w31 | month, the senior says one line, "Can you pull this data from the database?" Many freshers
L003 [00:09.27–00:14.56] w32–w47 | freeze, because nobody taught them the one skill that almost every project uses every single day.
   … pause 1.16s
L004 [00:15.72–00:18.96] w48–w61 | If you are a fresher waiting to join a tech company, stay with me.
L005 [00:18.96–00:23.58] w62–w77 | By the end, you will know the 5SQL, commands that cover most of your first year,
L006 [00:23.58–00:27.53] w78–w93 | a simple way to practice them in one hour, and the mistake that can delete real
L007 [00:27.53–00:28.86] w94–w98 | data on a real project.
   … pause 0.64s
L008 [00:29.49–00:32.24] w99–w106 | First, why⁽?⁾ this skill, and not another one.
L009 [00:32.24–00:36.01] w107–w115 | Almost every application stores its information in a database.
L010 [00:36.01–00:42.45] w116–w131 | Customer details, orders, bank transactions, test results to read that information, to check a bug, or
L011 [00:42.45–00:45.61] w132–w138 | to prepare a report, people write SQL.
L012 [00:45.61–00:49.08] w139–w149 | It is not a hard language, it reads almost like English.
   … pause 0.65s
L013 [00:49.73–00:51.00] w150–w153 | Here⁽?⁾ is the surprise.
L014 [00:51.00–00:54.62] w154–w169 | In many projects, a fresher is asked to check data long before they are asked to
L015 [00:54.62–00:55.74] w170–w173 | build a big feature.
L016 [00:55.77–00:57.42] w174–w179 | Testers use it to verify results.
L017 [00:57.42–01:00.11] w180–w188 | Support teams use it to find why something failed.
L018 [01:00.11–01:01.51] w189–w193 | Developers use it every day.
L019 [01:01.51–01:05.35] w194–w209 | So, if you learn only this one thing well, you will look useful in your first
L020 [01:05.35–01:05.73] w210–w210 | week.
L021 [01:05.73–01:07.29] w211–w214 | Now, the 5 commands.
   … pause 0.77s
L022 [01:08.06–01:11.24] w215–w224 | Command 1 is select,⁽?⁾ it means "show⁽?⁾ me this information".
L023 [01:11.66–01:17.05] w225–w240 | You write select, the column names, and from which table, for example, select name and marks
L024 [01:17.05–01:17.87] w241–w242 | from students.
L025 [01:18.33–01:21.26] w243–w253 | A database gives you a table with just those two columns.
L026 [01:21.63–01:23.97] w254–w261 | Command 2 is where it filters the rows.
L027 [01:24.33–01:28.21] w262–w272 | Select name and marks from students where marks is above 70.
L028 [01:28.58–01:31.45] w273–w282 | Now you see only the students who⁽?⁾ scored above 70.
L029 [01:32.05–01:35.70] w283–w294 | These two commands alone answer a surprising number of questions at work.
L030 [01:35.70–01:37.60] w295–w301 | Show me all failed payments from yesterday.
L031 [01:37.60–01:40.11] w302–w310 | Show me the users from Hyderabad, always start here.
L032 [01:40.13–01:41.18] w311–w315 | But here is the catch.
L033 [01:41.18–01:44.94] w316–w330 | Beginners write select *⁽?⁾ which means every column on a table with millions of rows.
L034 [01:44.94–01:47.19] w331–w338 | That can make this system slow for everyone.
L035 [01:47.19–01:50.85] w339–w354 | Ask only for the columns you need and add a limit so you get a small
L036 [01:50.85–01:51.68] w355–w356 | sample first.
   … pause 0.97s
L037 [01:52.65–01:54.22] w357–w361 | Command 3 is order by.
L038 [01:54.22–01:55.30] w362–w365 | It sorts the result.
L039 [01:55.30–01:58.12] w366–w374 | Order by marks descending puts the highest score first.
L040 [01:58.53–02:01.00] w375–w386 | Add a limit of 5 and you get the top 5 students.
L041 [02:01.50–02:02.89] w387–w391 | Command 4 is group by.
L042 [02:03.28–02:05.46] w392–w400 | And this is the one that makes interviewer smile.
L043 [02:05.46–02:07.23] w401–w408 | It groups rows and counts or adds them.
L044 [02:07.23–02:07.90] w409–w411 | Suppose you want
L045 [02:08.40–02:10.98] w412–w420 | to know how many students are in each department.
L046 [02:10.98–02:14.50] w421–w430 | You select department and count from students group⁽?⁾ by department.
L047 [02:14.50–02:17.33] w431–w440 | One short line and you get a small summary table.
   … pause 0.79s
L048 [02:18.12–02:22.12] w441–w456 | Think of it like sorting a pile of exam papers into one stack for each department
L049 [02:22.12–02:23.86] w457–w461 | and then counting each stack.
L050 [02:23.86–02:25.27] w462–w464 | Notice something important.
L051 [02:25.27–02:27.32] w465–w471 | Group by is how reports are made.
L052 [02:27.32–02:31.19] w472–w487 | When a manager asks how many orders came from each city this week, this is the
L053 [02:31.19–02:32.66] w488–w491 | command behind the answer.
   … pause 0.68s
L054 [02:33.34–02:34.57] w492–w495 | Command 5 is join.
L055 [02:34.57–02:36.48] w496–w501 | Real data is split across tables.
L056 [02:36.48–02:39.55] w502–w509 | One table has students, another has their marks.
L057 [02:39.55–02:43.02] w510–w521 | A join connects them using a common column like the student ID.
L058 [02:43.02–02:45.38] w522–w529 | Start by understanding it as a simple match.
L059 [02:45.38–02:48.89] w530–w542 | Rows with the same ID on both sides are put side by side.
L060 [02:48.89–02:53.17] w543–w552 | Once this clicks, 90% of the fear around SQL disappears.
   … pause 0.97s
L061 [02:54.14–02:55.82] w553–w558 | Now the trap, I promised you.
L062 [02:55.82–02:57.49] w559–w562 | Update and delete commands.
L063 [02:57.49–03:01.83] w563–w578 | If you write delete from a table and forget the where line, you delete every row.
L064 [03:01.83–03:04.49] w579–w589 | This is a very famous beginner mistake and on a real
L065 [03:05.06–03:07.30] w590–w596 | project, it can be a serious incident.
L066 [03:07.30–03:08.71] w597–w600 | So follow one rule.
L067 [03:09.16–03:13.04] w601–w616 | Before you run any update or delete, run the same condition as a select first and
L068 [03:13.04–03:14.88] w617–w622 | check the rows that come back.
L069 [03:14.88–03:19.61] w623–w638 | Never practice changes on real project data and in your first months, ask a senior to
L070 [03:19.61–03:21.81] w639–w645 | review any change before you run it.
   … pause 1.00s
L071 [03:22.81–03:25.31] w646–w653 | So here is your plan for this week.
L072 [03:25.31–03:31.01] w654–w669 | Install a free database tool on your laptop or use a free online SQL practice website.
L073 [03:31.01–03:35.88] w670–w684 | Create one small table of 10 students and write each of the 5 commands yourself.
L074 [03:35.88–03:37.85] w685–w692 | One hour is enough for a first round.
L075 [03:37.85–03:41.60] w693–w704 | Then repeat for 7 days, 10 minutes each day with new questions.
   … pause 0.67s
L076 [03:42.28–03:44.46] w705–w711 | Quick recap, select and where to read.
L077 [03:44.46–03:46.43] w712–w718 | Order⁽?⁾ by and group by to summarize.
L078 [03:46.43–03:50.71] w719–w731 | Join to connect tables and never delete without checking with a select first.
L079 [03:50.71–03:54.61] w732–w747 | Now tell me in the comments, have you ever written SQL or is this your first
L080 [03:54.61–03:55.31] w748–w748 | time?
L081 [03:55.31–03:57.82] w749–w757 | Write beginner or practiced and I will read them.
L082 [03:57.82–04:01.54] w758–w773 | And if this helped, like the video and subscribe so you do not miss the next
L083 [04:01.54–04:02.85] w774–w776 | update for freshers.
L084 [04:02.85–04:03.80] w777–w780 | All the best guys!⁽?⁾

## Long silences (≥0.8s, -35dB)

- 00:14.87–00:15.72 (0.85s)
- 01:51.68–01:52.65 (0.97s)
- 02:53.17–02:54.14 (0.97s)
- 03:21.81–03:22.81 (1.00s)
