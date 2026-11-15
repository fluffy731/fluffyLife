// Throwaway recon for Spots phase 2, round 2: what each working source actually gives.
// Not part of the site; delete once the sources are chosen.
const UA = "Mozilla/5.0 (compatible; fluffyLife-spots/1.0; personal reader)";

async function get(url, init = {}, ms = 30000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { redirect: "follow", ...init, headers: { "user-agent": UA, ...(init.headers || {}) }, signal: ctl.signal });
    return { status: r.status, type: r.headers.get("content-type") || "", headers: Object.fromEntries(r.headers), text: await r.text() };
  } catch (e) { return { status: 0, type: "", headers: {}, text: "", error: String(e.cause?.code || e.message || e) }; } finally { clearTimeout(t); }
}
const show = (label, s, n = 2500) => console.log(`\n===== ${label} =====\n${String(s).slice(0, n)}`);
const firstItems = (xml, n = 2) => [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].slice(0, n).map((m) => m[0]).join("\n---\n");
const channelHead = (xml) => xml.slice(0, xml.search(/<item\b|<entry\b/i)).slice(0, 1200);

// 1. Eventfinda: item structure and paging / category variants
{
  const r = await get("https://www.eventfinda.com.au/feed/events/melbourne/whatson/upcoming.rss");
  show("eventfinda channel head", channelHead(r.text));
  show("eventfinda first 2 items", firstItems(r.text), 4000);
  for (const u of [
    "https://www.eventfinda.com.au/feed/events/melbourne/whatson/upcoming.rss?rows=100",
    "https://www.eventfinda.com.au/feed/events/melbourne/whatson/upcoming.rss?page=2",
    "https://www.eventfinda.com.au/feed/events/melbourne/whatson/this-weekend.rss",
    "https://www.eventfinda.com.au/feed/events/melbourne/whatson/today.rss",
    "https://www.eventfinda.com.au/feed/events/melbourne/whatson/free.rss",
    "https://www.eventfinda.com.au/feed/events/melbourne/concerts-gig-guide/upcoming.rss",
    "https://www.eventfinda.com.au/feed/events/melbourne/festivals-lifestyle/upcoming.rss",
    "https://www.eventfinda.com.au/feed/events/melbourne/exhibitions/upcoming.rss",
    "https://www.eventfinda.com.au/feed/events/melbourne-city/whatson/upcoming.rss",
    "https://www.eventfinda.com.au/feed/events/melbourne/markets/upcoming.rss",
  ]) {
    const x = await get(u);
    const items = (x.text.match(/<item\b/gi) || []).length;
    const titles = [...x.text.matchAll(/<item\b[\s\S]*?<title>([\s\S]*?)<\/title>/gi)].slice(0, 3).map((m) => m[1].slice(0, 60));
    console.log(`eventfinda ${x.status} items=${items} ${u} | ${titles.join(" | ")}`);
  }
}

// 2. What's On Melbourne MCP: descriptor, tools/list, a search
{
  const d = await get("https://whatson.melbourne.vic.gov.au/.well-known/mcp.json");
  show("whatson mcp.json", d.text, 6000);
  const H = { "content-type": "application/json", accept: "application/json, text/event-stream" };
  const rpc = async (body, extra = {}) => get("https://whatson.melbourne.vic.gov.au/mcp", { method: "POST", headers: { ...H, ...extra }, body: JSON.stringify(body) });
  const init = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "fluffylife-spots", version: "1.0" } } });
  show(`whatson initialize ${init.status} ${init.type} session=${init.headers["mcp-session-id"] || "-"}`, init.text, 1500);
  const sid = init.headers["mcp-session-id"] ? { "mcp-session-id": init.headers["mcp-session-id"] } : {};
  if (sid["mcp-session-id"]) await rpc({ jsonrpc: "2.0", method: "notifications/initialized" }, sid);
  const list = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" }, sid);
  show(`whatson tools/list ${list.status}`, list.text, 6000);
  for (const args of [{ query: "events this weekend" }, { query: "markets" }, { query: "new restaurant" }]) {
    const call = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "search_tool", arguments: args } }, sid);
    show(`whatson search ${JSON.stringify(args)} ${call.status}`, call.text, 5000);
  }
}

// 3. allevents.in: JSON-LD events and RSS item
{
  const r = await get("https://allevents.in/melbourne");
  const ld = [...r.text.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const evBlock = ld.find((x) => /"@type"\s*:\s*"Event"/.test(x)) || "";
  show("allevents first JSON-LD block with Event", evBlock, 3500);
  const rss = await get("https://allevents.in/melbourne/RSS");
  show("allevents rss items", firstItems(rss.text), 3000);
  for (const u of ["https://allevents.in/melbourne/this-weekend", "https://allevents.in/melbourne/today", "https://allevents.in/melbourne/free"]) {
    const x = await get(u); const n = (x.text.match(/"@type"\s*:\s*"Event"/g) || []).length;
    console.log(`allevents ${x.status} ldEvents=${n} ${u}`);
  }
}

// 4. Article feeds: item structure (categories, images, summaries)
for (const [label, u] of [
  ["timeout", "https://www.timeout.com/melbourne/feed.rss"],
  ["concrete", "https://concreteplayground.com/melbourne/feed"],
  ["beat", "https://beat.com.au/feed/"],
  ["gnews openings", "https://news.google.com/rss/search?q=Melbourne+new+restaurant+opening+when:7d&hl=en-AU&gl=AU&ceid=AU:en"],
]) {
  const r = await get(u);
  show(`${label} first 2 items`, firstItems(r.text), 3500);
  const cats = {}; for (const m of r.text.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/gi)) { const c = m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim(); cats[c] = (cats[c] || 0) + 1; }
  console.log(`${label} categories: ${Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 30).map(([c, n]) => `${c}(${n})`).join(", ")}`);
  const links = [...r.text.matchAll(/<link>([^<]+)<\/link>/gi)].slice(1, 40).map((m) => m[1].replace(/^https?:\/\/[^/]+/, "")).map((p) => p.split("/").slice(0, 3).join("/"));
  const paths = {}; for (const p of links) paths[p] = (paths[p] || 0) + 1;
  console.log(`${label} link sections: ${JSON.stringify(paths)}`);
}

// 5. Weather retry, longer timeout
{
  const r = await get("https://api.open-meteo.com/v1/forecast?latitude=-37.81&longitude=144.96&daily=precipitation_probability_max,temperature_2m_max&timezone=Australia%2FMelbourne", {}, 45000);
  show(`open-meteo ${r.status} ${r.error || ""}`, r.text, 800);
}
