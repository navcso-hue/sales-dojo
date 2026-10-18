"use strict";
// Plumbing: storage, Gemini REST, mic capture, audio playback and the Gemini Live call.

const API = "https://generativelanguage.googleapis.com/v1beta";
const WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

const $ = s => document.querySelector(s);
const store = {
  get(k, d = null) { try { const v = localStorage.getItem("sd." + k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("sd." + k, v); return true; } catch { return false; } },
  del(k) { try { localStorage.removeItem("sd." + k); } catch {} },
  json(k, d) { try { const v = localStorage.getItem("sd." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  setJson(k, v) { return this.set(k, JSON.stringify(v)); },
};
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const todayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const median = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// ---------------------------------------------------------------- diagnostics (per call)
let diag = null;
function newDiag(extra) {
  diag = {
    at: new Date().toISOString(), display: isStandalone() ? "home-screen app" : "browser tab", ua: navigator.userAgent,
    mic: "-", capture: "-", ctxRate: "-", liveModel: "-", textModel: "-", voice: "-", setupAttempt: "-", setupMs: "-",
    audioChunksIn: 0, audioChunksOut: 0, latencies: [], closeInfo: "-", endReason: "-", tokens: "-", errors: [], ...extra,
  };
}
function logErr(where, e) {
  const msg = `${where}: ${e && e.message ? e.message : e}`;
  if (diag) diag.errors.push(msg);
  console.warn(msg);
  return msg;
}
function reportText() {
  if (!diag) return "No report yet.";
  const lat = diag.latencies;
  return [
    `Sales Dojo ${APP_VERSION} · ${diag.at}`,
    `Call: ${diag.callType || "-"} · Level ${diag.level || "-"} · Mode: ${diag.mode || "-"} · Opened as: ${diag.display}`,
    `Device: ${diag.ua}`,
    `Mic: ${diag.mic} · Capture: ${diag.capture} · AudioContext rate: ${diag.ctxRate}`,
    `Live model: ${diag.liveModel} · Voice: ${diag.voice} · Setup: ${diag.setupAttempt} in ${diag.setupMs} ms`,
    `Text/judge model: ${diag.textModel}`,
    `Audio chunks sent: ${diag.audioChunksOut} · received: ${diag.audioChunksIn}`,
    `Reply latency: median ${median(lat) ?? "-"} ms · all: ${lat.join(", ") || "-"}`,
    `Call ended: ${diag.endReason} · Socket close: ${diag.closeInfo} · Tokens: ${diag.tokens}`,
    `Errors: ${diag.errors.length ? "\n  - " + diag.errors.join("\n  - ") : "none"}`,
  ].join("\n");
}

// ---------------------------------------------------------------- Gemini REST
const keyNow = () => store.get("key", "");
function googleError(text) { try { return JSON.parse(text).error.message; } catch { return text.slice(0, 180); } }

async function listModels(key) {
  const r = await fetch(`${API}/models?pageSize=1000`, { headers: { "x-goog-api-key": key } });
  if (!r.ok) throw new Error(`Google rejected the key (${r.status}): ${googleError(await r.text())}`);
  return (await r.json()).models || [];
}
const modelVersion = n => { const m = n.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
function rankModels(models) {
  const id = m => m.name.replace(/^models\//, "");
  const has = (m, x) => (m.supportedGenerationMethods || []).includes(x);
  const score = (n, kind) => {
    let s = modelVersion(n) * 10;
    if (kind === "live") {
      if (n === "gemini-3.8-live") s += 1000;
      if (/extended-thinking/.test(n)) s -= 40;
      if (/native-audio/.test(n)) s += 5;
    } else {
      if (/flash/.test(n) && !/lite/.test(n)) s += 30;
      if (/lite/.test(n)) s += 10;
      if (/preview|exp/.test(n)) s -= 3;
    }
    return s;
  };
  const live = models.filter(m => has(m, "bidiGenerateContent")).map(id).sort((a, b) => score(b, "live") - score(a, "live"));
  const text = models.filter(m => has(m, "generateContent")).map(id)
    .filter(n => /^gemini/.test(n) && !/(tts|image|audio|live|embedding|robotics|computer|veo|imagen|lyria|nano)/.test(n))
    .sort((a, b) => score(b, "text") - score(a, "text"));
  return { live, text };
}

// Tries the chosen text model, then the next best ones. A 503 (overloaded) gets one quick retry first.
async function generate(body) {
  const chosen = store.get("textModel", "");
  const all = store.json("textModels", []);
  const order = [chosen, ...all.filter(m => m !== chosen)].filter(Boolean).slice(0, 4);
  if (!order.length) order.push("gemini-2.5-flash");
  let lastErr;
  for (const model of order) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await fetch(`${API}/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": keyNow() },
          body: JSON.stringify(body),
        });
        if (r.status === 503 && attempt === 0) { await sleep(1500); continue; }
        if (!r.ok) { lastErr = new Error(`${model} → ${r.status}: ${googleError(await r.text())}`); logErr("text model", lastErr); break; }
        const j = await r.json();
        const text = (j.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || "").join("");
        if (diag) diag.textModel = model;
        return text;
      } catch (e) { lastErr = e; logErr("text model", e); break; }
    }
  }
  throw lastErr || new Error("No text model worked");
}
async function generateJSON(prompt, temperature = 0.7) {
  for (let i = 0; i < 2; i++) {
    const raw = await generate({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature } });
    try { return JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "")); }
    catch (e) { logErr("bad JSON from model", e); }
  }
  throw new Error("The model returned unreadable JSON twice");
}

// ---------------------------------------------------------------- audio
function i16ToB64(i16) {
  const u8 = new Uint8Array(i16.buffer, i16.byteOffset, i16.byteLength);
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function b64ToI16(b64) {
  const s = atob(b64), u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return new Int16Array(u8.buffer, 0, u8.length >> 1);
}

// Mic → 16 kHz 16-bit PCM in 100 ms chunks. Box-filter decimation is plenty for speech.
const WORKLET_SRC = `
class Capture extends AudioWorkletProcessor {
  constructor() { super(); this.ratio = sampleRate / 16000; this.phase = 0; this.acc = 0; this.cnt = 0;
    this.out = new Int16Array(1600); this.n = 0; this.sq = 0; this.sqn = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      const v = ch[i]; this.sq += v * v; this.sqn++;
      this.acc += v; this.cnt++; this.phase += 1;
      if (this.phase >= this.ratio) {
        this.phase -= this.ratio;
        const s = Math.max(-1, Math.min(1, this.acc / this.cnt));
        this.acc = 0; this.cnt = 0;
        this.out[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this.n === this.out.length) {
          const buf = this.out.slice().buffer;
          this.port.postMessage({ pcm: buf, rms: Math.sqrt(this.sq / this.sqn) }, [buf]);
          this.n = 0; this.sq = 0; this.sqn = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("capture", Capture);`;

class AudioIO {
  constructor() { this.ctx = null; this.stream = null; this.node = null; this.src = null; this.workletReady = false; this.onChunk = () => {}; }
  // Must be called synchronously inside the tap handler so iOS unlocks audio.
  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx.resume();
    if (diag) diag.ctxRate = this.ctx.sampleRate;
  }
  async startMic() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    });
    diag.mic = "ok";
    const src = this.ctx.createMediaStreamSource(this.stream);
    const sink = this.ctx.createGain(); sink.gain.value = 0; sink.connect(this.ctx.destination);
    try {
      if (!this.workletReady) {
        const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: "application/javascript" }));
        await this.ctx.audioWorklet.addModule(url);
        this.workletReady = true;
      }
      this.node = new AudioWorkletNode(this.ctx, "capture");
      this.node.port.onmessage = e => this.onChunk(new Int16Array(e.data.pcm), e.data.rms);
      diag.capture = "AudioWorklet";
    } catch (e) {
      logErr("worklet (using fallback)", e);
      this.node = this.scriptProcessor();
      diag.capture = "ScriptProcessor";
    }
    src.connect(this.node); this.node.connect(sink);
    this.src = src;
  }
  scriptProcessor() {
    const node = this.ctx.createScriptProcessor(4096, 1, 1);
    const ratio = this.ctx.sampleRate / 16000;
    let phase = 0, acc = 0, cnt = 0, n = 0, sq = 0, sqn = 0;
    const out = new Int16Array(1600);
    node.onaudioprocess = ev => {
      const ch = ev.inputBuffer.getChannelData(0);
      for (let i = 0; i < ch.length; i++) {
        const v = ch[i]; sq += v * v; sqn++; acc += v; cnt++; phase += 1;
        if (phase >= ratio) {
          phase -= ratio;
          const s = Math.max(-1, Math.min(1, acc / cnt)); acc = 0; cnt = 0;
          out[n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
          if (n === out.length) { this.onChunk(out.slice(), Math.sqrt(sq / sqn)); n = 0; sq = 0; sqn = 0; }
        }
      }
    };
    return node;
  }
  stopMic() {
    try { this.src && this.src.disconnect(); this.node && this.node.disconnect(); } catch {}
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null; this.node = null; this.src = null;
  }
  suspend() { try { this.ctx && this.ctx.suspend(); } catch {} }
}

class Player {
  constructor(ctx) { this.ctx = ctx; this.out = ctx.createGain(); this.out.connect(ctx.destination); this.next = 0; this.live = new Set(); this.seconds = 0; }
  play(b64) {
    const pcm = b64ToI16(b64);
    if (!pcm.length) return;
    const buf = this.ctx.createBuffer(1, pcm.length, 24000);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.connect(this.out);
    const t = Math.max(this.ctx.currentTime + 0.04, this.next);
    src.start(t); this.next = t + buf.duration; this.seconds += buf.duration;
    this.live.add(src); src.onended = () => this.live.delete(src);
  }
  flush() { for (const s of this.live) { try { s.stop(); } catch {} } this.live.clear(); this.next = 0; }
  get speaking() { return this.ctx.currentTime < this.next; }
}

// ---------------------------------------------------------------- Gemini Live
class LiveCall {
  constructor(o) { Object.assign(this, o); this.ws = null; this.ready = false; }
  setupMsg(full) {
    const setup = {
      model: `models/${this.model}`,
      generationConfig: { responseModalities: ["AUDIO"] },
      systemInstruction: { parts: [{ text: this.system }] },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };
    if (full) {
      setup.generationConfig.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: this.voice } } };
      setup.realtimeInputConfig = { automaticActivityDetection: { silenceDurationMs: 700 } };
    }
    return { setup };
  }
  // Full setup first (custom voice, tuned turn-taking); if Google rejects it, a minimal one.
  async connect() {
    try { await this.open(true); diag.setupAttempt = "full"; }
    catch (e) {
      logErr("setup (full)", e);
      if (/api key|permission|quota|exhausted/i.test(e.message)) throw e;
      await this.open(false); diag.setupAttempt = "minimal (custom voice rejected)"; diag.voice = "default";
    }
  }
  open(full) {
    return new Promise((resolve, reject) => {
      const t0 = performance.now();
      const ws = new WebSocket(`${WS_URL}?key=${encodeURIComponent(keyNow())}`);
      ws.binaryType = "arraybuffer";
      let done = false;
      ws.onopen = () => ws.send(JSON.stringify(this.setupMsg(full)));
      ws.onmessage = async ev => {
        let msg;
        try {
          const raw = typeof ev.data === "string" ? ev.data
            : ev.data instanceof ArrayBuffer ? new TextDecoder().decode(ev.data)
            : await ev.data.text();
          msg = JSON.parse(raw);
        } catch (e) { logErr("bad server message", e); return; }
        if (msg.setupComplete && !done) {
          done = true; this.ws = ws; this.ready = true;
          diag.setupMs = Math.round(performance.now() - t0);
          resolve();
          return;
        }
        this.handle(msg);
      };
      ws.onerror = () => {};
      ws.onclose = ev => {
        const info = `code ${ev.code}${ev.reason ? " · " + ev.reason : ""}`;
        if (!done) { reject(new Error(`connection closed before setup (${info})`)); return; }
        this.ready = false; diag.closeInfo = info; this.onClose(info);
      };
    });
  }
  handle(msg) {
    const sc = msg.serverContent;
    if (msg.usageMetadata) diag.tokens = msg.usageMetadata.totalTokenCount ?? diag.tokens;
    if (msg.goAway) logErr("server", `goAway, time left ${JSON.stringify(msg.goAway.timeLeft)}`);
    if (!sc) return;
    if (sc.interrupted) this.onInterrupted();
    for (const p of sc.modelTurn?.parts || []) if (p.inlineData?.data) { diag.audioChunksIn++; this.onAudio(p.inlineData.data); }
    if (sc.inputTranscription?.text) this.onText("you", sc.inputTranscription.text);
    if (sc.outputTranscription?.text) this.onText("buyer", sc.outputTranscription.text);
    if (sc.turnComplete) this.onTurnComplete();
  }
  send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
  sendAudio(i16) { diag.audioChunksOut++; this.send({ realtimeInput: { audio: { data: i16ToB64(i16), mimeType: "audio/pcm;rate=16000" } } }); }
  sendText(text) { this.send({ clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true } }); }
  close() { this.ready = false; try { this.ws && this.ws.close(1000, "call ended"); } catch {} }
}

// ---------------------------------------------------------------- read-aloud (text mode)
let ttsVoice = null;
function pickTtsVoice() {
  const vs = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
  ttsVoice = vs.find(v => /premium/i.test(v.name)) || vs.find(v => /enhanced/i.test(v.name)) || vs.find(v => v.lang === "en-US") || vs[0] || null;
  if (diag) diag.voice = ttsVoice ? `${ttsVoice.name} (read-aloud)` : "no read-aloud voice";
}
function speak(text) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (ttsVoice) u.voice = ttsVoice;
    u.rate = 1.03;
    speechSynthesis.speak(u);
  } catch (e) { logErr("read aloud", e); }
}
