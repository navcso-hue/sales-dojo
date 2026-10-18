"use strict";
// The Gauntlet: daily plan, buyer generation, calls, judging, streaks and progress.

const APP_VERSION = "v1.0";
const CALLS_PER_DAY = 5;
const LEVEL_CLASS = l => (l <= 3 ? "easy" : l <= 6 ? "mid" : "hard");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const round1 = v => Math.round(v * 10) / 10;
const OUTCOME_LABEL = { booked: "Booked", soft_no: "Soft no", hard_no: "Hard no", unjudged: "Not judged" };
const FLAGS = { US: "🇺🇸", UK: "🇬🇧", IE: "🇮🇪", DE: "🇩🇪", NL: "🇳🇱", FR: "🇫🇷", ES: "🇪🇸", SE: "🇸🇪", DK: "🇩🇰", PL: "🇵🇱", AU: "🇦🇺", AE: "🇦🇪", SA: "🇸🇦", IN: "🇮🇳", CA: "🇨🇦", SG: "🇸🇬", NZ: "🇳🇿" };
const COUNTRY_CODE = {
  "us": "US", "usa": "US", "united states": "US", "united states of america": "US",
  "uk": "UK", "united kingdom": "UK", "england": "UK", "scotland": "UK", "wales": "UK", "northern ireland": "UK",
  "ireland": "IE", "germany": "DE", "netherlands": "NL", "the netherlands": "NL", "france": "FR", "spain": "ES",
  "sweden": "SE", "denmark": "DK", "poland": "PL", "australia": "AU", "uae": "AE", "united arab emirates": "AE",
  "saudi arabia": "SA", "ksa": "SA", "india": "IN", "canada": "CA", "singapore": "SG", "new zealand": "NZ",
};
const flagOf = c => FLAGS[COUNTRY_CODE[(c || "").toLowerCase()] || (c || "").toUpperCase()] || "🌍";

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function setStatus(html) { $("#status").innerHTML = html; }
function daysBetween(a, b) { return Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 864e5); }

// ---------------------------------------------------------------- persistent state
const DEFAULT_PROFILE = () => ({
  level: 3, streak: 0, best: 0, lastDone: null,
  skills: Object.fromEntries(Object.keys(SKILLS).map(k => [k, 5])),
  totals: { calls: 0, booked: 0, soft_no: 0, hard_no: 0 },
  days: {},            // date → {calls, booked, avg, fpm, talk}
  recentCompanies: [], // [{id, date}]
});
let profile = store.json("profile", null) || DEFAULT_PROFILE();
let calls = store.json("calls", []); // newest last
let plan = store.json("plan", null);
const saveProfile = () => store.setJson("profile", profile);
const savePlan = () => store.setJson("plan", plan);
function saveCalls() {
  // keep 200 calls; transcripts only for the newest 60 so storage stays small
  calls = calls.slice(-200);
  calls.forEach((c, i) => { if (i < calls.length - 60) delete c.transcript; });
  if (!store.setJson("calls", calls)) { calls.forEach((c, i) => { if (i < calls.length - 20) delete c.transcript; }); store.setJson("calls", calls); }
}

let COMPANIES = [];
const companyById = id => COMPANIES.find(c => c.id === id);
async function loadCompanies() {
  const r = await fetch(`companies.json?v=${APP_VERSION}`);
  if (!r.ok) throw new Error(`companies.json → ${r.status}`);
  COMPANIES = (await r.json()).filter(c => c && c.id && c.name);
}

// ---------------------------------------------------------------- daily plan
function recentTypes(n = 15) { return calls.slice(-n).map(c => c.type); }
function weakestSkill() { return Object.entries(profile.skills).sort((a, b) => a[1] - b[1])[0][0]; }
function validOffers(c) { const o = (c.good_fit_offers || []).filter(id => OFFERS[id]); return o.length ? o : Object.keys(OFFERS); }

function pickTypes(n) {
  if (profile.totals.calls === 0) return ["cold", "inbound", "discovery", "gatekeeper", "objections"].slice(0, n);
  const recent = recentTypes();
  const count = t => recent.filter(x => x === t).length;
  const chosen = new Set([pick(SKILL_TO_TYPES[weakestSkill()])]);
  for (const t of shuffle(Object.keys(CALL_TYPES)).sort((a, b) => count(a) - count(b))) {
    if (chosen.size >= n) break;
    chosen.add(t);
  }
  return shuffle([...chosen]);
}
function pickCompanies(n, exclude = new Set()) {
  const today = todayStr();
  const recent = new Set(profile.recentCompanies.filter(r => daysBetween(r.date, today) < 10).map(r => r.id));
  let pool = shuffle(COMPANIES.filter(c => !recent.has(c.id) && !exclude.has(c.id)));
  if (pool.length < n) pool = shuffle(COMPANIES.filter(c => !exclude.has(c.id)));
  const out = [], countries = new Set();
  for (const c of pool) { if (out.length < n && !countries.has(c.country)) { out.push(c); countries.add(c.country); } }
  for (const c of pool) { if (out.length < n && !out.includes(c)) out.push(c); }
  return out;
}
function makeItem(company, type, level, idx, bonus = false) {
  return { idx, companyId: company.id, offerId: pick(validOffers(company)), type, level, status: "pending", bonus };
}
function makePlan() {
  const base = Math.round(profile.level);
  const levels = [base - 1, base, base, base + 1, base + 1].map(l => clamp(l, 1, 10));
  const types = pickTypes(CALLS_PER_DAY);
  const comps = pickCompanies(CALLS_PER_DAY);
  return { date: todayStr(), items: comps.map((c, i) => makeItem(c, types[i], levels[i], i)), coach: null };
}
function ensurePlan() {
  if (!plan || plan.date !== todayStr()) { plan = makePlan(); savePlan(); }
  return plan;
}
const mainItems = () => plan.items.filter(i => !i.bonus);
const doneCount = () => mainItems().filter(i => i.status === "done").length;

// ---------------------------------------------------------------- buyer generation
function companyFacts(c) {
  return {
    name: c.name, country: c.country, city: c.city, industry: c.industry, size: c.size, revenue: c.revenue,
    what_they_sell: c.what_they_sell, customers: c.customers, channels: c.channels,
    recent_news: c.recent_news, signals: c.signals, likely_pains: c.likely_pains,
  };
}
function buyerSpecPrompt(item) {
  const c = companyById(item.companyId), o = OFFERS[item.offerId], t = CALL_TYPES[item.type];
  const gender = pick(["female", "male"]);
  return `You design a realistic buyer for a sales-call training simulator. The company is REAL (facts below, from public sources); the person is FICTIONAL.

COMPANY FACTS:
${JSON.stringify(companyFacts(c))}

WHAT THE REP SELLS: ${o.vendor}, ${o.product}. ${o.what} Price: ${o.price}. The vendor's claims: ${o.proof.join("; ")}.
CALL TYPE: ${t.label}. Situation: ${t.setup} Rep's goal: ${t.goal}.
DIFFICULTY ${item.level}/10: ${LEVEL_GUIDE[item.level]}
PERSONA HINTS: ${gender}; personality ${pick(PERSONALITIES)}; mood ${pick(MOODS)}.

Rules:
- Invent the person who would realistically take this call at this company. For a gatekeeper call, the person is the assistant or receptionist, and the decision-maker is a separate invented name they protect. For renewal or angry-customer calls, they are an existing customer of ${o.vendor}.
- Use a first and last name that fits the company's country. Never use a real person's name.
- Build the situation and pains from the real facts (size, products, news, signals). Do not invent dramatic events about the company (no scandals, layoffs, lawsuits, data breaches).
- Make the conversion rule specific, testable from a transcript, and matched to the difficulty.
- Objections are exact spoken lines, natural for this person.
- English only. The accent should fit the country.

Return JSON only:
{"person":{"name":"","role":"","gender":"${gender}","personality":"","mood":"","speaking_style":"","accent":""},
"rep_brief":{"context":"what the rep knows before dialling, 1-2 sentences","goal":"the rep's specific goal for this call"},
"hidden":{"situation":"2-3 sentences","pains":[{"pain":"","severity":3,"reveal_if":"what the rep must ask or do to hear this"}],"budget":"","authority":"","incumbent":"","timeline":"","objections":[{"line":"","kind":"brush-off"}],"conversion_rule":"","lose_conditions":"","opening_line":""}}`;
}
async function buildBuyer(item) {
  const spec = await generateJSON(buyerSpecPrompt(item), 0.9);
  if (!spec?.person?.name || !spec?.hidden) throw new Error("Buyer builder returned an incomplete persona");
  const used = new Set(plan.items.map(i => i.buyer?.voice).filter(Boolean));
  const pool = VOICES[spec.person.gender === "male" ? "male" : "female"];
  spec.voice = pool.find(v => !used.has(v)) || pick(pool);
  item.buyer = spec;
  item.status = "ready";
  savePlan();
  return item;
}
let preparing = false;
async function prepareBuyers() {
  if (preparing) return;
  preparing = true;
  try {
    for (const item of plan.items) {
      if (item.status !== "pending") continue;
      item.status = "building"; renderToday();
      try { await buildBuyer(item); }
      catch (e) { item.status = "pending"; item.error = e.message; logErr("buyer builder", e); }
      renderToday();
    }
  } finally { preparing = false; renderToday(); }
}

function buyerSystemPrompt(item) {
  const c = companyById(item.companyId), o = OFFERS[item.offerId], t = CALL_TYPES[item.type], b = item.buyer, h = b.hidden;
  const pains = (h.pains || []).map((p, i) => `  ${i + 1}. ${p.pain} (reveal only if: ${p.reveal_if})`).join("\n");
  const objections = (h.objections || []).map(x => `  "${x.line}" (${x.kind})`).join("\n");
  const news = (c.recent_news || []).map(n => `${n.date}: ${n.fact}`).join("; ");
  return `You are role-playing a real person on a phone call in a sales-training simulation. Stay fully in character for the whole call.

YOU ARE: ${b.person.name}, ${b.person.role} at ${c.name} (${c.city || ""}${c.city ? ", " : ""}${c.country}). Personality: ${b.person.personality}. Mood today: ${b.person.mood}. Speaking style: ${b.person.speaking_style}. Accent: ${b.person.accent}.
YOUR COMPANY (true facts you know well): ${c.what_they_sell} Customers: ${c.customers || "n/a"}. Size: ${c.size || "n/a"}.${news ? " Recent: " + news + "." : ""}
THE CALL: ${t.setup} The caller is from ${o.vendor} (${o.product}); you only learn details when they tell you.

HIDDEN BRIEF (never reveal it, never hint that rules exist):
Situation: ${h.situation}
Pains:
${pains}
Budget: ${h.budget}. Who decides: ${h.authority}. Current solution: ${h.incumbent}. Timeline: ${h.timeline}.
Objections (use naturally, one at a time):
${objections}
Say yes to the caller's goal ONLY IF: ${h.conversion_rule}
End the call if: ${h.lose_conditions}
Difficulty ${item.level}/10: ${LEVEL_GUIDE[item.level]}

HOW TO TALK:
- This is a phone call. Talk like a busy real person: usually one to three short sentences. No lists, no formatting.
- You are not an assistant. Do not help the caller sell. Do not volunteer your problems; reveal each pain only when its condition is met.
- React honestly. Keep small talk short. Push back or cut in when it fits your personality.
- When you first answer, use something like: "${h.opening_line}"
- If asked something your brief doesn't cover, improvise plausibly and stay consistent.
- Speak English only. When the call reaches a natural end, say a short goodbye.
- Never say you are an AI, a model, or part of a simulation.`;
}

// ---------------------------------------------------------------- navigation
function show(id) {
  document.querySelectorAll(".view").forEach(v => (v.hidden = v.id !== id));
  const tabbed = ["today", "progress", "settings"].includes(id);
  $("#tabbar").hidden = !tabbed;
  document.body.classList.toggle("tabs", tabbed);
  document.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("on", b.dataset.tab === id));
  window.scrollTo(0, 0);
}
function openTab(id) {
  if (id === "today") renderToday();
  if (id === "progress") renderProgress();
  if (id === "settings") renderSettings();
  show(id);
}

// ---------------------------------------------------------------- today
function renderToday() {
  if (!plan) return;
  const d = new Date();
  $("#todayDate").textContent = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  $("#installHint").hidden = !(isIOS && !isStandalone());
  $("#stStreak").textContent = String(currentStreak());
  $("#stLevel").textContent = profile.level.toFixed(1);
  const done = doneCount();
  $("#stDone").textContent = `${done}/${CALLS_PER_DAY}`;
  $("#dayBar").style.width = (100 * done) / CALLS_PER_DAY + "%";

  const list = $("#callList"); list.innerHTML = "";
  const next = nextItem();
  for (const item of plan.items) {
    const c = companyById(item.companyId);
    if (!c) continue;
    const t = CALL_TYPES[item.type];
    const card = el("button", "card callcard" + (item.status === "done" ? " done" : "") + (item === next ? " next" : ""));
    const num = el("div", "num", item.status === "done" ? "✓" : item.bonus ? "+" : String(item.idx + 1));
    const mid = el("div", "body");
    const title = el("div", "t");
    title.append(el("span", null, t.label), el("span", `lvl ${LEVEL_CLASS(item.level)}`, `L${item.level}`));
    const sub = el("div", "s", `${flagOf(c.country)} ${c.name} · ${OFFERS[item.offerId].product}`);
    mid.append(title, sub);
    const right = el("div", "r");
    if (item.status === "done") {
      const rec = calls.find(x => x.id === item.resultId);
      right.append(el("span", `badge ${rec?.outcome || "unjudged"}`, OUTCOME_LABEL[rec?.outcome || "unjudged"]));
    } else if (item.status === "building") { right.innerHTML = '<span class="spin"></span>'; }
    else if (item.status === "pending") right.textContent = item.error ? "Retry" : "Queued";
    else right.textContent = "Ready";
    card.append(num, mid, right);
    card.onclick = () => (item.status === "done" ? openStoredDebrief(item.resultId) : openCall(item));
    list.append(card);
  }

  const failed = plan.items.some(i => i.status === "pending" && i.error);
  $("#todayMsg").textContent = failed ? "Some buyers couldn't be built (Google busy?). Tap a call to retry." : "";

  const coach = $("#coachBox"); coach.innerHTML = "";
  if (done >= CALLS_PER_DAY) {
    coach.append(el("h3", null, "Today's coach"));
    if (plan.coach) {
      const box = el("div", "card coach");
      box.append(el("div", "head", plan.coach.headline || "Gauntlet complete."));
      const ul = el("ul");
      for (const p of plan.coach.patterns || []) ul.append(el("li", null, p));
      box.append(ul);
      if (plan.coach.drill) box.append(el("p", null, "Drill: " + plan.coach.drill));
      coach.append(box);
    } else coach.append(el("div", "card", "Gauntlet complete. Writing your coach notes…"));
  }
  const btn = $("#nextCallBtn");
  if (done >= CALLS_PER_DAY) { btn.textContent = "Bonus call (doesn't affect streak)"; btn.onclick = addBonus; }
  else { btn.textContent = "Start next call"; btn.onclick = () => next && openCall(next); }
  btn.disabled = done < CALLS_PER_DAY && !next;
}
function nextItem() { return plan.items.find(i => i.status !== "done" && !i.bonus) || plan.items.find(i => i.status !== "done"); }
function addBonus() {
  const used = new Set(plan.items.map(i => i.companyId));
  const [c] = pickCompanies(1, used);
  const item = makeItem(c, pick(Object.keys(CALL_TYPES)), clamp(Math.round(profile.level) + 1, 1, 10), plan.items.length, true);
  plan.items.push(item); savePlan(); renderToday(); openCall(item);
}
function currentStreak() {
  if (!profile.lastDone) return 0;
  return daysBetween(profile.lastDone, todayStr()) <= 1 ? profile.streak : 0;
}

// ---------------------------------------------------------------- call
let audio = new AudioIO();
let player = null;
let cur = null; // the call in progress
let wakeLock = null;
const mode = () => store.get("mode", "voice");

async function openCall(item) {
  if (item.status === "pending" || item.status === "building") {
    show("call");
    $("#brief").innerHTML = '<span class="spin"></span>Building this buyer from real company data…';
    resetCallUI(item); $("#startCall").disabled = true;
    try { if (item.status === "pending") { item.status = "building"; await buildBuyer(item); } else { while (item.status === "building") await sleep(400); } }
    catch (e) { item.status = "pending"; item.error = e.message; savePlan(); }
    if ($("#call").hidden) return; // the user backed out while we waited
    if (!item.buyer) { $("#brief").textContent = "Couldn't build this buyer: " + (item.error || "unknown error") + ". Go back and tap the call to retry."; return; }
  }
  cur = { item, turns: [], started: 0, timer: null, ended: false };
  player = null;
  newDiag({ callType: CALL_TYPES[item.type].label, level: item.level, mode: mode() === "voice" ? "live voice" : "text + read aloud" });
  renderBrief(item);
  resetCallUI(item);
  show("call");
}
function resetCallUI(item) {
  $("#callType").textContent = CALL_TYPES[item.type].label;
  $("#callLvl").className = `lvl ${LEVEL_CLASS(item.level)}`; $("#callLvl").textContent = `Level ${item.level}`;
  $("#bubbles").innerHTML = ""; $("#callErr").textContent = ""; $("#timer").textContent = "0:00"; $("#meter").style.width = "0";
  $("#startCall").hidden = false; $("#startCall").disabled = false; $("#startCall").textContent = "Start call";
  $("#endCall").hidden = true; $("#textRow").hidden = true;
  setStatus(mode() === "voice" ? "Tap <b>Start call</b> and talk normally. Earphones work best." : "Tap <b>Start call</b>. Use the keyboard mic to dictate.");
}
function renderBrief(item) {
  const c = companyById(item.companyId), o = OFFERS[item.offerId], b = item.buyer;
  const box = $("#brief"); box.innerHTML = "";
  const add = (k, v) => { box.append(el("div", "k", k)); if (v instanceof Node) box.append(v); else box.append(el("div", "v", v)); };
  add("Calling", `${b.person.name}, ${b.person.role}`);
  add("Company", `${flagOf(c.country)} ${c.name} · ${[c.city, c.country].filter(Boolean).join(", ")}${c.size ? " · " + c.size : ""}`);
  add("Context", b.rep_brief?.context || CALL_TYPES[item.type].setup);
  const sell = el("div"); sell.append(el("div", "v", `${o.vendor}: ${o.what}`));
  const ul = el("ul"); [o.price, ...o.proof].forEach(x => ul.append(el("li", null, x))); sell.append(ul);
  add("You sell", sell);
  add("Your goal", b.rep_brief?.goal || CALL_TYPES[item.type].goal);
  const det = el("details"); det.append(el("summary", null, "Company research"));
  const rl = el("ul");
  [c.what_they_sell, c.customers && "Customers: " + c.customers, c.channels && "Sells through: " + c.channels,
    ...(c.recent_news || []).map(n => `${n.date}: ${n.fact}`), ...(c.signals || []).map(s => "Signal: " + s)]
    .filter(Boolean).forEach(x => rl.append(el("li", null, x)));
  det.append(rl); box.append(det);
}

function addText(who, text) {
  const last = cur.turns[cur.turns.length - 1];
  if (last && last.who === who && !last.closed) { last.text += text; last.el.lastChild.textContent = last.text; }
  else {
    if (last) last.closed = true;
    const e = el("div", `b ${who}`);
    e.append(el("span", "who", who === "you" ? "You" : cur.item.buyer.person.name.split(" ")[0]), el("span", null, text));
    $("#bubbles").append(e);
    cur.turns.push({ who, text, el: e, closed: false });
  }
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}
function closeTurn() { const t = cur.turns[cur.turns.length - 1]; if (t) t.closed = true; }
const maxSec = item => (["discovery", "renewal", "closing"].includes(item.type) ? 10 : 8) * 60;
function tick() {
  const s = Math.floor((performance.now() - cur.started) / 1000);
  $("#timer").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  if (s >= maxSec(cur.item)) endCall("time limit reached");
}
async function keepAwake() { try { wakeLock = await navigator.wakeLock?.request("screen"); } catch {} }
function beginTimer() {
  cur.started = performance.now();
  cur.timer = setInterval(tick, 500);
  $("#startCall").hidden = true; $("#endCall").hidden = false;
  keepAwake();
}
function failCall(msg) {
  $("#callErr").textContent = msg;
  setStatus("Couldn't start.");
  $("#startCall").disabled = false; $("#startCall").textContent = "Try again";
}

// voice mode — rough on-device speech stats
function freshStats() { return { userSec: 0, inSpeech: false, segStart: 0, lastVoice: 0, longest: 0, noise: 0.01, awaitingReply: false, newTurn: true }; }
function onMicChunk(i16, rms) {
  const m = cur.stats;
  $("#meter").style.width = Math.min(100, rms * 900) + "%";
  const now = performance.now();
  const buyerTalking = player && player.speaking;
  const voiced = rms > Math.max(0.012, m.noise * 3);
  if (!voiced) m.noise = m.noise * 0.95 + rms * 0.05;
  if (voiced && !buyerTalking) {
    m.userSec += 0.1; m.lastVoice = now; m.awaitingReply = true;
    if (!m.inSpeech) { m.inSpeech = true; m.segStart = now; }
  } else if (m.inSpeech && now - m.lastVoice > 400) {
    m.inSpeech = false; m.longest = Math.max(m.longest, (m.lastVoice - m.segStart) / 1000);
  }
  if (!cur.live || !cur.live.ready) return;
  if (store.get("noInterrupt", "0") === "1" && buyerTalking) return;
  cur.live.sendAudio(i16);
}
async function startVoice() {
  const c = cur; const stale = () => c !== cur || c.ended;
  cur.stats = freshStats();
  setStatus('<span class="spin"></span>Allow the microphone when asked…');
  try { await audio.startMic(); }
  catch (e) { if (stale()) return; diag.mic = "blocked"; return failCall(logErr("mic", e) + ". Allow microphone access for this site, then try again."); }
  if (stale()) { audio.stopMic(); return; }
  player = new Player(audio.ctx);
  audio.onChunk = onMicChunk;
  const model = store.get("liveModel", "gemini-3.8-live");
  diag.liveModel = model; diag.voice = c.item.buyer.voice;
  setStatus('<span class="spin"></span>Dialling…');
  const first = c.item.buyer.person.name.split(" ")[0];
  c.live = new LiveCall({
    model, voice: c.item.buyer.voice, system: buyerSystemPrompt(c.item),
    onAudio: b64 => {
      const m = c.stats;
      if (m.newTurn) {
        m.newTurn = false;
        if (m.awaitingReply && m.lastVoice) { const l = Math.round(performance.now() - m.lastVoice); if (l > 150 && l < 15000) diag.latencies.push(l); }
        m.awaitingReply = false;
      }
      player.play(b64);
      setStatus(`<b>${first}</b> is talking…`);
    },
    onText: addText,
    onInterrupted: () => { player.flush(); c.stats.newTurn = true; },
    onTurnComplete: () => { c.stats.newTurn = true; closeTurn(); setStatus("Your turn."); },
    onClose: info => { if (!c.ended) endCall(`line dropped (${info})`); },
  });
  try { await c.live.connect(); }
  catch (e) { audio.stopMic(); if (stale()) return; return failCall(logErr("live connect", e) + ". Try Text mode in Settings, or another Live model."); }
  if (stale()) { c.live.close(); audio.stopMic(); return; }
  c.live.sendText("(The call connects. Answer the way you naturally would in this situation.)");
  beginTimer();
  setStatus("Ringing…");
  setTimeout(() => { if (!c.ended && diag.audioChunksIn === 0) setStatus(`No answer yet. Say “Hi, is that ${first}?”`); }, 5000);
}

// text mode
async function textTurn(userText) {
  const c = cur;
  c.history.push({ role: "user", parts: [{ text: userText }] });
  setStatus('<span class="spin"></span>…');
  try {
    const reply = (await generate({ systemInstruction: { parts: [{ text: buyerSystemPrompt(c.item) }] }, contents: c.history, generationConfig: { temperature: 0.8 } })).trim();
    if (c.ended) return;
    c.history.push({ role: "model", parts: [{ text: reply }] });
    closeTurn(); addText("buyer", reply); speak(reply);
    setStatus("Your turn.");
  } catch (e) { $("#callErr").textContent = logErr("text call", e); setStatus("Error. See below."); }
}
async function startText() {
  try { speechSynthesis.speak(new SpeechSynthesisUtterance(" ")); } catch {}
  pickTtsVoice();
  cur.history = [];
  $("#textRow").hidden = false;
  beginTimer();
  await textTurn("(The call connects. Answer the way you naturally would in this situation.)");
}
function sendTyped() {
  const v = $("#textInput").value.trim();
  if (!v || !cur || cur.ended) return;
  $("#textInput").value = "";
  closeTurn(); addText("you", v); textTurn(v);
}

async function endCall(reason) {
  if (!cur || cur.ended) return;
  cur.ended = true;
  clearInterval(cur.timer);
  if (cur.live) cur.live.close();
  if (player) player.flush();
  audio.stopMic(); audio.suspend();
  try { speechSynthesis.cancel(); } catch {}
  try { wakeLock && (await wakeLock.release()); } catch {}
  diag.endReason = reason || "you ended the call";
  if (cur.stats && cur.stats.inSpeech) cur.stats.longest = Math.max(cur.stats.longest, (cur.stats.lastVoice - cur.stats.segStart) / 1000);
  cur.durationSec = Math.round((performance.now() - cur.started) / 1000);
  judgeCall(cur);
}
function abandonCall() {
  if (!cur || cur.ended) return;
  cur.ended = true; clearInterval(cur.timer);
  if (cur.live) cur.live.close();
  audio.stopMic(); audio.suspend();
  try { speechSynthesis.cancel(); } catch {}
}

// ---------------------------------------------------------------- judging
function localMetrics(c) {
  const rep = c.turns.filter(t => t.who === "you").map(t => t.text).join(" ");
  const words = (rep.match(/[A-Za-z0-9']+/g) || []).length;
  const fillers = rep.match(/\b(um+|uh+|erm|like|basically|actually|you know|kind of|sort of|literally|i mean)\b/gi) || [];
  const hedges = rep.match(/\b(i think|maybe|just wanted|i guess|probably|hopefully|sorry)\b/gi) || [];
  const s = c.stats;
  const buyerSec = player ? player.seconds : 0;
  const m = { words, fillers: fillers.length, fillerList: [...new Set(fillers.map(f => f.toLowerCase()))], hedges: hedges.length };
  if (s && s.userSec > 5) {
    m.wpm = Math.round(words / (s.userSec / 60));
    m.fpm = round1(fillers.length / (s.userSec / 60));
    m.talkShare = Math.round((100 * s.userSec) / (s.userSec + buyerSec || 1));
    m.longest = Math.round(s.longest);
  }
  m.latency = median(diag.latencies);
  return m;
}
function judgePrompt(c, m, transcript) {
  const item = c.item, co = companyById(item.companyId), o = OFFERS[item.offerId], t = CALL_TYPES[item.type];
  const metricLine = [
    m.wpm ? `~${m.wpm} words per minute` : null,
    `${m.fillers} possible filler words (${m.fillerList.join(", ") || "none"})`, `${m.hedges} hedges`,
    m.talkShare != null ? `rep talk share ${m.talkShare}%` : null, m.longest != null ? `longest rep monologue ${m.longest}s` : null,
  ].filter(Boolean).join("; ");
  return `You are an elite B2B sales coach reviewing a call from a training simulator. Be specific, honest and demanding. Praise only what was genuinely good.

CALL TYPE: ${t.label}. Situation: ${t.setup}
REP'S GOAL: ${item.buyer.rep_brief?.goal || t.goal}
DIFFICULTY: ${item.level}/10
COMPANY (real): ${co.name}, ${co.country}. ${co.what_they_sell}
REP SELLS: ${o.vendor}, ${o.product}: ${o.what} (${o.price})
BUYER: ${item.buyer.person.name}, ${item.buyer.person.role}
BUYER'S HIDDEN BRIEF (the rep could not see this): ${JSON.stringify(item.buyer.hidden)}

TRANSCRIPT (speech-to-text, may contain small errors; punctuation may be missing):
${transcript}

MEASURED SPEECH METRICS: ${metricLine}

When naming techniques, prefer these exact names where they fit: ${FRAMEWORKS.join("; ")}.

Return JSON only, in exactly this shape:
{"outcome":"booked|soft_no|hard_no","outcome_reason":"one sentence","buyer_secret":"what the buyer was waiting to hear, in the buyer's own voice, 1-2 sentences","scores":{"opener":0,"discovery":0,"listening":0,"value":0,"objections":0,"next_step":0,"confidence":0,"phrasing":0},"best_moments":[{"quote":"exact rep words","why":""}],"worst_moments":[{"quote":"exact rep words","problem":"","say_instead":"an exact better line"}],"frameworks":{"used":[""],"missed":[""]},"drill":"one specific drill for tomorrow","summary":"one short line for the call history"}
"booked" means the rep achieved the goal. Scores are 0-10. Up to 3 best and 3 worst moments. If the call was too short to judge fairly, still return the JSON with low scores and say so in outcome_reason.`;
}

async function judgeCall(c) {
  const m = localMetrics(c);
  $("#debriefTitle").textContent = "Debrief";
  $("#debriefBody").innerHTML = `<div class="card"><span class="spin"></span>The judge is reviewing your call…</div>`;
  $("#debriefNext").hidden = true;
  $("#reportBox").hidden = false;
  $("#report").textContent = reportText();
  show("debrief");

  const transcript = c.turns.map(t => `${t.who === "you" ? "REP" : "BUYER"}: ${t.text.trim()}`).join("\n");
  const repTurns = c.turns.filter(t => t.who === "you").length;
  let j = null;
  if (repTurns === 0) {
    $("#debriefBody").innerHTML = "";
    $("#debriefBody").append(el("div", "card", "No speech from you was captured, so this call wasn't counted. Check the technical report below."));
    $("#report").textContent = reportText();
    finishItemUI(null);
    return;
  }
  const prompt = judgePrompt(c, m, transcript);
  try { j = await generateJSON(prompt, 0.4); }
  catch (e) { logErr("judge", e); }

  const rec = {
    id: `${Date.now()}`, date: todayStr(), companyId: c.item.companyId, companyName: companyById(c.item.companyId).name,
    country: companyById(c.item.companyId).country, offerId: c.item.offerId, type: c.item.type, level: c.item.level,
    buyer: { name: c.item.buyer.person.name, role: c.item.buyer.person.role }, durationSec: c.durationSec,
    outcome: j?.outcome && OUTCOME_LABEL[j.outcome] ? j.outcome : "unjudged",
    scores: j?.scores || null, judge: j, metrics: m, transcript, bonus: !!c.item.bonus,
    judgeInput: j ? undefined : prompt,
  };
  calls.push(rec); saveCalls();
  applyResult(rec);
  c.item.status = "done"; c.item.resultId = rec.id; savePlan();
  $("#report").textContent = reportText();
  renderDebrief(rec);
  finishItemUI(rec);
  if (!rec.bonus) checkDayComplete();
}
function finishItemUI() {
  const next = nextItem();
  const btn = $("#debriefNext");
  btn.hidden = !next || doneCount() >= CALLS_PER_DAY;
  btn.onclick = () => next && openCall(next);
}

function applyResult(rec) {
  profile.totals.calls++;
  profile.recentCompanies = [...profile.recentCompanies.filter(r => daysBetween(r.date, todayStr()) < 30), { id: rec.companyId, date: rec.date }];
  applyScores(rec);
}
function applyScores(rec) {
  if (rec.outcome in profile.totals) profile.totals[rec.outcome]++;
  if (rec.scores) {
    const vals = Object.keys(SKILLS).map(k => Number(rec.scores[k] ?? 0));
    const avg = mean(vals);
    for (const k of Object.keys(SKILLS)) profile.skills[k] = round1(0.7 * profile.skills[k] + 0.3 * clamp(Number(rec.scores[k] ?? 0), 0, 10));
    const delta = rec.outcome === "booked" ? 0.4 : rec.outcome === "soft_no" ? (avg >= 6 ? 0.1 : -0.1) : -0.3;
    profile.level = clamp(round1(profile.level + delta), 1, 10);
  }
  saveProfile();
}
function checkDayComplete() {
  if (doneCount() < CALLS_PER_DAY) return;
  const today = todayStr();
  if (profile.lastDone !== today) {
    profile.streak = profile.lastDone && daysBetween(profile.lastDone, today) === 1 ? profile.streak + 1 : 1;
    profile.best = Math.max(profile.best, profile.streak);
    profile.lastDone = today;
  }
  const dayRecs = calls.filter(r => r.date === today && !r.bonus);
  const avgs = dayRecs.filter(r => r.scores).map(r => mean(Object.keys(SKILLS).map(k => Number(r.scores[k] ?? 0))));
  profile.days[today] = {
    calls: dayRecs.length, booked: dayRecs.filter(r => r.outcome === "booked").length,
    avg: round1(mean(avgs)), fpm: round1(mean(dayRecs.map(r => r.metrics?.fpm).filter(v => v != null))),
    talk: Math.round(mean(dayRecs.map(r => r.metrics?.talkShare).filter(v => v != null))),
  };
  saveProfile();
  writeCoach(dayRecs);
}
async function writeCoach(dayRecs) {
  if (plan.coach) return;
  const lines = dayRecs.map((r, i) => `${i + 1}. ${CALL_TYPES[r.type].label}, level ${r.level}, ${r.companyName}: ${r.outcome}. Scores ${JSON.stringify(r.scores)}. Problems: ${(r.judge?.worst_moments || []).map(w => w.problem).join(" | ")}. Fillers/min ${r.metrics?.fpm ?? "?"}, talk share ${r.metrics?.talkShare ?? "?"}%.`).join("\n");
  try {
    plan.coach = await generateJSON(`You are a demanding sales coach. Here are today's 5 practice calls from one rep:
${lines}

Find the patterns across the calls (not one-offs). Return JSON only:
{"headline":"one punchy sentence on today's performance","patterns":["3 specific patterns, each one sentence, with what to do instead"],"drill":"one concrete drill for tomorrow (a few minutes)"}`, 0.5);
    savePlan();
  } catch (e) { logErr("coach", e); }
  if (!$("#today").hidden) renderToday();
}

// ---------------------------------------------------------------- debrief rendering
function scoreColor(v) { return v >= 7 ? "var(--accent)" : v >= 4 ? "var(--warn)" : "var(--danger)"; }
function renderDebrief(rec) {
  const j = rec.judge, m = rec.metrics || {};
  const body = $("#debriefBody"); body.innerHTML = "";
  const head = el("div", "card");
  head.append(el("div", "note", `${CALL_TYPES[rec.type].label} · L${rec.level} · ${flagOf(rec.country)} ${rec.companyName} · ${rec.buyer.name}`));
  if (!j) {
    head.append(el("p", "err", "The judge couldn't score this call (Google busy?). The transcript is saved below."));
    if (rec.judgeInput) {
      const again = el("button", "btn primary", "Judge again"); again.style.marginTop = "12px";
      again.onclick = () => rejudge(rec, again);
      head.append(again);
    }
    body.append(head);
  } else {
    const row = el("div", "outcome"); row.style.marginTop = "10px";
    row.append(el("span", `badge ${rec.outcome}`, OUTCOME_LABEL[rec.outcome]), el("span", null, j.outcome_reason || ""));
    head.append(row);
    if (j.buyer_secret) head.append(el("p", "secret", `“${j.buyer_secret}”`));
    body.append(head);

    body.append(el("h3", null, "Scores"));
    const sc = el("div", "card scores");
    for (const [k, name] of Object.entries(SKILLS)) {
      const v = clamp(Number(j.scores?.[k] ?? 0), 0, 10);
      const bar = el("div", "bar"), fill = el("i");
      fill.style.width = v * 10 + "%"; fill.style.background = scoreColor(v);
      bar.append(fill);
      sc.append(el("span", null, name), bar, el("span", "numv", String(v)));
    }
    body.append(sc);
    if (j.worst_moments?.length) {
      body.append(el("h3", null, "Fix these"));
      const c = el("div", "card");
      for (const w of j.worst_moments) { const d = el("div", "moment"); d.append(el("div", "q", `“${w.quote}”`), el("p", null, w.problem || ""), el("div", "ins", `Say instead: “${w.say_instead}”`)); c.append(d); }
      body.append(c);
    }
    if (j.best_moments?.length) {
      body.append(el("h3", null, "Keep doing"));
      const c = el("div", "card");
      for (const b of j.best_moments) { const d = el("div", "moment"); d.append(el("div", "q", `“${b.quote}”`), el("p", null, b.why || "")); c.append(d); }
      body.append(c);
    }
    if (j.frameworks) {
      body.append(el("h3", null, "Techniques"));
      const c = el("div", "card chips");
      for (const f of j.frameworks.used || []) if (f) c.append(el("span", "chip", "✓ " + f));
      for (const f of j.frameworks.missed || []) if (f) c.append(el("span", "chip miss", "✗ " + f));
      body.append(c);
    }
    if (j.drill) { body.append(el("h3", null, "Drill")); body.append(el("div", "card", j.drill)); }
  }
  body.append(el("h3", null, "Your speech (rough)"));
  const grid = el("div", "metrics");
  const add = (n, l) => { const d = el("div", "metric"); d.append(el("div", "n", n), el("div", "l", l)); grid.append(d); };
  add(m.wpm ?? "–", "words / minute");
  add(m.fpm != null ? String(m.fpm) : String(m.fillers ?? "–"), m.fpm != null ? "fillers / minute" : "possible fillers");
  add(m.talkShare != null ? m.talkShare + "%" : "–", "your talk share");
  add(m.longest != null ? m.longest + "s" : "–", "longest monologue");
  add(String(m.hedges ?? "–"), "hedges");
  add(m.latency != null ? m.latency + " ms" : "–", "buyer reply delay");
  body.append(grid);
  if (rec.transcript) {
    const det = el("details", "trans"); det.append(el("summary", null, "Transcript"));
    for (const line of rec.transcript.split("\n")) {
      const p = el("div", "line"); const i = line.indexOf(":");
      p.append(el("b", null, line.slice(0, i)), document.createTextNode(line.slice(i + 1)));
      det.append(p);
    }
    body.append(det);
  }
}
async function rejudge(rec, btn) {
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Judging…';
  try {
    const j = await generateJSON(rec.judgeInput, 0.4);
    rec.judge = j; rec.scores = j.scores || null;
    rec.outcome = OUTCOME_LABEL[j.outcome] ? j.outcome : "unjudged";
    delete rec.judgeInput;
    saveCalls(); applyScores(rec);
    renderDebrief(rec);
  } catch (e) { btn.disabled = false; btn.textContent = "Still busy. Try again in a minute"; logErr("rejudge", e); }
}
function openStoredDebrief(id) {
  const rec = calls.find(r => r.id === id);
  if (!rec) return;
  $("#debriefTitle").textContent = new Date(rec.date + "T12:00").toLocaleDateString(undefined, { day: "numeric", month: "short" });
  renderDebrief(rec);
  $("#debriefNext").hidden = true;
  $("#reportBox").hidden = true;
  show("debrief");
}

// ---------------------------------------------------------------- progress
function sparkline(values, max = 10) {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg"); svg.setAttribute("viewBox", "0 0 300 70"); svg.setAttribute("class", "spark");
  if (values.length < 2) { const t = document.createElementNS(svgNS, "text"); t.setAttribute("x", "0"); t.setAttribute("y", "40"); t.setAttribute("fill", "#5C6470"); t.setAttribute("font-size", "13"); t.textContent = "Trend appears after 2 days"; svg.append(t); return svg; }
  const pts = values.map((v, i) => `${(i * 300) / (values.length - 1)},${66 - (v / max) * 60}`).join(" ");
  const pl = document.createElementNS(svgNS, "polyline");
  pl.setAttribute("points", pts); pl.setAttribute("fill", "none"); pl.setAttribute("stroke", "#3DDC97"); pl.setAttribute("stroke-width", "2.5"); pl.setAttribute("stroke-linejoin", "round");
  svg.append(pl);
  return svg;
}
function renderProgress() {
  const body = $("#progressBody"); body.innerHTML = "";
  const t = profile.totals;
  const stats = el("div", "stats");
  const stat = (n, l) => { const d = el("div", "stat"); d.append(el("div", "n", n), el("div", "l", l)); return d; };
  stats.append(stat(profile.level.toFixed(1), "level"), stat(`${currentStreak()}`, `streak (best ${profile.best})`), stat(String(t.calls), "calls"));
  body.append(stats);
  const stats2 = el("div", "stats"); stats2.style.marginTop = "8px";
  stats2.append(stat(t.calls ? Math.round((100 * t.booked) / t.calls) + "%" : "–", "booking rate"), stat(String(t.soft_no), "soft no"), stat(String(t.hard_no), "hard no"));
  body.append(stats2);

  body.append(el("h3", null, "Skills"));
  const sk = el("div", "card scores");
  for (const [k, name] of Object.entries(SKILLS)) {
    const v = profile.skills[k];
    const bar = el("div", "bar"), fill = el("i"); fill.style.width = v * 10 + "%"; fill.style.background = scoreColor(v); bar.append(fill);
    sk.append(el("span", null, name), bar, el("span", "numv", v.toFixed(1)));
  }
  body.append(sk);

  const days = Object.keys(profile.days).sort().slice(-14);
  body.append(el("h3", null, "Average score by day"));
  const sp = el("div", "card"); sp.append(sparkline(days.map(d => profile.days[d].avg))); body.append(sp);

  const recent = calls.slice(-10).map(r => r.metrics || {});
  if (recent.length) {
    body.append(el("h3", null, "Speech habits (last 10 calls)"));
    const grid = el("div", "metrics");
    const add = (n, l) => { const d = el("div", "metric"); d.append(el("div", "n", n), el("div", "l", l)); grid.append(d); };
    const avgOf = k => { const v = recent.map(x => x[k]).filter(x => x != null); return v.length ? Math.round(mean(v) * 10) / 10 : "–"; };
    add(String(avgOf("fpm")), "fillers / minute"); add(avgOf("talkShare") + (avgOf("talkShare") === "–" ? "" : "%"), "talk share");
    add(String(avgOf("wpm")), "words / minute"); add(String(avgOf("longest")) + (avgOf("longest") === "–" ? "" : "s"), "longest monologue");
    body.append(grid);
  }

  body.append(el("h3", null, "Recent calls"));
  const list = el("div", "card list");
  const recs = calls.slice(-25).reverse();
  if (!recs.length) list.append(el("p", null, "No calls yet. Today's Gauntlet is waiting."));
  for (const r of recs) {
    const row = el("button", "row");
    const mm = el("div", "m");
    mm.append(el("div", "t", `${flagOf(r.country)} ${r.companyName}`), el("div", "s", `${CALL_TYPES[r.type]?.label || r.type} · L${r.level} · ${r.date}`));
    row.append(mm, el("span", `badge ${r.outcome}`, OUTCOME_LABEL[r.outcome]));
    row.onclick = () => openStoredDebrief(r.id);
    list.append(row);
  }
  body.append(list);
}

// ---------------------------------------------------------------- settings
function renderSettings() {
  document.querySelectorAll("[data-mode]").forEach(b => b.classList.toggle("on", b.dataset.mode === mode()));
  $("#noInterrupt").checked = store.get("noInterrupt", "0") === "1";
  $("#levelRange").value = profile.level; $("#levelVal").textContent = profile.level.toFixed(1);
  const fill = (sel, arr, cur) => { sel.innerHTML = ""; for (const id of arr) { const o = document.createElement("option"); o.value = o.textContent = id; if (id === cur) o.selected = true; sel.append(o); } };
  const live = store.json("liveModels", []), text = store.json("textModels", []);
  fill($("#liveModel"), live.length ? live : ["gemini-3.8-live"], store.get("liveModel"));
  fill($("#textModel"), text.length ? text : ["gemini-2.5-flash"], store.get("textModel"));
  const k = keyNow(); $("#keyLine").textContent = k ? `Key saved: ${k.slice(0, 4)}…${k.slice(-4)}` : "No key saved.";
  $("#versionLine").textContent = `Sales Dojo ${APP_VERSION} · ${COMPANIES.length} real companies · ${Object.keys(OFFERS).length} offers · ${Object.keys(CALL_TYPES).length} call types`;
  $("#backupMsg").textContent = "";
}
function exportBackup() {
  const data = { app: "sales-dojo", version: APP_VERSION, exported: new Date().toISOString(), profile, calls, plan };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `sales-dojo-backup-${todayStr()}.json`;
  document.body.append(a); a.click(); a.remove();
  $("#backupMsg").textContent = "Backup file created. On iPhone, choose Save to Files.";
}
async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== "sales-dojo" || !data.profile) throw new Error("not a Sales Dojo backup");
    profile = { ...DEFAULT_PROFILE(), ...data.profile }; calls = data.calls || [];
    saveProfile(); saveCalls();
    if (data.plan?.date === todayStr()) { plan = data.plan; savePlan(); }
    $("#backupMsg").textContent = `Restored ${calls.length} calls.`;
  } catch (e) { $("#backupMsg").textContent = "Couldn't restore: " + e.message; }
}

// ---------------------------------------------------------------- wiring
async function boot() {
  try { await loadCompanies(); }
  catch (e) { document.querySelector("main").innerHTML = `<div class="card"><p class="err">Couldn't load the company list (${e.message}). Check your connection and reopen.</p></div>`; return; }
  if (!keyNow()) { show("setup"); return; }
  ensurePlan();
  openTab("today");
  prepareBuyers();
}

$("#saveKey").onclick = async () => {
  const key = $("#keyInput").value.trim(), msg = $("#setupMsg");
  if (!key) { msg.textContent = "Paste your key first."; return; }
  msg.innerHTML = '<span class="spin"></span>Checking with Google…';
  try {
    const { live, text } = rankModels(await listModels(key));
    store.set("key", key);
    store.setJson("liveModels", live); store.setJson("textModels", text);
    store.set("liveModel", live[0] || "gemini-3.8-live"); store.set("textModel", text[0] || "gemini-2.5-flash");
    $("#keyInput").value = ""; msg.textContent = "";
    ensurePlan(); openTab("today"); prepareBuyers();
  } catch (e) { msg.textContent = e.message; }
};
document.querySelectorAll("[data-tab]").forEach(b => (b.onclick = () => openTab(b.dataset.tab)));
document.querySelectorAll("[data-mode]").forEach(b => (b.onclick = () => { store.set("mode", b.dataset.mode); renderSettings(); }));
$("#noInterrupt").onchange = e => store.set("noInterrupt", e.target.checked ? "1" : "0");
$("#levelRange").oninput = e => { profile.level = Number(e.target.value); $("#levelVal").textContent = profile.level.toFixed(1); saveProfile(); };
$("#liveModel").onchange = e => store.set("liveModel", e.target.value);
$("#textModel").onchange = e => store.set("textModel", e.target.value);
$("#regenBtn").onclick = () => {
  const used = new Set(plan.items.filter(i => i.status === "done").map(i => i.companyId));
  for (const item of plan.items) {
    if (item.status === "done") continue;
    const [c] = pickCompanies(1, used); used.add(c.id);
    Object.assign(item, makeItem(c, item.type, clamp(Math.round(profile.level) + (item.idx >= 3 ? 1 : 0), 1, 10), item.idx, item.bonus), { buyer: undefined, error: undefined });
  }
  savePlan(); openTab("today"); prepareBuyers();
};
$("#exportBtn").onclick = exportBackup;
$("#importFile").onchange = e => e.target.files[0] && importBackup(e.target.files[0]);
$("#forgetKey").onclick = () => { ["key", "liveModels", "textModels", "liveModel", "textModel"].forEach(k => store.del(k)); show("setup"); };
let resetArmed = false;
$("#resetBtn").onclick = e => {
  if (!resetArmed) { resetArmed = true; e.target.textContent = "Tap again to erase everything"; setTimeout(() => { resetArmed = false; e.target.textContent = "Reset all progress"; }, 4000); return; }
  profile = DEFAULT_PROFILE(); calls = []; plan = null;
  saveProfile(); saveCalls(); store.del("plan");
  ensurePlan(); openTab("today"); prepareBuyers();
};
$("#startCall").onclick = () => {
  if (!cur || cur.ended) return;
  $("#startCall").disabled = true; $("#callErr").textContent = "";
  if (mode() === "voice") { audio.unlock(); startVoice(); } else startText();
};
$("#endCall").onclick = () => endCall();
$("#backFromCall").onclick = () => {
  if (cur && cur.started && !cur.ended) return endCall();
  abandonCall(); openTab("today");
};
$("#sendText").onclick = sendTyped;
$("#textInput").addEventListener("keydown", e => { if (e.key === "Enter") sendTyped(); });
$("#debriefDone").onclick = () => { $("#reportBox").hidden = false; openTab("today"); };
$("#copyReport").onclick = async e => {
  try { await navigator.clipboard.writeText($("#report").textContent); e.target.textContent = "Copied ✓"; }
  catch { e.target.textContent = "Long-press the text to copy"; }
  setTimeout(() => (e.target.textContent = "Copy report"), 2500);
};
document.addEventListener("visibilitychange", () => {
  // a new day may have started while the app sat in the background
  if (!document.hidden && keyNow() && plan && plan.date !== todayStr() && (!cur || cur.ended)) { ensurePlan(); renderToday(); prepareBuyers(); }
});
if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => { if (cur && cur.history) pickTtsVoice(); };

boot();
