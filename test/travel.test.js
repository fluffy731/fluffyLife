import { test } from "node:test";
import assert from "node:assert/strict";
import { SECTIONS, TRIPS } from "../travel/items.js";
import { KEY, load, save, visible, progress, itemText } from "../travel/model.js";

const fakeLS = (init = {}) => { const m = { ...init }; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); } }; };

test("packing list is well formed (ticks key on wording, so no repeats)", () => {
  const seen = new Set(), ids = TRIPS.map(t => t.id);
  const known = (id, where) => assert.ok(ids.includes(id), `${where}: unknown trip type "${id}" (use ${ids.join(", ")})`);
  for (const s of SECTIONS) {
    assert.ok(s.title && s.icon, "section needs title and icon");
    assert.ok(Array.isArray(s.always) && Array.isArray(s.long), `${s.title}: always and long must be lists`);
    for (const id of s.trips || []) known(id, s.title);
    for (const it of [...s.always, ...s.long]) {
      if (Array.isArray(it)) {
        assert.ok(it.length === 2 && typeof it[1] === "string", `${s.title}: write tagged items as ["text", "trip ids"]`);
        for (const id of it[1].trim().split(/\s+/)) known(id, itemText(it));
      }
      const t = itemText(it);
      assert.equal(typeof t, "string", `${s.title}: items are text or ["text", "trip ids"]`);
      assert.ok(t.trim(), `${s.title}: empty item`);
      assert.ok(!seen.has(t), `duplicate item: ${t}`);
      seen.add(t);
    }
  }
});

test("long mode adds the long items, short mode hides them", () => {
  const secs = [{ title: "A", icon: "x", always: ["a"], long: ["b"] }];
  assert.deepEqual(visible(secs, "short", [])[0].items.map(i => i.text), ["a"]);
  assert.deepEqual(visible(secs, "long", [])[0].items.map(i => [i.text, i.long]), [["a", false], ["b", true]]);
  const mine = visible(secs, "short", ["a"]).at(-1);
  assert.equal(mine.items[0].key, "mine:a");
});

test("trip type filters tagged items and sections", () => {
  const secs = [
    { title: "A", icon: "x", always: ["a", ["p", "overseas"], ["c", "overseas domestic"]], long: [] },
    { title: "Car", icon: "y", trips: ["road"], always: ["tyres"], long: [] },
  ];
  const texts = trip => visible(secs, "short", [], trip).flatMap(s => s.items.map(i => i.text));
  assert.deepEqual(texts("overseas"), ["a", "p", "c"]);
  assert.deepEqual(texts("domestic"), ["a", "c"]);
  assert.deepEqual(texts("road"), ["a", "tyres"]);
});

test("progress counts only what is shown", () => {
  const secs = [{ title: "A", icon: "x", always: ["a"], long: ["b"] }];
  const ticked = { a: true, b: true };
  assert.deepEqual(progress(visible(secs, "short", []), ticked), { done: 1, total: 1 });
  assert.deepEqual(progress(visible(secs, "long", ["c"]), ticked), { done: 2, total: 3 });
});

test("load survives missing or corrupt storage; save round trips", () => {
  assert.equal(load(fakeLS()).mode, "short");
  assert.deepEqual(load(fakeLS({ [KEY]: "{oops" })).ticked, {});
  const ls = fakeLS();
  assert.equal(load(fakeLS()).trip, "overseas");
  save(ls, { trip: "road", mode: "long", ticked: { a: true }, mine: ["Kindle"], hideDone: true });
  assert.deepEqual(load(ls), { trip: "road", mode: "long", ticked: { a: true }, mine: ["Kindle"], hideDone: true });
});
