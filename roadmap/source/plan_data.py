"""Day-by-day plan: the single source for Part 05, Part 14 of the PDF and the phone tracker.

Plan day 1 is a Monday. Weekdays hold three blocks (content 10:30-12:00 IST,
sales 12:15-13:45 IST, live block from 19:00 IST); Saturday is a 2-hour batch,
Sunday a 45-minute review. From week 6 the sales and live blocks assume you are
in a paid seat; each of those weeks also carries a "not in a seat yet" version.
"""

START_SUGGESTED = "2026-11-09"  # a Monday; the tracker recalculates for any start date

DOJO = "Dojo routine (about 50 min): Articulation Warm-up, one lesson and quiz, the 5-call Gauntlet, one Objection Blitz."
REVIEW = ("Sunday review (45 min): log the week in your tracker, set next week's 3 targets "
          "(Accountability Mirror), add 2 wins to the Cookie Jar. Rest for the remainder.")
SHIFT = ("Shift 19:00–23:00 IST (UK 13:30–17:30, US East 08:30–12:30). "
         "Log every conversation in your funnel sheet.")
RP = "Review yesterday's conversations (45 min): score 3 threads with the call scorecard. "
BODY = " Body topic: use NHS, Mayo Clinic or peer-reviewed sources."

# Before day 1 (the days between today and your start date).
PRESTART = [
    ("tracker", "Set your start date in the tracker (More tab). A Monday keeps weekends in line with US/UK days off."),
    ("payments", "Start Wise or Payoneer verification now. It can take several days."),
    ("power", "Order the router UPS and test your iPhone hotspot on a 20-minute video call."),
    ("read", "Read Parts 00–06 of the roadmap once, end to end."),
    ("copper", "Pause CopperMediaAI on purpose (Part 08): screenshot its ManyChat flow and best numbers for your applications, then cancel any tool you paid for only because of it."),
    ("tools", "Review your AI-tool spend. Keep what earns or trains you; every ₹5K a month you save is about 14% of the ₹35K target."),
    ("record", "Read the record rule and the way back in (Part 06). Leave Bet On Me closed for the 90 days: one log only, this tracker."),
    ("debrief", "Set a daily 23:05 iPhone reminder called 'Debrief' with your tracker link. Each night's debrief unlocks the next day's tasks (Part 10, item 16)."),
    ("name", "Optional head start: shortlist two show names and check the handles."),
]

PLAN_B = {
    "sales": "Dojo routine, then prepare for your next interview: research the company and rehearse 3 answers.",
    "live": ("Plan B: 6 remote applications, 10 creator DMs with a free sample edit (seat option 2), "
             "3 applications to Indian US-process sales roles (backup pipeline)."),
}
AFTER_45 = {
    "sales": "Interview follow-ups and offer decisions first. Started a backup job? Use this block for content or rest.",
    "live": ("Past gate 45: start the best offer you have. Until it starts, keep Plan B and push every open "
             "interview to a decision this week."),
}


def sa(n, q, body=False, extra=""):
    return (f"Short {n}, sprint A: “{q}” Read two sources, write a one-sentence answer and five hooks, "
            f"script in two columns, record the voice-over." + (BODY if body else "") + (" " + extra if extra else ""))


def sb(n, extra=""):
    return (f"Short {n}, sprint B: build the visuals, cut to your voice, add captions, post to YouTube Shorts, "
            f"Instagram Reels and TikTok." + (" " + extra if extra else ""))


def ls(n, extra=""):
    return (f"Long video {n}, script: expand your best-performing short into a 3–5 minute script "
            f"(outline in Part 10, item 9). Reuse its research." + (" " + extra if extra else ""))


def lm(n):
    return f"Long video {n}: record the voice-over, edit (reuse the short's visuals), add captions, post to YouTube."


GATES = {
    21: ("Gate · day 21", "Resume, LinkedIn and master Loom done, and 30+ applications sent? If not, finishing them is "
         "your only extra task this week; drop to 2 shorts until it's done."),
    35: ("Gate · day 35", "Seat accepted? Yes: start your shifts tomorrow. No: Plan B from tomorrow. Run three pipelines "
         "at once: 6 remote applications a day, 10 creator DMs a day with a free sample edit (seat option 2), and 3 "
         "applications a day to Indian US-process sales roles that pay ₹35K a month or more including typical incentives."),
    45: ("Gate · day 45", "Still no seat? Accept the best offer in any pipeline that meets the floor, today. A start by "
         "about day 50 is the latest that can still pay ₹35K a month by day 90."),
    60: ("Gate · day 60", "Add the income received in the last 30 days and your guaranteed monthly pay. Under ₹20K a "
         "month? Add a second income line this week (a second part-time setter client or one editing client), or "
         "extend your shift to 5 hours for a month."),
    70: ("Fast-track check · day 70", "Received ₹35K or more in the last 30 days? Target hit. The next 20 days are "
         "about making it reliable."),
    75: ("Gate · day 75", "Under a ₹35K-a-month pace? Add paid hours now (a second client, longer shifts). No income at "
         "all? Start the best backup job you can, today."),
    90: ("Day 90", "Target hit = ₹35K or more received in the last 30 days, or guaranteed pay of ₹35K a month with "
         "work already started."),
}

# Each week: n, title, sales (summary), content (summary), proof, days (plan-day -> blocks).
# Day blocks: c = content, s = sales, l = live, b = Saturday batch, r = Sunday review.
WEEKS = [
    dict(n=1, title="Voice, listening, setup",
         sales="Voice + listening (S1–S2). Fear rungs 1–3 + K1. Dojo routine daily. Week-1 setup checklist (Part 04).",
         content="Set up your show (Part 08). Shorts 1–2: “Does 4D exist?” and fingers wrinkling in water.",
         proof="Setup done · rung 3 reached · 2 shorts",
         days={
             1: dict(c="Set up your show (Part 08): pick a name, check the handle on YouTube, Instagram and TikTok, write your 3-question idea filter, paste the 30-question bank into Notes.",
                     s="Read S1 (voice). Rung 1: record a 60-second voice memo explaining your show idea; listen once, delete it. " + DOJO,
                     l="Finish whatever is left of the Before-day-1 list (tracker), add London, New York and Los Angeles clocks to your phone, and write one line on why you want this (it goes into your LinkedIn and your Loom)."),
             2: dict(c=sa(1, "Does 4D exist?", extra="Start from the worked script in Part 08 and make it sound like you."),
                     s="S1 drill: record one 30-second pitch twice, in the calm 'late-night FM DJ' voice and in the playful voice. Rung 2: one Gauntlet call in voice mode. Then the rest of the Dojo routine.",
                     l="Rewrite LinkedIn in clear English: headline, About section, photo (Part 04 has a headline idea)."),
             3: dict(c=sb(1),
                     s="Read S2 (listening). Use one label ('It sounds like…') in three real conversations today. Rung 2 again. Dojo routine.",
                     l="Build your Applications sheet (company, link, time zone, pay type, date sent, reply). Add 30 targets from LinkedIn Jobs, Upwork, Wellfound and Remotive."),
             4: dict(c=sa(2, "Why do fingers wrinkle in water?", body=True),
                     s="S2 drill: write 10 'what/how' questions for a coach's lead. Rung 3: five thoughtful public comments on US/UK founders' or creators' posts. Dojo routine.",
                     l="Read 5 real setter job posts and list what they ask for. Draft a one-page resume: skills, training, Dojo stats, the UK/US hours you cover."),
             5: dict(c=sb(2, "Add 10 questions to your idea bank."),
                     s="Listen back to this week's memos and write one fix. K1: record a 30-second selfie video, watch it once, delete it. Rung 3 again. Dojo routine.",
                     l="Watch Hormozi's CLOSER video (Sources, item 14) and note each step. Add 20 targets to your sheet."),
             6: dict(b="Check shorts 1–2: viewed vs swiped and average % viewed. Outline next week's three shorts (tickling, cold space, AI making things up)."),
             7: dict(r=REVIEW),
         }),
    dict(n=2, title="Buyer psychology and discovery",
         sales="Psychology + discovery (S3, S7). Rungs 4–5 (role-plays) + K2. Resume, master message and Loom script ready.",
         content="Shorts 3–5: tickling, cold space, AI making things up.",
         proof="2 recorded role-plays · 5 shorts",
         days={
             8: dict(c=sa(3, "Why can't you tickle yourself?", body=True),
                     s="Read S3 (buyer psychology). Write the value equation for something you own. " + DOJO,
                     l="Finish your resume as a PDF. Set LinkedIn to 'Open to work: remote, UK & US hours'."),
             9: dict(c=sb(3),
                     s="Read S7 (discovery). Write S, P, I and N questions for a coaching lead. Ask two implication questions in every Gauntlet call. Dojo routine.",
                     l="Write your master application message (Part 04) and three versions of it: coach, agency, SaaS. Read each aloud."),
             10: dict(c=sa(4, "How cold is space, really?"),
                      s="Gap drill: current state → future state → gap for two Gauntlet companies. Rung 4: WhatsApp role-play with a friend using the DM setter flow (Part 10).",
                      l="Draft your 2-minute Loom script: who you are, the hours you cover, why you, one proof, the ask. Read it aloud 3 times."),
             11: dict(c=sb(4),
                      s="Rung 5: voice role-play with a friend who raises objections; record it. K2: keep your camera on for the first 10 minutes of a call with a friend. Short Dojo session.",
                      l="Join 2 online sales communities where people do practice calls (search Discord, Reddit and Skool for SDR or setter groups). Introduce yourself."),
             12: dict(c=sa(5, "Why does AI make things up?"),
                      s="Score yesterday's role-play with the call scorecard (Part 10) and write 3 fixes. Repeat rung 4 or 5, whichever still scores above 2. Dojo routine.",
                      l="Add 30 targets. Sort the sheet: UK and US East Coast first; delete anything that needs West Coast hours or asks you to pay."),
             13: dict(b=sb(5, "Note which of shorts 1–4 held viewers best, and why.")),
             14: dict(r=REVIEW),
         }),
    dict(n=3, title="Objections, closing, first 30 applications",
         sales="Objections + closing (S9–S10). Rungs 6–7 + K3–K4. Master Loom recorded. 30 applications.",
         content="Shorts 6–8: yawning, dark space, how AI sees a photo.",
         proof="Portfolio live · 30 applications · 8 shorts",
         days={
             15: dict(c=sa(6, "Why is yawning contagious?", body=True),
                      s="Read S9 (objections). Three rounds of Objection Blitz. Rung 6: five no-pitch DMs to US/UK founders or creators, one real question each.",
                      l="Send 6 applications with your master message. Log each one."),
             16: dict(c=sb(6),
                      s="Read S10 (closing). Write a CLOSER walk-through for one Gauntlet company. Rung 6: five DMs. Dojo routine.",
                      l="Send 6 applications. Reply to any rung-6 replies as a conversation, with no pitch."),
             17: dict(c=sa(7, "Why is space dark if there are billions of stars?"),
                      s="K3: video role-play with a friend, you as the setter. Rung 6: five DMs. Dojo routine.",
                      l="Send 6 applications."),
             18: dict(c=sb(7),
                      s="K4 + rung 7: record your master Loom with the face bubble on for the first 10 seconds. Three takes at most; keep the best.",
                      l="Send 6 applications, each with your Loom. For your top 3, re-record only the first 10 seconds with their name."),
             19: dict(c=sa(8, "How does an AI 'see' a photo?"),
                      s="Write your own answers to the 7 objections in Part 10. Three rounds of Objection Blitz. Dojo routine.",
                      l="Send 6 applications with your Loom (30 this week). Answer every reply."),
             20: dict(b=sb(8)),
             21: dict(r=REVIEW, g=21),
         }),
    dict(n=4, title="Prospect yourself into a seat",
         sales="Prospecting + openers (S4–S5). Rung 8 + K5. 30 more applications + 50 direct pitches.",
         content="Shorts 9–10 + long video 1 (from your best short).",
         proof="60 applications + 50 pitches · interviews booked · 10 shorts + 1 long",
         days={
             22: dict(c=sa(9, "Why do we get goosebumps?", body=True),
                      s="Read S4 (prospecting). Write your hiring ICP: who needs a setter (coaches, agencies, SaaS) and what triggers hiring (a launch, new ads, a new offer). Dojo routine.",
                      l="6 applications + 10 direct pitches to small US/UK agencies or coaches (message + Loom)."),
             23: dict(c=sb(9),
                      s="Read S5 (openers). Write a DM, an email and a 15-second call opener that pitch you as a setter. Dojo routine.",
                      l="6 applications + 10 direct pitches."),
             24: dict(c=sa(10, "Why are planets round but asteroids lumpy?"),
                      s="Rung 8: a mock sales call with someone from your sales community. Score it with the call scorecard.",
                      l="6 applications + 10 direct pitches. One polite follow-up on week-3 applications with no reply."),
             25: dict(c=sb(10),
                      s="K5: a mock video interview. Practise 'Why should we hire you?', 'How do you handle rejection?' and 'Walk me through how you'd book a call.'",
                      l="6 applications + 10 direct pitches."),
             26: dict(c=ls(1),
                      s="Write answers to 10 common setter interview questions. Record yourself answering 3 and watch once. Dojo routine.",
                      l="6 applications + 10 direct pitches (60 applications and 50 pitches so far)."),
             27: dict(b=lm(1)),
             28: dict(r=REVIEW),
         }),
    dict(n=5, title="Interviews and the offer",
         sales="Rung 9 / K6: interviews. Vet offers (Part 11) and accept base or per-show pay. Gate on day 35.",
         content="Shorts 11–13. First analytics review (C11).",
         proof="Seat accepted, or Plan B ready · 13 shorts",
         days={
             29: dict(c=sa(11, "Can AI dream?"),
                      s="Rung 9 / K6: any interviews you've booked. None yet? Read S6 (qualifying), then the Dojo routine.",
                      l="Follow up every application older than 5 days. 6 new applications. Research the company behind each interview you have."),
             30: dict(c=sb(11),
                      s="Interviews. Vet every offer with the Part 11 checklist: pay type, lead source, call recordings, payment dates.",
                      l="6 applications + 10 direct pitches."),
             31: dict(c=sa(12, "Could you survive a minute in space without a suit?"),
                      s="Interviews. Read S11 and build your CRM sheet: name, source, stage, last touch, next step + date.",
                      l="6 applications + 10 direct pitches."),
             32: dict(c=sb(12, "Then your first analytics review (C11): which short held viewers longest, and why?"),
                      s="Compare offers with the ₹35K math (Part 02). Accept the best legitimate offer with base or per-show pay. Agree a start date and 19:00–23:00 IST shifts.",
                      l="Accepted? Read their scripts, offer page and FAQs. Not yet? 6 applications + 10 direct pitches."),
             33: dict(c=sa(13, "What happens to your brain if you don't sleep?", body=True),
                      s="Read S12 and set up your funnel sheet: touches → replies → conversations → qualified → booked → showed. Dojo routine.",
                      l="In a seat? Listen to 5 recorded conversations by the top rep and note their openers. Not yet? 6 applications + 10 direct pitches."),
             34: dict(b=sb(13)),
             35: dict(r=REVIEW, g=35),
         }),
    dict(n=6, title="First real conversations",
         sales="In a seat: rung 10, first shifts 19:00–23:00 IST, daily reviews. Not yet: Plan B, three pipelines.",
         content="Shorts 14–16. One animated diagram per short from now on.",
         proof="In a seat: first 50 real conversations · Not yet: 3 interviews booked · 16 shorts",
         noseat=PLAN_B,
         days={
             36: dict(c=sa(14, "Why can AI write essays but miscount letters in a word?", extra="From now on, add one animated diagram per short (Keynote Magic Move)."),
                      s="Rung 10, before your first shift: re-read the DM setter flow (Part 10) and S2. Warm up with one voice Gauntlet call.",
                      l=SHIFT + " First shift: ask questions, follow the team's script."),
             37: dict(c=sb(14), s=RP + "Then S6: qualify in the first three messages.", l=SHIFT),
             38: dict(c=sa(15, "Does time pass differently on Mars?"), s=RP + "Then S2: use one label per conversation.", l=SHIFT),
             39: dict(c=sb(15), s=RP + "Then S7: ask one implication question per conversation.", l=SHIFT),
             40: dict(c=sa(16, "Can you cry from only one eye?", body=True),
                      s=RP + "Then ask your manager for one piece of feedback and write it down.", l=SHIFT),
             41: dict(b=sb(16)),
             42: dict(r=REVIEW),
         }),
    dict(n=7, title="Volume",
         sales="Volume and manager feedback. Gate on day 45: no seat → take the best offer that meets the floor.",
         content="Shorts 17–18 + long video 2.",
         proof="In a seat: 150 conversations · Not yet: an offer accepted · 18 shorts + 2 long",
         noseat=PLAN_B,
         days={
             43: dict(c=sa(17, "Is there a centre of the universe?"),
                      s=RP + "Then S12: work out your reply, booked and show rates so far.",
                      l=SHIFT + " Hit the team's daily activity target."),
             44: dict(c=sb(17), s=RP + "Then S3: use honest loss framing ('What happens if nothing changes?').", l=SHIFT),
             45: dict(c=sa(18, "Why does AI need so much electricity?"),
                      s=RP + "Then S10: tighten your booking line (two specific times, in their time zone).", l=SHIFT, g=45),
             46: dict(c=sb(18), s=RP + "Then S9: list the 3 objections you heard most this week.", l=SHIFT),
             47: dict(c=ls(2), s=RP + "Then ask your manager what the top setter does differently.", l=SHIFT),
             48: dict(b=lm(2)),
             49: dict(r=REVIEW),
         }),
    dict(n=8, title="Find the leak",
         sales="Find the leakiest funnel stage and fix one thing. Rung 11 if your role includes calls.",
         content="Shorts 19–21. LinkedIn text posts twice a week.",
         proof="One documented fix · 21 shorts",
         noseat=AFTER_45,
         days={
             50: dict(c=sa(19, "Can you actually die of a broken heart?", body=True),
                      s="Find the leak: compare reply → booked → showed with last week. Pick the weakest stage and write one fix to test all week.",
                      l=SHIFT + " Apply this week's one fix."),
             51: dict(c=sb(19, "Post a 5-line LinkedIn text version."), s=RP + "Then Dojo Strategy Room on your weakest stage.", l=SHIFT),
             52: dict(c=sa(20, "Could we ever hear sound in space?"),
                      s=RP + "If your role includes calls: rung 11, your first voice call with a lead (ask a teammate to listen).", l=SHIFT),
             53: dict(c=sb(20), s=RP + "Then S5: rewrite your opening message and test it tonight against the old one.", l=SHIFT),
             54: dict(c=sa(21, "How does your phone recognise your face in the dark?", extra="Post a LinkedIn text version of short 20."),
                      s=RP + "Then measure: did this week's fix move the number? Write down the result.", l=SHIFT),
             55: dict(b=sb(21)),
             56: dict(r=REVIEW),
         }),
    dict(n=9, title="Qualify harder · day-60 check",
         sales="Qualification (S6). Gate on day 60: under ₹20K a month → add a second income line.",
         content="Shorts 22–24. Hook experiment: misconception vs question.",
         proof="Day-60 income pace known · 24 shorts",
         noseat=AFTER_45,
         days={
             57: dict(c=sa(22, "Why does time feel faster as you get older?", extra="Experiment: open with a misconception hook."),
                      s=RP + "Then S6: write your 3 disqualifying questions and use them tonight.", l=SHIFT),
             58: dict(c=sb(22), s=RP + "Then S7: one root-cause question per conversation.", l=SHIFT),
             59: dict(c=sa(23, "What would happen if you fell into a black hole?", extra="Experiment: open with a question hook."),
                      s=RP + "Then S11: give every open lead a next step and a date.", l=SHIFT),
             60: dict(c=sb(23), s="Gate day: add your income for the last 30 days and your guaranteed pay (see the gate). Then review yesterday's threads.", l=SHIFT, g=60),
             61: dict(c=sa(24, "What is a neural network, in plain English?", extra="Compare the two hook styles' average % viewed."),
                      s=RP + "Then S9: refresh your objection answers with this week's real wording.", l=SHIFT),
             62: dict(b=sb(24)),
             63: dict(r=REVIEW),
         }),
    dict(n=10, title="Objections in the wild",
         sales="Log and answer every objection you meet (S9). Rung 11 regularly. Fast-track check on day 70.",
         content="Shorts 25–26 + long video 3.",
         proof="Objection bank 15+ · 26 shorts + 3 long",
         noseat=AFTER_45,
         days={
             64: dict(c=sa(25, "How long can you survive without water?", body=True),
                      s="Objection bank: write every objection from last week's shifts and your best answer to each (S9).", l=SHIFT),
             65: dict(c=sb(25), s=RP + "Then rung 11: at least one voice call with a lead, if your role allows it.", l=SHIFT),
             66: dict(c=sa(26, "What's beyond the observable universe?"), s=RP + "Then add tonight's new objections to your bank.", l=SHIFT),
             67: dict(c=sb(26), s=RP + "Then S8: tie your booking pitch to the lead's own words.", l=SHIFT),
             68: dict(c=ls(3), s=RP + "Then count your objection bank (target 15+).", l=SHIFT),
             69: dict(b=lm(3)),
             70: dict(r=REVIEW, g=70),
         }),
    dict(n=11, title="Get paid, prove it",
         sales="Get paid and ask for a testimonial. Gate on day 75: under a ₹35K pace → add paid hours now.",
         content="Shorts 27–29 (29 is a remake of your best).",
         proof="₹35K-a-month pace · testimonial · 29 shorts",
         noseat=AFTER_45,
         days={
             71: dict(c=sa(27, "Can we control our emotions fully?", body=True),
                      s="Ask a satisfied lead or your manager for a two-line written testimonial. Then review yesterday's threads.", l=SHIFT),
             72: dict(c=sb(27), s=RP + "Then S13: check every claim you make in DMs is true and provable.", l=SHIFT),
             73: dict(c=sa(28, "Could AI ever be conscious, and how would we know?"), s=RP + "Then S10: practise the direct ask in 3 Gauntlet calls.", l=SHIFT),
             74: dict(c=sb(28), s=RP + "Then list what you'd need to learn to take closer calls.", l=SHIFT),
             75: dict(c="Short 29, sprint A: remake your best-performing short with a sharper hook and one new visual. Re-record the voice-over.",
                      s="Gate day: check your 30-day income and pace (see the gate). Then review yesterday's threads.", l=SHIFT, g=75),
             76: dict(b=sb(29)),
             77: dict(r=REVIEW),
         }),
    dict(n=12, title="Case study and the next step",
         sales="One-page case study with real numbers. Ask to shadow closer calls.",
         content="Shorts 30–31 + long video 4. Pick your lane for months 4–6.",
         proof="Case study written · 31 shorts + 4 long",
         noseat=AFTER_45,
         days={
             78: dict(c=sa(30, "Does AI actually understand anything?"),
                      s="Write your one-page case study: starting numbers → what you changed → results. It's your promotion or next-job document.", l=SHIFT),
             79: dict(c=sb(30), s=RP + "Then ask your manager about shadowing closer calls (rung 12 is next).", l=SHIFT),
             80: dict(c=sa(31, "Can AI predict the weather better than meteorologists?"), s=RP + "Then clean your CRM: every lead gets a next step and a date.", l=SHIFT),
             81: dict(c=sb(31), s=RP + "Then update LinkedIn with the real numbers from your case study.", l=SHIFT),
             82: dict(c=ls(4, "Then pick your lane for months 4–6: the topic with the most shares and saves."),
                      s=RP + "Then decide: setter → closer, or SDR → account executive? Write the next 3 skills you need.", l=SHIFT),
             83: dict(b=lm(4)),
             84: dict(r=REVIEW),
         }),
    dict(n=13, title="Day-90 review",
         sales="Day-90 review against the scoreboard; plan v4.",
         content="Shorts 32–33 from your comments.",
         proof="Day-90 scoreboard filled · 33 shorts · v4 plan",
         noseat=AFTER_45,
         days={
             85: dict(c=sa(32, "the best question from your comments"), s=RP + "Then a Dojo session on your weakest skill.", l=SHIFT),
             86: dict(c=sb(32), s=RP + "Then write the 3 things that moved your numbers most.", l=SHIFT),
             87: dict(c=sa(33, "part two of your best short"), s=RP + "Then list what you'll stop doing next quarter.", l=SHIFT),
             88: dict(c=sb(33), s=RP + "Then ask for feedback on what would get you promoted.", l=SHIFT),
             89: dict(c="Content review: list your top 3 and bottom 3 shorts and write why they differ (C11).",
                      s="Fill in the Day-90 scoreboard in your tracker: income, conversations, shorts, long videos, highest fear rung.", l=SHIFT),
             90: dict(b="Day 90 review: compare with the scoreboard, decide the split for the next 90 days, and ask me to read your tracker for v4.", g=90),
         }),
]

# US/UK public holidays inside a Nov–Feb run: (month-day, note). The tracker matches real dates.
HOLIDAYS = [
    ("11-26", "US Thanksgiving: US companies are off. Favour UK targets today."),
    ("12-24", "Christmas Eve: expect a short or no shift."),
    ("12-25", "Christmas Day: UK and US are off. Use the time for content."),
    ("12-26", "Boxing Day: the UK is off."),
    ("12-31", "New Year's Eve: expect a short or no shift."),
    ("01-01", "New Year's Day: UK and US are off. Use the time for content."),
]
