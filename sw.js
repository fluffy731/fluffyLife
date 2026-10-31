// Offline shell: network-first so fixes reach installed copies, cache fallback when offline.
// VERSION is rewritten to the commit SHA by the Pages workflow at deploy time.
const VERSION = "dev";
const PREFIX = "hanja-korean-";
const CACHE = `${PREFIX}${VERSION}`;
const FILES = [
  "./", "./index.html", "./style.css", "./app.js",
  "./korean/", "./korean/index.html", "./korean/manifest.json",
  "./icons/icon.svg", "./icons/icon-180.png", "./icons/icon-512.png",
  "./lib/sm2.js", "./lib/track.js", "./lib/hour.js", "./lib/store.js", "./lib/validate.js", "./lib/pron.js", "./lib/hangul.js", "./lib/jyutping.js", "./lib/audio.js", "./lib/bridge.js", "./lib/validate-yue.js", "./lib/mix.js", "./lib/quiz.js", "./lib/interleave.js", "./lib/mongol.js", "./lib/validate-mn.js", "./lib/validate-en.js",
  "./news/", "./news/index.html", "./news/news.js", "./news/news.css", "./news/model.js", "./news/manifest.json", "./icons/news.svg", "./icons/news-180.png", "./icons/news-512.png",
  "./stocks/", "./stocks/index.html", "./stocks/stocks.js", "./stocks/stocks.css", "./stocks/model.js", "./stocks/manifest.json", "./icons/stocks.svg", "./icons/stocks-180.png", "./icons/stocks-512.png",
  "./quiz-view.js", "./quiz/ko.js", "./quiz/yue.js",
  "./packs/ko.js", "./packs/dict-ko.js", "./packs/dict-yue.js", "./packs/dict-en.js", "./cards/ko.js", "./ui/en.js", "./lib/dict.js",
  "./packs/yue.js", "./cards/yue.js", "./ui/ko.js",
  "./packs/mn.js", "./cards/mn.js", "./ui/zh.js", "./quiz/mn.js",
  "./packs/en.js", "./cards/en.js", "./ui/ko-en.js", "./quiz/en.js",
  "./mc/", "./mc/index.html", "./mc/mc.js", "./mc/mc.css", "./icons/mc.svg", "./icons/mc-180.png",
  "./travel/", "./travel/index.html", "./travel/travel.js", "./travel/model.js", "./travel/items.js", "./travel/plan.html", "./travel/plan.js", "./travel/plan-model.js", "./travel/travel.css", "./travel/manifest.json", "./icons/travel.svg", "./icons/travel-180.png", "./icons/travel-512.png",
  "./english/", "./english/index.html", "./english/manifest.json", "./icons/en.svg", "./icons/en-180.png", "./icons/en-512.png",
  "./data/en/pack.js", "./data/en/vocab.js", "./data/en/grammar.js", "./data/en/part1.js", "./data/en/part2.js", "./data/en/part3.js", "./data/en/part4.js",
  "./mongolian/", "./mongolian/index.html", "./mongolian/manifest.json", "./icons/mn.svg", "./icons/mn-180.png", "./icons/mn-512.png",
  "./data/mn/pack.js", "./data/mn/vocab.js", "./data/mn/vocab-a0.js", "./data/mn/vocab-a1.js", "./data/mn/vocab-a2.js", "./data/mn/grammar.js",
  "./data/yue/phrases.js", "./data/phrases-int.js", "./data/phrases-adv.js", "./data/phrases-beg.js",
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

const fallbackPage = (path) => (path.includes("/yue") ? "./yue/index.html" : path.includes("/mongolian") ? "./mongolian/index.html" : path.includes("/english") ? "./english/index.html" : path.includes("/news") ? "./news/index.html" : path.includes("/stocks") ? "./stocks/index.html" :path.includes("/mc/") ? "./mc/index.html" : path.includes("/travel/plan") ? "./travel/plan.html" : path.includes("/travel/") ? "./travel/index.html" : "./korean/index.html");

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // Recorded clips: iOS fetches media with Range requests; let the browser handle those directly.
  if (new URL(e.request.url).pathname.endsWith(".mp3") || e.request.headers.has("range")) return;
  // GitHub Pages sends Cache-Control: max-age=600. A plain fetch() would take the HTTP cache and keep
  // serving the previous deploy for up to 10 minutes; "no-cache" revalidates with the server (cheap 304s).
  const fresh = e.request.mode === "navigate" ? new Request(e.request.url, { cache: "no-cache" }) : new Request(e.request, { cache: "no-cache" });
  e.respondWith(
    fetch(fresh).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match(fallbackPage(new URL(e.request.url).pathname))))
  );
});
