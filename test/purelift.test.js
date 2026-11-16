// PureLift clinic site: links, assets, images, the English/Chinese pairs and the knowledge base.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { checkArticle, loadArticles, buildIndex, indexSource } from "../scripts/purelift-kb.mjs";
import { ARTICLES } from "../purelift/kb/index.js";
import { publicArticles, renderBlocks, inline } from "../purelift/kb-view.js";
import { tiltAngles, TILT_MAX, MARQUEE_DASH, liquidOffset, liquidMap } from "../purelift/cards.js";

const dir = new URL("../purelift/", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const pages = { "index.html": read("index.html"), "article.html": read("article.html"), "effects.html": read("effects.html") };
const css = read("purelift.css");
const cards = read("cards.css");

const attr = (html, name) => [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map((m) => m[1]);
const isLocal = (u) => u && !/^(https?:|mailto:|tel:|#|data:|\.\/#|\.\/$)/.test(u);
const cssUrls = (text) => [...text.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]);

test("every local file the pages or stylesheet reference exists", () => {
  for (const [name, html] of Object.entries(pages)) {
    const refs = [...attr(html, "href"), ...attr(html, "src"), ...attr(html, "content").filter((c) => /^img\//.test(c)), ...attr(html, "style").flatMap(cssUrls)].filter(isLocal);
    const missing = [...new Set(refs)].filter((r) => !existsSync(new URL(r, dir)));
    assert.deepEqual(missing, [], name);
  }
  for (const sheet of [css, cards]) assert.deepEqual(cssUrls(sheet).filter(isLocal).filter((r) => !existsSync(new URL(r, dir))), []);
});

test("every in-page link lands on an element with that id, and ids are unique", () => {
  const home = pages["index.html"];
  const ids = new Set(attr(home, "id"));
  for (const [name, html] of Object.entries(pages)) {
    const own = new Set(attr(html, "id"));
    assert.deepEqual([...new Set(attr(html, "href").filter((h) => h.startsWith("#") && h.length > 1))].filter((a) => !own.has(a.slice(1))), [], name);
  }
  assert.deepEqual([...new Set(attr(pages["article.html"], "href").filter((h) => h.startsWith("./#")))].filter((a) => !ids.has(a.slice(3))), [], "article page links into the home page");
  for (const [name, html] of Object.entries(pages)) assert.equal(attr(html, "id").length, new Set(attr(html, "id")).size, name);
});

test("every English text on the pages has a Chinese partner", () => {
  for (const [name, html] of Object.entries(pages)) {
    const en = (html.match(/\slang="en"/g) ?? []).length;
    const zh = (html.match(/\slang="zh-Hans"/g) ?? []).length;
    assert.ok(en > 10, `${name} is bilingual`);
    assert.equal(en, zh, name);
  }
  assert.match(css, /html\[data-lang="en"\] \[lang="zh-Hans"\]/);
  assert.match(css, /html\[data-lang="zh"\] \[lang="en"\]/);
});

test("images have alt text; the home page has a language, title and one h1", () => {
  for (const html of Object.values(pages)) for (const img of html.match(/<img\b[^>]*>/g) ?? []) assert.match(img, /\salt="[^"]*"/, img);
  const home = pages["index.html"];
  assert.match(home, /<html lang="en-AU" data-lang="en">/);
  assert.match(home, /<title>[^<]+<\/title>/);
  assert.equal((home.match(/<h1\b/g) ?? []).length, 1);
});

test("menu and language buttons control the elements they name", () => {
  for (const html of Object.values(pages)) for (const cls of ["menu-btn", "lang-btn"]) {
    const controls = html.match(new RegExp(`class="${cls}"[^>]*aria-controls="([^"]+)"`))?.[1];
    assert.ok(controls && attr(html, "id").includes(controls), cls);
  }
});

test("every knowledge-base article lines up in English and Chinese", () => {
  const articles = loadArticles();
  assert.ok(articles.length >= 17);
  for (const a of articles) assert.deepEqual(checkArticle(a), [], a.id);
  for (const a of articles) assert.doesNotThrow(() => { renderBlocks(a.en.blocks); renderBlocks(a.zh.blocks); }, a.id);
});

test("the card index is up to date with the article files", () => {
  assert.equal(read("kb/index.js"), indexSource(buildIndex(loadArticles())), "run node scripts/purelift-kb.mjs");
});

test("articles about prescription-only or restricted products stay off the public site", () => {
  const restricted = ["botulinum-toxin", "prp-hair", "prp-skin-hair", "injectable-ha", "pn-polynucleotides"];
  for (const id of restricted) assert.equal(ARTICLES.find((a) => a.id === id)?.review, true, id);
  const shown = publicArticles(ARTICLES).map((a) => a.id);
  for (const id of restricted) assert.ok(!shown.includes(id), `${id} hidden by default`);
  assert.equal(publicArticles(ARTICLES, { showReview: true }).length, ARTICLES.length);
});

test("article text cannot inject HTML; **bold** is the only markup", () => {
  assert.equal(inline('<img src=x onerror="a()"> **bold**'), "&lt;img src=x onerror=&quot;a()&quot;&gt; <strong>bold</strong>");
  assert.match(renderBlocks([{ t: "table", head: ["a"], rows: [["<b>"]] }]), /<td>&lt;b&gt;<\/td>/);
  assert.throws(() => renderBlocks([{ t: "script", text: "x" }]));
});

test("the card effects follow the brief's numbers", () => {
  const rule = (sel) => cards.match(new RegExp(`${sel.replace(/[.]/g, "\\.")} \\{([^}]*)\\}`, "s"))?.[1] ?? "";
  // 1 frosted glass: 20px blur, white at 15%, a thin translucent white edge. The live glass uses the same recipe.
  const frost = rule(".fx-frost");
  assert.match(frost, /rgba\(255, 255, 255, \.15\)/); assert.match(frost, /blur\(20px\)/); assert.match(frost, /border: 1px solid rgba\(255, 255, 255, \.\d+\)/);
  assert.match(css, /--glass: rgba\(255, 255, 255, \.15\)/); assert.match(css, /--glass-blur: blur\(20px\)/);
  // 5 gradient border: 2px, brand colour to transparent
  assert.match(cards, /\.fx-grad::before \{[^}]*padding: 2px[^}]*linear-gradient\(135deg, var\(--fx-brand-2\), rgba\(74, 99, 133, 0\)/s);
  // 6 flowing border: one turn every 8 seconds, steady
  assert.match(cards, /\.fx-flow::before \{[^}]*animation: fx-spin 8s linear infinite/s);
  assert.match(cards, /@keyframes fx-spin \{ to \{ --fx-angle: 360deg; \} \}/);
  // 7 marquee: a tenth of the border is lit
  assert.equal(MARQUEE_DASH, 10); assert.match(cards, /stroke-dasharray: 10 90/);
  // 11 tilt: never past 10 degrees, flat in the middle, a highlight that follows
  assert.ok(TILT_MAX <= 10);
  for (const [x, y] of [[0, 0], [200, 0], [0, 100], [200, 100], [500, -300], [-90, 400]]) {
    const { rx, ry } = tiltAngles(x, y, 200, 100);
    assert.ok(Math.abs(rx) <= 10 && Math.abs(ry) <= 10, `${x},${y}`);
  }
  const mid = tiltAngles(100, 50, 200, 100);
  assert.ok(Math.abs(mid.rx) < 1e-9 && Math.abs(mid.ry) < 1e-9);
  assert.ok(tiltAngles(200, 50, 200, 100).ry > 0 && tiltAngles(0, 50, 200, 100).ry < 0);
  assert.match(cards, /\.fx-tilt \.fx-glare \{[^}]*radial-gradient\(circle at var\(--gx\) var\(--gy\)/s);
  // everything that moves stops for visitors who ask for reduced motion
  assert.match(cards, /prefers-reduced-motion: reduce\) \{[^}]*\.fx-flow::before \{ animation: none; \}/s);
});

test("liquid glass: the middle stays clear and the rim bends", () => {
  const w = 300, h = 180, r = 30, bezel = 40;
  const mid = liquidOffset(w / 2, h / 2, w, h, r, bezel);
  assert.ok(Math.abs(mid.dx) < 0.05 && Math.abs(mid.dy) < 0.05, "centre");
  assert.ok(liquidOffset(0, h / 2, w, h, r, bezel).dx > 0.5, "left rim reads from further in");
  assert.ok(liquidOffset(w - 1, h / 2, w, h, r, bezel).dx < -0.5, "right rim");
  assert.ok(liquidOffset(w / 2, 0, w, h, r, bezel).dy > 0.5, "top rim");
  assert.ok(Math.abs(liquidOffset(60, h / 2, w, h, r, bezel).dx) < Math.abs(liquidOffset(5, h / 2, w, h, r, bezel).dx), "bends less further in");
  const map = liquidMap(w, h, r, bezel), i = ((h / 2) * w + w / 2) * 4;
  assert.equal(map.length, w * h * 4);
  assert.ok(Math.abs(map[i] - 128) <= 8 && Math.abs(map[i + 1] - 128) <= 8 && map[i + 3] === 255);
});

test("the live pages use the calm effects, and the loud ones stay in the gallery", () => {
  const live = read("purelift.js");
  assert.match(live, /fx-spot/); assert.match(live, /fx-tilt/); assert.match(live, /initCards\(\)/);
  for (const html of [pages["index.html"], pages["article.html"]]) for (const loud of ["fx-holo", "fx-metal", "fx-flow", "fx-marquee", "fx-grad", "fx-liquid"]) assert.ok(!html.includes(loud), loud);
  for (const n of Array.from({ length: 11 }, (_, i) => i + 1)) assert.ok(pages["effects.html"].includes(`id="e${n}"`), `demo ${n}`);
  assert.match(pages["effects.html"], /<meta name="robots" content="noindex, nofollow">/);
});
