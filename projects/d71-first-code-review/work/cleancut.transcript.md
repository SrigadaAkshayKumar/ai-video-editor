# Clean-cut transcript (clean-cut timeline — use these times for overlays, SFX, b-roll, captions)

[00:00.03–00:04.31] w0–w13 | Your first pull request gets 23 comments, and your first thought is, they think
[00:04.31–00:05.22] w14–w16 | I am useless.
[00:05.22–00:08.16] w17–w30 | If you are a fresher in your first year, or about to join in
[00:08.16–00:11.91] w31–w44 | the next five minutes, I will explain what a code review really is, the
[00:11.91–00:16.14] w45–w58 | three rules to handle every comment, and the one reply that quietly damages your
[00:16.14–00:16.65] w59–w59 | name.
[00:17.06–00:20.68] w60–w73 | Stay till the end, because the third rule is the one senior engineers notice
[00:20.68–00:21.23] w74–w74 | first.
[00:21.77–00:24.14] w75–w87 | First, what is a code review when you finish a piece of work?
[00:24.14–00:25.97] w88–w97 | You do not put it straight into the main code.
[00:25.99–00:28.89] w98–w111 | You raise a pull request, your teammates read your changes and leave comments, only
[00:28.89–00:33.05] w112–w119 | after they approve does your code go in.
[00:33.61–00:37.00] w120–w133 | Here is the part nobody tells freshers, reviewers are not grading you, they are
[00:37.55–00:41.37] w134–w147 | protecting the product because after your code goes in, the whole team has to
[00:41.37–00:42.23] w148–w150 | live with it.
[00:42.78–00:46.89] w151–w164 | Even senior engineers get comments on almost every pull request, so a long list
[00:46.89–00:50.53] w165–w178 | of comments does not mean you failed, it means people took the time to
[00:50.53–00:51.26] w179–w181 | read your work.
[00:52.16–00:55.59] w182–w193 | Rule one, read every comment before you reply to any of them.
[00:55.59–00:58.47] w194–w204 | When you see the first comment, your mind wants to defend.
[00:58.47–01:02.03] w205–w218 | You type a quick answer, and then the next comment explains why that answer
[01:02.03–01:02.76] w219–w220 | was wrong.
[01:02.76–01:04.84] w221–w226 | Now you have a messy thread.
[01:05.37–01:08.80] w227–w240 | Instead read all the comments once, slowly, sort them in your head into three
[01:08.80–01:12.02] w241–w252 | groups, things you must fix like a bug or a missing check.
[01:12.57–01:14.83] w253–w260 | Things that are style, like names and spacing.
[01:15.41–01:19.42] w261–w274 | And things you do not understand, this takes five minutes, but it turns 23
[01:19.42–01:22.60] w275–w281 | scary comments into maybe six real tasks.
[01:23.14–01:26.72] w282–w295 | Rule two, if you do not understand a comment, ask, do not argue, and
[01:26.72–01:27.56] w296–w298 | do not guess.
[01:27.56–01:30.23] w299–w307 | Suppose the reviewer writes, please handle the null case.
[01:30.23–01:31.52] w308–w314 | You do not know what they mean.
[01:31.52–01:33.93] w315–w322 | Do not stay silent and change random lines.
[01:33.93–01:35.78] w323–w329 | Reply like this, thanks for catching this.
[01:35.78–01:38.74] w330–w343 | Do you mean when the user list is empty or when the value itself
[01:38.74–01:39.44] w344–w345 | is missing?
[01:39.44–01:43.22] w346–w355 | A question like that shows you are thinking, not defending.
[01:43.79–01:46.97] w356–w369 | And if you truly disagree, give a reason and not an opinion, I used
[01:46.97–01:51.05] w370–w382 | this approach because of this case, happy to change it if you prefer.
[01:51.05–01:52.47] w383–w386 | Most reviewers respect that.
[01:52.47–01:56.40] w387–w400 | Now the third rule is coming, and it is the one that decides how
[01:56.40–01:57.49] w401–w403 | they see you.
[01:58.31–02:02.53] w404–w417 | Rule three, fix it, close the loop and never make the same mistake twice.
[02:02.53–02:06.34] w418–w431 | Fix the comments, push your changes and reply to each one with a short
[02:06.34–02:10.07] w432–w445 | word, done, or fixed in the latest commit that way the reviewer does not
[02:10.07–02:11.86] w446–w452 | need to hunt through your code again.
[02:12.39–02:14.68] w453–w460 | Then comes the part that builds your name.
[02:14.71–02:18.85] w461–w474 | Keep a small notes file, every time a reviewer teaches you something, write one
[02:18.85–02:22.84] w475–w485 | line, use meaningful names, add a test, check for empty values.
[02:22.84–02:26.66] w486–w496 | By your third pull request, those same comments should stop coming.
[02:26.66–02:30.66] w497–w508 | That is the moment senior engineers start trusting you with bigger work.
[02:31.21–02:35.16] w509–w522 | Now the reply that quietly damages your name, it works on my machine, or
[02:35.16–02:39.22] w523–w536 | this was already like that, or worst of all saying nothing and merging your
[02:39.22–02:41.21] w537–w542 | own code to avoid more comments.
[02:41.21–02:42.63] w543–w548 | Reviewers do not mind a bug.
[02:42.66–02:47.17] w549–w562 | Bugs happen, what they remember is a fresher who argues, ignores comments, or hides
[02:47.17–02:47.86] w563–w563 | things.
[02:48.39–02:51.42] w564–w577 | If you made a mistake, say it in one line, you are right, I
[02:51.42–02:53.10] w578–w582 | missed this, fixing it now.
[02:53.10–02:56.43] w583–w594 | That sentence costs nothing, and it makes people want to help you.
[02:56.43–03:00.11] w595–w608 | So to sum up, comments are not about you, they are about the code,
[03:00.11–03:04.17] w609–w622 | read everything first, ask when you are unclear, and fix and reply to every
[03:04.17–03:04.83] w623–w623 | comment.
[03:04.83–03:08.16] w624–w635 | Keep notes and you will grow faster than most of your batch.
[03:08.71–03:10.61] w636–w643 | Now I want to hear from you guys.
[03:10.64–03:14.09] w644–w657 | Comment the toughest review, comment you have ever got, and I will help you
[03:14.09–03:14.97] w658–w660 | word the reply.
[03:14.97–03:18.19] w661–w674 | If this helped, like the video and subscribe so you don't miss the next
[03:18.19–03:18.77] w675–w675 | update.
