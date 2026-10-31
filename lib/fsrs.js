// Spaced repetition with FSRS (ts-fsrs, MIT, vendored in lib/vendor/ts-fsrs.js), replacing SM-2 (October 2026).
// Same interface as the old lib/sm2.js: grade(state, g, now) returns the card's new state, with
// due (epoch ms) and interval (days) as before, so Review, Browse and the buttons read it unchanged.
//
// Progress saved under SM-2 ({ ease, interval, reps, due }) converts the first time a card is graded:
// stability = its interval (an SM-2 interval sits near 90% recall, which is what FSRS stability
// means), difficulty from ease (2.5 → 5, 1.3 → 10, easier above 2.5), last review = due − interval.
// A card SM-2 had reset with Again (reps 0) starts over as new. Nothing is rewritten until graded.
//
// Two app rules carry over from SM-2: Again leaves the card due now (it comes back this session),
// and "Got it" on a card seen for the first time schedules tomorrow, because first sight is not a
// recall test. "Already knew" on a new card is FSRS's Easy (about a week).
import { fsrs, generatorParameters, createEmptyCard, Rating, State } from "./vendor/ts-fsrs.js";

const DAY = 86400000;
const f = fsrs(generatorParameters({ request_retention: 0.9, enable_fuzz: false, enable_short_term: false }));
const RATING = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy };
const r4 = (x) => Math.round(x * 1e4) / 1e4;

// Missed this many times after being learned: flagged as a leech (Anki's default threshold).
export const LEECH = 8;

export const difficultyFromEase = (ease) => Math.min(10, Math.max(1, 5 + ((2.5 - ease) * 25) / 6));

// How hard a card is, 1 (easy) – 10 (hard), for either kind of saved state.
export const difficulty = (p) => (p?.d != null ? p.d : difficultyFromEase(p?.ease ?? 2.5));

export function toCard(p, now) {
  if (p && p.s != null) {
    return { due: new Date(p.due), stability: p.s, difficulty: p.d, elapsed_days: 0, scheduled_days: p.interval || 0,
      learning_steps: 0, reps: p.reps || 0, lapses: p.lapses || 0, state: p.st ?? State.Review, last_review: new Date(p.last ?? now) };
  }
  if (!p || !p.reps) return createEmptyCard(new Date(now));
  const interval = Math.max(1, p.interval || 1);
  return { due: new Date(p.due), stability: interval, difficulty: difficultyFromEase(p.ease ?? 2.5), elapsed_days: 0,
    scheduled_days: interval, learning_steps: 0, reps: p.reps, lapses: 0, state: State.Review,
    last_review: new Date(Math.min(now, (p.due || now) - interval * DAY)) };
}

export function grade(p, g, now = Date.now()) {
  const card = toCard(p, now);
  const first = card.state === State.New;
  const n = f.next(card, new Date(now), RATING[g]).card;
  let interval = n.scheduled_days, due = n.due.getTime();
  if (g === "again") { interval = 0; due = now; }
  else if (first && g !== "easy") { interval = 1; due = now + DAY; }
  const out = { due, interval, reps: n.reps, lapses: n.lapses, s: r4(n.stability), d: r4(n.difficulty), st: n.state, last: now };
  if (n.lapses >= LEECH || p?.leech) out.leech = true;
  return out;
}
