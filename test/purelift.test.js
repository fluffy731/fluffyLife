// PureLift clinic site: links, assets, images, the English/Chinese pairs and the knowledge base.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { checkArticle, loadArticles, buildIndex, indexSource } from "../scripts/purelift-kb.mjs";
import { ARTICLES } from "../purelift/kb/index.js";
import { publicArticles, renderBlocks, inline } from "../purelift/kb-view.js";

const dir = new URL("../purelift/", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const pages = { "index.html": read("index.html"), "article.html": read("article.html") };
const css = read("purelift.css");

const attr = (html, name) => [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map((m) => m[1]);
const isLocal = (u) => u && !/^(https?:|mailto:|tel:|#|data:|\.\/#|\.\/$)/.test(u);
const cssUrls = (text) => [...text.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]);

test("every local file the pages or stylesheet reference exists", () => {
  for (const [name, html] of Object.entries(pages)) {
    const refs = [...attr(html, "href"), ...attr(html, "src"), ...attr(html, "content").filter((c) => /^img\//.test(c)), ...attr(html, "style").flatMap(cssUrls)].filter(isLocal);
    const missing = [...new Set(refs)].filter((r) => !existsSync(new URL(r, dir)));
    assert.deepEqual(missing, [], name);
  }
  assert.deepEqual(cssUrls(css).filter(isLocal).filter((r) => !existsSync(new URL(r, dir))), []);
});

test("every in-page link lands on an element with that id, and ids are unique", () => {
  const home = pages["index.html"];
  const ids = new Set(attr(home, "id"));
  assert.deepEqual([...new Set(attr(home, "href").filter((h) => h.startsWith("#") && h.length > 1))].filter((a) => !ids.has(a.slice(1))), []);
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
