// Golden DOM snapshot of the Korean app (`/`). Run before and after a refactor:
//   node scripts/snapshot.mjs --write   |   node scripts/snapshot.mjs --check
// Needs Playwright: set PLAYWRIGHT_MODULE to its index.mjs if it is not importable as "playwright".
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = process.cwd(), GOLDEN = join(root, "test/golden/ko.json");
const mode = process.argv.includes("--write") ? "write" : "check";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer(async (req, res) => {
  let p = req.url.split("?")[0]; if (p.endsWith("/")) p += "index.html";
  try { res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(await readFile(join(root, p))); } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  const FIXED = new Date("2026-10-15T09:30:00").getTime(), D = Date;
  window.Date = class extends D { constructor(...a) { super(...(a.length ? a : [FIXED])); } static now() { return FIXED; } };
});
await page.goto(base, { waitUntil: "networkidle" });
const view = () => page.evaluate(() => document.querySelector("#view").innerHTML);
const out = {};
out.title = await page.title();
out.tabs = await page.evaluate(() => [...document.querySelectorAll("#tabs button")].map((b) => b.textContent.trim()));
out.home = await view();
await page.click('[data-tab="learn"]'); out.learn = await view();
await page.click("[data-flip]"); out.learnFlipped = await view();
await page.click('[data-tab="review"]'); out.reviewEmpty = await view();
await page.click('[data-tab="browse"]'); out.browseAll = await view();
await page.fill("#q", "경제"); out.browseSearch = await view();
await page.fill("#q", ""); await page.click('[data-kind="grammar"]'); await page.click('[data-tier="int"]');
await page.locator(".item").first().click(); out.browseGrammar = await view();
await page.click('[data-tab="settings"]'); out.settings = await view();
out.wipeConfirm = await page.evaluate(() => { let msg = null; const c = window.confirm; window.confirm = (m) => { msg = m; return false; }; document.querySelector("[data-wipe]").click(); window.confirm = c; return msg; });
await browser.close(); srv.close();

if (mode === "write") { await writeFile(GOLDEN, JSON.stringify(out, null, 1)); console.log("golden written:", Object.keys(out).join(", ")); }
else {
  const gold = JSON.parse(await readFile(GOLDEN, "utf8"));
  const bad = Object.keys(gold).filter((k) => JSON.stringify(gold[k]) !== JSON.stringify(out[k]));
  if (bad.length) { console.error("DIFFERS:", bad.join(", ")); const k = bad[0]; const a = JSON.stringify(gold[k]), b = JSON.stringify(out[k]); let i = 0; while (a[i] === b[i]) i++; console.error(`first difference in "${k}" at ${i}:\n  golden: …${a.slice(Math.max(0, i - 60), i + 80)}\n  now:    …${b.slice(Math.max(0, i - 60), i + 80)}`); process.exit(1); }
  console.log("Korean app views identical to golden:", Object.keys(gold).length, "entries");
}
