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
  ok("empty Songs tab offers Add song and Import list", text.includes("No songs yet") && text.includes("+ Add song") && text.includes("Import list"));
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
let apiMode = "ok", apiDelay = 0; const apiBodies = [];
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
    body: JSON.stringify([{ trackName: "빗소리", artistName: "가수", albumName: "A", duration: 180, instrumental: false, plainLyrics: LYRICS, syncedLyrics: null }]) }));
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
  const dueBefore = Number((await page.textContent("#due-badge")) || 0);
  await page.clock.fastForward("25:00:00");
  await page.click('[data-tab="home"]');
  ok("both cards are due the next day", Number(await page.textContent("#due-badge")) === dueBefore + 2);

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
  await page.click('[data-s="translate"]');
  ok("no Korean lines: nothing to translate, no call", (await page.textContent(".song-msg")).includes("Nothing to translate") && apiBodies.length === 1);

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
