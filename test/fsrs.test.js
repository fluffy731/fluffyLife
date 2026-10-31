import { test } from "node:test";
import assert from "node:assert/strict";
import { grade, toCard, difficulty, difficultyFromEase, LEECH } from "../lib/fsrs.js";

const DAY = 86400000;
const now = Date.UTC(2026, 10, 1, 9);

test("first sight: Got it → tomorrow, Already knew → FSRS Easy (about a week)", () => {
  const g = grade(undefined, "good", now);
  assert.equal(g.interval, 1); assert.equal(g.due, now + DAY); assert.equal(g.reps, 1); assert.equal(g.lapses, 0);
  const e = grade(undefined, "easy", now);
  assert.ok(e.interval >= 5 && e.interval <= 12, `${e.interval}`);
  assert.ok(e.d < g.d, "Easy leaves the card easier");
});

test("intervals grow with Good and shrink less with Hard than with Again", () => {
  let s = grade(undefined, "good", now), t = now;
  const seen = [];
  for (let i = 0; i < 4; i++) { t = s.due; s = grade(s, "good", t); seen.push(s.interval); }
  for (let i = 1; i < seen.length; i++) assert.ok(seen[i] > seen[i - 1], JSON.stringify(seen));
  const hard = grade(s, "hard", s.due), again = grade(s, "again", s.due);
  assert.ok(hard.interval >= 1 && again.interval === 0);
});

test("Again: due now, counts a lapse, card stays seen (comes back this session)", () => {
  let s = grade(grade(undefined, "good", now), "good", now + DAY);
  s = grade(s, "again", s.due);
  assert.equal(s.interval, 0); assert.equal(s.lapses, 1); assert.ok(s.reps > 0);
  assert.ok(s.due <= now + 30 * DAY);
});

test("SM-2 progress converts on the next grade, and is not lost", () => {
  const old = { ease: 2.5, interval: 15, reps: 3, due: now };
  const c = toCard(old, now);
  assert.equal(c.stability, 15); assert.equal(c.difficulty, 5); assert.equal(c.reps, 3);
  assert.equal(c.last_review.getTime(), now - 15 * DAY);
  const g = grade(old, "good", now);
  assert.ok(g.interval > 15, `${g.interval}`); assert.equal(g.reps, 4); assert.ok(g.s > 15);
  assert.equal(toCard({ ease: 2.3, interval: 0, reps: 0, due: now }, now).state, 0, "an SM-2 card reset by Again starts over");
});

test("a quiz miss (due set to now) still converts sensibly", () => {
  const g = grade({ ease: 2.1, interval: 6, reps: 3, due: now }, "good", now);
  assert.ok(g.interval >= 6);
});

test("difficulty: from FSRS state, or mapped from SM-2 ease", () => {
  assert.equal(difficultyFromEase(2.5), 5);
  assert.equal(difficultyFromEase(1.3), 10);
  assert.equal(difficultyFromEase(4), 1);
  assert.equal(difficulty({ d: 3.2 }), 3.2);
  assert.equal(difficulty({ ease: 1.3 }), 10);
  assert.equal(difficulty(undefined), 5);
});

test(`leech: flagged after ${LEECH} lapses, and stays flagged`, () => {
  let s = grade(undefined, "good", now), t = now;
  for (let i = 0; i < LEECH; i++) { t += 2 * DAY; s = grade(s, "good", t); t += 3 * DAY; s = grade(s, "again", t); }
  assert.equal(s.lapses, LEECH); assert.equal(s.leech, true);
  assert.equal(grade(s, "good", t + DAY).leech, true);
  assert.equal(grade(undefined, "good", now).leech, undefined);
});
