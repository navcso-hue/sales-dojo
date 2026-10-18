"use strict";
// Learn: book path, lessons, quizzes, book tests and spaced review (Leitner boxes).
// Loaded before app.js; everything here runs on user action, never at load time.

const REVIEW_DAYS = [0, 1, 2, 4, 8, 16, 32]; // box → days until next review
let learn = store.json("learn", null) || { xp: 0, c: {}, tests: {} };
const saveLearn = () => store.setJson("learn", learn);
const addDays = (d, n) => { const x = new Date(d + "T12:00"); x.setDate(x.getDate() + n); return todayStr(x); };
const cstate = id => (learn.c[id] ||= { box: 0, due: null, learned: false, ok: 0, bad: 0 });
const learnedCount = () => Object.values(learn.c).filter(s => s.learned).length;
const totalConcepts = () => Object.keys(CONCEPTS).length;
function dueConcepts() {
  const t = todayStr();
  return Object.entries(learn.c).filter(([id, s]) => CONCEPTS[id] && s.due && s.due <= t).map(([id]) => id);
}
function nextConcept() {
  for (const b of BOOKS) for (const c of b.concepts) if (!learn.c[c.id]?.learned) return c;
  return null;
}
function grade(id, correct) {
  const s = cstate(id);
  if (correct) { s.ok++; s.box = Math.min(s.box + 1, REVIEW_DAYS.length - 1); }
  else { s.bad++; s.box = 1; }
  s.due = addDays(todayStr(), correct ? REVIEW_DAYS[s.box] : 1);
}
// A technique the judge says you missed on a call → that concept is due for review today.
function flagMissedTechniques(names) {
  const flagged = [];
  const norm = s => s.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
  for (const name of names || []) {
    const n = norm(name);
    const hit = Object.entries(FW_CONCEPT).find(([fw]) => { const f = norm(fw); return n.includes(f) || f.includes(n); });
    if (!hit) continue;
    const s = cstate(hit[1]);
    s.due = todayStr(); if (s.box > 1) s.box = 1;
    flagged.push(CONCEPTS[hit[1]].title);
  }
  if (flagged.length) saveLearn();
  return flagged;
}

// ---------------------------------------------------------------- screens
function renderLearn() {
  $("#learnSub").textContent = `${learn.xp} XP · ${learnedCount()}/${totalConcepts()} ideas learned`;
  const due = dueConcepts();
  const top = $("#learnTop"); top.innerHTML = "";
  const next = nextConcept();
  if (next) {
    const b = CONCEPT_BOOK[next.id];
    const card = el("button", "card callcard next");
    const mid = el("div", "body");
    mid.append(el("div", "t", "Continue"), el("div", "s", `${next.title} · ${b.title}`));
    card.append(el("div", "num", "▶"), mid);
    card.onclick = () => startLesson(next.id);
    top.append(card);
  }
  const rv = el("button", "btn" + (due.length ? " primary" : ""), due.length ? `Review ${due.length} due` : "Nothing due for review");
  rv.disabled = !due.length; rv.style.marginTop = "10px";
  rv.onclick = startReview;
  top.append(rv);

  const list = $("#bookList"); list.innerHTML = "";
  for (const b of BOOKS) {
    const learned = b.concepts.filter(c => learn.c[c.id]?.learned).length;
    const card = el("button", "card sc");
    const row = el("div", "row");
    row.append(el("span", "co", b.title), el("span", "note", `${learned}/${b.concepts.length}`));
    card.append(row, el("div", "who", `${b.author} · ${b.skill}`));
    const bar = el("div", "progressbar"), fill = el("i"); fill.style.width = (100 * learned) / b.concepts.length + "%"; bar.append(fill); card.append(bar);
    if (learn.tests[b.id] != null) card.append(el("div", "note", `Book test best: ${learn.tests[b.id]}%`));
    card.onclick = () => openBook(b.id);
    list.append(card);
  }
}
function openBook(bookId) {
  const b = BOOKS.find(x => x.id === bookId);
  $("#bookTitle").textContent = b.title;
  $("#bookSub").textContent = `${b.author} · ${b.skill}`;
  const list = $("#conceptList"); list.innerHTML = "";
  b.concepts.forEach((c, i) => {
    const s = learn.c[c.id];
    const row = el("button", "card callcard" + (s?.learned ? " done" : ""));
    const mid = el("div", "body");
    mid.append(el("div", "t", c.title), el("div", "s", s?.learned ? `Strength ${"●".repeat(Math.min(s.box, 5))}${"○".repeat(5 - Math.min(s.box, 5))}` : "Not started"));
    row.append(el("div", "num", s?.learned ? "✓" : String(i + 1)), mid);
    row.onclick = () => startLesson(c.id);
    list.append(row);
  });
  $("#bookTest").onclick = () => startTest(bookId);
  $("#bookTest").textContent = learn.tests[b.id] != null ? `Book test (best ${learn.tests[b.id]}%)` : "Take the book test";
  show("book");
}

// ---------------------------------------------------------------- step runner
// A session is a list of steps: concept cards, multiple-choice questions and "say it" tasks.
let session = null;
function mcqStep(conceptId, qi) {
  const q = CONCEPTS[conceptId].q[qi];
  const order = shuffle([0, 1, 2, 3]);
  return { kind: "mcq", conceptId, q: q.q, options: order.map(i => q.o[i]), correct: order.indexOf(0), why: q.why };
}
function startLesson(conceptId) {
  const steps = [{ kind: "card", conceptId }, mcqStep(conceptId, 0), mcqStep(conceptId, 1), { kind: "say", conceptId }];
  runSession({ type: "lesson", title: CONCEPTS[conceptId].title, steps, conceptId });
}
function startReview() {
  const ids = shuffle(dueConcepts()).slice(0, 10);
  if (!ids.length) return;
  const steps = [];
  for (const id of ids) {
    if (!learn.c[id]?.learned) steps.push({ kind: "card", conceptId: id });
    steps.push(mcqStep(id, Math.floor(Math.random() * 2)));
  }
  steps.push({ kind: "say", conceptId: pick(ids) });
  runSession({ type: "review", title: "Review", steps });
}
function startTest(bookId) {
  const b = BOOKS.find(x => x.id === bookId);
  const steps = shuffle(b.concepts).map(c => mcqStep(c.id, Math.floor(Math.random() * 2)));
  const sayOn = shuffle(b.concepts).slice(0, 2);
  steps.push(...sayOn.map(c => ({ kind: "say", conceptId: c.id })));
  runSession({ type: "test", title: `${b.title} test`, steps, bookId });
}
function runSession(s) {
  session = { ...s, i: 0, correct: 0, asked: 0, sayScores: [], xp: 0, answered: false, from: currentTab };
  show("lesson");
  renderStep();
}
function renderStep() {
  const s = session, step = s.steps[s.i];
  $("#lessonTitle").textContent = s.title;
  $("#lessonBar").style.width = (100 * s.i) / s.steps.length + "%";
  const box = $("#lessonBody"); box.innerHTML = "";
  const btn = $("#lessonNext"); btn.hidden = false; btn.disabled = false;
  s.answered = false;
  const c = CONCEPTS[step.conceptId];

  if (step.kind === "card") {
    const card = el("div", "card stack lessoncard");
    card.append(el("div", "note", `${CONCEPT_BOOK[c.id].title} · ${CONCEPT_BOOK[c.id].author}`), el("h2", null, c.title), el("p", "big", c.idea));
    const ex = el("div", "moment"); ex.append(el("div", "note", "On a call it sounds like"), el("div", "q", c.sounds)); card.append(ex);
    const mi = el("div", "moment miss"); mi.append(el("div", "note", "Common mistake"), el("div", null, c.mistake)); card.append(mi);
    box.append(card);
    btn.textContent = "Got it";
    btn.onclick = nextStep;
  } else if (step.kind === "mcq") {
    box.append(el("h2", "qtext", step.q));
    const opts = el("div", "options");
    step.options.forEach((o, i) => {
      const b = el("button", "opt", o);
      b.onclick = () => answerMcq(i, opts);
      opts.append(b);
    });
    box.append(opts);
    btn.hidden = true;
  } else if (step.kind === "say") {
    box.append(el("div", "note", `Say it · ${c.title}`), el("h2", "qtext", c.say));
    const ta = document.createElement("textarea");
    ta.id = "sayInput"; ta.rows = 4; ta.placeholder = "Type, or tap the keyboard mic and say it out loud…";
    box.append(ta, el("div", "note", "Tip: say it the way you would on a real call. Short beats perfect."));
    btn.textContent = "Check my answer";
    btn.onclick = () => checkSay(step, ta.value.trim());
    const skip = el("button", "btn small", "Skip"); skip.style.marginTop = "10px";
    skip.onclick = nextStep;
    box.append(skip);
  }
}
function answerMcq(i, opts) {
  const s = session, step = s.steps[s.i];
  if (s.answered) return;
  s.answered = true; s.asked++;
  const ok = i === step.correct;
  [...opts.children].forEach((b, j) => { b.disabled = true; if (j === step.correct) b.classList.add("right"); else if (j === i) b.classList.add("wrong"); });
  if (ok) { s.correct++; s.xp += 10; }
  if (s.type !== "lesson") grade(step.conceptId, ok);
  const fb = el("div", "card feedback " + (ok ? "good" : "bad"));
  fb.append(el("div", "t", ok ? "Correct" : "Not quite"), el("p", null, step.why));
  $("#lessonBody").append(fb);
  const btn = $("#lessonNext"); btn.hidden = false; btn.textContent = "Continue"; btn.onclick = nextStep;
  fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
async function checkSay(step, answer) {
  if (!answer) { $("#sayInput").focus(); return; }
  const c = CONCEPTS[step.conceptId], btn = $("#lessonNext");
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Coach is reading…';
  let r = null;
  try {
    r = await generateJSON(`You are a demanding but encouraging sales coach grading a short answer in a learning app.
CONCEPT: ${c.title}. ${c.idea}
EXAMPLE OF THE CONCEPT IN USE: ${c.sounds}
COMMON MISTAKE: ${c.mistake}
TASK GIVEN TO THE LEARNER: ${c.say}
LEARNER'S ANSWER: "${answer.replace(/"/g, "'")}"
Grade how well the answer applies the concept to the task (ignore grammar and spelling). Return JSON only:
{"score":0,"verdict":"one sentence on what worked or didn't","better":"an improved version of their answer, phrased as they would say it out loud"}
score is 0-10.`, 0.3);
  } catch (e) { logErr("say grade", e); }
  const box = $("#lessonBody");
  box.querySelectorAll(".btn.small").forEach(b => b.remove());
  $("#sayInput").disabled = true;
  if (r) {
    const sc = clamp(Number(r.score) || 0, 0, 10);
    session.sayScores.push(sc); session.xp += sc;
    if (session.type !== "lesson") grade(step.conceptId, sc >= 6);
    const fb = el("div", "card feedback " + (sc >= 7 ? "good" : sc >= 4 ? "mid" : "bad"));
    fb.append(el("div", "t", `${sc}/10 · ${r.verdict || ""}`));
    if (r.better) { const m = el("div", "moment"); m.append(el("div", "note", "Stronger version"), el("div", "ins", r.better)); fb.append(m); }
    box.append(fb);
    fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else box.append(el("p", "err", "The coach couldn't grade that right now (Google busy?). Moving on."));
  btn.disabled = false; btn.textContent = "Continue"; btn.onclick = nextStep;
}
function nextStep() {
  session.i++;
  if (session.i >= session.steps.length) return finishSession();
  renderStep();
  window.scrollTo(0, 0);
}
function finishSession() {
  const s = session;
  if (s.type === "lesson") {
    const st = cstate(s.conceptId);
    st.learned = true; st.box = Math.max(st.box, 1); st.due = addDays(todayStr(), 1);
    s.xp += 10;
  }
  let pct = null;
  if (s.type === "test") {
    const sayPct = s.sayScores.length ? mean(s.sayScores) * 10 : null;
    const mcqPct = s.asked ? (100 * s.correct) / s.asked : 0;
    pct = Math.round(sayPct == null ? mcqPct : 0.8 * mcqPct + 0.2 * sayPct);
    learn.tests[s.bookId] = Math.max(learn.tests[s.bookId] ?? 0, pct);
    s.xp += Math.round(pct / 5);
  }
  learn.xp += s.xp;
  saveLearn();
  $("#lessonBar").style.width = "100%";
  const box = $("#lessonBody"); box.innerHTML = "";
  const card = el("div", "card stack");
  card.append(el("h2", null, s.type === "test" ? `Score: ${pct}%` : s.type === "review" ? "Review done" : "Lesson complete"));
  if (s.asked) card.append(el("p", null, `${s.correct}/${s.asked} questions right${s.sayScores.length ? ` · say-it average ${round1(mean(s.sayScores))}/10` : ""}`));
  card.append(el("p", "big", `+${s.xp} XP`));
  if (s.type === "lesson") {
    const n = nextConcept();
    if (n) { const b = el("button", "btn primary", `Next: ${n.title}`); b.onclick = () => startLesson(n.id); card.append(b); }
  }
  box.append(card);
  const btn = $("#lessonNext"); btn.hidden = false; btn.textContent = "Done";
  btn.onclick = () => openTab(s.from || "learn");
}
