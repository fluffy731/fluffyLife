// Builds spots/feed.json for the Spots app's Today screen: events from What's On Melbourne and Eventfinda,
// what's new from Time Out, Concrete Playground and Google News, the week's weather and Victoria's public holidays.
// Runs on GitHub Actions (hourly); the phone only downloads the finished JSON.
//   node scripts/build-spots.mjs            build spots/feed.json (merging the last one, so a failed source keeps its items)
//   node scripts/build-spots.mjs --probe    report what each source gives, and what Today would show
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { parseFeed } from "./build-news.mjs";

const UA = "Mozilla/5.0 (compatible; fluffyLife-spots/1.0; personal reader)";
const TZ = "Australia/Melbourne";
const OUT = "spots/feed.json";
// Each source's own listings, before merging, so a failed or reused source can be merged afresh with the others.
// Outside the published site; the workflow keeps it in the Actions cache.
const RAW = join(process.env.SPOTS_CACHE || join(homedir(), ".spots-cache"), "raw.json");
const LIVE = "https://fluffy731.github.io/fluffyLife/spots/feed.json";
export const WOM = "https://whatson.melbourne.vic.gov.au";
const EF = "https://www.eventfinda.com.au/feed/events/melbourne/whatson";
const GNEWS = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-AU&gl=AU&ceid=AU:en`;
const FRESH_DAYS = 21, FRESH_MAX = 40, ROUNDUP_DAYS = 7, BLURB = 180;
const WOM_EVERY = 3 * 3600e3; // What's On is fetched at most every 3 hours (and after Melbourne midnight)

// ---------- dates, in Melbourne ----------
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function melb(at = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-AU", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" })
    .formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, dow: WD.indexOf(p.weekday), hour: +p.hour };
}
export const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const dowOf = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
// The Saturday of "this weekend": today on Saturday, yesterday on Sunday, otherwise the coming Saturday.
export function weekendOf(today) { const w = dowOf(today); return w === 6 ? today : w === 0 ? addDays(today, -1) : addDays(today, 6 - w); }

// ---------- text helpers ----------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" };
export function text(s = "") {
  let t = String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  for (let i = 0; i < 2; i++) t = t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e.toLowerCase()] ?? m);
  return t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
export const clip = (s, n = BLURB) => { const t = text(s); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t; };
const raw = (block, tag) => block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))?.[1] ?? "";
const attr = (tagText, name) => tagText?.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
const titleCase = (s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
// Same event in two sources: lower case, without "the", years, "Melbourne" and punctuation.
export const sameKey = (title) => text(title).toLowerCase().replace(/\b(the|20\d\d|melbourne)\b/g, " ").replace(/[^\p{L}\p{N}]+/gu, "");

// ---------- event kinds ----------
export const CATS = [
  ["market", /\b(markets?|bazaar|flea|craft fair|makers'? fair)\b/i],
  ["comedy", /\b(comedy|comedians?|stand-?up|improv)\b/i],
  ["music", /\b(music|gigs?|concerts?|live music|bands?|DJs?|orchestras?|symphony|jazz|choirs?|opera|recitals?|singer|songwriter)\b/i],
  ["film", /\b(films?|cinema|screenings?|movies?)\b/i],
  ["theatre", /\b(theatre|musicals?|cabaret|circus|ballet|dance|drag|plays?|burlesque|magic)\b/i],
  ["festival", /\b(festival|carnival|parade|fireworks|christmas|lunar new year|fiesta)\b/i],
  ["arts", /\b(exhibitions?|galler(y|ies)|art|artworks?|artists?|museum|design|photograph\w*|sculptures?|installation)\b/i],
  ["food", /\b(food|foodies?|wine|beer|dining|tastings?|feast\w*|cooking|degustation|cocktails?|whisky|gin|brunch|dinner|lunch)\b/i],
  ["family", /\b(kids?|family|families|children|school holidays)\b/i],
  ["talk", /\b(talks?|workshops?|class(es)?|lectures?|in conversation|writing|books?|masterclass)\b/i],
  ["sport", /\b(vs\.?|versus|cricket|footy|AFLW?|A-League|tennis|races?|racing|grand prix|marathon|basketball|netball|rugby|soccer)\b/i],
  ["outdoors", /\b(walk(s|ing)?|run(s|ning)?|fun-run|tours?|yoga|cruise|picnic|ride|hike)\b/i],
];
export const catOf = (title, blurb = "") => (CATS.find(([, re]) => re.test(title)) || CATS.find(([, re]) => re.test(blurb)) || ["other"])[0];
const OUTDOOR = /\b(parks?|gardens?|reserve|river|beach|outdoors?|open-air|walk(s|ing)?|run(s|ning)?|fun-run|picnic|cruise|promenade|esplanade|square|racecourse|rooftop)\b/i;
const FREE = /(?<![-\w])free\b(?!-)/i;

// ---------- What's On Melbourne (City of Melbourne's public MCP endpoint, plain JSON-RPC) ----------

// The search tool answers in numbered plain-text blocks: title, blurb, URL, Location, Start Date, End Date.
export function parseWhatsOn(txt) {
  const out = [];
  for (const block of String(txt).split(/\n(?=\d+\.\s)/)) {
    const m = block.match(/^\s*\d+\.\s+(.+)\n([\s\S]*)$/);
    if (!m) continue;
    const url = m[2].match(/^\s*URL:\s*(\S+)/m)?.[1];
    if (!url) continue;
    out.push({
      title: text(m[1]), blurb: clip(m[2].split(/^\s*URL:/m)[0]), path: url, url: url.startsWith("http") ? url : WOM + url,
      location: text(m[2].match(/^\s*Location:\s*(.+)$/m)?.[1] || ""),
      from: m[2].match(/^\s*Start Date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1] || null,
      to: m[2].match(/^\s*End Date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1] || null,
    });
  }
  return out;
}
export const pagesOf = (txt) => +(String(txt).match(/Page:\s*\d+\s+of\s+(\d+)/)?.[1] || 1);

// "State Library Victoria, 328 Swanston St, Melbourne 3000" -> venue, address, area "Melbourne".
export function splitLocation(loc) {
  const parts = String(loc || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!parts.length) return { venue: "", address: "", area: "" };
  const bare = (p) => p.replace(/\b(VIC|Victoria)\b/gi, "").replace(/\b\d{4}\b/g, "").trim();
  let area = "";
  for (let i = parts.length - 1; i >= 0 && !area; i--) area = bare(parts[i]);
  return { venue: parts[0], address: parts.slice(1).join(", "), area };
}

// Only dated things-to-do listings are events; attractions, articles and guides without dates are left out.
export function womEvent(it) {
  if (!/^\/things-to-do\//.test(it.path) || !it.from) return null;
  const { venue, address, area } = splitLocation(it.location);
  return { id: `wom:${it.path}`, src: "wom", title: it.title, blurb: it.blurb, url: it.url, venue, address, area, image: null,
    from: it.from, to: it.to || it.from, days: [], weekend: null, next: null, free: null, cat: catOf(it.title, it.blurb),
    outdoor: OUTDOOR.test(`${it.title} ${it.blurb} ${venue}`) || null };
}

// ---------- Eventfinda (RSS) ----------
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
export function longDate(s) { // "Friday, 6 March 2026" -> "2026-03-06"
  const m = String(s).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  const mi = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1;
  return mi < 0 ? null : `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

export function parseEventfinda(xml) {
  return [...String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => {
    const b = m[0];
    const desc = raw(b, "description").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    const paras = [...desc.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((x) => x[1]);
    const dateLine = text(paras[1] || "").split("|").pop();
    const [a, z] = dateLine.split(/\s+-\s+/);
    const content = raw(b, "content:encoded").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
    const [when, place = ""] = content.split(/<br\s*\/?>/i);
    const venue = text(when).split(", ").pop() || "";
    const link = text(raw(b, "link")).replace(/\?utm_[^#]*$/, "");
    const seg = link.replace(/^https?:\/\/[^/]+\/\d{4}\/[^/]+\/?/, "").split("/").filter(Boolean);
    const pub = text(raw(b, "pubDate")).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    const title = text(raw(b, "title"));
    const blurb = clip(paras[0] || desc).replace(/\s*\.\.\.…?$/, "…");
    return {
      id: `ef:${text(raw(b, "guid")) || link}`, src: "ef", title, blurb, url: link, venue, address: "",
      area: text(place) || (seg.length ? titleCase(seg[seg.length - 1]) : ""), image: attr(b.match(/<enclosure\b[^>]*>/i)?.[0], "url") || null,
      from: longDate(a) || (pub && pub[1]) || null, to: longDate(z) || longDate(a) || (pub && pub[1]) || null,
      days: pub ? [pub[1]] : [], weekend: null, next: pub ? `${pub[1]}T${pub[2]}` : null,
      free: FREE.test(`${title} ${blurb}`) || null, cat: catOf(title, blurb), outdoor: OUTDOOR.test(`${title} ${blurb} ${venue}`) || null,
    };
  }).filter((e) => e.title && /^https?:/.test(e.url));
}

// ---------- merging events ----------

// lists: [{ events, days?: [date], weekend?: saturday, free?: true }] -> one list, each event once.
// What's On's copy wins a duplicate (it has the address); the other source's next session and picture are kept.
// The same event: the same title, or one with an add-on ("Opera Up Late" and "Opera Up Late with Reuben Kaye"),
// with overlapping dates, and not in two different suburbs (Eventfinda's plain "Melbourne" fits any). Add-on
// matches also need venues that don't disagree, so "Night Market" at Queen Vic isn't "Night Markets Box Hill".
const overlaps = (a, b) => !a.from || !b.from || ((a.from <= (b.to || b.from)) && (b.from <= (a.to || a.from)));
const place = (s) => text(s || "").toLowerCase().replace(/\b(the|cbd|inner city|city|vic|victoria)\b/g, " ").replace(/[^\p{L}\p{N}]+/gu, "");
const differ = (a, b, { generic = false } = {}) => {
  const x = place(a), y = place(b);
  if (!x || !y || (generic && (x === "melbourne" || y === "melbourne"))) return false;
  return !x.includes(y) && !y.includes(x);
};
function sameEvent(oKey, k, old, e) {
  const exact = oKey.split("|")[0] === k;
  if (!exact && !(Math.min(oKey.length, k.length) >= 8 && (oKey.startsWith(k) || k.startsWith(oKey)))) return false;
  if (!overlaps(old, e) || differ(old.area, e.area, { generic: true })) return false;
  return exact || !differ(old.venue, e.venue);
}
export function mergeEvents(lists, today) {
  const byKey = new Map();
  const find = (k, e) => [...byKey.keys()].find((o) => sameEvent(o, k, byKey.get(o), e));
  for (const { events, days = [], weekend = null, free = false } of lists) {
    for (const e of events) {
      if (!e || (e.to && e.to < today)) continue;
      const base = sameKey(e.title);
      let k = find(base, e);
      if (!k) { k = base; for (let n = 2; byKey.has(k); n++) k = `${base}|${n}`; }
      const old = byKey.get(k);
      const add = { ...e, days: [...new Set([...(e.days || []), ...days])], weekend: weekend || e.weekend, free: free || e.free || (FREE.test(`${e.title} ${e.blurb}`) || null) };
      if (!old) { byKey.set(k, add); continue; }
      const [keep, other] = old.src === "wom" || add.src !== "wom" ? [old, add] : [add, old];
      byKey.set(k, { ...keep, days: [...new Set([...old.days, ...add.days])].sort(), weekend: keep.weekend || other.weekend,
        next: keep.next || other.next, image: keep.image || other.image, free: keep.free || other.free || null,
        area: keep.area || other.area, venue: keep.venue || other.venue, from: keep.from || other.from, to: keep.to || other.to });
    }
  }
  return [...byKey.values()].map((e) => ({ ...e, days: e.days.filter((d) => d >= today).sort() }));
}

// ---------- what's new (articles) ----------
// "New" alone is too common in news headlines, so it only counts next to a venue or an outing.
const OPEN = /\b(opens?|opening|opened|now open|newest|launch(es|ed|ing)?|debuts?|arriv(es|ing|ed)|coming soon|pop-?ups?|first look|returns?|is back|unveil\w*|reopen\w*)\b|\bnew\s+(\S+\s+){0,2}(restaurants?|bars?|caf[eé]s?|venues?|spots?|eater(y|ies)|bak(ery|eries)|pubs?|rooftops?|markets?|exhibitions?|festivals?|shows?|menus?|stores?|precincts?|dessert|gelato|cinemas?|galler(y|ies)|attractions?|openings?|diner|wine bar|food hall)\b/i;
const CLOSE = /\b(clos(e|es|ed|ing|ure|ures)|shut(s|ting)?|calls? it quits|final (days|service)|goes bust|administration)\b/i;
const ELSEWHERE = /\b(Sydney|Perth|Brisbane|Adelaide|Hobart|Canberra|Gold Coast|Darwin|Auckland|NSW|Queensland)\b/i;
const NOT_NEW = /\bopening (night|weekend|party|ceremony)\b|^\s*(photos?|gallery|watch|video|listen)\s*:/i;
export const isOpening = (title) => OPEN.test(title) && !CLOSE.test(title) && !NOT_NEW.test(title);
export const isRoundup = (title) => /\b(things to do|what'?s on|best events)\b.*\b(this weekend|this week|weekend)\b|\bthis weekend in melbourne\b/i.test(title);
const KIND_PATH = [[/\/restaurants?\//, "eat"], [/\/bars?\//, "drink"], [/\/(cafes?|coffee)\//, "coffee"]];
const KIND_WORD = [
  // A gelato bar is dessert and a pizza bar is food: dessert, then food, then drink, then coffee.
  ["dessert", /\b(desserts?|gelato|ice cream|cakes?|pastr(y|ies)|bak(ery|eries)|doughnuts?|donuts?|croissants?|patisserie)\b/i],
  ["eat", /\b(restaurants?|eatery|eats|dining|diner|pizz\w*|ramen|dumplings?|noodles?|burgers?|tacos?|sushi|steak\w*|bbq|barbecue|yum cha|bistro|trattoria|food hall|chef)\b/i],
  ["drink", /\b(bars?|pubs?|wine|cocktails?|brewer(y|ies)|beer|rooftop|taproom|speakeasy)\b/i],
  ["coffee", /\b(caf[eé]s?|coffee|espresso|roaster\w*|brunch)\b/i],
];
export function freshKind(url, title) {
  for (const [re, k] of KIND_PATH) if (re.test(url)) return k;
  return (KIND_WORD.find(([, re]) => re.test(title)) || ["other"])[0];
}

// src: "timeout" | "concrete" | "gnews". Event write-ups always count; other articles only when they read as new.
export function articlesFrom(src, xml, today) {
  const items = parseFeed(xml);
  const out = [];
  for (const it of items) {
    let title = it.title, source = src === "timeout" ? "Time Out" : src === "concrete" ? "Concrete Playground" : "";
    if (src === "gnews") {
      const m = title.match(/^(.*\S)\s+-\s+([^-]+)$/);
      if (m) { title = m[1]; source = m[2].trim(); }
      if (ELSEWHERE.test(title) && !/\bMelb/i.test(title)) continue;
    }
    const url = it.link, path = url.replace(/^https?:\/\/[^/]+/, "");
    if (src === "timeout" && !/^\/melbourne\/(things-to-do|restaurants|bars|news|film|theatre|art|music|nightlife|food-drink)\//.test(path)) continue;
    if (src === "concrete" && (/\/(travel-leisure|design-style|health)\//.test(path) || it.categories.some((c) => /^sponsored$/i.test(c)))) continue;
    const event = (src === "timeout" && /^\/melbourne\/things-to-do\//.test(path)) || (src === "concrete" && /\/event\//.test(path));
    const always = event || (src !== "gnews" && /\/(restaurants|bars|cafes)\//.test(path));
    if (CLOSE.test(title) || isRoundup(title) || (!always && !isOpening(title))) continue;
    const date = it.time ? melb(new Date(it.time)).date : today;
    out.push({ id: `${src}:${src === "gnews" ? sameKey(title).slice(0, 60) : url.replace(/[?#].*$/, "")}`, src, source, title,
      blurb: src === "gnews" ? "" : clip(it.summary), url, image: it.image || null, date, kind: event ? "event" : freshKind(url, title) });
  }
  return out;
}

export function roundupsFrom(src, xml) {
  return parseFeed(xml).map((it) => {
    let title = it.title, source = src === "timeout" ? "Time Out" : "";
    const m = src === "gnews" && title.match(/^(.*\S)\s+-\s+([^-]+)$/);
    if (m) { title = m[1]; source = m[2].trim(); }
    return { title: src === "timeout" && !/\bMelb/i.test(title) ? `${title} (Melbourne)` : title, source, url: it.link, date: it.time ? melb(new Date(it.time)).date : null };
  }).filter((r) => isRoundup(r.title) && r.date && /\bMelb/i.test(r.title) && !ELSEWHERE.test(`${r.title} ${r.source}`));
}

// New items first, then the last feed's, each once (by id or same headline), inside the window, newest first.
export function mergeFresh(now, prev, today) {
  const cut = addDays(today, -FRESH_DAYS), seen = new Set(), out = [];
  for (const f of [...now, ...(prev || [])]) {
    const k = sameKey(f.title);
    if (!f.date || f.date < cut || seen.has(f.id) || seen.has(k)) continue;
    seen.add(f.id); seen.add(k); out.push(f);
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, FRESH_MAX);
}
export function mergeRoundups(now, prev, today) {
  const cut = addDays(today, -ROUNDUP_DAYS), bySource = new Map();
  for (const r of [...now, ...(prev || [])].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (r.date >= cut && !bySource.has(r.source || r.url)) bySource.set(r.source || r.url, r);
  }
  return [...bySource.values()].slice(0, 4);
}

// ---------- weather and holidays ----------
export function weatherFrom(j) {
  const d = j && j.daily;
  if (!d || !Array.isArray(d.time)) return [];
  return d.time.map((date, i) => ({ date, rain: d.precipitation_probability_max?.[i] ?? null, max: d.temperature_2m_max?.[i] == null ? null : Math.round(d.temperature_2m_max[i]) }));
}
export function holidaysFrom(lists) {
  return lists.flat().filter((h) => h && h.date && (h.global || (h.counties || []).includes("AU-VIC")))
    .map((h) => ({ date: h.date, name: h.localName || h.name })).sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ---------- fetching ----------
async function get(url, init = {}, ms = 25000) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { redirect: "follow", ...init, headers: { "user-agent": UA, accept: "application/rss+xml, application/xml, application/json, text/xml, */*", ...(init.headers || {}) }, signal: ctl.signal });
    return { status: r.status, text: r.ok ? await r.text() : "" };
  } catch (e) { return { status: 0, text: "", error: String(e.cause?.code || e.message || e) }; } finally { clearTimeout(timer); }
}
async function pool(list, n, fn) {
  const out = new Array(list.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const k = i++; out[k] = await fn(list[k], k); } }));
  return out;
}
let rpcId = 1;
async function womSearch(args) {
  const r = await get(`${WOM}/mcp`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method: "tools/call", params: { name: "search_tool", arguments: args } }) });
  if (r.status !== 200) throw new Error(`What's On ${r.status || r.error}`);
  const j = JSON.parse(r.text);
  if (j.error || j.result?.isError) throw new Error(`What's On: ${j.error?.message || "tool error"}`);
  return (j.result?.content || []).map((c) => c.text || "").join("\n");
}
// Every page it could get, and whether it got them all.
async function womAll(args, maxPages) {
  const first = await womSearch(args);
  const pages = Math.min(maxPages, pagesOf(first));
  const rest = await pool(Array.from({ length: pages - 1 }, (_, i) => i + 2), 3, (p) => womSearch({ ...args, page_number: p }).catch(() => null));
  return { items: [first, ...rest].filter((t) => t != null).flatMap(parseWhatsOn), complete: rest.every((t) => t != null) };
}

async function fetchWhatsOn(today) {
  const tmr = addDays(today, 1), sat = weekendOf(today);
  const q = (date_keyword, pages, sub) => womAll({ category: "things_to_do", date_keyword, ...(sub ? { sub_categories: [sub] } : {}) }, pages);
  // One query at a time (each fetches up to 3 pages at once), to go easy on the City's server.
  const t = await q("today", 10), tf = await q("today", 5, "free"), m = await q("tomorrow", 6), mf = await q("tomorrow", 3, "free"),
    w = await q("this_weekend", 6), wf = await q("this_weekend", 3, "free");
  const ev = (r) => r.items.map(womEvent).filter(Boolean);
  return {
    complete: [t, tf, m, mf, w, wf].every((r) => r.complete),
    lists: [
      { events: ev(t), days: [today] }, { events: ev(tf), days: [today], free: true },
      { events: ev(m), days: [tmr] }, { events: ev(mf), days: [tmr], free: true },
      { events: ev(w), weekend: sat }, { events: ev(wf), weekend: sat, free: true },
    ],
  };
}

async function fetchEventfinda(today) {
  const sat = weekendOf(today);
  const urls = [["today", `${EF}/today.rss`], ["weekend", `${EF}/this-weekend.rss`], ["up1", `${EF}/upcoming.rss`], ["up2", `${EF}/upcoming.rss?page=2`], ["up3", `${EF}/upcoming.rss?page=3`]];
  const rs = await pool(urls, 3, async ([k, u]) => ({ k, r: await get(u) }));
  if (!rs.some(({ r }) => r.status === 200)) throw new Error(`Eventfinda ${rs[0].r.status || rs[0].r.error}`);
  return rs.filter(({ r }) => r.text).map(({ k, r }) => ({ events: parseEventfinda(r.text), ...(k === "weekend" ? { weekend: sat } : {}) }));
}

function readJSON(path) {
  try { if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8")); } catch { /* broken file: start afresh */ }
  return null;
}
// A source's lists, without what has ended.
const live = (lists, today) => (Array.isArray(lists) ? lists : []).map((l) => ({ ...l, events: (l.events || []).filter((e) => !e.to || e.to >= today) }));

export async function build({ now = new Date(), out = OUT, raw: rawPath = RAW } = {}) {
  const { date: today } = melb(now);
  let prev = readJSON(out);
  if (!prev) { const r = await get(LIVE, {}, 15000); try { prev = r.text ? JSON.parse(r.text) : null; } catch { prev = null; } }
  const rawPrev = readJSON(rawPath) || {};
  const fetched = { ...(prev && prev.fetched) };
  const sources = [];
  const note = (id, ok, count, error) => sources.push({ id, ok, count, ...(error ? { error: String(error).slice(0, 120) } : {}) });
  const count = (lists) => new Set(lists.flatMap((x) => x.events.map((e) => e.id))).size;
  // A source's last lists: from the raw cache, or else (first run, cache lost) its events in the last feed.
  const kept = (src) => (rawPrev[src] ? live(rawPrev[src], today)
    : [{ events: prev && Array.isArray(prev.events) ? prev.events.filter((e) => e.src === src && (!e.to || e.to >= today)) : [] }]);

  // Events: each source's lists are kept apart and merged afresh, so a source that's down or reused never
  // freezes or drops what the other one adds (session times, pictures, days).
  const raw = {};
  const womFresh = rawPrev.wom && fetched.wom && now - new Date(fetched.wom) < WOM_EVERY && melb(new Date(fetched.wom)).date === today;
  if (womFresh) { raw.wom = kept("wom"); note("whatson", true, count(raw.wom), "kept: fetched within 3 hours"); }
  else {
    try {
      const r = await fetchWhatsOn(today);
      // Some pages missing: keep the last lists alongside, and try again next hour.
      raw.wom = r.complete ? r.lists : [...r.lists, ...kept("wom")];
      if (r.complete) fetched.wom = now.toISOString();
      note("whatson", true, count(raw.wom), r.complete ? "" : "some pages missing: last lists kept too");
    } catch (e) { raw.wom = kept("wom"); note("whatson", false, count(raw.wom), e.message); }
  }
  try { raw.ef = await fetchEventfinda(today); fetched.ef = now.toISOString(); note("eventfinda", true, count(raw.ef)); }
  catch (e) { raw.ef = kept("ef"); note("eventfinda", false, count(raw.ef), e.message); }
  const events = mergeEvents([...raw.wom, ...raw.ef], today);
  mkdirSync(dirname(rawPath), { recursive: true });
  writeFileSync(rawPath, JSON.stringify({ wom: live(raw.wom, today), ef: live(raw.ef, today) }));

  // What's new and round-ups
  const feeds = [
    ["timeout", "https://www.timeout.com/melbourne/feed.rss"],
    ["concrete", "https://concreteplayground.com/melbourne/feed"],
    ["gnews", GNEWS("Melbourne (new restaurant OR new bar OR new cafe OR \"now open\" OR opening) when:7d")],
    ["gnews-weekend", GNEWS("Melbourne \"things to do\" (\"this weekend\" OR \"this week\") when:7d")],
  ];
  const got = await pool(feeds, 4, async ([id, u]) => ({ id, r: await get(u) }));
  const fresh = [], roundups = [];
  for (const { id, r } of got) {
    if (id === "gnews-weekend") { const rs = r.text ? roundupsFrom("gnews", r.text) : []; roundups.push(...rs); note(id, !!r.text, rs.length, r.error || (r.text ? "" : r.status)); continue; }
    const fs = r.text ? articlesFrom(id, r.text, today) : [];
    fresh.push(...fs);
    if (id === "timeout" && r.text) roundups.push(...roundupsFrom("timeout", r.text));
    note(id, !!r.text, fs.length, r.error || (r.text ? "" : r.status));
  }

  // Weather and holidays
  const year = +today.slice(0, 4);
  const [wx, h1, h2] = await Promise.all([
    get("https://api.open-meteo.com/v1/forecast?latitude=-37.81&longitude=144.96&daily=precipitation_probability_max,temperature_2m_max&timezone=Australia%2FMelbourne&forecast_days=7", {}, 30000),
    get(`https://date.nager.at/api/v3/PublicHolidays/${year}/AU`), get(`https://date.nager.at/api/v3/PublicHolidays/${year + 1}/AU`),
  ]);
  const json = (r) => { try { return r.text ? JSON.parse(r.text) : null; } catch { return null; } };
  let weather = weatherFrom(json(wx));
  note("weather", weather.length > 0, weather.length, wx.error);
  if (!weather.length && prev) weather = (prev.weather || []).filter((d) => d.date >= today);
  let holidays = holidaysFrom([json(h1) || [], json(h2) || []]);
  note("holidays", holidays.length > 0, holidays.length, h1.error);
  if (!holidays.length && prev) holidays = prev.holidays || [];
  holidays = holidays.filter((x) => x.date >= addDays(today, -1));

  const feed = {
    built: now.toISOString(), today, fetched, sources, weather, holidays,
    events: events.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0)),
    fresh: mergeFresh(fresh, prev && prev.fresh, today),
    roundups: mergeRoundups(roundups, prev && prev.roundups, today),
  };
  mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(out, JSON.stringify(feed));
  return feed;
}

async function probe() {
  const feed = await build({ out: "/tmp/spots-probe-feed.json", raw: "/tmp/spots-probe-raw.json" });
  for (const s of feed.sources) console.log(`${s.ok ? "OK  " : "FAIL"} ${s.id.padEnd(14)} ${String(s.count).padStart(4)} ${s.error || ""}`);
  console.log(`\nevents: ${feed.events.length} (${["wom", "ef"].map((s) => `${s} ${feed.events.filter((e) => e.src === s).length}`).join(", ")}), today-listed ${feed.events.filter((e) => e.days.includes(feed.today)).length}, free ${feed.events.filter((e) => e.free).length}`);
  const cats = {}; for (const e of feed.events) cats[e.cat] = (cats[e.cat] || 0) + 1;
  console.log(`kinds: ${JSON.stringify(cats)}`);
  console.log(`fresh: ${feed.fresh.length}; roundups: ${feed.roundups.map((r) => r.source).join(", ")}; weather: ${feed.weather.map((d) => `${d.date.slice(5)} ${d.rain}% ${d.max}°`).join(" | ")}`);
  console.log(`holidays: ${feed.holidays.slice(0, 4).map((h) => `${h.date} ${h.name}`).join(", ")}`);
  const { onToday, nextList } = await import("../spots/today.js");
  const at = new Date();
  const fmt = (e) => `  ${e.cat.padEnd(8)} ${e.free ? "free " : "     "}${e.title.slice(0, 50).padEnd(50)} ${e.from}..${e.to} ${e.next || ""} ${e.area}`;
  console.log("\nOn today (top 12):"); for (const e of onToday(feed, at).slice(0, 12)) console.log(fmt(e));
  const nl = nextList(feed, at); console.log(`\n${nl.title} (top 8):`); for (const e of nl.events.slice(0, 8)) console.log(fmt(e));
  console.log("\nNew in town (top 10):"); for (const f of feed.fresh.slice(0, 10)) console.log(`  ${f.date} ${f.kind.padEnd(7)} ${f.source.padEnd(20)} ${f.title.slice(0, 70)}`);
  console.log(`\nfeed size: ${JSON.stringify(feed).length} bytes`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--probe")) await probe();
  else { const f = await build(); console.log("spots/feed.json:", JSON.stringify({ events: f.events.length, fresh: f.fresh.length, roundups: f.roundups.length, sources: f.sources })); }
}
