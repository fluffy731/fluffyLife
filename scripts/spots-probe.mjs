// Throwaway recon for Spots phase 2: which free Melbourne event and new-opening sources answer from GitHub Actions.
// Prints, for each URL: HTTP status, type, size, RSS/Atom items, JSON-LD Event count, discovered feed links, sample titles.
// Not part of the site; delete once the sources are chosen.
const UA = "Mozilla/5.0 (compatible; fluffyLife-spots/1.0; personal reader)";
const URLS = [
  // City of Melbourne What's On
  "https://whatson.melbourne.vic.gov.au/llms.txt",
  "https://whatson.melbourne.vic.gov.au/.well-known/mcp.json",
  "https://whatson.melbourne.vic.gov.au/sitemap.xml",
  "https://whatson.melbourne.vic.gov.au/things-to-do",
  "https://whatson.melbourne.vic.gov.au/rss",
  // Eventfinda
  "https://www.eventfinda.com.au/feed/events/melbourne/whatson/upcoming.rss",
  "https://www.eventfinda.com.au/whatson/events/melbourne",
  // Concrete Playground
  "https://concreteplayground.com/melbourne/feed",
  "https://concreteplayground.com/melbourne/feed/",
  "https://concreteplayground.com/melbourne",
  // Broadsheet
  "https://www.broadsheet.com.au/melbourne",
  "https://www.broadsheet.com.au/melbourne/rss",
  "https://www.broadsheet.com.au/rss/melbourne",
  "https://www.broadsheet.com.au/melbourne/series/coming-soon",
  // Time Out
  "https://www.timeout.com/melbourne",
  "https://www.timeout.com/melbourne/feed.rss",
  "https://www.timeout.com/melbourne/things-to-do/things-to-do-in-melbourne-this-weekend",
  // Urban List
  "https://www.theurbanlist.com/melbourne",
  "https://www.theurbanlist.com/melbourne/rss",
  // Secret Melbourne, Weekend Notes, Good Food
  "https://secretmelbourne.com/feed/",
  "https://www.weekendnotes.com/melbourne/",
  "https://www.goodfood.com.au/",
  "https://www.goodfood.com.au/rss",
  // Venues and institutions
  "https://www.ngv.vic.gov.au/feed/",
  "https://www.ngv.vic.gov.au/whats-on/",
  "https://www.acmi.net.au/whats-on/",
  "https://api.acmi.net.au/",
  "https://www.slv.vic.gov.au/whats-on",
  "https://www.artscentremelbourne.com.au/whats-on",
  "https://qvm.com.au/feed/",
  "https://www.wheelercentre.com/events",
  "https://www.beat.com.au/feed/",
  // Aggregators
  "https://allevents.in/melbourne",
  "https://www.reddit.com/r/melbourne/.rss",
  "https://news.google.com/rss/search?q=Melbourne+new+restaurant+opening+when:7d&hl=en-AU&gl=AU&ceid=AU:en",
  "https://news.google.com/rss/search?q=Melbourne+%22this+weekend%22+festival+OR+market+OR+exhibition+when:7d&hl=en-AU&gl=AU&ceid=AU:en",
  // Public holidays and weather (for day-aware picks)
  "https://date.nager.at/api/v3/PublicHolidays/2026/AU",
  "https://api.open-meteo.com/v1/forecast?latitude=-37.81&longitude=144.96&daily=precipitation_probability_max,temperature_2m_max&timezone=Australia%2FMelbourne",
];

const decode = (s = "") => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

async function get(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/rss+xml, application/atom+xml, application/json, text/html, */*" }, signal: ctl.signal, redirect: "follow" });
    return { status: r.status, type: r.headers.get("content-type") || "", final: r.url, text: await r.text() };
  } catch (e) { return { status: 0, type: "", text: "", error: String(e.cause?.code || e.message || e) }; } finally { clearTimeout(t); }
}

const found = new Set();
function inspect(url, r) {
  const x = r.text;
  const items = [...x.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  const titles = items.slice(0, 4).map((b) => decode(b.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").slice(0, 90));
  const dates = items.slice(0, 2).map((b) => decode(b.match(/<(pubDate|published|updated|dc:date)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] || ""));
  const feeds = [...x.matchAll(/<link\b[^>]*type=["']application\/(rss|atom)\+xml["'][^>]*>/gi)].map((m) => m[0].match(/href=["']([^"']+)/i)?.[1]).filter(Boolean);
  const ld = [...x.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const ldEvents = ld.join(" ").match(/"@type"\s*:\s*"(Event|MusicEvent|Festival|ExhibitionEvent|TheaterEvent|FoodEvent|ComedyEvent)"/g)?.length || 0;
  const ldTypes = [...new Set(ld.join(" ").match(/"@type"\s*:\s*"[A-Za-z]+"/g) || [])].slice(0, 8).join(",");
  const next = /__NEXT_DATA__/.test(x) ? " next-data" : "";
  const cf = /cf-chl|challenge-platform|Just a moment/i.test(x) ? " CLOUDFLARE-CHALLENGE" : "";
  console.log(`\n${r.status === 200 ? "OK  " : "FAIL"} ${r.status} ${url}`);
  console.log(`     type=${r.type.split(";")[0]} bytes=${x.length} items=${items.length} ldEvents=${ldEvents} ld=[${ldTypes}]${next}${cf} ${r.error || ""}${r.final && r.final !== url ? " -> " + r.final : ""}`);
  if (feeds.length) console.log(`     feeds: ${[...new Set(feeds)].slice(0, 6).join(" ")}`);
  for (const f of feeds.slice(0, 4)) { try { const abs = new URL(f, r.final || url).href; if (!URLS.includes(abs)) found.add(abs); } catch {} }
  if (titles.length) console.log(`     titles: ${titles.join(" | ")}`);
  if (dates.length && dates[0]) console.log(`     dates: ${dates.join(" | ")}`);
  if (!items.length && /json|text\/plain/.test(r.type)) console.log(`     head: ${x.slice(0, 600).replace(/\s+/g, " ")}`);
}

async function run(list) {
  for (let i = 0; i < list.length; i += 6) {
    const batch = list.slice(i, i + 6);
    const rs = await Promise.all(batch.map(get));
    batch.forEach((u, k) => inspect(u, rs[k]));
  }
}
await run(URLS);
console.log("\n===== feeds discovered on those pages =====");
await run([...found].slice(0, 30));
