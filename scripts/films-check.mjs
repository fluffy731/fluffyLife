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

// 4. Browse
const idsIn = (page, sel) => page.$$eval(`${sel} [data-film]`, (els) => els.map((e) => Number(e.dataset.film)));
const placeOf = new Map(FEED.films.map((f) => [f.id, f.places]));
// Seeds the phone's storage once per tab (init scripts run again on reload, which would wipe what the check did).
const setStore = (obj) => ({ fn: (o) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("films.v1", JSON.stringify(o)); sessionStorage.setItem("seeded", "1"); } }, arg: obj });
page = await newPage();
ok("Browse shows the three lists", (await idsIn(page, 'section[data-list="rated"]')).length >= 1 && (await idsIn(page, 'section[data-list="popular"]')).length >= 1);
await page.click('#place-chips [data-place="KR"]');
const kr = await idsIn(page, 'section[data-list="rated"]');
ok("place narrows the rows", kr.length > 0 && kr.every((id) => placeOf.get(id).includes("KR")));
ok("era line: classics disabled for Korean", await page.$eval('.era-line [data-era="classics"]', (el) => el.disabled));
await page.click('.era-line [data-era="2000s"]');
const on1 = await page.$$eval(".era-line .on", (els) => els.map((e) => e.dataset.era));
await page.click('.era-line [data-era="2000s"]');
const on2 = await page.$$eval(".era-line .on", (els) => els.length);
ok("era line rides and clears", on1.length === 1 && on1[0] === "2000s" && on2 === 0);
await page.click('#place-chips [data-place="HK"]');
ok("named era: Hong Kong 1990s is the Golden age interchange", await page.$eval('.era-line [data-era="1990s"]', (el) => el.classList.contains("interchange") && el.textContent.includes("Golden age")));
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#place-chips");
ok("filters persist", await page.$eval('#place-chips [data-place="HK"]', (el) => el.classList.contains("on")));
await page.click('#place-chips [data-place="all"]');
const ratedFirst = (await idsIn(page, 'section[data-list="rated"]'))[0];
await page.click('section[data-list="rated"] [data-all]');
await page.waitForSelector("#grid [data-film]");
ok("All opens a three-across grid", (await page.$eval("#grid", (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)) === 3
  && (await idsIn(page, "#grid"))[0] === ratedFirst);
await page.click('[data-sort="popular"]');
ok("the grid's sort switch reorders it", (await idsIn(page, "#grid"))[0] !== ratedFirst);
ok("no overflow on the grid", (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
await page.context().close();

page = await newPage({ init: setStore({ settings: { place: "KR", era: "classics" } }) });
ok("thin shelf: no empty rows, and a note instead", (await page.$$("section.row-list")).length === 0 && /No films here yet/.test(await page.textContent("#view")));
await page.context().close();

const krFilms = FEED.films.filter((f) => f.places.includes("KR"));
const keep = krFilms[krFilms.length - 1].id;
const seenKR = Object.fromEntries(krFilms.filter((f) => f.id !== keep).map((f) => [f.id, { id: f.id, title: f.title }]));
page = await newPage({ init: setStore({ settings: { place: "KR" }, seen: seenKR }) });
const picks = [];
for (let i = 0; i < 5; i++) {
  await page.click("#surprise");
  picks.push(Number(await page.evaluate(() => document.querySelector("#film").dataset.id)));
  await page.evaluate(() => { for (const d of document.querySelectorAll("dialog[open]")) d.close(); });
}
ok("Surprise me opens a film, never a seen one", picks.every((id) => id === keep));
await page.context().close();

for (const scheme of ["light", "dark"]) {
  page = await newPage({ scheme });
  ok(`no overflow on Browse (${scheme})`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
  ok(`Browse has no pictographs (${scheme})`, (await pictographs(page)).length === 0);
  await page.context().close();
}

// 5. The film sheet, the watchlist and search
const sheetText = (page) => page.textContent("#film");
const sheetOpen = (page) => page.$eval("#film", (el) => el.open);
page = await newPage({ init: setStore({ settings: { place: "HK" } }) });
await page.click('section[data-list="rated"] [data-film="10775"]');
await page.waitForFunction(() => document.querySelector("#film").open);
const ia = await sheetText(page);
ok("film sheet: titles, director, ratings and links", ["無間道", "Infernal Affairs", "Andrew Lau", "ratings"].every((t) => ia.includes(t))
  && (await page.$$("#film a.tmdb")).length === 1 && (await page.$$("#film a.douban")).length === 1 && (await page.$$("#film a.trailer")).length === 1);
ok("film sheet: titles sit on a station sign", (await page.$$("#film .card.flash.film-sign .rule")).length === 1);
ok("more like this leaves out the film itself", !(await idsIn(page, "#film .more-like")).includes(10775) && (await idsIn(page, "#film .more-like")).length > 0);
ok("a film opened from a tile has no Another", (await page.$$('#film [data-act="another"]')).length === 0);
await page.click('#film [data-act="want"]');
ok("want: the badge counts it", (await page.textContent("#want-badge")) === "1 to watch" && /On your watchlist/.test(await sheetText(page)));
await page.keyboard.press("Escape");
await page.waitForFunction(() => !document.querySelector("#film").open);
ok("Escape closes the sheet", !(await sheetOpen(page)));
await page.reload({ waitUntil: "load" });
await page.waitForSelector("#place-chips");
ok("the watchlist survives a reload", (await page.textContent("#want-badge")) === "1 to watch");
await page.click('section[data-list="rated"] [data-film="10775"]');
await page.waitForFunction(() => document.querySelector("#film").open);
await page.click('#film [data-act="seen"]');
ok("seen takes it off the watchlist", await page.$eval("#want-badge", (el) => el.hidden));
await page.keyboard.press("Escape");
await page.click('#tabs [data-tab="watchlist"]');
const wl = await page.textContent("#view");
ok("Watchlist lists it under Seen", /Want to watch[\s\S]*Nothing here yet[\s\S]*Seen[\s\S]*Infernal Affairs/.test(wl));
await page.click('#tabs [data-tab="search"]');
await page.fill("#q", "kung");
await page.waitForFunction(() => document.querySelector("#view").textContent.includes("Kung Fu Hustle"));
ok("search finds Kung Fu Hustle", true);
await page.fill("#q", "살인");
await page.waitForFunction(() => document.querySelector("#view").textContent.includes("Memories of Murder"));
ok("search finds 살인의 추억", true);
await page.fill("#q", "casablanca");
await page.waitForSelector('.item[data-film="289"]');
await page.click('.item[data-film="289"]');
await page.waitForFunction(() => document.querySelector("#film").open);
ok("Casablanca has no Douban link", (await page.$$("#film a.douban")).length === 0 && (await page.$$("#film a.tmdb")).length === 1);
await page.keyboard.press("Escape");
await page.waitForFunction(() => !document.querySelector("#film").open);
await page.fill("#q", "");
await page.waitForTimeout(200);
ok("clearing search lists nothing", (await page.$$("#view .item[data-film]")).length === 0);
await page.context().close();

page = await newPage({ init: setStore({ settings: { place: "KR" } }) });
await page.click("#surprise");
await page.waitForFunction(() => document.querySelector("#film").open);
const first = await page.$eval("#film", (el) => Number(el.dataset.id));
ok("Another shows after Surprise me", (await page.$$('#film [data-act="another"]')).length === 1);
await page.click('#film [data-act="another"]');
await page.waitForFunction((id) => Number(document.querySelector("#film").dataset.id) !== id, first);
const second = await page.$eval("#film", (el) => Number(el.dataset.id));
ok("Another draws a different Korean film", second !== first && placeOf.get(second).includes("KR"));
await page.context().close();

page = await newPage({ feed: false, init: setStore({ want: { 99999: { id: 99999, title: "Gone Film", original: "消失的電影", year: 1990, era: "1990s", places: ["HK"], genres: ["Drama"], director: { id: 1, name: "Someone" }, cast: [], poster: null, at: "2026-11-01T00:00:00Z" } } }) });
await page.click('#tabs [data-tab="watchlist"]');
ok("offline: the watchlist still lists a saved film", (await page.textContent("#view")).includes("Gone Film"));
await page.click('.item[data-film="99999"]');
await page.waitForFunction(() => document.querySelector("#film").open);
ok("offline: its sheet doesn't claim it left the list", !(await sheetText(page)).includes("No longer in this week's list") && (await sheetText(page)).includes("Saved on this phone"));
await page.context().close();

// 6. Settings, backup and restore
const snap = (id) => { const f = FEED.films.find((x) => x.id === id); return { id, title: f.title, original: f.original, year: f.year, era: f.era, places: f.places, genres: f.genres, director: f.director, cast: f.cast, poster: f.poster, at: "2026-11-10T00:00:00Z" }; };
const openSettings = async (page) => { await page.click("#tabs [data-more]"); await page.click('#more [data-tab="settings"]'); await page.waitForSelector("#hide-seen"); };
page = await newPage({ init: setStore({ settings: { place: "HK" }, seen: { 10775: snap(10775) }, want: { 843: snap(843) } }) });
await openSettings(page);
const settingsText = await page.textContent("#view");
ok("attribution and catalogue date", settingsText.includes("This product uses the TMDB API but is not endorsed or certified by TMDB") && /Catalogue built 15 November · \d+ films/.test(settingsText));
await page.click("button[data-theme]");
await page.click("button[data-theme]");
ok("theme cycles phone, light, dark", (await page.evaluate(() => document.documentElement.dataset.theme)) === "dark" && /Theme: Dark/.test(await page.textContent("#view")));
await page.click("button[data-theme]");
ok("and back to the phone's", (await page.evaluate(() => document.documentElement.dataset.theme)) === undefined);
await page.check("#hide-seen");
await page.click('#tabs [data-tab="browse"]');
ok("hide seen: a seen film leaves Browse", (await page.$$('#view [data-film="10775"]')).length === 0 && (await page.$$('#view [data-film="843"]')).length > 0);
await openSettings(page);
await page.setInputFiles("#file", { name: "films-backup.json", mimeType: "application/json",
  buffer: Buffer.from(JSON.stringify({ app: "films", version: 1, saved: "2026-11-14T00:00:00Z", want: { 843: snap(843), 9470: snap(9470) }, seen: {} })) });
await page.waitForFunction(() => document.querySelector("#toast").classList.contains("on"));
ok("restore merges and says how many", (await page.textContent("#toast")) === "Added 1 film" && (await page.textContent("#want-badge")) === "2 to watch");
await page.setInputFiles("#file", { name: "other.json", mimeType: "application/json", buffer: Buffer.from('{"app":"stocks-watchlist","watch":[]}') });
await page.waitForFunction(() => document.querySelector("#toast").textContent.includes("not a Films"));
ok("a foreign file is refused", (await page.textContent("#toast")) === "This file is not a Films backup." && (await page.textContent("#want-badge")) === "2 to watch");
ok("Settings has Back up and Restore", (await page.$$('#view [data-act="backup"]')).length === 1 && (await page.$$('#view [data-act="restore"]')).length === 1);
ok("no pictographs in Settings", (await pictographs(page)).length === 0);
await page.context().close();

// 7. Fixes from the final review
// While the feed is still on its way, Browse says it's loading, never that the key is missing.
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.route("**/films/feed.json", async (r) => { await new Promise((res) => setTimeout(res, 1500)); await r.fulfill({ contentType: "application/json", body: FEED_JSON }); });
  await p.route(/^https:\/\/image\.tmdb\.org\//, (r) => r.fulfill({ status: 404, body: "" }));
  await p.goto(base, { waitUntil: "load" });
  await p.waitForTimeout(400);
  const during = await p.textContent("#view");
  ok("loading: no false 'add a key' message while the feed loads", !during.includes("TMDB key") && /Loading/.test(during));
  await p.waitForSelector('section[data-list="rated"]');
  ok("loading: then the shelves", true);
  await ctx.close();
}
page = await newPage({ init: setStore({ settings: { place: "KR", era: "classics" } }) });
ok("a chosen era with no films can still be cleared", await page.$eval('.era-line [data-era="classics"]', (el) => !el.disabled && el.classList.contains("on")));
await page.click('.era-line [data-era="classics"]');
ok("…and tapping it clears it", (await page.$$(".era-line .on")).length === 0 && (await page.$$('section[data-list="rated"]')).length === 1);
await page.context().close();

page = await newPage({ init: setStore({ settings: { hideSeen: true }, seen: { 10775: snap(10775) } }) });
await page.click('#tabs [data-tab="search"]');
await page.fill("#q", "infernal");
await page.waitForFunction(() => document.querySelector("#view").textContent.includes("Infernal Affairs"));
ok("search still finds a seen film with Hide seen on", (await page.$$('#view .item[data-film="10775"]')).length === 1);
await page.context().close();

const krAll = FEED.films.filter((f) => f.places.includes("KR"));
const last = krAll[0].id;
page = await newPage({ init: setStore({ settings: { place: "KR", hideSeen: true }, seen: Object.fromEntries(krAll.filter((f) => f.id !== last).map((f) => [f.id, snap(f.id)])) }) });
await page.click('section[data-list="rated"] [data-all]');
await page.waitForSelector(`#grid [data-film="${last}"]`);
await page.click(`#grid [data-film="${last}"]`);
await page.waitForFunction(() => document.querySelector("#film").open);
await page.click('#film [data-act="seen"]');
await page.keyboard.press("Escape");
await page.waitForFunction(() => !document.querySelector("#film").open);
ok("an emptied grid says so", (await page.$$("#grid [data-film]")).length === 0 && /No films here yet/.test(await page.textContent("#view")));
await page.context().close();

const crafted = { 77: { id: 77, title: "Crafted", original: "Crafted", year: "<img src=x onerror=window.__pwned=1>", places: ["HK"], genres: [], cast: [], director: null, poster: '/a.jpg" onerror="window.__pwned=2', at: "2026-11-01T00:00:00Z" } };
page = await newPage({ init: setStore({ want: crafted }) });
await page.click('#tabs [data-tab="watchlist"]');
await page.click('.item[data-film="77"]');
await page.waitForFunction(() => document.querySelector("#film").open);
await page.waitForTimeout(200);
ok("stored text is escaped, never run", (await page.evaluate(() => window.__pwned)) === undefined && (await page.$$("#view img[src='x'], #film img[src='x']")).length === 0);
await page.context().close();

page = await newPage({ init: setStore({ want: { 99999: { id: 99999, title: "Gone Film", original: "消失的電影", year: 1990, era: "1990s", places: ["HK"], genres: ["Drama"], director: { id: 1, name: "Someone" }, cast: [], poster: null, at: "2026-11-01T00:00:00Z" } } }) });
await page.click('#tabs [data-tab="watchlist"]');
await page.click('.item[data-film="99999"]');
await page.waitForFunction(() => document.querySelector("#film").open);
ok("with the list loaded, a missing film is 'no longer in this week's list'", (await sheetText(page)).includes("No longer in this week's list"));
await page.context().close();

ok("no page errors", errs.length === 0);
if (errs.length) console.log(errs.join("\n"));
console.log(out.join("\n"));
await b.close(); srv.close();
process.exit(out.some((l) => l.startsWith("FAIL")) ? 1 : 0);
