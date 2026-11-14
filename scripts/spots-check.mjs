// Behavioural checks for the Spots app (/spots/) in sample mode. Needs Playwright (PLAYWRIGHT_MODULE).
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import { createServer } from "node:http"; import { readFile } from "node:fs/promises"; import { extname, join } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(process.cwd(), p)); res.writeHead(200, { "content-type": types[extname(p)] || "text/plain" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${srv.address().port}/spots/`;
const b = await chromium.launch();
const out = []; const ok = (name, cond) => out.push(`${cond ? "PASS" : "FAIL"} ${name}`);
const errs = [];
const WED_1PM = new Date(2026, 10, 18, 13, 0);
const WED_3PM = new Date(2026, 10, 18, 15, 0);
const sampleOn = () => localStorage.setItem("spots.v1", JSON.stringify({ settings: { sample: true } }));

async function newPage({ geo = true, at = WED_1PM, sample = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block",
    ...(geo ? { permissions: ["geolocation"], geolocation: { latitude: -37.8136, longitude: 144.9631 } } : {}) });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(at);
  if (sample) await page.addInitScript(sampleOn);
  await page.goto(base, { waitUntil: "load" });
  return page;
}

// 1. First open: no key, no samples
let page = await newPage();
ok("setup card offers Google and sample places", (await page.locator(".setup #setup-google").count()) === 1 && (await page.locator(".setup #setup-sample").count()) === 1);
await page.click("#setup-sample");

// 2. Now · Eat · 2 h
await page.click("#mode-now");
await page.click("#find");
await page.waitForSelector(".result", { timeout: 10000 });
const cards = page.locator(".result");
const n = await cards.count();
let allGood = n > 0;
for (let i = 0; i < n; i++) {
  const t = await cards.nth(i).textContent();
  if (!/Open|Hours unknown/.test(t) || !/about \d+/.test(t) || !/★/.test(t)) allGood = false;
}
ok(`Now/Eat/2 h gives results with hours, rating and drive time (${n})`, allGood);
ok("results credit their source", (await page.textContent("#v-explore")).includes("Sample data"));

// 3. Place sheet
await cards.first().locator(".open-place").click();
await page.waitForFunction(() => document.querySelector("#sheet")?.textContent.includes("Sample summary"));
const maps = await page.locator("#sheet a.maps").getAttribute("href");
ok("place sheet shows the review summary and a Google Maps link", maps && maps.startsWith("https://www.google.com/maps/"));
ok("place sheet shows today's hours", /Today/.test(await page.textContent("#sheet")));
await page.click("#sheet [data-close]");

// 4. Save, then Saved tab
await cards.first().locator('[data-act="save"]').click();
await page.click('[data-tab="saved"]');
ok("Saved lists the saved place", (await page.locator(".saved-row").count()) === 1);

// 5. Tomorrow
await page.click('[data-tab="explore"]');
await page.click("#mode-tomorrow");
await page.click("#find");
await page.waitForSelector(".stop", { timeout: 10000 });
ok("Tomorrow (relaxed) gives four stops", (await page.locator(".stop").count()) === 4);
ok("Tomorrow shows drive times between stops", (await page.locator(".leg").count()) >= 3);

// 6. Check in by keyboard
await page.click("#fab");
await page.waitForSelector("#sheet[open] #hold");
await page.focus("#hold");
await page.keyboard.press("Enter");
await page.waitForSelector("#v-passport:not([hidden]) .stamp", { timeout: 5000 });
ok("check-in adds a stamp to Passport", (await page.locator("#v-passport .stamp").count()) === 1);

// 7. Theme
await page.click("#settings-btn");
await page.click("#theme-dark");
ok("night theme sets data-theme=dark", (await page.evaluate(() => document.documentElement.dataset.theme)) === "dark");
await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/spots-settings-dark.png` : "/tmp/spots-settings-dark.png" });
ok("no horizontal scroll", (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);

// 8. Empty results
await page.click('[data-tab="explore"]');
await page.click("#mode-now");
await page.click('[data-min="60"]');
for (const k of ["eat", "drink", "coffee", "sights", "dessert"]) {
  const chip = page.locator(`.kinds [data-kind="${k}"][aria-pressed="true"]`);
  if (await chip.count()) await chip.click();
}
if (!(await page.locator('.kinds [data-kind="activities"][aria-pressed="true"]').count())) await page.click('.kinds [data-kind="activities"]');
await page.click('[data-price="1"]');
await page.click("#find");
await page.waitForFunction(() => document.querySelector("#results")?.textContent.includes("Nothing open within these limits"), null, { timeout: 10000 });
ok("tight limits give the empty-state hint", true);

// 9. Late night tapped in the afternoon
page = await newPage({ at: WED_3PM, sample: true });
await page.click("#mode-late");
await page.click("#find");
await page.waitForFunction(() => document.querySelector("#results")?.textContent.includes("Tonight from 10 pm"), null, { timeout: 10000 });
ok("Late night at 3 pm plans for tonight from 10 pm", true);
ok("late results say how late they're open", /Open (till|24 hours)/.test(await page.textContent("#results")));
await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/spots-late.png` : "/tmp/spots-late.png" });

// 10. Location refused
page = await newPage({ geo: false, sample: true });
await page.click("#find");
await page.waitForFunction(() => document.querySelector("#where-note")?.textContent.includes("Using Melbourne CBD (location is off)"), null, { timeout: 12000 });
ok("location refused falls back to the CBD and says so", true);
await page.waitForSelector(".result", { timeout: 10000 });
await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/spots-now.png` : "/tmp/spots-now.png" });

ok(`no page errors${errs.length ? ": " + errs.join(" | ") : ""}`, errs.length === 0);
await b.close(); srv.close();
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
