// PureLift clinic site: links, assets and images stay intact as the content is filled in.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const dir = new URL("../purelift/", import.meta.url);
const html = readFileSync(new URL("index.html", dir), "utf8");
const css = readFileSync(new URL("purelift.css", dir), "utf8");

const attr = (name) => [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map((m) => m[1]);
const isLocal = (u) => u && !/^(https?:|mailto:|tel:|#|data:)/.test(u);

test("every local file the page or stylesheet references exists", () => {
  const fromSrcset = [...attr("srcset"), ...attr("imagesrcset")].flatMap((s) => s.split(",").map((p) => p.trim().split(/\s+/)[0]));
  const fromCss = [...css.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]);
  const refs = [...attr("href"), ...attr("src"), ...attr("content").filter((c) => /^img\//.test(c)), ...fromSrcset, ...fromCss].filter(isLocal);
  assert.ok(refs.length > 10, "found the page's references");
  const missing = [...new Set(refs)].filter((r) => !existsSync(new URL(r, dir)));
  assert.deepEqual(missing, []);
});

test("every in-page link lands on an element with that id", () => {
  const ids = new Set(attr("id"));
  const anchors = [...new Set(attr("href").filter((h) => h.startsWith("#") && h.length > 1))];
  assert.deepEqual(anchors.filter((a) => !ids.has(a.slice(1))), []);
  assert.equal(attr("id").length, ids.size, "ids are unique");
});

test("images have alt text, and the page has a language, title and one h1", () => {
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) assert.match(img, /\salt="[^"]+"/, img);
  assert.match(html, /<html lang="en-AU">/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
});

test("the nav toggle controls the nav it names", () => {
  const controls = html.match(/class="nav-toggle"[^>]*aria-controls="([^"]+)"/)?.[1];
  assert.ok(controls && attr("id").includes(controls));
});
