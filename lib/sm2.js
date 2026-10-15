// SM-2 spaced repetition. Intervals in days, due in epoch ms.
const DAY = 86400000;
const r2 = (x) => Math.round(x * 100) / 100;

export function newState() {
  return { ease: 2.5, interval: 0, reps: 0, due: 0 };
}

export function grade(state, g, now = Date.now()) {
  const s = { ...(state || newState()) };
  if (g === "again") {
    s.reps = 0; s.interval = 0; s.ease = Math.max(1.3, r2(s.ease - 0.2));
  } else if (g === "hard") {
    s.interval = Math.max(1, Math.round(s.interval * 1.2));
    s.ease = Math.max(1.3, r2(s.ease - 0.15));
    s.reps += 1;
  } else {
    // good / easy
    let next = s.reps === 0 ? 1 : s.reps === 1 ? 6 : Math.round(s.interval * s.ease);
    if (g === "easy") { next = Math.round(next * 1.3); s.ease = r2(s.ease + 0.15); }
    s.interval = next; s.reps += 1;
  }
  s.due = now + s.interval * DAY;
  return s;
}
