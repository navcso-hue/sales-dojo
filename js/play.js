"use strict";
// Play: Quick Maths & Reasoning, Rapid Fire objection blitz, Myth or Proven, Company X-Ray, Ad & Copy Lab.
// Loaded before app.js; nothing runs at load time.

let play = store.json("play", null) || { best: {}, count: {}, mathLevel: 1 };
const savePlay = () => store.setJson("play", play);

// ---------------------------------------------------------------- content
// Objection → a strong model answer (shown in offline practice and as a reference).
const OBJECTION_PAIRS = [
  ["I'm not interested.", "Fair enough, you weren't expecting my call. Can I ask one question to see if this is even relevant? Then you can hang up."],
  ["Just send me an email.", "Happy to. So it's actually useful, what's the one thing you'd want it to cover?"],
  ["Now's not a good time.", "No problem. Would it be a bad idea to book 15 minutes later this week, when it is?"],
  ["We're all set, thanks.", "Glad to hear it. Out of curiosity, what are you using today, and what's the one thing you'd change about it?"],
  ["How did you get my number?", "Fair question. It's from public business listings. I'm calling for one specific reason. Can I take 20 seconds to explain it?"],
  ["Call me next quarter.", "Will do. What changes next quarter that makes it a better time?"],
  ["I'm about to walk into a meeting.", "I'll be quick. When's a better two minutes: today at 4, or tomorrow morning?"],
  ["Take me off your list.", "Absolutely, I'll remove you right now. Thanks for telling me."],
  ["We already use someone for this.", "Makes sense, most companies your size do. What do you like most about them, and what would you change if you could?"],
  ["We do this in-house.", "Smart if the team has the capacity. How much of their week does it take, and what would they do with that time back?"],
  ["We just signed with one of your competitors.", "Congrats on getting it sorted. When that contract comes up, what would you want done differently?"],
  ["Our current system works fine.", "Good. 'Fine' usually means it isn't on fire. Where does it slow you down the most?"],
  ["It's too expensive.", "Compared to what? (pause) Setting price aside for a second, would this actually solve the problem?"],
  ["We don't have budget for this.", "Understood. If the problem costs more than the fix, where would budget usually come from, and who decides that?"],
  ["Your competitor is cheaper.", "They might be. What would make the difference worth paying for?"],
  ["Can you do it for half that?", "How am I supposed to do that and still deliver what you need? If budget's the issue, let's look at a smaller scope."],
  ["What's your cheapest plan?", "I'll tell you, but cheapest only helps if it fixes the problem. What's the one thing it has to do for you?"],
  ["Maybe next year.", "That's fine. What would need to be true next year that isn't true now?"],
  ["We're slammed right now.", "That's usually exactly why people talk to us. Is it a bad idea to grab 15 minutes when the rush calms down, say next Tuesday?"],
  ["We're in the middle of a restructure.", "Makes sense to wait on big changes. Once the new structure's in place, who will own this?"],
  ["Let's revisit after Black Friday.", "Fair. Is there anything about this Black Friday you're worried about, where getting ahead of it now would help?"],
  ["I'm not the decision-maker.", "Thanks for telling me. Who else would weigh in, and what would they need to see to take it seriously?"],
  ["I'd need to run it by my boss.", "Of course. What do you think they'll push back on? Let's make sure you've got the answer."],
  ["Procurement handles all of this.", "Got it. Before it reaches procurement, who decides whether it's worth solving? I'd value 15 minutes with them."],
  ["The board would never approve it.", "What would the board need to see to approve something like this?"],
  ["I've never heard of you.", "That's fair, we're not a household name. That's why I'm asking for 15 minutes, not a contract."],
  ["We got burned by an agency last year.", "It sounds like they over-promised. What happened? I'd rather know what to avoid than repeat it."],
  ["How do I know this will work for us?", "You shouldn't take my word for it. What would you need to see in a small pilot to know it's working?"],
  ["Do you have case studies in our industry?", "Yes. Which result would matter most to you, so I send the right one?"],
  ["AI makes mistakes. Our customers would hate it.", "That's a real concern. What would a mistake look like for you? Let's look at how we handle exactly that before you decide."],
  ["We don't really have that problem.", "Great. How do you handle it today? Most teams only spot it once they measure it."],
  ["We're growing fine without it.", "Congrats. As you keep growing, what's the next bottleneck?"],
  ["It's just not a priority.", "Understood. What is the priority right now? If this helps with that, it's worth a look. If not, I'll leave you alone."],
  ["My team won't use another tool.", "Fair, adoption kills most tools. What would it need to look like for your team to actually use it?"],
  ["Let me think about it.", "Of course. Which part are you unsure about? I'd rather help with that now than leave you guessing."],
  ["Send me a proposal and I'll take a look.", "Happy to. So it's worth your time, can we spend 10 minutes on what it must include and who else needs to see it?"],
  ["Sounds interesting, but I'm not sure.", "It sounds like something's holding you back. What is it?"],
  ["I'll get back to you.", "Great. So it doesn't slip, can we put 10 minutes in for Thursday to decide either way?"],
  ["We tried something like this and it didn't work.", "What went wrong last time? If it's the same thing, I'll tell you straight."],
  ["Why should I trust a cold caller?", "You shouldn't, yet. Give me 20 seconds to explain why I called, and you decide if it's worth more."],
];
const OBJECTIONS = OBJECTION_PAIRS.map(p => p[0]);
const MODEL_ANSWER = Object.fromEntries(OBJECTION_PAIRS);

const MYTHS = [
  { s: "Priming people with words about old age makes them walk more slowly: a solid, replicated finding.", t: false, why: "Large replication attempts failed; social priming is one of the best-known casualties of the replication crisis." },
  { s: "Nudges reliably produce large behaviour change across the board.", t: false, why: "After correcting for publication bias, the average nudge effect shrinks dramatically, and one reanalysis found no clear overall effect." },
  { s: "Brands grow mainly by winning more buyers (penetration), not by making existing buyers more loyal.", t: true, why: "This pattern shows up across many categories in Sharp's and the Ehrenberg-Bass Institute's data." },
  { s: "Small brands usually have fewer buyers, and those buyers are slightly less loyal (double jeopardy).", t: true, why: "A long-documented empirical law in marketing science." },
  { s: "Willpower is a limited fuel tank that runs out the more you use it (ego depletion).", t: false, why: "A 23-lab replication with over 2,000 participants found little to no effect." },
  { s: "Brain scans prove people relate to brands the way they relate to religion.", t: false, why: "Those popular neuromarketing claims were publicly rejected by dozens of neuroscientists." },
  { s: "Admitting a small weakness can make your strengths more believable.", t: true, why: "Two-sided messages that concede a minor drawback tend to increase credibility." },
  { s: "Light, occasional buyers make up a large share of most brands' sales.", t: true, why: "Sales are spread across a long tail of light buyers, which is why reach matters." },
  { s: "Most customers are loyal to just one brand in a category.", t: false, why: "Loyalty is typically spread across a repertoire of brands." },
  { s: "Social proof works better when the examples are similar to the person you're persuading.", t: true, why: "Similarity makes the proof feel relevant; it's a consistent finding in influence research." },
  { s: "A precise counter-offer (like $4,815) tends to be read as more considered than a round one ($5,000).", t: true, why: "Research on negotiation anchors finds precise numbers signal research and get smaller counter-moves." },
  { s: "Talking faster always makes you sound more confident to buyers.", t: false, why: "Rushing usually reads as nerves; a steady pace with pauses sounds more in control." },
  { s: "'Start with why' is a scientifically proven formula for business success.", t: false, why: "It's an appealing framework, but it isn't based on systematic evidence." },
  { s: "Signing an honesty pledge at the top of a form reliably reduces cheating.", t: false, why: "The well-known study was retracted after failed replications and data concerns." },
  { s: "In large B2B sales, questions about the consequences of a problem were linked to success in Rackham's research.", t: true, why: "Implication questions had the strongest link to success in his study of thousands of sales calls." },
  { s: "The rep who talks the most on a call usually wins the deal.", t: false, why: "Strong reps ask more and listen more; monologues usually hurt." },
];

// Correct option first; options are shuffled at runtime.
const COPY_LINES = [
  { line: "Join 1,200 clinics that stopped losing patients to voicemail.", o: ["Social proof", "Scarcity", "Risk reversal", "Identification"] },
  { line: "Only 4 onboarding spots left for November.", o: ["Scarcity", "Authority", "Social proof", "Contrast"] },
  { line: "Built by former air-traffic controllers who plan 10,000 routes a day.", o: ["Authority", "Reciprocity", "Scarcity", "Loss framing"] },
  { line: "Grab the free 2-minute audit. No call needed.", o: ["Reciprocity", "Scarcity", "Contrast", "Identification"] },
  { line: "Every week you wait, about 30 patients book somewhere else.", o: ["Loss framing", "Social proof", "Authority", "Reciprocity"] },
  { line: "Cut month-end close from 9 days to 4.", o: ["Specific, concrete outcome", "Scarcity", "Identification", "Authority"] },
  { line: "We re-plan every route at 5am from yesterday's real traffic.", o: ["Unique mechanism", "Social proof", "Scarcity", "Reciprocity"] },
  { line: "If your CPA doesn't drop in 60 days, we work free until it does.", o: ["Risk reversal (guarantee)", "Scarcity", "Authority", "Contrast"] },
  { line: "For founders who build systems, not chaos.", o: ["Identification", "Scarcity", "Risk reversal", "Social proof"] },
  { line: "Still chasing receipts every Friday?", o: ["Problem-aware hook", "Most-aware offer", "Authority", "Scarcity"] },
  { line: "Missed calls cost you $25k a month. Ringly costs $299.", o: ["Contrast (anchoring)", "Reciprocity", "Identification", "Social proof"] },
  { line: "You already agree missed calls are lost revenue. Here's the fix.", o: ["Commitment and consistency", "Scarcity", "Authority", "Unity"] },
  { line: "Ringly customers: add a second location this week for 20% off.", o: ["Most-aware offer", "Problem-aware hook", "Authority", "Identification"] },
  { line: "As a fellow family-run business, we know every customer counts.", o: ["Unity", "Scarcity", "Authority", "Contrast"] },
];
const WEAK_LINES = [
  "We are a leading provider of innovative solutions for businesses of all sizes.",
  "Our software helps you save time and money.",
  "I just wanted to reach out and see if maybe you'd be interested in a quick chat?",
  "We offer best-in-class quality and great customer service.",
  "Click here to learn more about our amazing product!",
  "Sorry to bother you, I know you're busy, but do you have a minute?",
  "Our platform leverages AI to optimise your workflows synergistically.",
  "We have lots of happy customers.",
  "Let me know if you're ever interested.",
  "Our prices are very competitive.",
  "We can do everything you need.",
  "Hope this email finds you well! Just following up on my last email.",
];

// ---------------------------------------------------------------- quick maths & reasoning
const rint = (a, b, step = 1) => a + step * Math.floor(Math.random() * (Math.floor((b - a) / step) + 1));
const money = n => "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });
const fmtn = (n, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString("en-US", { maximumFractionDigits: d });
const MATH = [
  { id: "margin", min: 1, make(L) {
    const P = L <= 1 ? 100 : rint(40, 400, L <= 2 ? 10 : 5), m = L <= 1 ? pick([40, 50]) : rint(25, 60, L <= 2 ? 5 : 1), d = L <= 1 ? pick([10, 20]) : rint(5, 25, L <= 2 ? 5 : 1);
    const cost = P * (1 - m / 100), np = P * (1 - d / 100), nm = ((np - cost) / np) * 100;
    return { label: "Discount vs margin", q: `A product sells for ${money(P)} at a ${m}% gross margin. You give ${d}% off. What's the new gross margin?`, answer: nm, tolAbs: 0.6, unit: "%", shown: `${fmtn(nm)}%`,
      explain: `Cost = ${money(cost)}. New price = ${money(np)}. Margin = (${money(np)} − ${money(cost)}) ÷ ${money(np)} = ${fmtn(nm)}%. A ${d}% discount cost ${fmtn(m - nm)} points of margin.` };
  } },
  { id: "units", min: 2, make() {
    const P = rint(50, 300, 10), C = Math.round((P * rint(40, 65)) / 100), U = rint(50, 400, 10), d = rint(5, 20, 5);
    const np = P * (1 - d / 100), need = Math.ceil((U * (P - C)) / (np - C));
    return { label: "Discount vs volume", q: `You sell ${U} units a month at ${money(P)} each (they cost you ${money(C)} each). With a ${d}% discount, how many units must you sell to make the same total profit?`, answer: need, tolAbs: 1, unit: "units", shown: String(need),
      explain: `Profit now = ${U} × ${money(P - C)} = ${money(U * (P - C))}. Discounted profit per unit = ${money(np - C)}. ${money(U * (P - C))} ÷ ${money(np - C)} ≈ ${need} units, that's ${fmtn((need / U - 1) * 100, 0)}% more volume.` };
  } },
  { id: "roi", min: 1, make(L) {
    const C = L <= 1 ? pick([1000, 2000, 5000, 10000]) : rint(1200, 20000, L <= 2 ? 100 : 10), R = Math.round(C * (L <= 1 ? pick([1.5, 2, 3]) : rint(110, 400) / 100)), roi = ((R - C) / C) * 100;
    return { label: "ROI", q: `A campaign cost ${money(C)} and brought in ${money(R)} in gross profit. What's the ROI?`, answer: roi, tolAbs: 0.6, unit: "%", shown: `${fmtn(roi)}%`, explain: `ROI = (return − cost) ÷ cost = (${money(R)} − ${money(C)}) ÷ ${money(C)} = ${fmtn(roi)}%.` };
  } },
  { id: "payback", min: 2, make() {
    const S = rint(1000, 12000, 500), F = rint(100, 600, 50), V = F + rint(200, 1500, 50), m = S / (V - F);
    return { label: "Payback", q: `A tool costs ${money(S)} to set up plus ${money(F)}/month. It saves the client ${money(V)}/month. How many months until the setup is paid back?`, answer: m, tolAbs: 0.15, unit: "months", shown: `${fmtn(m)} months`, explain: `Net saving = ${money(V)} − ${money(F)} = ${money(V - F)}/month. ${money(S)} ÷ ${money(V - F)} = ${fmtn(m)} months.` };
  } },
  { id: "cac", min: 1, make(L) {
    const N = L <= 1 ? pick([10, 20, 25, 50]) : rint(12, 180), X = L <= 1 ? N * pick([100, 200, 250]) : rint(2000, 40000, L <= 2 ? 500 : 50), v = X / N;
    return { label: "CAC", q: `You spent ${money(X)} on sales and marketing last month and won ${N} new customers. What's your customer acquisition cost?`, answer: v, tolRel: 0.01, tolAbs: 0.5, unit: "$", shown: money(v), explain: `CAC = spend ÷ new customers = ${money(X)} ÷ ${N} = ${money(v)}.` };
  } },
  { id: "ltv", min: 3, make() {
    const A = rint(50, 500, 10), g = rint(60, 90, 5), c = pick([2, 3, 4, 5, 8]), v = (A * (g / 100)) / (c / 100);
    return { label: "Lifetime value", q: `Customers pay ${money(A)}/month, gross margin is ${g}%, and ${c}% of customers churn each month. What's the lifetime gross profit per customer?`, answer: v, tolRel: 0.02, unit: "$", shown: money(v), explain: `Average lifetime = 1 ÷ ${c}% = ${fmtn(100 / c)} months. LTV = ${money(A)} × ${g}% × ${fmtn(100 / c)} = ${money(v)}.` };
  } },
  { id: "ltvcac", min: 3, make() {
    const ltv = rint(1200, 9000, 100), cac = rint(300, 3000, 50), x = ltv / cac;
    return { label: "LTV : CAC", q: `LTV is ${money(ltv)} and CAC is ${money(cac)}. What's the LTV:CAC ratio? (answer like 3.2)`, answer: x, tolAbs: 0.06, unit: "×", shown: `${fmtn(x)} : 1`, explain: `${money(ltv)} ÷ ${money(cac)} = ${fmtn(x)}. Around 3:1 is a common healthy benchmark; below 1 loses money on every customer.` };
  } },
  { id: "pipeline", min: 1, make(L) {
    const Q = L <= 1 ? pick([50000, 100000, 200000]) : rint(30000, 400000, L <= 2 ? 10000 : 1000), w = L <= 1 ? pick([20, 25, 50]) : rint(12, 40), p = Q / (w / 100);
    return { label: "Pipeline coverage", q: `Your quota is ${money(Q)} and your win rate is ${w}%. How much pipeline do you need?`, answer: p, tolRel: 0.01, unit: "$", shown: money(p), explain: `Pipeline = quota ÷ win rate = ${money(Q)} ÷ ${w}% = ${money(p)}, which is ${fmtn(100 / w)}× coverage.` };
  } },
  { id: "funnel", min: 1, make(L) {
    const D = L <= 1 ? pick([40, 50, 60]) : rint(30, 120, 5), c = L <= 1 ? 10 : rint(5, 18), b = L <= 1 ? pick([20, 25]) : rint(10, 35), m = D * (c / 100) * (b / 100) * 5;
    return { label: "Call funnel", q: `You make ${D} dials a day, ${c}% connect, and ${b}% of connects book a meeting. How many meetings in a 5-day week?`, answer: m, tolAbs: 0.15, unit: "meetings", shown: fmtn(m), explain: `${D} × ${c}% × ${b}% = ${fmtn(m / 5, 2)} meetings a day, × 5 = ${fmtn(m)}.` };
  } },
  { id: "dials", min: 3, make() {
    const M = rint(5, 20), c = rint(6, 15), b = rint(15, 35), perDial = (c / 100) * (b / 100), d = Math.ceil(M / (perDial * 5));
    return { label: "Reverse funnel", q: `You need ${M} meetings a week. ${c}% of dials connect and ${b}% of connects book. How many dials per day, over 5 days?`, answer: d, tolAbs: 1, unit: "dials", shown: String(d), explain: `Each dial books ${fmtn(perDial * 100, 2)}% of a meeting. ${M} ÷ ${fmtn(perDial, 4)} = ${fmtn(M / perDial, 0)} dials a week, ÷ 5 ≈ ${d} a day.` };
  } },
  { id: "ads", min: 2, make(L) {
    const spend = rint(1000, 20000, L <= 2 ? 500 : 50), cpm = rint(4, 25), imp = Math.round((spend / cpm) * 1000), ctr = rint(5, 30) / 10, clicks = Math.round((imp * ctr) / 100), rev = Math.round(spend * (rint(15, 60) / 10));
    const data = `You spent ${money(spend)}, got ${imp.toLocaleString("en-US")} impressions, ${clicks.toLocaleString("en-US")} clicks and ${money(rev)} in revenue.`;
    const which = pick(["cpm", "ctr", "cpc", "roas"]);
    if (which === "cpm") { const v = (spend / imp) * 1000; return { label: "Ad maths", q: `${data} What's the CPM?`, answer: v, tolRel: 0.02, unit: "$", shown: money(v), explain: `CPM = spend ÷ impressions × 1,000 = ${money(v)}.` }; }
    if (which === "ctr") { const v = (clicks / imp) * 100; return { label: "Ad maths", q: `${data} What's the click-through rate?`, answer: v, tolAbs: 0.05, unit: "%", shown: `${fmtn(v, 2)}%`, explain: `CTR = clicks ÷ impressions = ${fmtn(v, 2)}%.` }; }
    if (which === "cpc") { const v = spend / clicks; return { label: "Ad maths", q: `${data} What's the cost per click?`, answer: v, tolRel: 0.02, unit: "$", shown: money(v), explain: `CPC = spend ÷ clicks = ${money(v)}.` }; }
    const v = rev / spend; return { label: "Ad maths", q: `${data} What's the ROAS? (answer like 3.4)`, answer: v, tolAbs: 0.06, unit: "×", shown: `${fmtn(v)}×`, explain: `ROAS = revenue ÷ spend = ${fmtn(v)}.` };
  } },
  { id: "pct", min: 1, make(L) {
    const a = L <= 1 ? pick([50, 80, 100, 200]) : rint(40, 900, L <= 2 ? 10 : 1), b = Math.round(a * (L <= 1 ? pick([0.5, 0.75, 1.25, 1.5, 2]) : rint(40, 220) / 100)), v = ((b - a) / a) * 100;
    return { label: "% change", q: `Meetings went from ${a} last quarter to ${b} this quarter. What's the % change? (use − for a drop)`, answer: v, tolAbs: 0.6, unit: "%", shown: `${fmtn(v)}%`, explain: `(${b} − ${a}) ÷ ${a} = ${fmtn(v)}%.` };
  } },
  { id: "acv", min: 2, make() {
    const seats = rint(5, 150), price = rint(8, 90), disc = pick([0, 10, 15, 20]), v = seats * price * 12 * (1 - disc / 100);
    return { label: "Contract value", q: `A client buys ${seats} seats at ${money(price)} per seat per month on an annual contract${disc ? ` with ${disc}% off` : ""}. What's the annual contract value?`, answer: v, tolRel: 0.005, unit: "$", shown: money(v), explain: `${seats} × ${money(price)} × 12${disc ? ` × ${100 - disc}%` : ""} = ${money(v)}.` };
  } },
  { id: "commission", min: 4, make() {
    const Q = rint(50000, 200000, 5000), closed = Math.round((Q * rint(80, 150)) / 100 / 1000) * 1000, base = rint(6, 12), acc = base * 2;
    const within = Math.min(closed, Q), over = Math.max(0, closed - Q), v = (within * base) / 100 + (over * acc) / 100;
    return { label: "Commission", q: `Quota ${money(Q)}. You closed ${money(closed)}. You earn ${base}% up to quota and ${acc}% on everything above it. What's your commission?`, answer: v, tolRel: 0.005, unit: "$", shown: money(v), explain: `${money(within)} × ${base}%${over ? ` + ${money(over)} × ${acc}%` : ""} = ${money(v)}.` };
  } },
];
function startMaths() {
  const L = play.mathLevel, pool = MATH.filter(g => g.min <= L), limit = [45, 40, 35, 30, 25][L - 1];
  const steps = []; let last = null;
  while (steps.length < 8) {
    const g = pick(pool); if (g.id === last && pool.length > 1) continue; last = g.id;
    const q = g.make(L);
    steps.push({ kind: "num", limit, ...q, label: `Level ${L} · ${q.label}` });
  }
  runSession({ type: "play", mode: "maths", title: "Quick Maths & Reasoning", steps });
}

// ---------------------------------------------------------------- myth or proven
function startMyths() {
  const steps = shuffle(MYTHS).slice(0, 8).map(m => ({ kind: "mcq", label: "Myth or proven?", q: m.s, options: ["Backed by evidence", "Myth / not supported"], correct: m.t ? 0 : 1, why: m.why }));
  runSession({ type: "play", mode: "myths", title: "Myth or Proven", steps });
}

// ---------------------------------------------------------------- company x-ray
function factsLine(c) {
  const parts = [`${c.name} · ${[c.city, c.country].filter(Boolean).join(", ")} · ${c.industry}${c.size ? " · " + c.size : ""}`, c.what_they_sell];
  if (c.customers) parts.push("Customers: " + c.customers);
  if (c.channels) parts.push("Sells through: " + c.channels);
  for (const n of c.recent_news || []) parts.push(`${n.date}: ${n.fact}`);
  for (const s of c.signals || []) parts.push("Signal: " + s);
  return parts.join("\n");
}
async function startXray() {
  const c = pick(COMPANIES);
  show("lesson");
  $("#lessonTitle").textContent = "Company X-Ray"; $("#lessonBar").style.width = "0";
  $("#lessonBody").innerHTML = `<div class="card"><span class="spin"></span>Pulling up ${c.name}…</div>`;
  $("#lessonNext").hidden = true;
  const fits = validOffers(c), good = pick(fits), bad = shuffle(Object.keys(OFFERS).filter(o => !fits.includes(o))).slice(0, 3);
  const label = `${flagOf(c.country)} ${c.name}`;
  const steps = [mcqFrom(`Which offer fits ${c.name} best?`, [good, ...bad].map(id => `${OFFERS[id].vendor}: ${OFFERS[id].product}`),
    `${c.name} is a ${(c.industry || "business").toLowerCase()}${c.likely_pains?.[0] ? `; a likely pain: ${c.likely_pains[0].replace(/\.$/, "")}` : ""}. ${OFFERS[good].product} addresses that directly.`, { label, show: factsLine(c) })];
  try {
    const r = await generateJSON(`You write pattern-recognition quiz questions for sales reps, based ONLY on these real company facts:
${JSON.stringify(companyFacts(c))}

Write 4 multiple-choice questions that test reading the account like a top SDR:
1. the most likely current priority or pain, given the signals
2. which fact suggests the best timing to reach out, and why
3. which role to call first (a role, never a person's name)
4. the strongest opening angle for a cold call
Each question has exactly 4 options. Put the CORRECT option FIRST. Distractors must be plausible. Base everything on the facts; where you infer, the correct answer must be the most reasonable inference.
Return JSON only: {"questions":[{"q":"","options":["correct","","",""],"why":"one sentence"}]}`, 0.6);
    for (const q of (r.questions || []).slice(0, 4)) if (q.q && q.options?.length === 4) steps.push(mcqFrom(q.q, q.options, q.why, { label }));
  } catch (e) { logErr("x-ray questions", e); }
  const o = OFFERS[good];
  steps.push({ kind: "write", label, show: factsLine(c), prompt: `Write your 15-second cold-call opener for ${c.name}, selling ${o.vendor} (${o.product}).`,
    grader: ans => `You are a cold-calling coach. A rep wrote a 15-second cold-call opener for ${c.name} (${c.industry}, ${c.country}), selling ${o.vendor}: ${o.what}
Company facts: ${JSON.stringify(companyFacts(c))}
Opener: "${ans.replace(/"/g, "'")}"
Score 0-10 for relevance to this company's real situation, a clear reason for calling, brevity, and a specific ask. Return JSON only: {"score":0,"verdict":"one sentence","better":"a stronger opener the rep could say"}` });
  runSession({ type: "play", mode: "xray", title: `X-Ray: ${c.name}`, steps, from: "play" });
}

// ---------------------------------------------------------------- ad & copy lab
function startCopyLab() {
  if (!online()) {
    const steps = shuffle(COPY_LINES).slice(0, 6).map(x => mcqFrom("Which principle is this line using?", x.o, `“${x.line}” works through ${x.o[0].toLowerCase()}.`, { label: "Name the principle (offline round)", show: x.line }));
    return runSession({ type: "play", mode: "copy", title: "Ad & Copy Lab", steps });
  }
  const steps = shuffle(COPY_LINES).slice(0, 3).map(x => mcqFrom("Which principle is this line using?", x.o, `“${x.line}” works through ${x.o[0].toLowerCase()}.`, { label: "Name the principle", show: x.line }));
  const weak = pick(WEAK_LINES);
  steps.push({ kind: "write", label: "Fix the weak line", show: weak, prompt: "Rewrite it so it's specific, buyer-focused and strong.",
    grader: ans => `You are a direct-response copy chief. Weak line: "${weak}". The writer's rewrite: "${ans.replace(/"/g, "'")}". Score 0-10 for specificity, buyer focus, clarity and strength (Ogilvy, Schwartz and Hormozi principles). Return JSON only: {"score":0,"verdict":"one sentence","better":"your own stronger rewrite"}` });
  const c = pick(COMPANIES), o = OFFERS[pick(validOffers(c))];
  steps.push({ kind: "write", label: "Write a hook", show: `${c.name} (${c.industry}, ${c.country}). You sell ${o.vendor}: ${o.what}`, prompt: "Write a cold email subject line and first sentence.",
    grader: ans => `You are a cold-email expert. Target: ${c.name}, ${c.industry}, ${c.country}. Facts: ${c.what_they_sell}. Offer: ${o.vendor}: ${o.what}. The rep's subject line and first sentence: "${ans.replace(/"/g, "'")}". Score 0-10 for relevance, curiosity, brevity and no hype. Return JSON only: {"score":0,"verdict":"one sentence","better":"a stronger subject line and first sentence"}` });
  runSession({ type: "play", mode: "copy", title: "Ad & Copy Lab", steps });
}

// ---------------------------------------------------------------- results
const MODE_INFO = {
  maths: { name: "Quick Maths & Reasoning", desc: "Discounts, ROI, CAC, funnels, pipeline, ad maths. 8 questions against the clock.", max: null, run: startMaths },
  rapid: { name: "Rapid Fire: Objection Blitz", desc: "60 seconds of objections. Hold to answer out loud. Scored on every answer.", max: 30, run: () => openRapid() },
  myths: { name: "Myth or Proven", desc: "Spot the bluff: which popular sales and marketing claims hold up?", max: 8, run: startMyths },
  xray: { name: "Company X-Ray", desc: "Read a real company like a top SDR: fit, timing, who to call, the angle.", max: null, run: startXray, needsNet: true },
  copy: { name: "Ad & Copy Lab", desc: "Name the principle, fix a weak line, write a hook.", max: null, run: startCopyLab },
  mentor: { needsNet: true, name: "Mentors", desc: "Voice sessions with AI mentors modelled on Hormozi, Voss, Blount, Rackham, Dunford, Ogilvy, Sharp and Sutherland.", run: () => renderMentors(), label: () => `${play.count.mentor || 0} sessions` },
  debate: { needsNet: true, name: "1v1 Debate", desc: "Argue a sales or marketing motion out loud against an AI opponent. Judged on logic, evidence and rebuttal.", run: () => openDebate(), label: () => `${play.debates?.won || 0} wins` },
  strategy: { needsNet: true, name: "Strategy Room", desc: "A real company and a business case. Present your plan, then the CMO and CFO grill you.", run: () => openStrategy(), label: () => `${play.strategy?.approve || 0} approved` },
  warmup: { name: "Articulation Warm-up", desc: "60-second no-filler talk, say-it-stronger, your phrase bank, and the pen drill.", run: () => openWarmup(), label: () => (play.best.warmup != null ? `best ${play.best.warmup}/10` : "new") },
};
const VOICE_MODES = ["mentor", "debate", "strategy", "warmup"];
function recordPlay(mode, score) {
  play.count[mode] = (play.count[mode] || 0) + 1;
  const isBest = score > (play.best[mode] ?? -1);
  if (isBest) play.best[mode] = score;
  savePlay();
  return isBest;
}
function finishPlay(s) {
  let score = s.points, extra = "";
  if (s.mode === "myths") score = s.correct;
  if (s.mode === "maths") {
    const before = play.mathLevel;
    if (s.correct >= 7) play.mathLevel = Math.min(5, play.mathLevel + 1);
    else if (s.correct <= 3) play.mathLevel = Math.max(1, play.mathLevel - 1);
    if (play.mathLevel !== before) extra = play.mathLevel > before ? `Level up! Next round is level ${play.mathLevel}.` : `Next round drops to level ${play.mathLevel}.`;
  }
  const isBest = recordPlay(s.mode, score);
  const box = $("#lessonBody"); box.innerHTML = "";
  const card = el("div", "card stack");
  card.append(el("div", "note", MODE_INFO[s.mode].name), el("h2", null, `Score: ${score}${MODE_INFO[s.mode].max ? " / " + MODE_INFO[s.mode].max : ""}`));
  if (s.asked) card.append(el("p", null, `${s.correct}/${s.asked} right${s.freeScores.length ? ` · written answers ${round1(mean(s.freeScores))}/10` : ""}`));
  card.append(el("p", "big", `${isBest ? "New best! " : ""}+${s.xp} XP`));
  if (extra) card.append(el("p", null, extra));
  const again = el("button", "btn primary", "Play again"); again.onclick = () => MODE_INFO[s.mode].run();
  card.append(again);
  box.append(card);
  const btn = $("#lessonNext"); btn.hidden = false; btn.disabled = false; btn.textContent = "Done"; btn.onclick = () => openTab("play");
}
function renderPlay() {
  const list = $("#playList"); list.innerHTML = "";
  for (const [id, m] of Object.entries(MODE_INFO)) {
    if (id === VOICE_MODES[0]) list.append(el("h3", null, "Voice rooms"));
    const card = el("button", "card sc");
    const row = el("div", "row");
    const best = play.best[id];
    row.append(el("span", "co", m.name), el("span", "note", m.label ? m.label() : best != null ? `best ${best}${m.max ? "/" + m.max : ""}` : "new"));
    card.append(row, el("div", "who", m.desc));
    if (id === "maths") card.append(el("div", "note", `Level ${play.mathLevel} of 5`));
    const off = !online() && m.needsNet;
    if (off) { card.classList.add("off"); card.append(el("div", "note", "Needs internet")); }
    card.onclick = () => (off ? toast(`${m.name} needs internet. Quick Maths, Myth or Proven, Copy Lab and Rapid Fire practice work offline.`) : m.run());
    list.append(card);
  }
}

// ---------------------------------------------------------------- rapid fire: objection blitz
let rapid = null;
function openRapid() {
  rapid = null;
  $("#rapidBody").innerHTML = "";
  const intro = el("div", "card stack");
  intro.append(el("h2", null, "Objection Blitz"), el("p", null, "60 seconds. An objection appears; hold the button and answer it out loud, then let go for the next one. Short, calm answers win. You're scored on every answer at the end."));
  if (!online()) {
    intro.append(el("p", "note", "You're offline, so this is a practice round: answer each objection out loud, tap Next, and compare with a model answer at the end. Scoring comes back online."));
    const p = el("button", "btn primary", "Start practice"); p.onclick = () => startRapid(false, true);
    intro.append(p);
  } else {
    const v = el("button", "btn primary", "Start with voice"); v.onclick = () => startRapid(true);
    const t = el("button", "btn", "Start by typing"); t.onclick = () => startRapid(false);
    intro.append(v, t);
  }
  $("#rapidBody").append(intro);
  show("rapid");
}
async function startRapid(voice, practice = false) {
  rapid = { voice, practice, objections: shuffle(OBJECTIONS).slice(0, 10), i: 0, answers: [], t0: 0, timer: null, rec: null, holding: false, done: false };
  if (voice) {
    audio.unlock();
    rapid.rec = new Recorder(audio);
    try { await rapid.rec.open(); }
    catch (e) { logErr("rapid mic", e); rapid.voice = false; rapid.rec = null; }
  }
  rapid.t0 = performance.now();
  rapid.timer = setInterval(rapidTick, 200);
  renderRapid();
}
function rapidTick() {
  const left = 60 - (performance.now() - rapid.t0) / 1000;
  const t = $("#rapidTimer"); if (t) t.textContent = `${Math.max(0, Math.ceil(left))}s`;
  if (left <= 0 && !rapid.holding) endRapid();
}
function renderRapid() {
  const box = $("#rapidBody"); box.innerHTML = "";
  if (rapid.i >= rapid.objections.length) return endRapid();
  const timer = el("div", "timerbig", `${Math.max(0, Math.ceil(60 - (performance.now() - rapid.t0) / 1000))}s`); timer.id = "rapidTimer";
  box.append(timer, el("div", "note", `Objection ${rapid.i + 1} of ${rapid.objections.length}`));
  box.append(el("div", "card objcard", `“${rapid.objections[rapid.i]}”`));
  if (rapid.practice) {
    const next = el("button", "holdbtn", "Said it out loud: next");
    next.onclick = () => { rapid.answers.push({ objection: rapid.objections[rapid.i], text: "" }); rapid.i++; renderRapid(); };
    box.append(next);
    return;
  }
  if (rapid.voice) {
    const hold = el("button", "holdbtn", "Hold to answer");
    const meter = el("div", "meter"); const fill = el("i"); meter.append(fill);
    rapid.rec.onLevel = rms => { fill.style.width = Math.min(100, rms * 900) + "%"; };
    const down = e => { e.preventDefault(); if (rapid.done) return; rapid.holding = true; hold.classList.add("on"); hold.textContent = "Listening… let go when done"; rapid.rec.start(); };
    const up = e => { e.preventDefault(); if (!rapid.holding) return; rapid.holding = false; const clip = rapid.rec.stop(); rapid.answers.push({ objection: rapid.objections[rapid.i], wav: clip.sec > 0.4 ? clip.wav : null }); rapid.i++; renderRapid(); };
    hold.addEventListener("pointerdown", down); hold.addEventListener("pointerup", up); hold.addEventListener("pointercancel", up); hold.addEventListener("pointerleave", e => rapid.holding && up(e));
    hold.oncontextmenu = e => e.preventDefault();
    box.append(hold, meter);
  } else {
    const inp = document.createElement("input"); inp.placeholder = "Your answer, then Enter"; inp.autocomplete = "off";
    const go = () => { rapid.answers.push({ objection: rapid.objections[rapid.i], text: inp.value.trim() }); rapid.i++; renderRapid(); };
    inp.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    const b = el("button", "btn primary", "Next"); b.onclick = go; b.style.marginTop = "10px";
    box.append(inp, b);
    setTimeout(() => inp.focus(), 50);
  }
  const skip = el("button", "btn small", "Skip"); skip.style.marginTop = "12px";
  skip.onclick = () => { rapid.answers.push({ objection: rapid.objections[rapid.i], text: "" }); rapid.i++; renderRapid(); };
  box.append(skip);
}
async function endRapid() {
  if (!rapid || rapid.done) return;
  rapid.done = true;
  clearInterval(rapid.timer);
  if (rapid.rec) rapid.rec.close();
  const box = $("#rapidBody");
  if (rapid.practice) {
    box.innerHTML = "";
    box.append(el("div", "card stack", ""));
    box.firstChild.append(el("h2", null, `Practice done: ${rapid.answers.length} objections`), el("p", null, "Compare each with a model answer. Say the model answer out loud once too."));
    for (const a of rapid.answers) {
      const c = el("div", "card stack"); c.style.marginTop = "10px";
      c.append(el("div", "q", `“${a.objection}”`), el("div", "ins", MODEL_ANSWER[a.objection] || ""));
      box.append(c);
    }
    return addRapidButtons(box);
  }
  const answered = rapid.answers.filter(a => a.wav || a.text);
  if (!answered.length) { box.innerHTML = ""; box.append(el("div", "card", "No answers recorded. Try again, and hold the button while you speak.")); addRapidButtons(box); return; }
  box.innerHTML = `<div class="card"><span class="spin"></span>Scoring your answers…</div>`;
  const parts = [{ text: `You are a sales coach scoring a rapid-fire objection drill. Each numbered item has an objection and the rep's answer: an audio clip, typed text, or nothing. For audio, transcribe the answer verbatim first.
Score each 0-3: 0 = no answer, argues, or caves; 1 = weak; 2 = decent; 3 = excellent (acknowledges, reframes or asks a smart question, and keeps the conversation moving toward a next step).
Return JSON only: {"items":[{"n":1,"transcript":"","score":0,"better":"a strong one-line answer"}]}` }];
  rapid.answers.forEach((a, i) => {
    parts.push({ text: `Item ${i + 1}. Objection: "${a.objection}". (Reference answer, for calibration only: "${MODEL_ANSWER[a.objection] || ""}") Rep's answer: ${a.wav ? "(audio clip follows)" : a.text ? `"${a.text.replace(/"/g, "'")}"` : "(none)"}` });
    if (a.wav) parts.push({ inlineData: { mimeType: "audio/wav", data: a.wav } });
  });
  let items = null;
  try {
    const raw = await generate({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.3 } });
    items = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")).items;
  } catch (e) { logErr("rapid scoring", e); }
  box.innerHTML = "";
  if (!items) { box.append(el("div", "card err", "Couldn't score this round (Google busy?). Try again in a minute.")); addRapidButtons(box); return; }
  const total = items.reduce((a, x) => a + clamp(Number(x.score) || 0, 0, 3), 0);
  const isBest = recordPlay("rapid", total);
  learn.xp += total * 2; saveLearn();
  const head = el("div", "card stack");
  head.append(el("h2", null, `Score: ${total} / ${rapid.answers.length * 3}`), el("p", "big", `${isBest ? "New best! " : ""}+${total * 2} XP`));
  box.append(head);
  rapid.answers.forEach((a, i) => {
    const it = items.find(x => Number(x.n) === i + 1) || {};
    const sc = clamp(Number(it.score) || 0, 0, 3);
    const c = el("div", "card stack"); c.style.marginTop = "10px";
    c.append(el("div", "row2", ""), el("div", "q", `“${a.objection}”`));
    c.firstChild.append(el("span", "stars", "★".repeat(sc) + "☆".repeat(3 - sc)));
    c.append(el("p", null, `You: ${it.transcript || a.text || "(no answer)"}`));
    if (it.better) c.append(el("div", "ins", `Better: “${it.better}”`));
    box.append(c);
  });
  addRapidButtons(box);
}
function addRapidButtons(box) {
  const again = el("button", "btn primary", "Play again"); again.style.marginTop = "14px"; again.onclick = openRapid;
  const done = el("button", "btn", "Done"); done.style.marginTop = "10px"; done.onclick = () => openTab("play");
  box.append(again, done);
}
function leaveRapid() {
  if (rapid) { rapid.done = true; clearInterval(rapid.timer); if (rapid.rec) rapid.rec.close(); }
  openTab("play");
}
