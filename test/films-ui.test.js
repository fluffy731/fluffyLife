import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8");

test("the service worker caches every Films file and routes offline Films pages home", () => {
  const sw = read("sw.js");
  const wanted = [...sw.matchAll(/"\.\/((?:films\/|icons\/films)[^"]*)"/g)].map((m) => m[1]).filter((f) => !f.endsWith("/"));
  for (const f of wanted) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `sw.js lists ${f} but it does not exist`);
  for (const f of ["films/index.html", "films/films.js", "films/films.css", "films/model.js", "films/store.js", "films/manifest.json",
    "icons/films.svg", "icons/films-180.png", "icons/films-512.png"]) assert.ok(wanted.includes(f), `sw.js does not cache ${f}`);
  assert.ok(!wanted.includes("films/feed.json"), "the feed is cached by the fetch handler, not listed");
  assert.match(sw, /includes\("\/films\/"\) \? "\.\/films\/index\.html"/);
});

test("the film line is defined in light and both dark forms", () => {
  const css = read("metro.css");
  assert.equal(css.match(/\[data-line="film"\]/g)?.length, 3);
  assert.match(css, /:root\[data-line="film"\] \{[^}]*--route-strong: #7b4f92/);
});

test("the page uses the Metro shell", () => {
  const html = read("films/index.html");
  assert.match(html, /<html lang="en-AU" data-line="film">/);
  assert.ok(html.indexOf("../metro.css") > 0 && html.indexOf("../metro.css") < html.indexOf("./films.css"), "metro.css first, then films.css");
  assert.match(html, /<span class="roundel"[^>]*>影<\/span>/);
  for (const t of ["browse", "search", "watchlist"]) assert.match(html, new RegExp(`data-tab="${t}"`));
  assert.match(html, /<dialog id="more" class="sheet"/);
  assert.match(html, /<dialog id="film" class="sheet"/);
  assert.ok(!/\p{Extended_Pictographic}/u.test(html), "no emoji as icons");
  const manifest = JSON.parse(read("films/manifest.json"));
  assert.equal(manifest.name, "Films");
  assert.ok(manifest.icons.some((i) => i.src === "../icons/films-512.png"));
});

test("feed and logo are git-ignored; the home page links Films", () => {
  const ignore = read(".gitignore").split("\n");
  assert.ok(ignore.includes("films/feed.json") && ignore.includes("films/tmdb.svg"));
  assert.match(read("index.html"), /<a href="\.\/films\/">Films<\/a>/);
});
