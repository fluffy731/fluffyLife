// Behavioural checks for the News app (/news/) against a fixture feed. Needs Playwright (PLAYWRIGHT_MODULE).
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  if (p === "/news/feed.json") p = "/test/fixtures/news/feed.json";
  try { const body = await readFile(join(process.cwd(), p)); res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;
const b = await chromium.launch();
const out = []; const ok = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message));
await page.route("**/dict/ko.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify({ rows: [["금리", "金利", "n", "", "interest rate", "", ""], ["정부", "政府", "n", "", "government", "", ""]] }) }));
await page.goto(base + "news/", { waitUntil: "networkidle" });
ok("nine tabs incl. 한국어 and Regulation", (await page.locator("#tabs button").allTextContents()).join("|") === "Top|Australia|World|Asia|한국어|Construction|Engineering|Property|Regulation");
ok("Top: multi-outlet story first, with its picture and lean bar", (await page.locator(".story").first().textContent()).includes("Ceasefire") && (await page.locator(".story").first().locator(".pic").count()) === 1 && (await page.locator(".story").first().locator(".bar i").count()) === 3);
ok("images are loaded without a referrer", (await page.locator(".pic").first().getAttribute("referrerpolicy")) === "no-referrer");
await page.locator("[data-toggle]").first().click();
const outlets = page.locator(".story.open .outlet");
ok("Compare shows each outlet's headline with its lean and a link to the original", (await outlets.count()) === 3 && (await outlets.first().locator(".lean").textContent()).length > 0 && (await outlets.first().getAttribute("target")) === "_blank");
await page.click('[data-tab="property"]');
ok("Property tab shows the house-price story", (await page.locator(".story").count()) === 1 && (await page.textContent(".story h2")).includes("house prices"));
await page.click('[data-tab="regulation"]');
ok("Regulation tab shows the Building Commissioner story", (await page.textContent(".story h2")).includes("Building Commissioner"));
await page.click('[data-tab="ko"]');
ok("한국어 tab: Korean stories with tappable words", (await page.locator(".story.ko .w").count()) > 3);
await page.locator('.story.ko h2 .w[data-ko="금리를"]').click();
await page.waitForFunction(() => document.querySelector("#sheet")?.textContent.includes("interest rate"));
ok("tapping 금리를 shows 금리 金利 interest rate", (await page.textContent("#sheet")).includes("金利"));
await page.click("[data-close]");
await page.click("#about");
ok("About lists sources by region with lean and feed status", (await page.locator(".src-row").count()) === 10 && (await page.textContent("#sheet")).includes("feed down"));
await page.click("[data-close]");
await page.click('[data-tab="top"]');
ok("no horizontal scroll", (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
ok("no page errors", errs.length === 0);
await page.screenshot({ path: process.env.SHOT || "/tmp/news.png", fullPage: false });
await b.close(); srv.close();
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
