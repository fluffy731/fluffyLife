// Offline shell: network-first so fixes reach installed copies, cache fallback when offline.
// VERSION is rewritten to the commit SHA by the Pages workflow at deploy time.
const VERSION = "dev";
const PREFIX = "hanja-korean-";
const CACHE = `${PREFIX}${VERSION}`;
const FILES = [
  "./", "./index.html", "./style.css", "./app.js", "./manifest.json",
  "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-512.png",
  "./lib/sm2.js", "./lib/track.js", "./lib/hour.js", "./lib/store.js", "./lib/validate.js", "./lib/pron.js", "./lib/hangul.js", "./lib/jyutping.js", "./lib/bridge.js", "./lib/validate-yue.js",
  "./packs/ko.js", "./cards/ko.js", "./ui/en.js",
  "./packs/yue.js", "./cards/yue.js", "./ui/ko.js",
  "./yue/", "./yue/index.html", "./yue/manifest.json", "./icons/yue.svg", "./icons/yue-180.png", "./icons/yue-512.png",
  "./data/yue/pack.js", "./data/yue/vocab.js", "./data/yue/vocab-a0.js", "./data/yue/vocab-a1.js", "./data/yue/vocab-a2.js", "./data/yue/grammar.js", "./data/yue/hanja-ko.js", "./data/yue/legacy-ids.js",
  "./data/pack.js", "./data/vocab.js", "./data/vocab-int.js", "./data/vocab-adv.js", "./data/vocab-beg.js", "./data/grammar.js",
];

self.addEventListener("install", (e) => {
  // cache: "reload" bypasses the HTTP cache so a fresh install never mixes old and new files.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  // Only our own old caches: Cache Storage is shared by every app on this origin.
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // GitHub Pages sends Cache-Control: max-age=600. A plain fetch() would take the HTTP cache and keep
  // serving the previous deploy for up to 10 minutes; "no-cache" revalidates with the server (cheap 304s).
  const fresh = e.request.mode === "navigate" ? new Request(e.request.url, { cache: "no-cache" }) : new Request(e.request, { cache: "no-cache" });
  e.respondWith(
    fetch(fresh).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match(new URL(e.request.url).pathname.includes("/yue") ? "./yue/index.html" : "./index.html")))
  );
});
