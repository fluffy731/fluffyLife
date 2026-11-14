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

// 3b. A message inside one sheet survives that sheet being replaced by another
await cards.nth(1).locator(".open-place").click();
await page.waitForFunction(() => document.querySelector("#sheet")?.textContent.includes("Sample summary"));
await page.click('#sheet [data-act="save"]');
await page.click('#sheet [data-act="checkin"]');
await page.waitForSelector("#sheet[open] #hold");
await page.click("#sheet [data-close]");
await cards.nth(1).locator('[data-act="save"]').click();
ok("messages still work after one sheet replaces another", (await page.locator("#toast.on").count()) === 1);

// 4. Save, then Saved tab
await cards.first().locator('[data-act="save"]').click();
await page.click('[data-tab="saved"]');
ok("Saved lists the saved place", (await page.locator(".saved-row").count()) === 1);
ok("Saved credits where place names came from", (await page.textContent("#v-saved")).includes("Sample data"));

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
ok("check-in offers places just found, not only saved ones", (await page.locator("#sheet .cand").count()) > 2);
await page.click('#sheet [data-cand="other"]');
await page.focus("#hold");
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
ok("a message shows inside the open sheet (no place name typed)", (await page.locator("#sheet #toast.on").count()) === 1 && (await page.textContent("#sheet #toast")).includes("Type the place name"));
await page.locator("#sheet .cand").first().click();
await page.focus("#hold");
await page.keyboard.press("Enter");
await page.waitForSelector("#v-passport:not([hidden]) .stamp", { timeout: 5000 });
ok("check-in adds a stamp to Passport", (await page.locator("#v-passport .stamp").count()) === 1);

// 7. Settings: quota advice, backup fallback, theme
await page.click("#settings-btn");
const setText = await page.textContent("#v-settings");
ok("quota advice keeps inside the free allowance (30 a day, not 300)", setText.includes("30 a day") && !setText.includes("300"));
await page.evaluate(() => { navigator.canShare = () => true; navigator.share = () => Promise.reject(Object.assign(new Error("no gesture"), { name: "NotAllowedError" })); });
await page.click("#backup-btn");
await page.waitForSelector("#sheet[open] #backup-again", { timeout: 5000 }).catch(() => {});
ok("backup offers a second tap when iPhone blocks the share sheet", (await page.locator("#sheet[open] #backup-again").count()) === 1 && (await page.locator("#sheet[open] a[download]").count()) === 1);
if (await page.locator("#sheet[open]").count()) await page.click("#sheet [data-close]");
await page.click("#theme-dark");
ok("night theme sets data-theme=dark", (await page.evaluate(() => document.documentElement.dataset.theme)) === "dark");
await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/spots-settings-dark.png` : "/tmp/spots-settings-dark.png" });
ok("no horizontal scroll", (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);

// 8. One hour still finds a quick bite
await page.click('[data-tab="explore"]');
await page.click("#mode-now");
await page.click('[data-min="60"]');
await page.click("#find");
await page.waitForSelector(".result", { timeout: 10000 }).catch(() => {});
ok("1 h with Eat finds quick bites", (await page.locator(".result").count()) > 0);

// 8b. Everything closed: the empty state says what to try
page = await newPage({ at: new Date(2026, 10, 18, 20, 0), sample: true });
await page.click('.kinds [data-kind="sights"]');
await page.click('.kinds [data-kind="eat"]');
await page.click("#find");
await page.waitForFunction(() => document.querySelector("#results")?.textContent.includes("closed now"), null, { timeout: 10000 }).catch(() => {});
ok("sights at 8 pm: empty state says they're closed and suggests Late night or Tomorrow", /closed now.*Late night.*Tomorrow/.test(await page.textContent("#results")));

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

// 11. The Google path, with a stand-in for the Maps JavaScript API
const FAKE_MAPS = (cb) => `
const PH = { getURI: () => "/icons/spots-180.png", authorAttributions: [{ displayName: "Tester", uri: "https://example.com" }] };
const mk = (i) => ({ id: "g" + i, displayName: "Google place " + i, location: { lat: () => -37.81 + i * 0.002, lng: () => 144.96 },
  formattedAddress: "1 Test St, Fitzroy VIC 3065, Australia", primaryType: "restaurant", rating: 4.5, userRatingCount: 100 + i, priceLevel: "MODERATE",
  regularOpeningHours: { periods: [{ open: { day: 0, hour: 0, minute: 0 } }] }, utcOffsetMinutes: 660, photos: [PH], googleMapsURI: "https://maps.google.com/?cid=" + i });
class Place {
  constructor({ id }) { this.id = id; }
  async fetchFields() { Object.assign(this, mk(1), { id: this.id, reviewSummary: { text: "Fake summary", disclosureText: "Summarized with Gemini" } }); return { place: this }; }
  static async searchByText(req) { (window.__reqs ||= []).push(JSON.parse(JSON.stringify(req))); return { places: [1, 2, 3].map(mk) }; }
}
window.google = { maps: { importLibrary: async () => ({ Place, PriceLevel: { INEXPENSIVE: "INEXPENSIVE", MODERATE: "MODERATE", EXPENSIVE: "EXPENSIVE", VERY_EXPENSIVE: "VERY_EXPENSIVE" } }) } };
window[${JSON.stringify(cb)}]();`;
page = await newPage();
const keysLoaded = [];
await page.route("https://maps.googleapis.com/**", (route) => {
  const u = new URL(route.request().url()); keysLoaded.push(u.searchParams.get("key"));
  route.fulfill({ contentType: "text/javascript", body: FAKE_MAPS(u.searchParams.get("callback")) });
});
await page.click("#setup-google");
await page.fill("#key-in", "KEY_A");
await page.click("#key-save");
await page.click("#key-test");
await page.waitForFunction(() => document.querySelector("#test-out")?.textContent.includes("Connected"), null, { timeout: 10000 }).catch(() => {});
ok("Test connects and confirms a photo actually loaded", (await page.textContent("#test-out")).includes("✓ Photos"));
await page.fill("#key-in", "KEY_B");
await Promise.all([page.waitForEvent("load", { timeout: 5000 }).catch(() => null), page.click("#key-save")]);
await page.click('[data-tab="explore"]');
await page.click("#find");
await page.waitForSelector(".result img", { timeout: 10000 }).catch(() => {});
ok("a changed key reloads Spots so Google uses the new key", keysLoaded.at(-1) === "KEY_B");
ok("Google photos load with the site as referrer (no referrerpolicy)", (await page.locator(".result img").count()) > 0 && (await page.locator(".result img").first().getAttribute("referrerpolicy")) === null);
ok("search centre sent to Google is just lat and lng", (await page.evaluate(() => Object.keys(window.__reqs[0].locationBias.center).sort().join(","))) === "lat,lng");

ok(`no page errors${errs.length ? ": " + errs.join(" | ") : ""}`, errs.length === 0);
await b.close(); srv.close();
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
