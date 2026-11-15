// Behavioural checks for the Films app (/films/) against a feed built from the TMDB-shaped fixtures in
// test/fixtures/films. Needs Playwright (PLAYWRIGHT_MODULE, or importable as "playwright").
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join } from "node:path";
import { filmFrom, assemble } from "./build-films.mjs";

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" };
const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(process.cwd(), p)); res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/films/`;
const b = await chromium.launch();
const out = []; const ok = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
const errs = [];

// The feed: every fixture film, plus copies under new ids so rows and the grid have enough to show.
const details = JSON.parse(await readFile(join(process.cwd(), "test/fixtures/films/details.json"), "utf8"));
const real = Object.values(details).map((d) => filmFrom(d, ["HK"])).filter(Boolean);
const copies = [];
for (let i = 1; i <= 6; i++) for (const f of real) copies.push({ ...f, id: f.id * 100 + i, title: `${f.title} ${i}`, original: `${f.original} ${i}`, votes: Math.max(10, Math.round(f.votes / (i + 1))), rating: Math.round((f.rating - i * 0.15) * 10) / 10, pop: f.pop / (i + 1) });
export const FEED = assemble([...real, ...copies], "2026-11-15T03:00:00.000Z", "check", { calls: 0, failed: 0 });
const FEED_JSON = JSON.stringify(FEED);

async function newPage({ feed = true, scheme = "light", init = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", colorScheme: scheme });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  if (init) await page.addInitScript(init.fn, init.arg);
  await page.route("**/films/feed.json", (r) => (feed ? r.fulfill({ contentType: "application/json", body: FEED_JSON }) : r.fulfill({ status: 404, body: "" })));
  await page.route(/^https:\/\/image\.tmdb\.org\//, (r) => r.fulfill({ status: 404, body: "" }));
  await page.goto(base, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#view")?.childElementCount > 0);
  return page;
}
const pictographs = (page) => page.evaluate(() => {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const hits = [];
  while (w.nextNode()) if (/\p{Extended_Pictographic}/u.test(w.currentNode.textContent)) hits.push(w.currentNode.textContent.trim());
  return hits;
});

// 1. No feed yet
let page = await newPage({ feed: false });
await page.waitForTimeout(150);
ok("no-feed message", (await page.textContent("#view")).includes("The film list arrives with the next update, once a TMDB key has been added to the repository."));
ok("no page errors without a feed", errs.length === 0);
await page.context().close();

// 2. Tabs and the Metro look
page = await newPage();
let tabsOk = true;
for (const t of ["search", "watchlist", "browse"]) {
  await page.click(`#tabs [data-tab="${t}"]`);
  tabsOk &&= await page.$eval(`#tabs [data-tab="${t}"]`, (el) => el.classList.contains("active"));
}
await page.click("#tabs [data-more]");
await page.click('#more [data-tab="settings"]');
await page.waitForFunction(() => !document.querySelector("#more").open);
tabsOk &&= await page.$eval("#tabs [data-more]", (el) => el.classList.contains("active"));
ok("tabs switch, and More stays marked on Settings", tabsOk);
ok("Metro rules: the roundel is Line 5 purple", (await page.$eval(".roundel", (el) => getComputedStyle(el).backgroundColor)) === "rgb(153, 108, 172)");
ok("Metro rules: no emoji or pictographs as icons", (await pictographs(page)).length === 0);
await page.context().close();

// 3. Night
page = await newPage({ scheme: "dark" });
ok("night theme follows the phone", (await page.$eval("body", (el) => getComputedStyle(el).backgroundColor)) === "rgb(13, 16, 19)");
await page.context().close();

ok("no page errors", errs.length === 0);
if (errs.length) console.log(errs.join("\n"));
console.log(out.join("\n"));
await b.close(); srv.close();
process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
