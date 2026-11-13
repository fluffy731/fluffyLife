// Foreman: the data-only modules behind the new Real world tab, the defect hunt and the drawing sheets.
// The 3D engine needs WebGL and three.js, so it is checked in the browser, not here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { REFS, REF_KINDS } from "../foreman/refs.js";
import { PHOTOS } from "../foreman/photos.js";
import { HUNT, huntPhases, huntFor } from "../foreman/hunt.js";
import { apiUrl, freeLicence, plain, parse } from "../foreman/commons.js";
import { svg, titled, R } from "../foreman/dwg.js";
import { SOURCES } from "../foreman/plan.js";

const STAGES = Array.from({ length: 18 }, (_, i) => i + 1);
const pad = (n) => String(n).padStart(2, "0");
const src = (n) => readFileSync(new URL(`../foreman/step-${pad(n)}.js`, import.meta.url), "utf8");
const study = (n) => { try { return readFileSync(new URL(`../foreman/step-${pad(n)}-study.js`, import.meta.url), "utf8"); } catch { return ""; } };
// Drawing ids are the `{ id, title, scale` entries (hotspots have no scale); phases are the `{ title:` entries of `const phases`.
const drawingIds = (n) => [...(src(n) + study(n)).matchAll(/\{ id: '([A-Za-z0-9]+)', title: '[^']*', scale:/g)].map((m) => m[1]);
const phaseCount = (n) => { const s = src(n), i = s.indexOf("const phases = ["); return s.slice(i, s.indexOf("\n];", i)).split("{ title:").length - 1; };
const FLAGS = ["V", "T", "C"];

test("every stage has reference details with a link, a pointer and a flag", () => {
  for (const n of STAGES) {
    const list = REFS[n];
    assert.ok(Array.isArray(list) && list.length >= 2, `stage ${n} needs at least 2 references`);
    const urls = new Set();
    for (const r of list) {
      assert.ok(r.kind in REF_KINDS, `stage ${n}: kind ${r.kind}`);
      assert.match(r.url, /^https:\/\/[^\s]+$/, `stage ${n}: ${r.title}`);
      assert.ok(!urls.has(r.url), `stage ${n}: duplicate link ${r.url}`); urls.add(r.url);
      for (const f of ["org", "title", "where", "use"]) assert.ok(String(r[f] || "").trim(), `stage ${n}: ${r.title} needs ${f}`);
      assert.ok(FLAGS.includes(r.flag), `stage ${n}: flag ${r.flag}`);
      if (r.dwg) assert.ok(drawingIds(n).includes(r.dwg), `stage ${n}: no drawing ${r.dwg}`);
    }
  }
});

test("photos are Commons file titles with short captions of our own", () => {
  for (const n of STAGES) {
    assert.ok(Array.isArray(PHOTOS[n]), `stage ${n} needs a list, even an empty one`);
    for (const p of PHOTOS[n]) {
      assert.match(p.file, /^File:[^|#<>[\]{}]+\.(jpe?g|png|gif|webp|tiff?)$/i, p.file);
      assert.ok(p.caption && p.caption.length <= 160, `stage ${n}: caption length`);
      assert.ok(!/—/.test(p.caption), `stage ${n}: no em dashes`);
    }
  }
});

test("only CC0, public domain, CC BY and CC BY-SA photos pass the licence filter", () => {
  for (const ok of ["CC0", "Public domain", "PD-US", "CC BY 2.0", "CC BY-SA 3.0", "CC BY-SA 4.0", "CC-BY-SA-4.0", "CC BY 4.0"]) assert.ok(freeLicence(ok), ok);
  for (const no of ["", "CC BY-NC 2.0", "CC BY-ND 4.0", "CC BY-NC-SA 3.0", "Fair use", "All rights reserved", undefined]) assert.ok(!freeLicence(no), String(no));
});

test("Commons replies become credit lines keyed by the title we asked for", () => {
  const url = new URL(apiUrl(["File:A b.jpg", "File:C.jpg"]));
  assert.equal(url.searchParams.get("origin"), "*");
  assert.equal(url.searchParams.get("titles"), "File:A b.jpg|File:C.jpg");
  const json = { query: {
    normalized: [{ from: "File:a_b.jpg", to: "File:A b.jpg" }],
    pages: [
      { title: "File:A b.jpg", imageinfo: [{ thumburl: "https://t/a.jpg", descriptionurl: "https://c/a", extmetadata: { LicenseShortName: { value: "CC BY-SA 4.0" }, Artist: { value: '<a href="x">Jo &amp; Al</a>' }, LicenseUrl: { value: "https://cc/by-sa" } } }] },
      { title: "File:C.jpg", imageinfo: [{ url: "https://t/c.jpg", extmetadata: { LicenseShortName: { value: "CC BY-NC 2.0" } } }] },
      { title: "File:Gone.jpg", missing: true },
    ] } };
  const out = parse(json, ["File:a_b.jpg", "File:C.jpg", "File:Gone.jpg"]);
  assert.deepEqual(Object.keys(out), ["File:a_b.jpg"]);
  assert.deepEqual(out["File:a_b.jpg"], { thumb: "https://t/a.jpg", page: "https://c/a", author: "Jo & Al", licence: "CC BY-SA 4.0", licenceUrl: "https://cc/by-sa" });
  assert.equal(plain("<b>x</b>  y"), "x y");
});

test("defects are complete, unique and sit in a real phase of their stage", () => {
  const ids = new Set();
  for (const [k, list] of Object.entries(HUNT)) {
    const n = Number(k);
    assert.ok(STAGES.includes(n), `stage key ${k}`);
    const phases = phaseCount(n);
    assert.ok(phases > 0, `stage ${n} phases`);
    for (const d of list) {
      assert.ok(d.id && !ids.has(d.id), `duplicate or missing id ${d.id}`); ids.add(d.id);
      assert.ok(Number.isInteger(d.phase) && d.phase >= 0 && d.phase < phases, `${d.id}: phase ${d.phase} of ${phases}`);
      assert.ok(Array.isArray(d.pos) && d.pos.length === 3 && d.pos.every(Number.isFinite), `${d.id}: pos`);
      assert.ok(Number.isFinite(d.r) && d.r > 0 && d.r <= 3, `${d.id}: r`);
      if (d.box) assert.ok(d.box.length === 2 && d.box.every((p) => p.length === 3 && p.every(Number.isFinite)), `${d.id}: box`);
      for (const f of ["title", "hint", "explain", "fix"]) assert.ok(String(d[f] || "").trim(), `${d.id} needs ${f}`);
      assert.ok(FLAGS.includes(d.flag), `${d.id}: flag`);
      assert.ok(d.src === "" || d.src in SOURCES, `${d.id}: unknown source ${d.src}`);
      if (d.build) assert.equal(typeof d.build, "function", `${d.id}: build`);
      if (d.hide) assert.ok(Array.isArray(d.hide) && d.hide.every((h) => typeof h === "string"), `${d.id}: hide`);
      assert.ok(d.build || d.hide?.length, `${d.id} must change the scene`);
      assert.ok(![d.title, d.explain, d.fix, d.hint].some((t) => /—/.test(t)), `${d.id}: no em dashes`);
    }
    assert.deepEqual(huntPhases(n), [...new Set(list.map((d) => d.phase))].sort((a, b) => a - b));
    for (const p of huntPhases(n)) assert.ok(huntFor(n, p).length > 0);
  }
});

test("drawings get material hatching and a title block", () => {
  const s = svg(100, 50, R(0, 0, 10, 10, "d-conc") + R(0, 0, 5, 5, "d-line") + R(1, 1, 2, 2, "d-brick"));
  assert.match(s, /<defs>.*id="hp-conc".*<\/defs>/s);
  assert.equal((s.match(/class="hx hx-conc"/g) || []).length, 1);
  assert.equal((s.match(/class="hx hx-brick"/g) || []).length, 1);
  assert.ok(!/hx-line/.test(s), "plain lines are not hatched");
  const t = titled(s, { no: "6.4", title: "Slab edge detail", scale: "About 1:5", stage: 6 });
  assert.match(t, /viewBox="0 0 100 114"/);
  assert.match(t, /SLAB EDGE DETAIL/);
  assert.match(t, />6\.4</);
});
