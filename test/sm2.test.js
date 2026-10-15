import { test } from "node:test";
import assert from "node:assert/strict";
import { grade, newState } from "../lib/sm2.js";

const DAY = 86400000;
const now = 1_700_000_000_000;

test("new state", () => {
  assert.deepEqual(newState(), { ease: 2.5, interval: 0, reps: 0, due: 0 });
});

test("good: 1 → 6 → 15", () => {
  let s = grade(undefined, "good", now);
  assert.equal(s.interval, 1); assert.equal(s.reps, 1); assert.equal(s.due, now + DAY);
  s = grade(s, "good", now);
  assert.equal(s.interval, 6); assert.equal(s.reps, 2);
  s = grade(s, "good", now);
  assert.equal(s.interval, 15); assert.equal(s.reps, 3); assert.equal(s.due, now + 15 * DAY);
});

test("again resets and lowers ease", () => {
  let s = grade(grade(undefined, "good", now), "good", now);
  s = grade(s, "again", now);
  assert.equal(s.reps, 0); assert.equal(s.interval, 0); assert.equal(s.due, now);
  assert.equal(s.ease, 2.3);
});

test("ease floor 1.3", () => {
  let s = newState();
  for (let i = 0; i < 20; i++) s = grade(s, "again", now);
  assert.equal(s.ease, 1.3);
});

test("hard: interval ×1.2 min 1, ease −0.15", () => {
  let s = grade(undefined, "good", now); // interval 1
  s = grade(s, "hard", now);
  assert.equal(s.interval, 1); assert.equal(s.ease, 2.35);
  s = { ...s, interval: 10 };
  s = grade(s, "hard", now);
  assert.equal(s.interval, 12);
});

test("easy: good ×1.3, ease +0.15", () => {
  let s = grade(grade(undefined, "good", now), "good", now); // 6
  s = grade(s, "easy", now); // good would be 15 → 19.5 → 20
  assert.equal(s.interval, 20); assert.equal(s.ease, 2.65);
});
