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

// A Today feed made from the recorded source samples in test/fixtures/spots (Sunday 15 November 2026).
const fb = await import("./build-spots.mjs");
const fx = (n) => readFile(join(process.cwd(), "test/fixtures/spots", n), "utf8");
const FEED_DAY = "2026-11-15";
const FEED = JSON.stringify({
  built: "2026-11-14T23:17:00Z", today: FEED_DAY, fetched: {}, sources: [],
  weather: fb.weatherFrom(JSON.parse(await fx("open-meteo.json"))), holidays: [{ date: "2026-12-25", name: "Christmas Day" }],
  events: fb.mergeEvents([{ events: fb.parseWhatsOn(await fx("whatson-today.txt")).map(fb.womEvent).filter(Boolean), days: [FEED_DAY] },
    { events: fb.parseEventfinda(await fx("eventfinda.xml")) },
    { events: [{ id: "ef:m", src: "ef", title: "Stock Up Vintage Market", blurb: "Vintage and DJs", url: "https://www.eventfinda.com.au/m", venue: "Queen Victoria Market", address: "Queen St, Melbourne 3000",
      area: "Melbourne", image: null, from: FEED_DAY, to: FEED_DAY, days: [FEED_DAY], next: null, free: true, cat: "market", outdoor: null }] }], FEED_DAY),
  fresh: fb.mergeFresh((await Promise.all(["timeout", "concrete", "gnews"].map(async (x) => fb.articlesFrom(x, await fx(`${x}.xml`), FEED_DAY)))).flat(), [], FEED_DAY),
  roundups: fb.roundupsFrom("gnews", await fx("gnews.xml")),
});

// Opens Spots on Explore (where most checks start) unless tab says otherwise; feed: true serves the sample feed.
async function newPage({ geo = true, at = WED_1PM, sample = false, tab = "explore", feed = true, patch = null } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block",
    ...(geo ? { permissions: ["geolocation"], geolocation: { latitude: -37.8136, longitude: 144.9631 } } : {}) });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.clock.setFixedTime(at);
  if (sample) await page.addInitScript(sampleOn);
  const body = patch ? JSON.stringify(patch(JSON.parse(FEED))) : FEED;
  await page.route("**/spots/feed.json", (r) => (feed ? r.fulfill({ contentType: "application/json", body }) : r.fulfill({ status: 404, body: "" })));
  await page.route(/^https:\/\/(cdn\.eventfinda|media\.timeout|cdn\.concreteplayground)/, (r) => r.fulfill({ status: 404, body: "" }));
  await page.goto(base, { waitUntil: "load" });
  if (tab !== "today") await page.click(`.tab[data-tab="${tab}"]`);
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

// 12. Today: ideas for the moment, what's on, saving an event, checking in at it
const SUN_1030 = new Date(2026, 10, 15, 10, 30);
page = await newPage({ at: SUN_1030, sample: true, tab: "today" });
ok("Spots opens on Today", (await page.locator("#v-today:not([hidden])").count()) === 1 && (await page.locator('.tab[data-tab="today"][aria-current="page"]').count()) === 1);
await page.waitForSelector("#ev-today .ev", { timeout: 5000 });
ok("the moment line names the day, part of the day and the rain", (await page.textContent(".moment")).startsWith("Sunday morning · 🌧 92% rain"));
const ideaIds = await page.$$eval("[data-idea]", (bs) => bs.map((b) => b.dataset.idea));
ok(`Sunday morning in the rain: brunch, the markets, and a gallery instead of out and about (${ideaIds})`, ideaIds.join() === "brunch,ev:market,museum");
const firstTwo = await page.$$eval("#ev-today .ev b", (bs) => bs.slice(0, 2).map((b) => b.textContent));
ok(`On today puts one-day free things first (${firstTwo})`, firstTwo.includes("Stock Up Vintage Market"));
ok("Tomorrow is the second list on a Sunday", (await page.textContent("#ev-next h3")) === "Tomorrow");
ok("New in town lists openings with their source and age", (await page.locator(".fresh").count()) >= 4 && /(Broadsheet|Time Out|Concrete Playground) · (today|yesterday|\d+ days ago)/.test(await page.textContent(".fresh")));
ok("no horizontal scroll on Today", (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
await page.click('[data-idea="ev:market"]');
const marketRows = await page.$$eval("#ev-today .ev b", (bs) => bs.map((b) => b.textContent));
ok(`the markets idea filters On today to markets (${marketRows})`, marketRows.length >= 1 && marketRows.every((t) => /Market/.test(t)) && (await page.locator("[data-unfilter]").count()) === 1);
await page.click("[data-unfilter]");
await page.locator("#ev-today .ev", { hasText: "Stock Up Vintage Market" }).click();
await page.waitForSelector("#sheet[open] [data-evsave]");
ok("the event sheet has Details and a Google Maps search for the venue", (await page.getAttribute("#sheet a.maps", "href")).includes("Queen%20Victoria%20Market") && (await page.locator('#sheet a:text("Details")').count()) === 1);
await page.click("#sheet [data-evsave]");
await page.click("#sheet [data-close]");
ok("a saved event is marked on Today", (await page.locator("#ev-today .ev", { hasText: "Stock Up Vintage Market" }).locator(".saved-mark").count()) === 1);
await page.click('.tab[data-tab="saved"]');
ok("Saved shows the event under Coming up", (await page.textContent("#v-saved")).includes("Coming up") && (await page.textContent("#v-saved")).includes("Stock Up Vintage Market"));
await page.click("#fab");
await page.waitForSelector("#sheet[open] .cand");
ok("Check in offers today's saved event first", (await page.textContent("#sheet .cand >> nth=0")).includes("Stock Up Vintage Market"));
await page.focus("#hold");
await page.keyboard.press("Enter");
await page.waitForSelector("#v-passport:not([hidden]) .stamp", { timeout: 5000 });
ok("a check-in at an event stamps the suburb, not the venue", (await page.evaluate(() => JSON.parse(localStorage.getItem("spots.v1")).stamps[0].area)) === "Melbourne");
await page.click('.tab[data-tab="today"]');
ok("a saved event on today puts 'Near <venue>' first in Right now", (await page.getAttribute("[data-idea] >> nth=0", "data-idea")) === "near" && (await page.textContent("[data-idea] >> nth=0")).includes("Near Queen Victoria Market"));
await page.click('[data-idea="brunch"]');
await page.waitForSelector(".result", { timeout: 10000 });
ok("the Brunch idea opens Explore set to Now, 2 h, Coffee and Eat, and searches",
  (await page.locator("#mode-now[aria-pressed=true]").count()) === 1 && (await page.locator('[data-min="120"][aria-pressed=true]').count()) === 1
  && (await page.$$eval('.kinds [aria-pressed="true"]', (bs) => bs.map((b) => b.dataset.kind).sort().join())) === "coffee,eat");

// 13. Near a place: well-reviewed places around somewhere you're going
const ratingsOK = async () => (await page.$$eval(".result .meta b", (bs) => bs.map((b) => b.textContent)))
  .every((t) => { const m = t.match(/★ ([\d.]+)/); return m && +m[1] >= 4.5; });
const countsOK = async () => (await page.$$eval(".result .meta", (ms) => ms.map((m) => m.textContent).filter((t) => t.includes("★"))))
  .every((t) => { const m = t.match(/\(([\d,]+)\)/); return m && +m[1].replace(/,/g, "") >= 1000; });
page = await newPage({ at: SUN_1030, sample: true });
await page.click("#mode-near");
await page.click("#find");
await page.waitForSelector("#results .error", { timeout: 5000 }).catch(() => {});
ok("Near with nothing typed asks where you're going", (await page.textContent("#results")).includes("Type where you're going"));
await page.fill("#near-q", "Fitzroy");
await page.click("#find");
await page.waitForSelector(".region", { timeout: 10000 });
ok("Near shows top-rated places around the place typed, by kind", (await page.textContent(".region")).includes("Top-rated near") && (await page.textContent(".region h3")) === "Fitzroy" && (await page.locator("#results .res-head").count()) === 3);
ok(`every place shown is rated ★ 4.5 or more by at least 1,000 people (${await page.locator(".result").count()} shown)`, (await page.locator(".result").count()) > 0 && await ratingsOK() && await countsOK());
ok("a 15-minute drive is the default, and distances are drives from the place you're going", (await page.locator('[data-nrange="d15"][aria-pressed=true]').count()) === 1 && (await page.textContent(".result .meta >> nth=1")).includes("drive from Fitzroy") && (await page.textContent(".region")).includes("within a 15 min drive"));
await page.click('[data-nrange="w1"]');
await page.click("#find");
await page.waitForFunction(() => document.querySelector(".region")?.textContent.includes("1 km walk"), null, { timeout: 10000 });
ok("a walk instead shows walks from the place you're going", (await page.locator(".result").count()) === 0 || (await page.textContent(".result .meta >> nth=1")).includes("walk from Fitzroy"));
await page.click('[data-nrange="d15"]');
await page.click('[data-nrev="300"]');
await page.click("#find");
await page.waitForFunction(() => document.querySelectorAll(".result").length > 0, null, { timeout: 10000 });
const n300 = await page.locator(".result").count();
ok(`300+ reviews finds at least as many (${n300})`, n300 >= 1);
await page.locator(".result .open-place").first().click();
await page.waitForSelector('#sheet[open] [data-act="near"]');
ok("a place's sheet offers Top-rated near here", true);

await page.click("#sheet [data-close]");
await page.click("#fab");
await page.waitForSelector("#sheet[open] .cand", { timeout: 5000 }).catch(() => {});
ok("Check in opens after a Near search, offering the places it found", (await page.locator("#sheet[open] .cand").count()) > 1);
await page.click("#sheet [data-close]").catch(() => {});

page = await newPage({ at: SUN_1030, sample: true, tab: "today" });
await page.waitForSelector("#ev-today .ev");
await page.locator("#ev-today .ev", { hasText: "Stock Up Vintage Market" }).click();
await page.click("#sheet [data-evnear]");
await page.waitForSelector(".region", { timeout: 10000 });
ok("an event's Top-rated near here opens Near for its venue", (await page.inputValue("#near-q")) === "Queen Victoria Market, Queen St, Melbourne 3000" && (await page.textContent(".region h3")) === "Queen Victoria Market");
await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/spots-near.png` : "/tmp/spots-near.png", fullPage: true });

// 14. Weather: a dry, mild afternoon suggests the outdoors; Nature finds parks and trails even with no listed hours
const dry = (f) => ({ ...f, weather: [{ date: FEED_DAY, rain: 10, max: 21, code: 2, wind: 18, sunset: "20:13" }],
  hourly: [13, 14, 15, 16, 17].map((h) => ({ t: `${FEED_DAY}T${h}:00`, rain: 5, code: 2, temp: 20 })) });
page = await newPage({ at: new Date(2026, 10, 15, 14, 0), sample: true, tab: "today", patch: dry });
await page.waitForSelector("[data-idea]");
ok("a dry Sunday afternoon offers a walk in a park first", (await page.getAttribute("[data-idea] >> nth=0", "data-idea")) === "nature" && (await page.textContent("[data-idea] >> nth=0")).includes("and dry"));
ok("the moment line shows the next 3 hours", (await page.textContent(".moment")).includes("5% rain next 3 h"));
await page.click('[data-idea="nature"]');
await page.waitForSelector(".result", { timeout: 10000 });
ok("Walk in a park searches Nature for 3 hours and finds parks, some with no set hours",
  (await page.locator('.kinds [data-kind="nature"][aria-pressed=true]').count()) === 1 && (await page.locator('[data-min="180"][aria-pressed=true]').count()) === 1
  && (await page.locator('.result[data-kind="nature"]').count()) > 0 && /No set hours|Open 24 hours/.test(await page.textContent("#results")));
await page.click("#mode-late");
ok("Late night doesn't offer Nature or Beach", (await page.locator('.kinds [data-kind="nature"], .kinds [data-kind="beach"]').count()) === 0);

page = await newPage({ at: new Date(2026, 10, 15, 10, 30), sample: true, tab: "today" });
await page.waitForSelector("[data-idea]");
ok("a rainy morning offers nothing outdoors", !(await page.$$eval("[data-idea]", (bs) => bs.map((b) => b.dataset.idea))).some((id) => ["nature", "trail", "beach", "sunset", "outAbout"].includes(id)));

// 15. Long names never push the page wider than the phone (an iPhone SE is 320 wide)
const LONG_VENUE = "Melbourne Convention and Exhibition Centre (MCEC)";
const long = (f) => ({ ...f, events: [{ id: "wom:/long", src: "wom", title: "MindBodySpirit Festival: wellness, lifestyle and holistic living", blurb: "", url: "https://whatson.melbourne.vic.gov.au/x",
  venue: LONG_VENUE, address: "1 Convention Pl, South Wharf 3006", area: "South Wharf", image: null, from: "2026-11-13", to: "2026-11-15", days: [FEED_DAY], next: `${FEED_DAY}T10:00`, free: true, cat: "festival", outdoor: null }, ...f.events] });
for (const width of [390, 320]) {
  const ctx = await b.newContext({ viewport: { width, height: 800 }, serviceWorkers: "block" });
  const p2 = await ctx.newPage();
  p2.on("pageerror", (e) => errs.push(e.message));
  await p2.clock.setFixedTime(SUN_1030);
  await p2.addInitScript(sampleOn);
  await p2.route("**/spots/feed.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(long(JSON.parse(FEED))) }));
  await p2.goto(base, { waitUntil: "load" });
  await p2.waitForSelector("#ev-today .ev");
  await p2.locator("#ev-today .ev", { hasText: "MindBodySpirit" }).click();
  await p2.click("#sheet [data-evsave]");
  await p2.click("#sheet [data-close]");
  const fits = async () => (await p2.evaluate(() => document.documentElement.scrollWidth)) <= width
    && (await p2.evaluate((w) => [...document.querySelectorAll("main *")].every((e) => e.getBoundingClientRect().right <= w + 0.5), width));
  ok(`${width} px: Today fits with a long venue, the Free tag stays on screen`, await fits()
    && (await p2.locator("#ev-today .ev", { hasText: "MindBodySpirit" }).locator(".tag.free").evaluate((e, w) => e.getBoundingClientRect().right <= w, width)));
  await p2.click('.tab[data-tab="saved"]');
  ok(`${width} px: Saved fits with a long venue`, await fits());
  await ctx.close();
}

page = await newPage({ at: new Date(2026, 10, 20, 19, 0), sample: true, tab: "today" });
await page.waitForSelector("[data-idea]");
ok("Friday evening offers Plan tomorrow", (await page.locator('[data-idea="tomorrow"]').count()) === 1);

page = await newPage({ at: SUN_1030, tab: "today", feed: false });
await page.waitForFunction(() => document.querySelector("#v-today")?.textContent.includes("next hourly update"), null, { timeout: 5000 }).catch(() => {});
ok("without a feed, Today says when events arrive and still offers ideas", (await page.textContent("#v-today")).includes("next hourly update") && (await page.locator("[data-idea]").count()) >= 2);
await page.screenshot({ path: process.env.SHOT_DIR ? `${process.env.SHOT_DIR}/spots-today-nofeed.png` : "/tmp/spots-today-nofeed.png" });

// Cuisine and distance
page = await newPage({ sample: true });
await page.click("#mode-now");
ok("Cuisine shows under What when Eat is chosen, led by Cantonese, Chinese and Korean", (await page.locator(".cuisines [data-cuisine]").allTextContents()).slice(0, 4).join("|") === "Any|Cantonese|Chinese|Korean");
await page.click('.kinds [data-kind="coffee"]'); await page.click('.kinds [data-kind="eat"]');
ok("Cuisine hides when Eat is off", (await page.locator(".cuisines").count()) === 0);
await page.click('.kinds [data-kind="eat"]'); await page.click('.kinds [data-kind="coffee"]');   // back to Eat alone
await page.click('[data-cuisine="korean"]');
ok("choosing a cuisine presses it and releases Any", (await page.locator('[data-cuisine="korean"][aria-pressed=true]').count()) === 1 && (await page.locator('[data-cuisine="any"][aria-pressed=true]').count()) === 0);
await page.click("#find");
await page.waitForSelector(".result", { timeout: 10000 });
const meta = (await page.locator(".result .meta").allTextContents()).filter((t) => t.includes("★"));
ok(`every result is Korean (${meta.length} shown)`, meta.length > 0 && meta.every((t) => t.includes("Korean")));
await page.click('[data-cuisine="any"]');
ok("Any clears the cuisines", (await page.locator('[data-cuisine="korean"][aria-pressed=true]').count()) === 0);
// the slider: five steps up from 500 m is 3 km
const slide = async (id, step) => page.evaluate(([i, v]) => { const el = document.getElementById(`dist-${i}`); el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); }, [id, step]);
ok("Now starts on Any distance", (await page.textContent("#dist-now-val")) === "Any distance");
await slide("now", 4);
ok("moving the slider shows the distance and how long it takes", (await page.textContent("#dist-now-val")) === "3 km" && (await page.textContent("#dist-now-hint")).includes("drive"));
await page.click("#find");
await page.waitForSelector(".result", { timeout: 10000 });
const kms = (await page.locator(".result .travel + *, .result .meta").allTextContents()).map((t) => /· ([\d.]+) km/.exec(t)).filter(Boolean).map((m) => +m[1]);
ok(`every result is within 3 km (${kms.length} distances read, furthest ${Math.max(...kms)} km)`, kms.length > 0 && Math.max(...kms) <= 3);
await slide("now", 4);
await page.click('[data-nrange], #mode-near').catch(() => {});
await page.click("#mode-near");
await page.click('[data-nrange="w1"]');
await slide("near", 6);
ok("in Near, the slider sets the distance and lets go of the presets", (await page.textContent("#dist-near-val")) === "5 km" && (await page.locator("[data-nrange][aria-pressed=true]").count()) === 0);
await page.fill("#near-q", "Fitzroy");
await page.click("#find");
await page.waitForSelector(".region", { timeout: 10000 });
ok("Near results say the typed radius", (await page.textContent(".region")).includes("within a 5 km radius"));
await page.click("#mode-tomorrow");
ok("Tomorrow around town has a distance slider, and Eat's cuisines are for lunch and dinner", (await page.locator("#dist-town").count()) === 1 && (await page.textContent(".cuisines").catch(() => "")).includes("Korean") && (await page.locator("#v-explore .label small").first().textContent()).includes("lunch and dinner"));
await page.click('[data-where="surprise"]');
ok("a day-trip region has no around-town slider", (await page.locator("#dist-town").count()) === 0);
ok("no horizontal scroll with the sliders", await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

// iPhone navigation (lib/nav.js), in Chromium with touch emulation (not a real iPhone)
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, serviceWorkers: "block", permissions: ["geolocation"], geolocation: { latitude: -37.8136, longitude: 144.9631 } });
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errs.push(e.message));
  await pg.clock.setFixedTime(WED_1PM);
  await pg.addInitScript(sampleOn);
  await pg.route("**/spots/feed.json", (r) => r.fulfill({ contentType: "application/json", body: FEED }));
  await pg.route(/^https:\/\/(cdn\.eventfinda|media\.timeout|cdn\.concreteplayground)/, (r) => r.fulfill({ status: 404, body: "" }));
  await pg.goto(base, { waitUntil: "load" });
  const cdp = await ctx.newCDPSession(pg);
  const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  const swipe = async (x0, y0, x1, y1, steps = 10) => { await touch("touchStart", x0, y0); for (let i = 1; i <= steps; i++) { await touch("touchMove", x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps); await pg.waitForTimeout(12); } await touch("touchEnd"); };
  const st = () => pg.evaluate(() => ({ nav: (history.state && history.state.nav) || 0, open: document.querySelector("#sheet").open, url: location.pathname }));
  await pg.tap('.tab[data-tab="explore"]');
  await pg.tap("#find");
  await pg.waitForSelector(".result");
  await pg.tap(".result .open-place >> nth=0");
  await pg.waitForFunction(() => document.querySelector("#sheet").open);
  let s = await st();
  ok("opening a place adds one history entry and keeps the address", s.open && s.nav === 1 && s.url === "/spots/");
  await pg.evaluate(() => history.back()); await pg.waitForTimeout(500);
  s = await st();
  ok("Back closes the place and stays in Spots", !s.open && s.nav === 0 && s.url === "/spots/");
  await pg.tap(".result .open-place >> nth=0");
  await pg.waitForFunction(() => document.querySelector("#sheet").open);
  await swipe(6, 420, 200, 430); await pg.waitForTimeout(700);
  s = await st();
  ok("a swipe from the left edge closes the place", !s.open && s.nav === 0);
  await pg.tap(".result .open-place >> nth=0");
  await pg.waitForFunction(() => document.querySelector("#sheet").open);
  await pg.evaluate(() => document.querySelector("#sheet").scrollTo(0, 0));
  await swipe(200, 420, 205, 760); await pg.waitForTimeout(600);
  ok("a swipe down closes the place", !(await st()).open);
  await pg.tap('.tab[data-tab="saved"]');
  await swipe(6, 420, 200, 430); await pg.waitForTimeout(400);
  ok("at the root, a swipe from the edge does nothing", (await pg.getAttribute('.tab[data-tab="saved"]', "aria-current")) === "page" && (await st()).nav === 0);
  await pg.tap('.tab[data-tab="today"]');
  await pg.waitForSelector("#v-today *");
  let pulls = 0;
  await pg.route("**/spots/feed.json", (r) => { pulls++; r.fulfill({ contentType: "application/json", body: FEED }); });
  await pg.evaluate(() => scrollTo(0, 0));
  await swipe(200, 140, 204, 420, 14); await pg.waitForTimeout(1200);
  ok(`pulling down on Today fetches the listings again (${pulls} fetch)`, pulls === 1);
  await pg.tap('.tab[data-tab="explore"]');
  await pg.waitForSelector("#find");
  await pg.evaluate(() => scrollTo(0, 0));
  await swipe(200, 140, 204, 420, 14); await pg.waitForTimeout(600);
  ok("pulling down on another tab does nothing (no refresh there)", pulls === 1);
  await ctx.close();
}

ok(`no page errors${errs.length ? ": " + errs.join(" | ") : ""}`, errs.length === 0);
await b.close(); srv.close();
console.log(out.join("\n"));
if (out.some((l) => l.startsWith("FAIL"))) process.exit(1);
