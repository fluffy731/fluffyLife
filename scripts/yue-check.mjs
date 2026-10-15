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
async function speechRun(voices) {
  const page = await b.newPage();
  await page.addInitScript((vs) => {
    window.__spoken = []; window.__alerts = [];
    window.alert = (m) => window.__alerts.push(m);
    // speechSynthesis is a read-only getter on Window, so it has to be redefined, not assigned.
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => vs.map((lang) => ({ lang, name: lang })), cancel() {}, speak(u) { window.__spoken.push({ lang: u.lang, text: u.text }); } } });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: class { constructor(t) { this.text = t; } } });
  }, voices);
  await page.goto(base + "yue/", { waitUntil: "networkidle" });
  await page.click(".say");
  const r = await page.evaluate(() => ({ spoken: window.__spoken, alerts: window.__alerts }));
  await page.close(); return r;
}
{
  const hk = await speechRun(["zh-HK", "zh-TW", "ko-KR"]);
  ok("zh-HK voice preferred", hk.spoken[0]?.lang === "zh-HK" && /\p{Script=Han}/u.test(hk.spoken[0]?.text));
  const tw = await speechRun(["zh-TW", "ko-KR"]);
  ok("falls back to zh-TW", tw.spoken[0]?.lang === "zh-TW");
  const none = await speechRun(["ko-KR", "en-US"]);
  ok("no Cantonese voice → Korean hint, nothing spoken", none.spoken.length === 0 && /광둥어/.test(none.alerts[0] || ""));
  const notLoaded = await speechRun([]); // Safari often returns [] until voices finish loading
  ok("voices not loaded yet → still speaks zh-HK, no alert", notLoaded.spoken[0]?.lang === "zh-HK" && notLoaded.alerts.length === 0);
}

// 3. offline after first visit (review focus 4)
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
await b.close(); srv.close();
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
