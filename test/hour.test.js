import { test } from "node:test";
import assert from "node:assert/strict";
import { hourKey, hash, wordOfHour } from "../lib/hour.js";

test("hourKey local YYYY-MM-DDTHH", () => {
  const d = new Date(2026, 9, 15, 7, 30);
  assert.equal(hourKey(d), "2026-10-15T07");
});

test("hash is deterministic uint32", () => {
  assert.equal(hash("a"), hash("a"));
  assert.notEqual(hash("a"), hash("b"));
  assert.ok(hash("x") >= 0 && hash("x") < 2 ** 32);
});

test("wordOfHour stable within hour, null when empty", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const a = wordOfHour(items, new Date(2026, 9, 15, 7, 1));
  const b = wordOfHour(items, new Date(2026, 9, 15, 7, 59));
  assert.equal(a, b);
  assert.equal(wordOfHour([], new Date()), null);
});
