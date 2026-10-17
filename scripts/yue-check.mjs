// Behavioural checks for the Cantonese app (/yue/). Needs Playwright (PLAYWRIGHT_MODULE).
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer(async (req, res) => {
  let p = req.url.split("?")[0]; if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(process.cwd(), p)); res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;
const out = []; const ok = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
const b = await chromium.launch();

// 1. learning writes yue.v1 only (review focus 3)
{
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; page.on("pageerror", (e) => errs.push(e.message)); page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(base + "yue/", { waitUntil: "networkidle" });
  await page.click('[data-tab="learn"]');
  let n = 0; while ((await page.inputValue("#unit-pick")) === "a0-1" && (await page.locator("[data-flip]").count()) && n < 60) { await page.click("[data-flip]"); await page.click('[data-grade="good"]'); n++; }
  const keys = await page.evaluate(() => ({ ko: localStorage.getItem("korean.v1"), yue: Object.keys(JSON.parse(localStorage.getItem("yue.v1")).progress).length }));
  ok(`learned unit 1 (${n} items) into yue.v1`, keys.yue === n && n >= 24);
  ok("korean.v1 untouched", keys.ko === null);
  await page.click('[data-tab="home"]');
  ok("home now on unit 2", (await page.textContent(".card .row b")).includes("2단원"));
  ok("no console or page errors", errs.length === 0);
  await page.close();
}

// 2. speech: zh-HK missing → zh-TW; none → Korean hint (review focus 5)
async function speechRun(voices, path = "yue/") {
  const page = await b.newPage();
  await page.addInitScript((vs) => {
    window.__spoken = []; window.__alerts = []; window.__order = [];
    // iOS 16.4+ Audio Session API: record its type at the moment speak() is called.
    const session = { _t: "auto", get type() { return this._t; }, set type(v) { this._t = v; window.__order.push(`type=${v}`); } };
    Object.defineProperty(navigator, "audioSession", { configurable: true, value: session });
    window.alert = (m) => window.__alerts.push(m);
    // speechSynthesis is a read-only getter on Window, so it has to be redefined, not assigned.
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => vs.map((lang) => ({ lang, name: lang })), cancel() {}, speak(u) { window.__order.push(`speak@${navigator.audioSession.type}`); window.__spoken.push({ lang: u.lang, text: u.text }); } } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(t) { this.text = t; } } });
  }, voices);
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.click(".say");
  const r = await page.evaluate(() => ({ spoken: window.__spoken, alerts: window.__alerts, order: window.__order }));
  await page.close(); return r;
}
{
  const hk = await speechRun(["zh-HK", "zh-TW", "ko-KR"]);
  ok("zh-HK voice preferred", hk.spoken[0]?.lang === "zh-HK" && /\p{Script=Han}/u.test(hk.spoken[0]?.text));
  // iPhone home-screen app: speech ran (start/end fired) but was inaudible — the default audio session
  // obeys the ring/silent switch. "playback" must be set before speak() is called.
  ok("Cantonese: audio session set to playback before speaking", hk.order.join(",") === "type=playback,speak@playback");
  const ko = await speechRun(["ko-KR"], "korean/");
  ok("Korean: audio session set to playback before speaking", ko.order.join(",") === "type=playback,speak@playback");
  const yue = await speechRun(["yue-HK", "ko-KR"]);
  ok("Android yue-HK voice accepted", yue.spoken[0]?.lang === "yue-HK");
  const tw = await speechRun(["zh-TW", "ko-KR"]);
  ok("Mandarin-only device: nothing spoken, Korean hint shown (review I6)", tw.spoken.length === 0 && /광둥어/.test(tw.alerts[0] || ""));
  const none = await speechRun(["ko-KR", "en-US"]);
  ok("no Cantonese voice → Korean hint, nothing spoken", none.spoken.length === 0 && /광둥어/.test(none.alerts[0] || ""));
  const notLoaded = await speechRun([]); // Safari often returns [] until voices finish loading
  ok("voices not loaded yet → still speaks zh-HK, no alert", notLoaded.spoken[0]?.lang === "zh-HK" && notLoaded.alerts.length === 0);
}

// 2b. recorded clips: 🔊 plays the file (audible on silent) and does not use the speech engine
{
  const { buildJobs } = await import("../lib/audio-jobs.js");
  const { yuePack } = await import("../packs/yue.js");
  const { koPack } = await import("../packs/ko.js");
  const wav = Buffer.from("UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=", "base64");
  async function clipRun(path, pack, withIndex) {
    const page = await b.newPage();
    const names = buildJobs(pack).map((j) => j.file.split("/").pop().replace(".mp3", ""));
    await page.route("**/audio/*/index.json", (r) => (withIndex ? r.fulfill({ contentType: "application/json", body: JSON.stringify({ clips: names }) }) : r.fulfill({ status: 404, body: "" })));
    await page.route("**/audio/*/*.mp3", (r) => r.fulfill({ contentType: "audio/mpeg", body: wav }));
    await page.addInitScript(() => {
      window.__played = []; window.__spoken = [];
      HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); return Promise.resolve(); };
      Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [{ lang: "zh-HK", name: "Sinji" }, { lang: "ko-KR", name: "Yuna" }], cancel() {}, speak(u) { window.__spoken.push(u.text); } } });
      Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(t) { this.text = t; } } });
    });
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(300); // clip index loads in the background
    await page.click(".say");
    const r = await page.evaluate(() => ({ played: window.__played, spoken: window.__spoken }));
    await page.close(); return r;
  }
  const y = await clipRun("yue/", yuePack, true);
  ok("Cantonese 🔊 plays the recorded clip, not the speech engine", y.played.length === 1 && /\/audio\/yue\/[0-9a-f]{16}\.mp3$/.test(y.played[0]) && y.spoken.length === 0);
  const k = await clipRun("korean/", koPack, true);
  ok("Korean 🔊 plays the recorded clip, not the speech engine", k.played.length === 1 && /\/audio\/ko\/[0-9a-f]{16}\.mp3$/.test(k.played[0]) && k.spoken.length === 0);
  const none = await clipRun("yue/", yuePack, false);
  ok("no recordings deployed → falls back to the speech engine", none.played.length === 0 && none.spoken.length === 1);
}

// 3. review fixes: legacy-id migration, wipe dialog text, unfiltered Browse, tone key, review direction
{
  const page = await b.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("yue.v1", JSON.stringify({ progress: { "y01-01": { ease: 2.5, interval: 1, reps: 1, due: 0 } }, custom: [], settings: {} })); } });
  await page.goto(base + "yue/", { waitUntil: "networkidle" });
  const prog = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("yue.v1")).progress));
  ok("release-1 progress migrated to stable ids (y01-01 → y:詩)", prog.length === 1 && prog[0] === "y:詩");
  ok("Home shows the tone key", (await page.locator(".tonekey .tk").count()) === 6);
  await page.click('[data-tab="browse"]');
  ok("unfiltered Browse has no raw ${…}", !(await page.textContent("#view")).includes("${"));
  await page.click('[data-tab="settings"]');
  const msg = await page.evaluate(() => { let m = null; const c = window.confirm; window.confirm = (x) => { m = x; return false; }; document.querySelector("[data-wipe]").click(); window.confirm = c; return m; });
  ok("wipe dialog has its Korean text (review I1)", /진도/.test(msg || ""));
  await page.click('[data-setting="direction"][data-value="meaning"]');
  await page.click('[data-tab="review"]');
  ok("meaning → sound: Review front shows the Korean meaning", (await page.locator(".ko-front").count()) === 1 && (await page.locator("#card .syl").count()) === 0);
  await page.close();
}

// 4. offline after first visit (review focus 4)
{
  const ctx = await b.newContext();
  const page = await ctx.newPage();
  await page.goto(base + "yue/", { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" }); // controlled by the worker now
  await ctx.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#view .stat", { timeout: 5000 }).catch(() => {});
  ok("renders offline", (await page.locator("#view .stat").count()) === 3 && (await page.title()).includes("광동어"));
  await ctx.close();
}

// 5. quiz: tone question with recorded clips; 🔊 inside an option plays without answering
{
  const { buildJobs } = await import("../lib/audio-jobs.js");
  const { yuePack } = await import("../packs/yue.js");
  const names = buildJobs(yuePack).map((j) => j.file.split("/").pop().replace(".mp3", ""));
  const wav = Buffer.from("UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=", "base64");
  async function quizPage(seed, offline = false) {
    // Service workers blocked: after the reload the worker would fetch the clip index itself, past these routes.
    const qctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    const page = await qctx.newPage();
    await page.route("**/audio/*/index.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ clips: names }) }));
    await page.route("**/audio/*/*.mp3", (r) => r.fulfill({ contentType: "audio/mpeg", body: wav }));
    await page.addInitScript((seed) => {
      globalThis.__QUIZ_TEST__ = true; globalThis.__QUIZ_SEED__ = seed; window.__played = [];
      HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); return Promise.resolve(); };
    }, seed);
    await page.goto(base + "yue/", { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      const { buildUnits } = await import("/lib/track.js"); const { yuePack: p } = await import("/packs/yue.js");
      const u = buildUnits(p.vocab, p.grammar, p.tiers.map((x) => x.key)).find((x) => x.key === "a0-1");
      localStorage.setItem("yue.v1", JSON.stringify({ progress: Object.fromEntries(u.items.map((i) => [i.id, { ease: 2.5, interval: 6, reps: 2, due: Date.now() + 9e9 }])), custom: [], settings: {} }));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(300); // clip index loads in the background
    if (offline) await qctx.setOffline(true);
    await page.click('[data-tab="quiz"]'); await page.click('[data-qstart="a0-1"]');
    return page;
  }
  const SEED = 1;
  const page = await quizPage(SEED);
  let tone = null, sayChecked = false;
  for (let i = 0; i < 15 && (await page.locator("[data-qopt]").count()); i++) {
    if (!tone && (await page.locator(".qtones").count())) {
      const before = await page.evaluate(() => window.__played.length);
      tone = { opts: await page.locator(".qtones .qopt").count(), playedOnOpen: before > 0 };
    }
    if (!sayChecked && (await page.locator(".qopt button.say").count())) {
      await page.locator(".qopt button.say").first().click();
      sayChecked = (await page.locator(".qopt.right, .qopt.wrong").count()) === 0 && (await page.evaluate(() => window.__played.length)) > 0;
      if (!sayChecked) sayChecked = "failed";
    }
    const a = await page.evaluate(() => window.__quizAnswer());
    await page.evaluate(() => { window.__played = []; });
    await page.click(`[data-qopt="${a}"]`, { position: { x: 12, y: 12 } }); await page.click("[data-qnext]");
  }
  ok(`tone question shows 6 options (seed ${SEED})`, tone?.opts === 6);
  ok("tone question plays its clip when it opens", tone?.playedOnOpen === true);
  ok("say option 🔊 plays without selecting", sayChecked === true);
  ok("unit test finishes with a pass", (await page.textContent(".qverdict")).includes("합격"));
  await page.context().close();
  // Offline, the clip index may be cached but the mp3s are not: audio questions must not be asked.
  const off = await quizPage(SEED, true);
  const captions = [];
  for (let i = 0; i < 15 && (await off.locator("[data-qopt]").count()); i++) {
    captions.push(await off.locator(".qprompt .small").textContent());
    await off.click(`[data-qopt="${await off.evaluate(() => window.__quizAnswer())}"]`, { position: { x: 12, y: 12 } }); await off.click("[data-qnext]");
  }
  ok("offline: no listening or tone questions", captions.length === 15 && !captions.some((c) => c.includes("몇 성") || c.includes("들은 말")));
  await off.context().close();
}
await b.close(); srv.close();
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
