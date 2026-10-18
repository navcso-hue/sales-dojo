"use strict";
// Offline support: keep the app shell cached so lessons, maths and quizzes work without internet.
// Page loads go to the network first (so updates arrive) and fall back to the cache offline.
// Scripts carry ?v= version strings, so they're safe to serve cache-first.
// Gemini calls are cross-origin and never touched here.
const VERSION = "v1.4"; // keep equal to APP_VERSION in js/app.js
const CACHE = `dojo-${VERSION}`;
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", `companies.json?v=${VERSION}`];

// Precache the shell plus every script the page references, so the app works offline after one visit.
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    const html = await (await fetch("index.html", { cache: "no-cache" })).text();
    await c.addAll([...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./", copy)); return res; })
        .catch(() => caches.match("./").then(r => r || caches.match("index.html")))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
