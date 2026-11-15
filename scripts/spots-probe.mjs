// Throwaway recon for Spots phase 2, round 3: What's On Melbourne filters, Eventfinda today feed.
// Not part of the site; delete once the sources are chosen.
const UA = "Mozilla/5.0 (compatible; fluffyLife-spots/1.0; personal reader)";
async function get(url, init = {}, ms = 30000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { redirect: "follow", ...init, headers: { "user-agent": UA, ...(init.headers || {}) }, signal: ctl.signal });
    return { status: r.status, text: await r.text() };
  } catch (e) { return { status: 0, text: "", error: String(e.cause?.code || e.message || e) }; } finally { clearTimeout(t); }
}
const show = (label, s, n = 3000) => console.log(`\n===== ${label} =====\n${String(s).slice(0, n)}`);
let id = 10;
async function tool(name, args = {}) {
  const t0 = Date.now();
  const r = await get("https://whatson.melbourne.vic.gov.au/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: id++, method: "tools/call", params: { name, arguments: args } }) });
  let text = r.text; try { text = JSON.parse(r.text).result.content.map((c) => c.text).join("\n"); } catch {}
  return { status: r.status, ms: Date.now() - t0, text };
}

for (const [name, args, n] of [
  ["get_sub_categories_tool", { category: "things_to_do" }, 4000],
  ["get_sub_categories_tool", { category: "eat_and_drink" }, 2500],
  ["get_tags_tool", {}, 3000],
  ["get_date_keywords_tool", {}, 800],
  ["get_locations_tool", {}, 1500],
  ["search_tool", { category: "things_to_do", date_keyword: "today" }, 6000],
  ["search_tool", { category: "things_to_do", date_keyword: "today", page_number: 2 }, 2500],
  ["search_tool", { category: "things_to_do", date_keyword: "this_weekend" }, 1500],
  ["search_tool", { category: "things_to_do", date_keyword: "specific_dates", date_range: "2026-11-16 to 2026-11-22" }, 1500],
  ["search_tool", { category: "things_to_do", date_keyword: "today", tags_keys: ["free"] }, 2000],
  ["search_tool", { category: "eat_and_drink", query: "new" }, 3500],
  ["search_tool", { query: "new opening", category: "guides" }, 2000],
]) {
  const r = await tool(name, args);
  show(`${name} ${JSON.stringify(args)} http=${r.status} ${r.ms}ms`, r.text, n);
}

const ef = await get("https://www.eventfinda.com.au/feed/events/melbourne/whatson/today.rss");
const items = [...ef.text.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
show(`eventfinda today: ${items.length} items, first 3`, items.slice(0, 3).join("\n---\n"), 5000);
console.log("eventfinda today pubDates:", items.map((b) => b.match(/<pubDate>([^<]+)/)?.[1]).join(" "));
