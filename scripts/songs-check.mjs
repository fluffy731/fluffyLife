// Songs tab (Korean app) in a real browser, with LRCLIB and the Claude API replaced by local fakes.
//   PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node scripts/songs-check.mjs
// The lyrics are invented (test/fixtures/songs.js): real lyrics never go in this public repo.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer(async (req, res) => {
  let p = req.url.split("?")[0]; if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(process.cwd(), p)); res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;
const out = []; const ok = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
const browser = await chromium.launch();

// ---- the tab exists in the Korean app only ----
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base + "korean/", { waitUntil: "networkidle" });
  const tabs = await page.evaluate(() => [...document.querySelectorAll("#tabs button")].map((b) => b.textContent.trim()));
  ok(`Korean app has 7 tabs ending in Songs (${tabs.join(",")})`, tabs.length === 7 && tabs[6].endsWith("Songs"));
  await page.click('[data-tab="songs"]');
  await page.waitForSelector("#view .songs");
  const text = await page.textContent("#view");
  ok("empty Songs tab offers Add song and Import list", text.includes("No songs yet") && text.includes("Add song") && text.includes("Import list"));
  await page.goto(base + "yue/", { waitUntil: "networkidle" });
  ok("Cantonese app still has 6 tabs", (await page.locator("#tabs button").count()) === 6);
  await page.close();
}

// ---- no IndexedDB: a message, and the rest of the app still works ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => Object.defineProperty(window, "indexedDB", { get: () => undefined, configurable: true }));
  const page = await ctx.newPage();
  await page.goto(base + "korean/", { waitUntil: "networkidle" });
  await page.click('[data-tab="songs"]');
  await page.waitForTimeout(200);
  ok("no IndexedDB: Songs explains it can't save", (await page.textContent("#view")).includes("Songs can't be saved on this device"));
  await page.click('[data-tab="home"]');
  ok("no IndexedDB: Home still renders", (await page.locator(".route").count()) === 1);
  await ctx.close();
}

// ---- the full flow, with LRCLIB and the Claude API faked ----
const { LYRICS } = await import(join(process.cwd(), "test/fixtures/songs.js"));
let apiMode = "ok", apiDelay = 0, lrclibHits = null; const apiBodies = [];
const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, OPTIONS" };
// The SDK streams: answer with the same server-sent events the Messages API sends.
function sse(json) {
  const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
  return ev("message_start", { message: { id: "msg_1", type: "message", role: "assistant", model: "claude-haiku-5-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 3000, output_tokens: 1 } } })
    + ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } })
    + ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: JSON.stringify(json) } })
    + ev("content_block_stop", { index: 0 })
    + ev("message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 800 } })
    + ev("message_stop", {});
}
function analysisFor(body) {
  const lines = body.messages[0].content.split("\n");
  return { lines: lines.map((_, i) => ({ n: i + 1, zh: `中文${i + 1}`, en: `English ${i + 1}`,
    grammar: [{ form: i ? "-아도/어도" : "-게 되다", appId: null, en: i ? "even if" : "come to", zh: i ? "即使" : "變得", note: "note" }],
    words: [{ ko: "웃게", base: `웃다${i}`, hanja: null, zh: "笑", en: "laugh", pos: "v" }] })) };
}
async function mockNetwork(target) {
  await target.route("https://lrclib.net/api/search**", (r) => r.fulfill({ headers: CORS, contentType: "application/json",
    body: JSON.stringify(lrclibHits ?? [{ trackName: "빗소리", artistName: "가수", albumName: "A", duration: 180, instrumental: false, plainLyrics: LYRICS, syncedLyrics: null }]) }));
  await target.route("https://api.anthropic.com/**", async (r) => {
    if (r.request().method() === "OPTIONS") return r.fulfill({ status: 204, headers: CORS });
    const body = JSON.parse(r.request().postData() || "{}"); apiBodies.push(body);
    if (apiDelay) await new Promise((ok) => setTimeout(ok, apiDelay));
    if (apiMode === "400") return r.fulfill({ status: 400, headers: CORS, contentType: "application/json", body: JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "Your credit balance is too low to access the Anthropic API." } }) });
    if (apiMode === "401") return r.fulfill({ status: 401, headers: CORS, contentType: "application/json", body: JSON.stringify({ type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } }) });
    return r.fulfill({ status: 200, headers: { ...CORS, "content-type": "text/event-stream" }, body: sse(analysisFor(body)) });
  });
}
const stateOf = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("korean.v1") || "{}"));
let backupText = null;
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", acceptDownloads: true });
  await mockNetwork(ctx);
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  await page.clock.install({ time: new Date("2026-11-03T09:00:00") });
  await page.goto(base + "korean/", { waitUntil: "networkidle" });

  // Key in Settings: stored on its own, never inside the saved state.
  await page.click('[data-tab="settings"]');
  await page.fill("#song-key", "  sk-ant-test-key-1234  ");
  await page.click('[data-s="key-save"]');
  ok("API key saved under its own key", (await page.evaluate(() => localStorage.getItem("korean.songs.apiKey"))) === "sk-ant-test-key-1234");
  ok("API key not in the saved state", !(await page.evaluate(() => localStorage.getItem("korean.v1") || "")).includes("sk-ant"));
  ok("Settings shows the key masked", (await page.textContent("#view")).includes("sk-ant-…1234"));

  // Search, pick, save, translate.
  await page.click('[data-tab="songs"]');
  await page.click('[data-s="add"]');
  await page.fill("#song-title", "빗소리"); await page.fill("#song-artist", "가수");
  await page.click('[data-s="search"]');
  await page.waitForSelector('[data-s="pick"]');
  await page.click('[data-s="pick"]');
  await page.click('[data-s="save"]');
  await page.click('[data-s="translate"]');
  await page.waitForSelector(".song-sum");
  ok("song page shows 4 lyric rows", (await page.locator(".song-line").count()) === 4);
  ok("Korean rows show Chinese", (await page.locator(".song-line .zh").count()) === 3 && (await page.textContent(".song-line .zh")).includes("中文1"));
  ok("summary shows the cost", (await page.textContent(".song-sum")).includes("US$"));
  ok("one API call, with the 2 unique lines numbered", apiBodies.length === 1 && apiBodies[0].messages[0].content === "1. 너를 볼 때마다 웃게 돼\n2. 비가 와도 괜찮아" && apiBodies[0].model === "claude-haiku-5-5");

  // Add to study: a grammar point the app already teaches (-게 되다) schedules the app's own card;
  // a word it doesn't have becomes a new card. Both are due a day later.
  const T0 = Date.parse("2026-11-03T09:00:00");
  const inADay = (p) => p && p.due - T0 > 20 * 3600e3 && p.due - T0 < 30 * 3600e3;
  const before = await stateOf(page);
  await page.locator(".song-line.item").first().click();
  await page.locator('.song-line.item.open [data-s="study"][data-kind="grammar"]').first().click();
  const mid = await stateOf(page);
  const newIds = Object.keys(mid.progress).filter((k) => !(k in (before.progress || {})));
  ok("Add to study on a known grammar point schedules the app's own card", newIds.length === 1 && !newIds[0].startsWith("u") && inADay(mid.progress[newIds[0]]) && (mid.custom || []).length === (before.custom || []).length);
  await page.locator('.song-line.item.open [data-s="study"][data-kind="word"]').first().click();
  const after = await stateOf(page);
  const added = (after.custom || []).filter((c) => !(mid.custom || []).some((b) => b.id === c.id));
  ok("Add to study on a new word makes one card due in a day", added.length === 1 && added[0].ko === "웃다0" && inADay(after.progress[added[0].id]));
  ok("button now says In reviews", (await page.locator(".song-line.item.open .in-reviews").count()) >= 1);
  await page.locator(".song-line.item.open .in-reviews").first().click();
  ok("second tap adds nothing", ((await stateOf(page)).custom || []).length === (after.custom || []).length);
  const dueBefore = parseInt((await page.textContent("#due-badge")) || "0", 10) || 0;
  await page.clock.fastForward("25:00:00");
  await page.click('[data-tab="home"]');
  ok("both cards are due the next day", parseInt(await page.textContent("#due-badge"), 10) === dueBefore + 2);

  // Export: songs in the file, key not.
  await page.click('[data-tab="settings"]');
  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("[data-export]")]);
  backupText = await readFile(await dl.path(), "utf8");
  const backup = JSON.parse(backupText);
  ok("backup has the song", Array.isArray(backup.songs) && backup.songs.length === 1 && backup.songs[0].status === "done");
  ok("backup has no API key", !JSON.stringify(backup).includes("sk-ant"));

  // A song with no Korean costs nothing. (The Songs tab reopens the last song viewed.)
  await page.click('[data-tab="songs"]');
  ok("Songs tab reopens the last song viewed", (await page.locator(".song-sum").count()) === 1);
  await page.click('[data-s="back"]');
  await page.click('[data-s="add"]');
  await page.fill("#song-title", "English one"); await page.fill("#song-lyrics", "Oh baby\nla la");
  await page.click('[data-s="save"]');
  ok("no Korean lines: no Translate button, no call", (await page.locator('[data-s="translate"]').count()) === 0 && (await page.textContent("#view")).includes("no Korean lines") && apiBodies.length === 1);

  // A refused key: plain message, lyrics kept.
  apiMode = "401";
  await page.click('[data-s="back"]');
  await page.click('[data-s="add"]');
  await page.fill("#song-title", "두 번째"); await page.fill("#song-lyrics", "비가 와도 괜찮아");
  await page.click('[data-s="save"]');
  await page.click('[data-s="translate"]');
  await page.waitForSelector(".song-msg");
  ok("401: message names the key", (await page.textContent(".song-msg")).includes("API key was refused"));
  ok("401: lyrics still shown", (await page.textContent("#view")).includes("비가 와도 괜찮아"));
  apiMode = "ok";

  // Import list: duplicates skipped, new songs ticked for one batch tap.
  await page.click('[data-s="back"]');
  await page.click('[data-s="import"]');
  await page.fill("#song-list", "제목 – 가수\n제목 – 가수\n봄 – 그룹");
  await page.click('[data-s="importGo"]');
  ok("Import list adds 2 queued songs", (await page.locator('.song-row[data-status="queued"]').count()) === 2);
  ok("batch button offers the 2 imported songs", (await page.textContent('[data-s="batch"]')).includes("Translate 2 songs"));
  await page.click('[data-s="batch"]');
  await page.waitForFunction(() => document.querySelectorAll('.song-row[data-status="done"]').length === 3, null, { timeout: 15000 });
  ok("batch fetched lyrics and translated both", apiBodies.length === 4);
  await ctx.close();
}

// ---- a batch running in the background must not wipe typing or bring back a deleted song ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await mockNetwork(ctx);
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(base + "korean/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("korean.songs.apiKey", "sk-ant-test-key-1234"));
  await page.click('[data-tab="songs"]');
  await page.click('[data-s="import"]');
  await page.fill("#song-list", "하나 – 가수\n둘 – 가수");
  await page.click('[data-s="importGo"]');
  apiDelay = 1500;
  await page.click('[data-s="batch"]');
  await page.click('[data-s="add"]');
  await page.fill("#song-title", "손으로 쓴 노래"); await page.fill("#song-lyrics", "직접 붙여 넣은 가사");
  await page.waitForTimeout(4000);
  ok("batch finishing keeps pasted lyrics and title", (await page.inputValue("#song-lyrics")) === "직접 붙여 넣은 가사" && (await page.inputValue("#song-title")) === "손으로 쓴 노래");
  await page.click('[data-s="back"]');
  await page.waitForFunction(() => !document.querySelector(".song-msg")?.textContent.includes("Translating"), null, { timeout: 15000 });

  // Delete a song while the batch is translating it.
  await page.click('[data-s="import"]');
  await page.fill("#song-list", "지울 노래 – 가수");
  await page.click('[data-s="importGo"]');
  const before = apiBodies.length;
  await page.click('[data-s="batch"]');
  await page.waitForTimeout(300);
  await page.locator('.song-row [data-s="open"]', { hasText: "지울 노래" }).click();
  await page.click('[data-s="delete"]');
  await page.waitForTimeout(2500);
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[data-tab="songs"]');
  await page.waitForSelector(".song-row");
  ok("a song deleted during a batch stays deleted", (await page.locator(".song-row", { hasText: "지울 노래" }).count()) === 0 && apiBodies.length === before + 1);

  // A request Claude rejects outright: say why instead of "Retry".
  apiDelay = 0; apiMode = "400";
  await page.click('[data-s="add"]');
  await page.fill("#song-title", "잔액"); await page.fill("#song-lyrics", "비가 와도 괜찮아");
  await page.click('[data-s="save"]');
  await page.click('[data-s="translate"]');
  await page.waitForSelector(".song-msg");
  ok("400: message gives the API's reason", (await page.textContent(".song-msg")).includes("credit balance is too low"));
  apiMode = "ok";
  await ctx.close();
}

// ---- a long batch: resumes after the app is reopened, keeps the screen awake, can be stopped ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await mockNetwork(ctx);
  // A stand-in Screen Wake Lock that counts requests and releases.
  await ctx.addInitScript(() => {
    window.__locks = { req: 0, rel: 0 };
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request: async () => { window.__locks.req++; return { release: async () => { window.__locks.rel++; } }; } } });
  });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(base + "korean/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("korean.songs.apiKey", "sk-ant-test-key-1234"));
  await page.click('[data-tab="songs"]');
  await page.click('[data-s="import"]');
  await page.fill("#song-list", "하나 – 가수\n둘 – 가수\n셋 – 가수");
  await page.click('[data-s="importGo"]');
  // Closing the app forgets the ticks; one tap still covers every song left to translate.
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[data-tab="songs"]');
  await page.waitForSelector(".song-row");
  ok("after reopening, the batch offers every untranslated song", (await page.textContent('[data-s="batch"]')).includes("Translate all 3 untranslated"));

  // Stop after the song in progress: the rest stay untranslated for next time.
  apiDelay = 1200;
  const before = apiBodies.length;
  await page.click('[data-s="batch"]');
  await page.waitForSelector('[data-s="stop"]');
  ok("a running batch asks to keep the screen open", (await page.textContent(".song-msg")).includes("Keep this screen open"));
  ok("a running batch keeps the screen awake", (await page.evaluate(() => window.__locks.req)) === 1);
  await page.click('[data-s="stop"]');
  await page.waitForFunction(() => !document.querySelector('[data-s="stop"]'), null, { timeout: 15000 });
  ok("Stop ends the batch after the current song", apiBodies.length === before + 1 && (await page.locator('.song-row[data-status="done"]').count()) === 1);
  ok("the screen lock is released when the batch ends", (await page.evaluate(() => window.__locks.rel)) === 1);
  ok("stopping says how many are done", (await page.textContent(".song-msg")).includes("Stopped: translated 1 of 3"));

  // Resume: the button now covers the 2 left; a full run reports its result.
  apiDelay = 0;
  ok("resume offers the 2 left", (await page.textContent('[data-s="batch"]')).includes("Translate all 2 untranslated"));
  await page.click('[data-s="batch"]');
  await page.waitForFunction(() => document.querySelectorAll('.song-row[data-status="done"]').length === 3, null, { timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector('[data-s="stop"]'), null, { timeout: 15000 });
  ok("a finished batch reports its result", (await page.textContent(".song-msg")).includes("Translated 2 of 2"));
  ok("nothing left to translate: no batch button", (await page.locator('[data-s="batch"]').count()) === 0);

  // A song that failed in a batch says why when opened.
  apiMode = "401";
  await page.click('[data-s="import"]');
  await page.fill("#song-list", "넷 – 가수");
  await page.click('[data-s="importGo"]');
  await page.click('[data-s="batch"]');
  await page.waitForFunction(() => !document.querySelector('[data-s="stop"]') && document.querySelector('.song-row[data-status="error"]'), null, { timeout: 15000 });
  ok("a failed batch song is counted", (await page.textContent(".song-msg")).includes("1 needs attention"));
  await page.locator('.song-row [data-s="open"]', { hasText: "넷" }).click();
  ok("the failed song says why", (await page.textContent(".song-msg")).includes("API key was refused"));
  apiMode = "ok";
  await ctx.close();
}

// ---- find a song: by title, by a lyric or its translation, and filter by status ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await mockNetwork(ctx);
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(base + "korean/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("korean.songs.apiKey", "sk-ant-test-key-1234"));
  await page.click('[data-tab="songs"]');
  await page.click('[data-s="import"]');
  await page.fill("#song-list", "봄 – 그룹\n바다 – 가수 E\nLove story – 볼빨간사춘기");
  await page.click('[data-s="importGo"]');
  await page.click('[data-s="add"]');
  await page.fill("#song-title", "우산"); await page.fill("#song-lyrics", "비가 와도 괜찮아");
  await page.click('[data-s="save"]');
  apiMode = "ok"; apiDelay = 0;
  await page.click('[data-s="translate"]');
  await page.waitForSelector(".song-sum");
  await page.click('[data-s="back"]');
  ok("the list has a find box", (await page.locator("#song-q").count()) === 1);

  await page.evaluate(() => { window.__sq = document.querySelector("#song-q"); });
  await page.type("#song-q", "바다");
  ok("find box is not replaced while typing", await page.evaluate(() => window.__sq === document.querySelector("#song-q")));
  ok("finds a song by title", (await page.locator(".song-row").count()) === 1 && (await page.textContent(".song-row")).includes("바다"));
  ok("says how many match", (await page.textContent("#song-results")).includes("1 of 4 songs"));
  await page.fill("#song-q", "괜찮");
  ok("finds a song by a lyric and shows the line", (await page.locator(".song-row").count()) === 1 && (await page.textContent(".song-row .song-hit")).includes("비가 와도 괜찮아"));
  await page.fill("#song-q", "English 1");
  ok("finds a song by its English translation", (await page.locator(".song-row").count()) === 1 && (await page.textContent(".song-row")).includes("우산"));
  await page.fill("#song-q", "zzz");
  ok("no match says so", (await page.locator(".song-row").count()) === 0 && (await page.textContent("#song-results")).includes("No songs match"));
  await page.fill("#song-q", "");
  ok("clearing the box shows every song", (await page.locator(".song-row").count()) === 4);

  // Status chips narrow the list; the box and chips combine.
  await page.click('[data-sfilter="done"]');
  ok("Translated chip shows the 1 translated song", (await page.locator(".song-row").count()) === 1);
  await page.click('[data-sfilter="todo"]');
  ok("To translate chip shows the 3 imported songs", (await page.locator(".song-row").count()) === 3);
  await page.fill("#song-q", "love");
  ok("chip and box combine", (await page.locator(".song-row").count()) === 1);
  await page.click('[data-s="open"]');
  await page.click('[data-s="back"]');
  ok("the search is kept after opening a song", (await page.inputValue("#song-q")) === "love" && (await page.locator(".song-row").count()) === 1);
  await ctx.close();
}

// ---- wrong lyrics: an English version is never translated, and other lyrics can be picked or pasted ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  await mockNetwork(ctx);
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(base + "korean/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.setItem("korean.songs.apiKey", "sk-ant-test-key-1234"));
  const hit = (album, lyrics) => ({ trackName: "Parallel Night", artistName: "서영주", albumName: album, duration: 200, instrumental: false, plainLyrics: lyrics, syncedLyrics: null });
  const EN = hit("English", "You looked so pretty last night\nIt was so hard to fake it");
  const KO = hit("Korean", LYRICS), KO2 = hit("Korean live", "비가 와도 괜찮아\n비가 와도");
  apiMode = "ok"; apiDelay = 0; lrclibHits = [EN];
  await page.click('[data-tab="songs"]');
  await page.click('[data-s="import"]');
  await page.fill("#song-list", "Parallel Night – 서영주");
  await page.click('[data-s="importGo"]');
  const before = apiBodies.length;
  await page.click('[data-s="batch"]');
  await page.waitForFunction(() => document.querySelector('.song-row[data-status="error"]') && !document.querySelector('[data-s="stop"]'), null, { timeout: 15000 });
  ok("only English lyrics found: the song says no Korean lyrics", (await page.textContent(".song-row")).includes("no Korean lyrics"));
  ok("only English lyrics found: Claude is not called", apiBodies.length === before);
  ok("a song waiting for Korean lyrics is not offered to the next batch", (await page.locator('[data-s="batch"]').count()) === 0);

  // Find other lyrics: every result with its language; a Korean one makes the song translatable.
  lrclibHits = [EN, KO];
  await page.locator('.song-row [data-s="open"]', { hasText: "Parallel Night" }).click();
  ok("the song explains the English-only lyrics", (await page.textContent(".song-msg")).includes("without Korean"));
  await page.click('[data-s="relyrics"]');
  await page.waitForSelector(".lyric-hit");
  const hits = await page.locator(".lyric-hit").allTextContents();
  ok("Find other lyrics lists each result with its language", hits.length === 2 && hits[0].includes("No Korean") && hits[1].includes("Korean") && hits[1].includes("너를 볼 때마다"));
  ok("a result without Korean can't be picked", (await page.locator('.lyric-hit [data-s="pickLyrics"]').count()) === 1);
  await page.click('[data-s="pickLyrics"]');
  ok("picking Korean lyrics makes the song translatable", (await page.locator('[data-s="translate"]').count()) === 1 && (await page.textContent("#view")).includes("너를 볼 때마다 웃게 돼"));
  await page.click('[data-s="translate"]');
  await page.waitForSelector(".song-sum");

  // A translated song: picking other lyrics asks first, then the old translation goes.
  lrclibHits = [KO, KO2];
  await page.click('[data-s="relyrics"]');
  await page.waitForSelector(".lyric-hit");
  await page.locator('.lyric-hit', { hasText: "Korean live" }).locator('[data-s="pickLyrics"]').click();
  ok("new lyrics replace the translated ones and drop the old translation", (await page.locator(".song-sum").count()) === 0 && (await page.locator('[data-s="translate"]').count()) === 1 && (await page.textContent("#view")).includes("비가 와도"));

  // Or paste: the change panel has its own paste box.
  await page.click('[data-s="relyrics"]');
  await page.waitForSelector(".lyric-hit");
  await page.fill("#song-lyrics", "직접 고친 가사");
  await page.click('[data-s="savelyrics"]');
  ok("pasted lyrics replace the old ones", (await page.textContent("#view")).includes("직접 고친 가사") && !(await page.textContent("#view")).includes("비가 와도 괜찮아"));

  // English lyrics saved before this check existed: no Translate button, and a batch marks them without a call.
  await page.click('[data-s="back"]');
  await page.click('[data-s="add"]');
  await page.fill("#song-title", "Old fetch"); await page.fill("#song-lyrics", "Hello there\nGood night");
  await page.click('[data-s="save"]');
  ok("lyrics with no Korean: no Translate button, a way to fix it instead", (await page.locator('[data-s="translate"]').count()) === 0 && (await page.textContent("#view")).includes("no Korean lines") && (await page.locator('[data-s="relyrics"]').count()) >= 1);
  await ctx.close();
  lrclibHits = null;
}

// ---- restore on a fresh phone, then read it offline ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(base + "korean/", { waitUntil: "networkidle" });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[data-tab="settings"]');
  await page.setInputFiles("#file", { name: "korean-backup.json", mimeType: "application/json", buffer: Buffer.from(backupText) });
  await page.click('[data-tab="songs"]');
  await page.waitForSelector(".song-row");
  ok("import restores the song", (await page.locator(".song-row").count()) === 1);
  await ctx.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.click('[data-tab="songs"]');
  await page.click('.song-row [data-s="open"]');
  await page.waitForSelector(".song-line .zh");
  ok("translated song opens offline", (await page.textContent(".song-line .zh")).includes("中文1"));
  await ctx.close();
}

await browser.close(); srv.close();
console.log(out.join("\n"));
process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
