import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { TABS, SECTIONS, ACTIVITIES, STEPS, SOURCES, PROJECT_DOCS } from "../builder/data.js";
import {
  KEY, blank, normalise, load, save, sectionsFor, progress, evidenceKey, activityGaps, projectCounts, coveredMonths, outsideWindow,
  newRef, refProgress, cleanName, projectFolder, folderTree, folderPaths, macCommands, winCommands, plainList, NPROJECTS, ROOT,
} from "../builder/model.js";

const fakeLS = (init = {}) => { const m = { ...init }; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; };
const tabIds = TABS.map((t) => t.id);

test("checklist content is well formed (ticks key on `key`, so keys never repeat)", () => {
  const keys = new Set(), ids = new Set();
  for (const s of SECTIONS) {
    assert.ok(tabIds.includes(s.tab), `${s.title}: unknown tab ${s.tab}`);
    assert.ok(s.title && s.icon && s.id, "section needs id, title and icon");
    assert.ok(!ids.has(s.id), `duplicate section id ${s.id}`); ids.add(s.id);
    assert.ok(s.items.length, `${s.title}: empty section`);
    for (const it of s.items) {
      assert.ok(it.key.startsWith(`${s.id.replace(/^exam/, "ex")}`) || it.key.includes("."), `${it.key}: use section.name keys`);
      assert.ok(it.text.trim(), `${it.key}: empty text`);
      assert.ok(!keys.has(it.key), `duplicate key ${it.key}`); keys.add(it.key);
    }
  }
  assert.equal(new Set(ACTIVITIES.map(([id]) => id)).size, ACTIVITIES.length, "activity ids repeat");
  assert.equal(new Set(STEPS.map(([k]) => k)).size, STEPS.length, "referee step ids repeat");
  for (const [label, href] of SOURCES) assert.ok(label && /^https:\/\/www\.bpc\.vic\.gov\.au\//.test(href), `${label}: sources are BPC pages`);
});

test("each of the three projects gets the same document checklist, with generic wording only", () => {
  assert.equal(NPROJECTS, 3);
  const want = PROJECT_DOCS.map(([k]) => k);
  for (const k of ["working", "structural", "permit"]) assert.ok(want.includes(k), `missing ${k}`);
  for (let n = 1; n <= NPROJECTS; n++) {
    const sec = SECTIONS.find((s) => s.id === `doc${n}`);
    assert.ok(sec, `no documents section for project ${n}`);
    assert.equal(sec.tab, "list");
    assert.deepEqual(sec.items.map((i) => i.key), want.map((k) => `doc${n}.${k}`));
  }
  // The repo is public: nothing project-specific (permit numbers, application numbers, emails) may sit in the content.
  const text = PROJECT_DOCS.flat().join("\n");
  assert.ok(!/\d{4,}|@/.test(text), "document checklist must stay generic");
});

test("every tab that lists sections has some, and the BPC activity list is complete", () => {
  for (const t of ["list", "exam"]) assert.ok(sectionsFor(SECTIONS, t).length, `${t} has no sections`);
  assert.equal(ACTIVITIES.length, 12);
});

test("the checklist carries the corrected requirements, not the old VBA ones", () => {
  const text = SECTIONS.flatMap((s) => s.items.map((i) => `${i.text} ${i.note || ""}`)).join("\n");
  assert.match(text, /CPC50220/);
  assert.match(text, /Cert IV[^\n]*not/i, "must say the Cert IV alone is not prescribed");
  assert.match(text, /last 7 years/);
  assert.match(text, /3 years/);
  assert.match(text, /12 characters/);
});

test("normalise accepts junk and returns a well-formed state", () => {
  for (const junk of [null, undefined, 5, "x", [], { projects: "no", refs: 7, slots: {}, ticked: [] }]) {
    const s = normalise(junk);
    assert.equal(s.projects.length, NPROJECTS);
    assert.deepEqual(s.ticked, {});
    assert.deepEqual(s.refs, []);
    assert.deepEqual(s.slots, []);
    assert.equal(s.hideDone, false);
  }
  const s = normalise({
    ticked: { a: true, b: false, c: "yes" }, evidence: { "x:0": true },
    projects: [{ addr: "1 Test St", hrs: 38 }],
    refs: [{ name: "Ref", steps: { asked: "2026-11-07", agreed: "soon" } }, null],
    slots: [{ text: " ID " }, { text: "   " }, { text: 4 }],
  });
  assert.deepEqual(s.ticked, { a: true });
  assert.equal(s.projects[0].addr, "1 Test St");
  assert.equal(s.projects[0].hrs, "", "non-string values are dropped");
  assert.deepEqual(s.refs[0].steps, { asked: "2026-11-07" });
  assert.equal(s.refs.length, 1);
  assert.deepEqual(s.slots.map((x) => x.text), ["ID"]);
});

test("load and save round-trip, and corrupt storage falls back to a blank state", () => {
  const ls = fakeLS();
  const s = blank(); s.ticked["start.webinar"] = true; s.slots.push({ id: "s1", text: "ID", done: true });
  save(ls, s);
  assert.deepEqual(load(ls), s);
  assert.deepEqual(load(fakeLS({ [KEY]: "{not json" })), blank());
  assert.doesNotThrow(() => save({ setItem() { throw new Error("full"); } }, s));
});

test("progress counts ticked items per section list", () => {
  const secs = sectionsFor(SECTIONS, "list");
  const total = secs.reduce((n, s) => n + s.items.length, 0);
  assert.deepEqual(progress(secs, {}), { done: 0, total });
  assert.deepEqual(progress(secs, { "start.webinar": true, "qual.diploma": true, "not.a.key": true }), { done: 2, total });
});

test("activity gaps and per-project counts follow the evidence grid", () => {
  assert.equal(activityGaps(ACTIVITIES, {}).length, ACTIVITIES.length);
  const ev = { [evidenceKey("permit-get", 0)]: true, [evidenceKey("permit-get", 2)]: true, [evidenceKey("certify", 1)]: true };
  assert.deepEqual(activityGaps(ACTIVITIES, ev).includes("permit-get"), false);
  assert.equal(activityGaps(ACTIVITIES, ev).length, ACTIVITIES.length - 2);
  assert.deepEqual(projectCounts(ACTIVITIES, ev), [1, 1, 1]);
});

test("covered months count overlaps once and ignore unfinished or backwards dates", () => {
  const p = (from, to) => ({ from, to });
  assert.equal(coveredMonths([p("2024-01", "2024-06")]), 6);
  assert.equal(coveredMonths([p("2024-01", "2024-06"), p("2024-04", "2024-09")]), 9, "overlap counted once");
  assert.equal(coveredMonths([p("2024-01", "2024-06"), p("2025-01", "2025-01")]), 7);
  assert.equal(coveredMonths([p("2024-01", "2024-12"), p("2024-03", "2024-04")]), 12, "a project inside another adds nothing");
  assert.equal(coveredMonths([p("2024-06", "2024-01"), p("", "2024-01"), p("2024-01", "")]), 0);
  assert.equal(coveredMonths([p("2023-11", "2024-02"), p("2022-01", "2022-12")]), 16, "order does not matter");
});

test("the 7-year window runs back to the same month", () => {
  const today = "2026-11-07";
  assert.equal(outsideWindow({ to: "2019-10" }, today), true);
  assert.equal(outsideWindow({ to: "2019-11" }, today), false);
  assert.equal(outsideWindow({ to: "2026-01" }, today), false);
  assert.equal(outsideWindow({ to: "" }, today), false);
});

test("referee progress counts the dated steps", () => {
  const r = newRef("r1");
  assert.equal(refProgress(r, STEPS), 0);
  r.steps.asked = "2026-11-07"; r.steps.agreed = "2026-11-08"; r.steps.bogus = "2026-11-09";
  assert.equal(refProgress(r, STEPS), 2);
});

test("folder names are safe for Windows and for pasted shell commands", () => {
  assert.equal(cleanName('1 "Test" St: Unit/2 $x `y` \'z\''), "1 Test St Unit 2 x y z");
  assert.equal(cleanName("Long Road... "), "Long Road");
  assert.ok(cleanName("x".repeat(100)).length <= 40);
  assert.equal(projectFolder(0, ""), "Project 1");
  assert.equal(projectFolder(1, " 25 Wattle Rd, Box Hill "), "Project 2 - 25 Wattle Rd, Box Hill");
  const tree = folderTree([{ addr: "1 A/B St" }, { addr: "" }, { addr: "3 Smith's Rd" }]);
  const paths = folderPaths(tree);
  assert.equal(new Set(paths).size, paths.length, "folder paths repeat");
  for (const p of paths) for (const seg of p.split("/")) {
    assert.ok(seg && !/[<>:"\\|?*$`']/.test(seg) && !/[. ]$/.test(seg), `unsafe folder name: ${seg}`);
  }
  assert.ok(paths.includes("03 Experience/Project 1 - 1 A B St/05 Proof of paid work"));
  assert.ok(paths.includes("03 Experience/Project 3 - 3 Smith s Rd/01 Contract and scope"));
  assert.ok(paths.includes("04 Referees/Referee 2"));
});

test("copy-paste commands create every leaf folder and nothing else", () => {
  const tree = folderTree([{ addr: "1 Test St" }, { addr: "" }, { addr: "" }]);
  const leaves = folderPaths(tree).filter((p) => !folderPaths(tree).some((q) => q.startsWith(`${p}/`)));
  const mac = macCommands(tree), win = winCommands(tree);
  for (const l of leaves) { assert.ok(mac.includes(`"${ROOT}/${l}"`), `mac misses ${l}`); assert.ok(win.includes(`"${l}"`), `windows misses ${l}`); }
  assert.match(mac, /^cd "\$\(ls -d ~\/Library\/CloudStorage\/OneDrive\* \| head -1\)" && mkdir -p/);
  assert.match(win, /\$env:OneDrive "DB-U registration"/);
  assert.ok(!/rm |rmdir|Remove-Item|-Recurse/.test(mac + win), "commands must only create folders");
  assert.ok(plainList(tree).startsWith(ROOT));
});

test("the service worker caches every Builder file and routes offline Builder pages home", () => {
  const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
  const wanted = [...sw.matchAll(/"\.\/((?:builder\/|icons\/builder)[^"]*)"/g)].map((m) => m[1]).filter((f) => !f.endsWith("/"));
  assert.ok(wanted.length >= 9, "Builder files are missing from FILES in sw.js");
  for (const f of wanted) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `sw.js lists ${f} but it does not exist`);
  for (const f of ["builder/index.html", "builder/builder.js", "builder/model.js", "builder/data.js", "builder/builder.css", "builder/manifest.json"]) {
    assert.ok(wanted.includes(f), `sw.js does not cache ${f}`);
  }
  assert.match(sw, /includes\("\/builder\/"\) \? "\.\/builder\/index\.html"/);
});

test("the page is unlisted and its manifest icons exist", () => {
  const html = readFileSync(new URL("../builder/index.html", import.meta.url), "utf8");
  assert.match(html, /name="robots" content="noindex, nofollow"/);
  const manifest = JSON.parse(readFileSync(new URL("../builder/manifest.json", import.meta.url), "utf8"));
  for (const i of manifest.icons) assert.ok(existsSync(new URL(`../builder/${i.src}`, import.meta.url)), `missing icon ${i.src}`);
  assert.ok(!/href="\.\/builder\//.test(readFileSync(new URL("../index.html", import.meta.url), "utf8")), "Builder must stay off the home page");
});
