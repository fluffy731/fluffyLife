// Cache-first offline shell. Bump VERSION to invalidate after content changes.
const VERSION = "v1";
const CACHE = `hanja-korean-${VERSION}`;
const FILES = [
  "./", "./index.html", "./style.css", "./app.js", "./manifest.json",
  "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-512.png",
  "./lib/sm2.js", "./lib/track.js", "./lib/hour.js", "./lib/store.js", "./lib/validate.js",
  "./data/pack.js", "./data/vocab.js", "./data/vocab-int.js", "./data/vocab-adv.js", "./data/vocab-beg.js", "./data/grammar.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return res;
    }))
  );
});
