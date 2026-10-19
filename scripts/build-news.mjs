// Builds news/feed.json for the News app: fetches every source's RSS/Atom feed, drops opinion and
// commentary, groups the same story across outlets, tags topics, and finds a picture for each story.
// Runs on GitHub Actions (hourly); the phone only downloads the finished JSON.
//   node scripts/build-news.mjs            build news/feed.json
//   node scripts/build-news.mjs --probe    report which feeds work (count, images)
import { writeFileSync, mkdirSync } from "node:fs";
import { SOURCES } from "./news-sources.mjs";

const UA = "Mozilla/5.0 (compatible; fluffyLife-news/1.0; personal reader)";
const MAX_AGE = 48 * 3600e3, PER_SOURCE = 40;

// ---------- parsing ----------
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", mdash: "—", ndash: "–", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" };
export function decode(s = "") {
  let t = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  for (let i = 0; i < 2; i++) t = t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e.toLowerCase()] ?? m);
  return t.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
const raw = (block, tag) => block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"))?.[1];
const attr = (tagText, name) => tagText?.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
const firstTag = (block, tag) => block.match(new RegExp(`<${tag}\\b[^>]*>`, "i"))?.[0];
const unCdata = (s = "") => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");

function imageOf(block) {
  for (const m of block.matchAll(/<media:(?:content|thumbnail)\b[^>]*>/gi)) {
    const url = attr(m[0], "url"), medium = attr(m[0], "medium"), type = attr(m[0], "type");
    if (url && (!medium || medium === "image") && (!type || type.startsWith("image"))) return url;
  }
  const enc = [...block.matchAll(/<enclosure\b[^>]*>/gi)].map((m) => m[0]).find((t) => /image/i.test(attr(t, "type") || "") || /\.(jpe?g|png|webp)(\?|$)/i.test(attr(t, "url") || ""));
  if (enc) return attr(enc, "url");
  const html = unCdata(raw(block, "content:encoded") || raw(block, "description") || raw(block, "summary") || raw(block, "content") || "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  return attr(html.match(/<img\b[^>]*>/i)?.[0], "src") || null;
}

export function parseFeed(xml) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks.map((b) => {
    const atomLink = [...b.matchAll(/<link\b[^>]*\/?>/gi)].map((m) => m[0]).find((t) => attr(t, "href") && (!attr(t, "rel") || attr(t, "rel") === "alternate"));
    const link = (atomLink && attr(atomLink, "href")) || decode(raw(b, "link") || "") || decode(raw(b, "guid") || "");
    const when = raw(b, "pubDate") || raw(b, "dc:date") || raw(b, "published") || raw(b, "updated");
    const summary = decode(raw(b, "description") || raw(b, "summary") || raw(b, "content:encoded") || raw(b, "content") || "");
    return {
      title: decode(raw(b, "title") || ""),
      link: link.trim(),
      time: when ? Date.parse(decode(when)) || null : null,
      summary: summary.length > 260 ? summary.slice(0, 259).replace(/\s\S*$/, "") + "…" : summary,
      image: imageOf(b),
      categories: [...b.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/gi)].map((m) => decode(m[1])).filter(Boolean),
    };
  }).filter((i) => i.title && /^https?:/.test(i.link));
}

// ---------- opinion filter ----------
const OP_URL = /\/(opinions?|commentisfree|comment|editorials?|columns?|columnists?|op-?ed|views|analysis|blogs?|letters|perspectives?|sasul|column)\//i;
const OP_TITLE = /^\s*(opinion|comment|commentary|analysis|editorial|column|op-ed|view|letters?|perspective|explainer opinion)\s*[:|–—-]/i;
const OP_KO = /^\s*[\[【(〈<]\s*(사설|칼럼|시론|기고|오피니언|논설|기자수첩|데스크|시평|만물상|천자칼럼|여적|횡설수설|분수대|포럼|인터뷰|기자의 눈|특파원)/;
const OP_CAT = /^(opinion|comment|commentary|editorials?|columns?|columnists?|analysis|op-?ed|오피니언|사설|칼럼)$/i;
export const isOpinion = (i) => OP_URL.test(i.link) || OP_TITLE.test(i.title) || OP_KO.test(i.title) || i.categories.some((c) => OP_CAT.test(c.trim()));

// ---------- topics ----------
const TOPIC_RE = {
  construction: /\b(construction|builders?|building (industry|site|works|approvals?|code|defects?)|cladding|developers?|tradies|scaffold\w*|concrete|NCC|National Construction Code|Building Commission\w*|certifiers?|high-?rise|apartment (block|tower|defects?))\b/i,
  engineering: /\b(engineer\w*|infrastructure|tunnel\w*|bridges?|rail (line|link|project)|metro (line|project)|motorway|WestConnex|dams?|structural|geotechnical|civil works|tunnel boring)\b/i,
  property: /\b(property|real estate|house prices?|home prices?|housing (market|affordability|supply|crisis)|rents?|rental|landlords?|tenants?|mortgages?|auction|clearance rates?|first home buyers?|stamp duty|vacancy rates?|dwellings?|apartments? (prices?|market))\b/i,
  regulation: /\b(NCC|National Construction Code|Building Commission\w*|building (code|regulations?|standards?|defects?)|Australian Standards?|AS ?\d{4}|certifiers?|cladding|Building Ministers|ABCB|occupation certificate|fire safety (rules|order)|compliance (order|notice)|stop[- ]work order|licensing (of )?builders?)\b/i,
};
export function topicsOf(i) {
  const text = `${i.title} ${i.summary || ""}`;
  return Object.entries(TOPIC_RE).filter(([, re]) => re.test(text)).map(([k]) => k);
}

// ---------- grouping ----------
const STOP = new Set("the a an and or of to in on for at by with from as is are was were be been has have had it its this that after over into about amid says said new not but up out more than what who why how will can could would may might just than then them they he she his her their our your you we us one two three first last year years day week says".split(" "));
const KO_TAIL = /(에서|으로|에게|까지|부터|이며|이고|하고|에는|에도|으로서|로서|이라|라고|하며|했다|한다|된다|됐다|은|는|이|가|을|를|의|에|로|와|과|도|만|서)$/;
const stem = (w) => (w.endsWith("ies") ? w.slice(0, -3) + "y" : w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);
export function tokens(title, lang) {
  if (lang === "ko") return new Set(title.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).map((w) => w.replace(KO_TAIL, "")).filter((w) => w.length >= 2));
  return new Set(title.toLowerCase().replace(/[’']s\b/g, "").replace(/[^\p{L}\p{N}\s.%]/gu, " ").split(/\s+/).map((w) => w.replace(/\.$/, "")).map((w) => w.replace(/%$/, "")).filter((w) => w.length >= 3 && !STOP.has(w)).map(stem));
}
const similar = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n >= 2 && n / Math.min(a.size, b.size) >= 0.45; };

// items: { s (source id), title, link, time, summary, image, … } — newest first in, stories best first out.
export function clusterStories(items, lang) {
  const stories = [];
  for (const it of [...items].sort((a, b) => (b.time || 0) - (a.time || 0))) {
    const tk = tokens(it.title, lang);
    const home = stories.find((s) => !s.items.some((x) => x.s === it.s) && [...s.toks].length && similar(tk, s.toks));
    const entry = { s: it.s, t: it.title, l: it.link, d: it.summary, time: it.time };
    if (home) { home.items.push(entry); for (const x of tk) home.toks.add(x); home.image ||= it.image; home.topics = [...new Set([...home.topics, ...(it.topics || [])])]; }
    else stories.push({ lang, items: [entry], toks: new Set(tk), image: it.image || null, time: it.time, topics: it.topics || [] });
  }
  const now = Date.now();
  const score = (s) => new Set(s.items.map((i) => i.s)).size * 3 - (now - (s.time || 0)) / 3600e3 / 6;
  return stories.sort((a, b) => score(b) - score(a));
}

// Stories carried only by "corroborate" (tabloid) sources are dropped.
export const dropUncorroborated = (stories, solo) => stories.filter((st) => !st.items.every((i) => solo.has(i.s)));

// ---------- fetching ----------
async function get(url, ms = 15000) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*" }, signal: ctl.signal, redirect: "follow" });
    return { status: r.status, text: r.ok ? await r.text() : "" };
  } catch (e) { return { status: 0, text: "", error: String(e.message || e) }; } finally { clearTimeout(timer); }
}
async function pool(list, n, fn) {
  const out = new Array(list.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < list.length) { const k = i++; out[k] = await fn(list[k], k); } }));
  return out;
}
const ogImage = (html) => attr(html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i)?.[0], "content");

export async function build(out = "news/feed.json") {
  const now = Date.now();
  const results = await pool(SOURCES, 8, async (src) => {
    const r = await get(src.url);
    const items = r.text ? parseFeed(r.text) : [];
    return { src, status: r.status, error: r.error, items };
  });
  const sources = results.map(({ src, status, items }) => ({ id: src.id, name: src.name, region: src.region, topic: src.topic, lang: src.lang, lean: src.lean, ok: status === 200 && items.length > 0, count: items.length }));
  const all = [];
  for (const { src, items } of results) {
    for (const it of items.filter((i) => !isOpinion(i) && (!i.time || now - i.time < MAX_AGE)).slice(0, PER_SOURCE)) {
      all.push({ ...it, s: src.id, time: it.time || now, topics: [...new Set([...(src.topic ? [src.topic] : []), ...topicsOf(it)])] });
    }
  }
  let stories = [...clusterStories(all.filter((i) => i.s && SOURCES.find((x) => x.id === i.s).lang === "en"), "en"), ...clusterStories(all.filter((i) => SOURCES.find((x) => x.id === i.s).lang === "ko"), "ko")];
  // Tabloid sources only count when another outlet covers the same story.
  stories = dropUncorroborated(stories, new Set(SOURCES.filter((x) => x.corroborate).map((x) => x.id)));
  // Pictures: feeds without one get the article's og:image (top stories only, to stay quick).
  const missing = stories.filter((s) => !s.image).slice(0, 120);
  await pool(missing, 8, async (s) => { for (const it of s.items.slice(0, 2)) { const r = await get(it.l, 8000); const img = r.text && ogImage(r.text); if (img) { s.image = img; return; } } });
  const json = {
    built: new Date(now).toISOString(),
    sources,
    stories: stories.map((s, k) => ({ id: k, lang: s.lang, topics: s.topics, image: s.image || null, time: s.time, items: s.items })),
  };
  mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(out, JSON.stringify(json));
  return { stories: json.stories.length, sources: sources.filter((s) => s.ok).length, failed: sources.filter((s) => !s.ok).map((s) => s.id) };
}

async function probe() {
  const extra = process.argv.includes("--candidates") ? (await import("./news-candidates.mjs")).CANDIDATES : [];
  const rows = await pool(extra.length ? extra : SOURCES, 8, async (src) => {
    const r = await get(src.url); const items = r.text ? parseFeed(r.text) : [];
    const op = items.filter(isOpinion).length, img = items.filter((i) => i.image).length;
    return `${r.status === 200 && items.length ? "OK  " : "FAIL"} ${src.id.padEnd(16)} http=${r.status} items=${items.length} opinion=${op} images=${img} ${r.error || ""} ${items[0] ? "| " + items[0].title.slice(0, 60) : ""}`;
  });
  console.log(rows.join("\n"));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--probe")) await probe();
  else console.log("news/feed.json:", JSON.stringify(await build()));
}
