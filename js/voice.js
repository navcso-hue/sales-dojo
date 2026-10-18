"use strict";
// Voice rooms (mentors, 1v1 debate, strategy room) and the articulation warm-up.
// Rooms reuse the Gauntlet's Live engine; loaded before app.js, nothing runs at load time.

const MENTORS = [
  { id: "hormozi", name: "Alex Hormozi", voice: "Orus", known: "offers, value and lead generation",
    style: "Blunt, direct, numbers-first. Short punchy sentences. Challenges excuses, pushes volume and simple maths. Uses plain analogies.",
    ideas: "Grand Slam Offer, the value equation (dream outcome × likelihood ÷ time × effort), starving crowd, charge more, guarantees and bonuses, Core Four lead channels, lead magnets, Rule of 100, More-Better-New, ACA for warm outreach.", books: "$100M Offers, $100M Leads" },
  { id: "voss", name: "Chris Voss", voice: "Charon", known: "negotiation and objections",
    style: "Calm, slow, warm late-night-radio voice. Uses labels and calibrated how/what questions on the rep. Patient, curious, never pushy.",
    ideas: "tactical empathy, mirroring, labelling, accusation audits, no-oriented questions, getting to 'that's right', calibrated questions, Ackerman bargaining, the late-night DJ voice.", books: "Never Split the Difference" },
  { id: "blount", name: "Jeb Blount", voice: "Fenrir", known: "prospecting and cold calls",
    style: "High energy, no excuses, practical drill-sergeant warmth. Talks about discipline and daily habits.",
    ideas: "prospecting every day, the 30-Day Rule, golden hours, balanced prospecting, the five-step phone framework, asking confidently and shutting up, turning brush-offs with a ledge, emotional discipline.", books: "Fanatical Prospecting" },
  { id: "rackham", name: "Neil Rackham", voice: "Iapetus", known: "discovery and large-sale research",
    style: "Measured, thoughtful researcher. Evidence-led, precise, a little dry. Asks what the data says.",
    ideas: "SPIN (situation, problem, implication, need-payoff), implied vs explicit needs, benefits vs advantages, advances vs continuations, preventing objections, small vs large sales.", books: "SPIN Selling" },
  { id: "dunford", name: "April Dunford", voice: "Kore", known: "positioning and sales pitches",
    style: "Practical, friendly, sharp. Cuts through vague messaging fast. Uses B2B examples.",
    ideas: "positioning as context, competitive alternatives, unique attributes, attributes to value, best-fit customers, market category, trends used carefully, pitches that start from the buyer's alternatives.", books: "Obviously Awesome, Sales Pitch" },
  { id: "ogilvy", name: "David Ogilvy", voice: "Algenib", known: "advertising and copy",
    style: "Witty, erudite, confident, a little old-school. Insists on research, specifics and headlines that sell.",
    ideas: "research before writing, headlines do most of the work, specific facts beat adjectives, respect the consumer's intelligence, test everything, brand image built over time.", books: "Ogilvy on Advertising, Confessions of an Advertising Man" },
  { id: "sharp", name: "Byron Sharp", voice: "Schedar", known: "evidence-based marketing",
    style: "Contrarian, evidence-obsessed, gently mocking of marketing myths. Asks for the data.",
    ideas: "growth through penetration, double jeopardy, mental and physical availability, category entry points, distinctive assets over differentiation, reach light buyers, polygamous loyalty.", books: "How Brands Grow" },
  { id: "sutherland", name: "Rory Sutherland", voice: "Sadaltager", known: "behavioural creativity",
    style: "Playful, erudite, full of surprising reframes and odd examples. Argues logic is overrated in persuasion.",
    ideas: "perception beats reality, reframing value, costly signalling, psycho-logic, small changes with big perceived effects, why the 'irrational' choice is often sensible.", books: "Alchemy" },
];
const MOTIONS = [
  "Discounting to hit quarter-end targets is smart business.", "Cold calling is dead.", "Brands should target their heaviest buyers, not everyone.",
  "Email beats the phone for booking meetings.", "Sales reps should never reveal price on the first call.", "Being liked matters more than being right in sales.",
  "Free trials hurt more than they help.", "AI SDRs will replace human SDRs within five years.", "Long-form copy outsells short copy.",
  "Startups should hire sales before marketing.", "A great product sells itself.", "Brand building is a waste of money for small businesses.",
  "Commission-only pay makes better salespeople.", "You should never accept the first offer in a negotiation.", "Founders should do all early sales themselves.",
  "Social selling on LinkedIn beats outbound calling.",
];
const TALK_TOPICS = [
  "Explain what an SDR does to a 10-year-old.", "Pitch your favourite book as if it were a product.", "Describe the best salesperson you've ever met.",
  "Convince me to try your favourite food.", "Explain why some ads work and others don't.", "Tell me about a time you changed someone's mind.",
  "Describe your ideal workday from start to finish.", "Explain how you'd get your first client tomorrow.", "Argue for or against working from home.",
  "Explain the value equation in your own words.", "Describe a product you love and why it's priced right.", "Tell me what makes a great cold call opener.",
];

// ---------------------------------------------------------------- generic voice room
let room = null;
function openRoom(cfg) {
  room = { cfg, turns: [], started: 0, timer: null, ended: false, stats: freshStats(), live: null, meterEl: $("#roomMeter") };
  newDiag({ callType: cfg.title, level: "-", mode: "voice room" });
  $("#roomTitle").textContent = cfg.title;
  const brief = $("#roomBrief"); brief.innerHTML = "";
  for (const [k, v] of cfg.brief) { brief.append(el("div", "k", k)); brief.append(v instanceof Node ? v : el("div", "v", v)); }
  $("#roomBubbles").innerHTML = ""; $("#roomErr").textContent = ""; $("#roomResult").innerHTML = "";
  $("#roomTimer").textContent = "0:00"; $("#roomMeter").style.width = "0";
  $("#roomStart").hidden = false; $("#roomStart").disabled = !!cfg.notReady; $("#roomStart").textContent = cfg.startLabel || "Start";
  $("#roomEnd").hidden = true; $("#roomExtra").innerHTML = "";
  if (cfg.extra) $("#roomExtra").append(cfg.extra);
  $("#roomStatus").innerHTML = cfg.hint || "Tap <b>Start</b> and talk normally. Earphones work best.";
  show("room");
}
function roomText(who, text) {
  const last = room.turns[room.turns.length - 1];
  if (last && last.who === who && !last.closed) { last.text += text; last.el.lastChild.textContent = last.text; }
  else {
    if (last) last.closed = true;
    const e = el("div", `b ${who}`);
    e.append(el("span", "who", who === "you" ? "You" : room.cfg.otherName), el("span", null, text));
    $("#roomBubbles").append(e);
    room.turns.push({ who, text, el: e, closed: false });
  }
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}
async function startRoom() {
  const r = room; const stale = () => r !== room || r.ended;
  if (!online()) { $("#roomErr").textContent = "Voice rooms need internet."; return; }
  $("#roomStart").disabled = true; $("#roomErr").textContent = ""; $("#roomExtra").innerHTML = "";
  audio.unlock();
  $("#roomStatus").innerHTML = '<span class="spin"></span>Allow the microphone when asked…';
  try { await audio.startMic(); }
  catch (e) { if (stale()) return; $("#roomErr").textContent = logErr("mic", e) + ". Allow microphone access, then try again."; $("#roomStart").disabled = false; return; }
  if (stale()) { audio.stopMic(); return; }
  player = new Player(audio.ctx);
  audio.onChunk = (i16, rms) => onMicChunk(i16, rms, r);
  const model = store.get("liveModel", "gemini-3.8-live");
  diag.liveModel = model; diag.voice = r.cfg.voice;
  $("#roomStatus").innerHTML = '<span class="spin"></span>Connecting…';
  r.live = new LiveCall({
    model, voice: r.cfg.voice, system: r.cfg.system,
    onAudio: b64 => {
      const m = r.stats;
      if (m.newTurn) { m.newTurn = false; if (m.awaitingReply && m.lastVoice) { const l = Math.round(performance.now() - m.lastVoice); if (l > 150 && l < 15000) diag.latencies.push(l); } m.awaitingReply = false; }
      player.play(b64);
      $("#roomStatus").innerHTML = `<b>${r.cfg.otherName}</b> is talking…`;
    },
    onText: roomText,
    onInterrupted: () => { player.flush(); r.stats.newTurn = true; },
    onTurnComplete: () => { r.stats.newTurn = true; const t = r.turns[r.turns.length - 1]; if (t) t.closed = true; $("#roomStatus").textContent = "Your turn."; },
    onClose: info => { if (!r.ended) endRoom(`line dropped (${info})`); },
  });
  try { await r.live.connect(); }
  catch (e) { audio.stopMic(); if (stale()) return; $("#roomErr").textContent = logErr("live connect", e); $("#roomStart").disabled = false; return; }
  if (stale()) { r.live.close(); audio.stopMic(); return; }
  r.live.sendText(r.cfg.opener);
  r.started = performance.now();
  r.timer = setInterval(() => {
    const s = Math.floor((performance.now() - r.started) / 1000);
    $("#roomTimer").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    if (s >= (r.cfg.maxSec || 480)) endRoom("time limit reached");
  }, 500);
  $("#roomStart").hidden = true; $("#roomEnd").hidden = false;
  keepAwake();
}
async function endRoom(reason) {
  const r = room;
  if (!r || r.ended) return;
  r.ended = true; clearInterval(r.timer);
  if (r.live) r.live.close();
  if (player) player.flush();
  audio.stopMic(); audio.suspend();
  try { wakeLock && (await wakeLock.release()); } catch {}
  diag.endReason = reason || "you ended it";
  $("#roomEnd").hidden = true;
  const transcript = r.turns.map(t => `${t.who === "you" ? "REP" : r.cfg.otherTag || "OTHER"}: ${t.text.trim()}`).join("\n");
  const box = $("#roomResult"); box.innerHTML = "";
  if (!r.turns.some(t => t.who === "you")) { box.append(el("div", "card", "No speech from you was captured, so there's nothing to review.")); return roomDoneButton(box); }
  if (!r.cfg.judge) return roomDoneButton(box);
  box.append(el("div", "card", "")); box.firstChild.innerHTML = '<span class="spin"></span>Reviewing…';
  let j = null;
  try { j = await generateJSON(r.cfg.judge(transcript, localMetrics(r)), 0.4); } catch (e) { logErr("room judge", e); }
  box.innerHTML = "";
  if (!j) box.append(el("div", "card err", "Couldn't review this one (Google busy?). The transcript is above."));
  else r.cfg.renderResult(j, box);
  roomDoneButton(box);
  window.scrollTo({ top: box.offsetTop - 20, behavior: "smooth" });
}
function roomDoneButton(box) {
  const again = el("button", "btn primary", "Go again"); again.style.marginTop = "14px"; again.onclick = () => room.cfg.again();
  const done = el("button", "btn", "Done"); done.style.marginTop = "10px"; done.onclick = () => openTab(room.cfg.backTo || "play");
  box.append(again, done);
}
function leaveRoom() {
  if (room && room.started && !room.ended) return endRoom();
  if (room) { room.ended = true; clearInterval(room.timer); if (room.live) room.live.close(); audio.stopMic(); audio.suspend(); }
  openTab(room?.cfg.backTo || "play");
}
// Shared result rendering: a headline badge, score bars and text blocks.
function renderScores(box, scores, labels) {
  const sc = el("div", "card scores");
  for (const [k, name] of Object.entries(labels)) {
    const v = clamp(Number(scores?.[k] ?? 0), 0, 10);
    const bar = el("div", "bar"), fill = el("i"); fill.style.width = v * 10 + "%"; fill.style.background = scoreColor(v); bar.append(fill);
    sc.append(el("span", null, name), bar, el("span", "numv", String(v)));
  }
  box.append(el("h3", null, "Scores"), sc);
}
function textBlock(box, title, text, cls) { if (!text) return; box.append(el("h3", null, title)); box.append(el("div", "card" + (cls ? " " + cls : ""), text)); }
function listBlock(box, title, items) { if (!items?.length) return; box.append(el("h3", null, title)); const c = el("div", "card"); const ul = el("ul", "plain"); items.forEach(x => ul.append(el("li", null, x))); c.append(ul); box.append(c); }

// ---------------------------------------------------------------- mentors
function renderMentors() {
  const list = $("#mentorList"); list.innerHTML = "";
  const last = calls.filter(c => c.transcript && c.judge).slice(-1)[0];
  for (const m of MENTORS) {
    const card = el("div", "card stack");
    card.append(el("div", "co", m.name), el("div", "note", `AI mentor modelled on their public work · ${m.known}`));
    const row = el("div", "chips");
    const ask = el("button", "btn small", "Ask anything"); ask.onclick = () => openMentor(m, "ask");
    const teach = el("button", "btn small", "Teach me"); teach.onclick = () => openMentor(m, "teach");
    row.append(ask, teach);
    if (last) { const rv = el("button", "btn small", "Review my last call"); rv.onclick = () => openMentor(m, "review", last); row.append(rv); }
    card.append(row);
    list.append(card);
  }
  const notes = (play.mentorNotes || []).slice(-5).reverse();
  const nb = $("#mentorNotes"); nb.innerHTML = "";
  if (notes.length) {
    nb.append(el("h3", null, "Your mentor notes"));
    for (const n of notes) { const c = el("div", "card stack"); c.style.marginTop = "10px"; c.append(el("div", "note", `${n.mentor} · ${n.date}`)); const ul = el("ul", "plain"); (n.takeaways || []).forEach(t => ul.append(el("li", null, t))); c.append(ul); if (n.action) c.append(el("div", "ins", "Do today: " + n.action)); nb.append(c); }
  }
  show("mentors");
}
function openMentor(m, kind, lastCall) {
  const first = m.name.split(" ")[0];
  let task = "Answer whatever the rep asks about sales, marketing or their career, through your lens. Ask them a question back to make them think.";
  let opener = "(The rep joins the call. Greet them in one short sentence and ask what they want to work on.)";
  if (kind === "teach") {
    task = "Teach the rep one of your core ideas that would most help an SDR. Explain it in plain words with one concrete example, then quiz them: ask them to apply it to a situation and react to their answer. Keep going idea by idea.";
    opener = "(The rep joins. Greet them briefly and start teaching your first idea.)";
  }
  if (kind === "review") {
    task = `Review the rep's most recent practice call through your lens. Be specific: quote what they said, say what you'd have done, and give one drill.
THE CALL (${CALL_TYPES[lastCall.type]?.label}, level ${lastCall.level}, ${lastCall.companyName}):
${lastCall.transcript.slice(0, 4000)}
JUDGE SUMMARY: ${lastCall.judge?.outcome_reason || ""}`;
    opener = "(The rep joins. Greet them in one sentence and start with the single biggest thing you noticed in their call.)";
  }
  openRoom({
    title: `${m.name} (AI mentor)`, otherName: first, otherTag: m.name.toUpperCase(), voice: m.voice, maxSec: 900, backTo: "play",
    brief: [["Mentor", `${m.name} · ${m.known}`], ["Session", kind === "ask" ? "Ask anything" : kind === "teach" ? "Teach me" : `Review of your ${lastCall.companyName} call`], ["Note", "An AI coach modelled on their books and public talks, not the real person."]],
    system: `You are an AI mentor modelled on ${m.name}'s publicly known ideas, books and speaking style, coaching a junior sales rep (an SDR) by voice. You are not the real ${m.name}; if asked, say you're an AI coach based on their public work.
STYLE: ${m.style}
YOUR CORE IDEAS (from ${m.books}): ${m.ideas}
TASK: ${task}
RULES: Speak in short turns (2–4 sentences). Be conversational and specific. Ground advice in your ideas and name the idea you're using. Never invent private facts, quotes or personal stories about the real person. English only.`,
    opener, again: () => openMentor(m, kind, lastCall),
    judge: transcript => `Summarise this mentoring session for the rep's notes. Transcript:
${transcript}
Return JSON only: {"takeaways":["3 short, specific takeaways"],"action":"one concrete thing to do today"}`,
    renderResult: (j, box) => {
      listBlock(box, "Takeaways", j.takeaways);
      textBlock(box, "Do today", j.action, "ins");
      play.mentorNotes = [...(play.mentorNotes || []), { mentor: m.name, date: todayStr(), takeaways: j.takeaways, action: j.action }].slice(-30);
      recordPlay("mentor", (play.count.mentor || 0) + 1);
    },
  });
}

// ---------------------------------------------------------------- 1v1 debate
function openDebate(motion = pick(MOTIONS), side = pick(["for", "against"]), opp = pick(MENTORS)) {
  const extra = el("div", "chips");
  const b1 = el("button", "btn small", "New motion"); b1.onclick = () => openDebate(pick(MOTIONS.filter(x => x !== motion)), side, opp);
  const b2 = el("button", "btn small", "Switch side"); b2.onclick = () => openDebate(motion, side === "for" ? "against" : "for", opp);
  const b3 = el("button", "btn small", "New opponent"); b3.onclick = () => openDebate(motion, side, pick(MENTORS.filter(x => x !== opp)));
  extra.append(b1, b2, b3);
  const oppSide = side === "for" ? "against" : "for";
  openRoom({
    title: "1v1 Debate", otherName: opp.name.split(" ")[0], otherTag: "OPPONENT", voice: opp.voice, maxSec: 420, backTo: "play", extra,
    brief: [["Motion", motion], ["You argue", side === "for" ? "FOR the motion" : "AGAINST the motion"], ["Opponent", `${opp.name} (AI, argues ${oppSide})`], ["Format", "They open, then you alternate: three rounds each, about 30 seconds per turn. A judge scores you at the end."]],
    system: `You are an AI debater modelled on ${opp.name}'s public ideas and style (${opp.style}) in a live voice debate with a sales rep.
MOTION: "${motion}". You argue ${oppSide.toUpperCase()} the motion; the rep argues ${side.toUpperCase()}.
FORMAT: You open with a sharp argument of about 20 seconds. Then the rep responds. Alternate. Each of your turns: under 30 seconds, directly rebut the rep's last point, then add one new point. Use evidence and examples, ideally from your known ideas (${opp.ideas}). Be tough but fair; don't concede easily. After the rep's third response, give a one-sentence closing and say "Over to the judge." Never invent fake statistics; say "in my experience" or name the idea instead. English only.`,
    opener: "(The debate starts now. Give your opening argument.)",
    again: () => openDebate(pick(MOTIONS), pick(["for", "against"]), pick(MENTORS)),
    judge: (transcript, m) => `You judge a 1v1 sales debate. Motion: "${motion}". The REP argued ${side}; the OPPONENT argued ${oppSide}.
TRANSCRIPT:
${transcript}
Rep speech metrics: ${m.wpm ? m.wpm + " wpm, " : ""}${m.fillers} possible fillers.
Judge only the REP's performance against the opponent. Return JSON only:
{"winner":"rep|opponent|draw","summary":"one sentence","scores":{"logic":0,"evidence":0,"rebuttal":0,"delivery":0,"persuasion":0},"best_point":"the rep's strongest point, quoted or paraphrased","weakest_point":"where the rep lost ground","say_next_time":"a stronger line the rep could have used"}`,
    renderResult: (j, box) => {
      const head = el("div", "card");
      const row = el("div", "outcome");
      const label = j.winner === "rep" ? "You won" : j.winner === "draw" ? "Draw" : "You lost";
      row.append(el("span", `badge ${j.winner === "rep" ? "booked" : j.winner === "draw" ? "soft_no" : "hard_no"}`, label), el("span", null, j.summary || ""));
      head.append(row); box.append(head);
      renderScores(box, j.scores, { logic: "Logic", evidence: "Evidence", rebuttal: "Rebuttal", delivery: "Delivery", persuasion: "Persuasion" });
      textBlock(box, "Your best point", j.best_point);
      textBlock(box, "Where you lost ground", j.weakest_point);
      textBlock(box, "Say this next time", j.say_next_time, "ins");
      play.debates = play.debates || { won: 0, lost: 0, draw: 0 };
      play.debates[j.winner === "rep" ? "won" : j.winner === "draw" ? "draw" : "lost"]++;
      recordPlay("debate", play.debates.won);
    },
  });
}

// ---------------------------------------------------------------- strategy room
async function openStrategy() {
  const c = pick(COMPANIES);
  openRoom({ title: "Strategy Room", otherName: "Panel", voice: "Kore", brief: [["Company", `${flagOf(c.country)} ${c.name}`], ["Case", el("div", "v", "")]], notReady: true, backTo: "play", again: openStrategy, hint: '<span class="spin"></span>Writing the case…' });
  let cs = null;
  try {
    cs = await generateJSON(`Write a short, realistic business case for a sales and marketing strategy exercise, based on this REAL company:
${JSON.stringify(companyFacts(c))}
Use the real facts. You may add scenario numbers (budget, current metrics), but keep them plausible for the company's size and label nothing as real data that isn't in the facts.
Return JSON only: {"situation":"2-3 sentences","numbers":["3-5 key scenario numbers"],"constraint":"budget and time limit","question":"the one question the rep must answer, e.g. what's your 90-day plan to ..."}`, 0.8);
  } catch (e) { logErr("strategy case", e); }
  if (room?.cfg.title !== "Strategy Room" || room.started || room.ended) return;
  if (!cs) { $("#roomStatus").textContent = "Couldn't write the case (Google busy?). Go back and try again."; return; }
  const caseBox = el("div");
  caseBox.append(el("div", "v", cs.situation));
  const ul = el("ul"); (cs.numbers || []).forEach(n => ul.append(el("li", null, n))); caseBox.append(ul);
  openRoom({
    title: "Strategy Room", otherName: "Panel", otherTag: "PANEL", voice: "Kore", maxSec: 600, backTo: "play", again: openStrategy, startLabel: "Present to the panel",
    brief: [["Company", `${flagOf(c.country)} ${c.name} · ${c.industry || ""}`], ["Case", caseBox], ["Constraint", cs.constraint], ["Your question", cs.question], ["How it works", "Think for a minute, then present your plan in about 90 seconds. Maria (CMO) and Raj (CFO) will grill you."]],
    hint: "Prepare, then tap <b>Present to the panel</b>.",
    system: `You are a two-person leadership panel at ${c.name}: Maria, the CMO (growth, brand, customers) and Raj, the CFO (cost, risk, payback). Voice both; start each turn with the speaker's name, like "Raj here:".
CASE: ${cs.situation} Numbers: ${(cs.numbers || []).join("; ")}. Constraint: ${cs.constraint}. Question for the rep: ${cs.question}
FLOW: Welcome the rep in one sentence and ask them to present. Let them present without interrupting. Then ask 4 to 6 tough, specific follow-up questions, alternating Maria and Raj, one at a time, reacting to their answers. Push on numbers, priorities, risks and trade-offs. Then thank them and end. Keep turns short. English only.`,
    opener: "(The rep has joined the meeting. Welcome them and ask them to present.)",
    judge: transcript => `You assess a strategy presentation to a leadership panel. Case: ${cs.situation} Numbers: ${(cs.numbers || []).join("; ")}. Constraint: ${cs.constraint}. Question: ${cs.question}
TRANSCRIPT:
${transcript}
Return JSON only: {"verdict":"approve|revise|reject","summary":"one sentence","scores":{"structure":0,"prioritisation":0,"numbers":0,"frameworks":0,"questions":0,"clarity":0},"strengths":["2 specifics"],"gaps":["2-3 specifics"],"better_plan":"a stronger plan in 3-4 sentences","frameworks_used":["named frameworks or ideas the rep used, if any"]}`,
    renderResult: (j, box) => {
      const head = el("div", "card"), row = el("div", "outcome");
      row.append(el("span", `badge ${j.verdict === "approve" ? "booked" : j.verdict === "revise" ? "soft_no" : "hard_no"}`, j.verdict === "approve" ? "Approved" : j.verdict === "revise" ? "Revise" : "Rejected"), el("span", null, j.summary || ""));
      head.append(row); box.append(head);
      renderScores(box, j.scores, { structure: "Structure", prioritisation: "Priorities", numbers: "Numbers", frameworks: "Frameworks", questions: "Handling Qs", clarity: "Clarity" });
      listBlock(box, "Strengths", j.strengths); listBlock(box, "Gaps", j.gaps);
      textBlock(box, "A stronger plan", j.better_plan, "ins");
      play.strategy = play.strategy || { approve: 0, revise: 0, reject: 0 };
      play.strategy[j.verdict] = (play.strategy[j.verdict] || 0) + 1;
      recordPlay("strategy", play.strategy.approve);
    },
  });
}

// ---------------------------------------------------------------- warm-up (articulation)
let warm = null;
function phraseBank() {
  const lines = [];
  for (const c of calls.slice(-30)) for (const w of c.judge?.worst_moments || []) if (w.say_instead) lines.push(w.say_instead);
  return [...new Set(lines)].slice(-12);
}
function openWarmup() {
  if (warm?.rec) warm.rec.close();
  warm = { from: currentTab, topic: pick(TALK_TOPICS), weak: pick([...calls.slice(-10).flatMap(c => (c.judge?.worst_moments || []).map(w => w.quote)).filter(Boolean), ...WEAK_LINES]), rec: null, busy: false };
  const box = $("#warmBody"); box.innerHTML = "";
  const d1 = el("div", "card stack");
  d1.append(el("div", "co", "1 · 60-second talk, no fillers"), el("p", null, "Talk for up to 60 seconds. Replace every 'um' with a pause. You'll get a filler count, pace, any words that came out unclear, and tips."), el("div", "showline", warm.topic));
  const b1 = el("button", "btn primary", "Start talking"); b1.onclick = () => warmRecord("talk", b1, d1);
  const nt = el("button", "btn small", "New topic"); nt.onclick = () => { warm.topic = pick(TALK_TOPICS.filter(t => t !== warm.topic)); d1.querySelector(".showline").textContent = warm.topic; };
  d1.append(b1, nt);
  const d2 = el("div", "card stack"); d2.style.marginTop = "12px";
  d2.append(el("div", "co", "2 · Say it stronger"), el("p", null, "Read the weak line, then say a stronger version out loud."), el("div", "showline", warm.weak));
  const b2 = el("button", "btn primary", "Record my version"); b2.onclick = () => warmRecord("rewrite", b2, d2);
  d2.append(b2);
  const d3 = el("div", "card stack"); d3.style.marginTop = "12px";
  d3.append(el("div", "co", "3 · Phrase bank"), el("p", null, "Lines from your own debriefs. Say each one out loud three times, slowly, ending each sentence on a downward pitch."));
  const bank = phraseBank();
  if (!bank.length) d3.append(el("p", "note", "Your bank fills up as you do Gauntlet calls: every \"Say instead\" line lands here."));
  for (const line of bank.slice(-6)) { const l = el("label", "toggle"); l.style.marginTop = "6px"; const cb = document.createElement("input"); cb.type = "checkbox"; l.append(el("span", null, line), cb); d3.append(l); }
  const d4 = el("div", "card stack"); d4.style.marginTop = "12px";
  d4.append(el("div", "co", "4 · Pen drill (no app needed)"), el("p", null, "Hold a pen sideways between your teeth and read any paragraph aloud for one minute, forcing every consonant. Take it out and read it again: you'll hear the difference."));
  box.append(d1, d2, d3, d4);
  show("warm");
}
async function warmRecord(kind, btn, card) {
  if (warm.busy) return;
  if (!online() && !(warm.rec && warm.rec.on)) { toast("Feedback on recordings needs internet. The phrase bank and pen drill work offline."); return; }
  if (warm.rec && warm.rec.on) { // second tap = stop
    const clip = warm.rec.stop(); clearInterval(warm.tick);
    warm.rec.close(); warm.rec = null;
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Listening back…';
    return warmAnalyse(kind, clip, btn, card);
  }
  audio.unlock();
  warm.rec = new Recorder(audio);
  try { await warm.rec.open(); }
  catch (e) { warm.rec = null; btn.textContent = "Microphone blocked: allow it and try again"; logErr("warm-up mic", e); return; }
  warm.rec.start();
  const limit = kind === "talk" ? 60 : 30;
  btn.classList.add("rec");
  warm.tick = setInterval(() => {
    const s = Math.floor((performance.now() - warm.rec.t0) / 1000);
    btn.textContent = `Recording ${s}s · tap to stop`;
    if (s >= limit) warmRecord(kind, btn, card);
  }, 250);
}
async function warmAnalyse(kind, clip, btn, card) {
  warm.busy = true;
  card.querySelectorAll(".warmres").forEach(x => x.remove());
  if (!clip.wav || clip.sec < 1) { btn.disabled = false; btn.classList.remove("rec"); btn.textContent = "Too short. Try again"; warm.busy = false; return; }
  const ask = kind === "talk"
    ? `This is a salesperson doing a speaking drill on the topic: "${warm.topic}". Transcribe the recording VERBATIM, including filler words (um, uh, like, you know, basically, actually, so) and false starts. Then analyse their delivery. Return JSON only:
{"transcript":"","fillers":0,"filler_words":[""],"unclear_words":["words that came out mumbled or unclear (best guess; empty if none)"],"hedges":[""],"clarity":0,"tips":["2 specific tips"],"tighter":"a tighter 2-3 sentence version of what they said"}
clarity is 0-10.`
    : `A salesperson was shown this weak line: "${warm.weak}" and asked to say a stronger version out loud. Transcribe what they said verbatim, then judge it. Return JSON only:
{"transcript":"","score":0,"verdict":"one sentence","better":"an even stronger version","unclear_words":["any mumbled words (best guess)"]}
score is 0-10 for specificity, buyer focus, confidence and clarity of delivery.`;
  let j = null;
  try {
    const raw = await generate({ contents: [{ role: "user", parts: [{ text: ask }, { inlineData: { mimeType: "audio/wav", data: clip.wav } }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2 } });
    j = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ""));
  } catch (e) { logErr("warm-up analysis", e); }
  const res = el("div", "warmres stack");
  if (!j) res.append(el("p", "err", "Couldn't analyse that (Google busy?). Try again in a minute."));
  else if (kind === "talk") {
    const words = (j.transcript || "").split(/\s+/).filter(Boolean).length, wpm = Math.round(words / (clip.sec / 60));
    const grid = el("div", "metrics");
    const add = (n, l) => { const d = el("div", "metric"); d.append(el("div", "n", n), el("div", "l", l)); grid.append(d); };
    add(String(j.fillers ?? "–"), "fillers"); add(String(wpm), "words / minute"); add(`${clamp(Number(j.clarity) || 0, 0, 10)}/10`, "clarity"); add(String((j.hedges || []).length), "hedges");
    res.append(grid);
    if (j.unclear_words?.length) res.append(el("p", null, "Came out unclear: " + j.unclear_words.join(", ")));
    if (j.filler_words?.length) res.append(el("p", null, "Fillers used: " + [...new Set(j.filler_words)].join(", ")));
    const ul = el("ul", "plain"); (j.tips || []).forEach(t => ul.append(el("li", null, t))); res.append(ul);
    if (j.tighter) res.append(el("div", "ins", "Tighter: " + j.tighter));
    res.append(el("details", null, "")); res.lastChild.append(el("summary", null, "Transcript"), el("p", null, j.transcript || ""));
    recordPlay("warmup", Math.max(0, 10 - (j.fillers || 0)));
  } else {
    const sc = clamp(Number(j.score) || 0, 0, 10);
    res.append(el("div", "t", `${sc}/10 · ${j.verdict || ""}`), el("p", null, `You said: ${j.transcript || ""}`));
    if (j.unclear_words?.length) res.append(el("p", null, "Came out unclear: " + j.unclear_words.join(", ")));
    if (j.better) res.append(el("div", "ins", "Even stronger: " + j.better));
  }
  card.append(res);
  btn.disabled = false; btn.classList.remove("rec"); btn.textContent = kind === "talk" ? "Try again" : "Record again";
  warm.busy = false;
}
function leaveWarmup() { if (warm?.rec) { clearInterval(warm.tick); warm.rec.close(); warm.rec = null; } openTab(warm?.from || "play"); }
