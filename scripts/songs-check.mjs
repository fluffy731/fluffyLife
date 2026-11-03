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
  ok("no IndexedDB: Home still renders", (await page.locator(".stat-row").count()) === 1);
  await ctx.close();
}

await browser.close(); srv.close();
console.log(out.join("\n"));
process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
