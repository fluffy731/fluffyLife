// Quiz engine: builds multiple-choice questions from pack items and scores attempts. Pure (data in,
// data out); each pack supplies its own question types (quiz/ko.js, quiz/yue.js).
//
// Question type: { key, kind: "vocab"|"grammar", applies(it, env), answerText(it), reject?(cand, it),
//   fixedOptions?(it), answerKey?(it), clip?(it), promptHTML(it, ctx), optionHTML(opt, ctx) }
// Question: { type, item, options: Array<item|string>, answer }

const HISTORY = 10;

// mulberry32: small seeded generator, so a seed reproduces a quiz exactly.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 80%, in integers: Math.ceil(0.8 * 15) would be 13 because 0.8 * 15 = 12.000000000000002.
export const passMark = (n) => Math.ceil((n * 4) / 5);

// The test's n items (at most 3 grammar, at least 1 when the unit has any), then spare vocab
// for when an item cannot make a question.
export function pickUnitTestItems(unitItems, isGrammar, rand, n = 15) {
  const g = shuffle(unitItems.filter(isGrammar), rand);
  const v = shuffle(unitItems.filter((i) => !isGrammar(i)), rand);
  const nG = Math.min(g.length, 3, n);
  const primary = shuffle([...g.slice(0, nG), ...v.slice(0, n - nG)], rand);
  return [...primary, ...v.slice(n - nG)];
}

// Seen items only: the weakest half first (lowest ease, then earliest due), the rest at random,
// then every other seen item as spares. Fewer than 4 seen → [].
export function pickPracticeItems(items, progress, rand, n = 10) {
  const seen = items.filter((i) => progress[i.id] != null && typeof progress[i.id] === "object");
  if (seen.length < 4) return [];
  const weak = [...seen].sort((a, b) => (progress[a.id].ease ?? 2.5) - (progress[b.id].ease ?? 2.5) || (progress[a.id].due ?? 0) - (progress[b.id].due ?? 0))
    .slice(0, Math.ceil(n / 2));
  const rest = shuffle(seen.filter((i) => !weak.includes(i)), rand);
  return [...weak, ...rest];
}

function distractors(it, type, pool, rand, isGrammar) {
  const g = isGrammar(it);
  const same = pool.filter((c) => c !== it && c.id !== it.id && isGrammar(c) === g);
  const bands = [
    same.filter((c) => c.tier === it.tier && c.pos === it.pos),
    same.filter((c) => c.tier === it.tier && c.pos !== it.pos),
    same.filter((c) => c.tier !== it.tier),
  ];
  const seen = new Set([type.answerText(it)]), out = [];
  for (const band of bands) {
    for (const c of shuffle(band, rand)) {
      const txt = type.answerText(c);
      if (seen.has(txt) || type.reject?.(c, it)) continue;
      seen.add(txt); out.push(c);
      if (out.length === 3) return out;
    }
  }
  return out;
}

function makeQuestion(it, type, pool, rand, isGrammar) {
  if (type.fixedOptions) {
    const options = shuffle(type.fixedOptions(it), rand);
    return { type: type.key, item: it, options, answer: options.indexOf(type.answerKey(it)) };
  }
  const ds = distractors(it, type, pool, rand, isGrammar);
  if (ds.length < 3) return null;
  const options = shuffle([it, ...ds], rand);
  return { type: type.key, item: it, options, answer: options.indexOf(it) };
}

export function buildQuestions(targets, pool, types, { rand, env, n, isGrammar }) {
  const out = [];
  for (const it of targets) {
    if (out.length >= n) break;
    const kind = isGrammar(it) ? "grammar" : "vocab";
    for (const type of shuffle(types.filter((t) => t.kind === kind && t.applies(it, env)), rand)) {
      const q = makeQuestion(it, type, pool, rand, isGrammar);
      if (q) { out.push(q); break; }
    }
  }
  return out;
}

const ratio = (s, t) => (t ? s / t : 0);

// Returns a new quiz state; unitKey null records a practice attempt.
export function recordAttempt(quiz, unitKey, score, total, now) {
  const attempt = { at: now, score, total };
  if (unitKey == null) return { ...quiz, practice: [...(quiz.practice || []), attempt].slice(-HISTORY) };
  const prev = quiz.units?.[unitKey];
  const better = !prev || ratio(score, total) > ratio(prev.best, prev.total);
  const passed = total > 0 && score >= passMark(total);
  const entry = {
    best: better ? score : prev.best,
    total: better ? total : prev.total,
    passedAt: prev?.passedAt ?? (passed ? now : null),
    attempts: [...(prev?.attempts || []), attempt].slice(-HISTORY),
  };
  return { ...quiz, units: { ...quiz.units, [unitKey]: entry } };
}

// A missed item comes up in Review now; ease, interval and reps are left alone (no "Again" penalty).
export function applyMisses(progress, ids, now) {
  const out = { ...progress };
  for (const id of ids) if (out[id] && typeof out[id] === "object") out[id] = { ...out[id], due: now };
  return out;
}
