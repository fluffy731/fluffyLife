// Quiz tab: practice quizzes and unit tests (80% passes). app.js routes data-q* clicks here and
// renders whatever render() returns; question building and scoring live in lib/quiz.js.
import { rng, passMark, pickUnitTestItems, pickPracticeItems, buildQuestions, recordAttempt, applyMisses } from "./lib/quiz.js";

const UNIT_N = 15, PRACTICE_N = 10;

export function createQuiz(api) {
  const { pack, t, esc, ctx } = api;
  let s = { view: "list" };
  const typeOf = (q) => pack.quiz.types.find((x) => x.key === q.type);
  const quizState = () => api.state().quiz;
  const unitLabel = (u) => `${esc(api.tierLabel(u.tier))} · ${t.unitN(esc(u.unit))}${api.unitTitle(u.unit)}`;
  const passed = (key) => !!quizState().units[key]?.passedAt;
  if (globalThis.__QUIZ_TEST__) window.__quizAnswer = () => (s.view === "q" ? s.questions[s.i].answer : null);

  function playCurrent() {
    const q = s.questions[s.i], type = typeOf(q);
    if (type.clip) api.speak(type.clip(q.item));
  }

  function begin(key) {
    const rand = rng(globalThis.__QUIZ_SEED__ ?? Date.now());
    const pool = api.items();
    let targets, n;
    if (key === "practice") { targets = pickPracticeItems(pool, api.state().progress, rand, PRACTICE_N); n = PRACTICE_N; }
    else {
      const u = api.units().find((x) => x.key === key);
      if (!u || !api.isLearned(u)) return;
      targets = pickUnitTestItems(u.items, api.isGrammar, rand, UNIT_N); n = Math.min(UNIT_N, u.items.length);
    }
    const questions = buildQuestions(targets, pool, pack.quiz.types, { rand, env: { hasClip: api.hasClip }, n, isGrammar: api.isGrammar });
    if (!questions.length) { s = { view: "list" }; return; }
    s = { view: "q", key, questions, i: 0, picked: null, score: 0, missed: [], open: null };
    playCurrent();
  }

  function finish() {
    const st = api.state(), total = s.questions.length;
    st.quiz = recordAttempt(st.quiz, s.key === "practice" ? null : s.key, s.score, total, Date.now());
    st.progress = applyMisses(st.progress, s.missed, Date.now());
    api.persist();
    s = { ...s, view: "done" };
  }

  function listHTML() {
    const seenCount = api.items().filter((i) => api.state().progress[i.id]).length;
    const practice = seenCount >= 4
      ? `<button class="btn primary" data-qstart="practice" style="width:100%">${t.quizPractice}</button><p class="small muted">${t.quizPracticeHint}</p>`
      : `<button class="btn" disabled style="width:100%">${t.quizPractice}</button><p class="small muted">${t.quizNeedSeen}</p>`;
    const rows = api.units().map((u) => {
      const learned = api.isLearned(u), rec = quizState().units[u.key];
      const status = !learned ? t.quizNotReady(api.unseenCount(u)) : rec?.passedAt ? t.quizPassed(rec.best, rec.total) : t.quizReady;
      return `<div class="unit qunit ${learned ? "" : "locked"} ${rec?.passedAt ? "passed" : ""}" ${learned ? `data-qstart="${esc(u.key)}" role="button"` : ""}>
        <span class="pill ${esc(u.tier)}">${esc(u.tier)}</span><span class="qunit-name">${t.unitN(esc(u.unit))}${api.unitTitle(u.unit)}</span>
        <span class="small muted">${status}</span></div>`;
    }).join("");
    return `<div class="card">${practice}</div><h2>${t.quizUnits}</h2><div class="list">${rows}</div>`;
  }

  function questionHTML() {
    const q = s.questions[s.i], type = typeOf(q), done = s.picked != null;
    const opts = q.options.map((o, i) => {
      const cls = !done ? "" : i === q.answer ? "right" : i === s.picked ? "wrong" : "dim";
      return `<div class="qopt ${cls}" role="button" tabindex="0" data-qopt="${i}">${type.optionHTML(o, ctx)}</div>`;
    }).join("");
    return `<div class="row small muted" style="margin-bottom:8px"><span>${t.quizQn(s.i + 1, s.questions.length)}</span><span>${s.score} ✓</span></div>
      <div class="card qprompt"><div class="small muted">${t[type.caption]}</div>${type.promptHTML(q.item, ctx)}</div>
      <div class="qopts ${type.fixedOptions ? "qtones" : ""}">${opts}</div>
      ${done ? `<div class="actions" style="grid-template-columns:1fr;margin-bottom:12px"><button class="btn primary" data-qnext>${t.quizNext}</button></div>${api.cardHTML(q.item, true)}` : ""}`;
  }

  function doneHTML() {
    const total = s.questions.length, unit = s.key !== "practice";
    const verdict = unit ? `<div class="qverdict ${s.score >= passMark(total) ? "pass" : "notyet"}">${s.score >= passMark(total) ? t.quizPass : t.quizNotYet}</div>` : "";
    const missed = s.missed.map((id) => {
      const it = api.items().find((i) => i.id === id);
      // Korean app: the word or grammar form; Cantonese app: the Korean meaning. Tap opens the full card.
      return `<div class="qmiss" data-qmiss="${esc(id)}" role="button">${esc(it.ko ?? it.form)}</div>${s.open === id ? api.cardHTML(it, true) : ""}`;
    }).join("");
    return `<div class="card qresult"><div class="qscore">${t.quizResult(s.score, total)}</div>${verdict}</div>
      ${s.missed.length ? `<h2>${t.quizMissed}</h2><div class="list">${missed}</div>` : ""}
      <div class="actions"><button class="btn primary" data-qretake>${t.quizRetake}</button><button class="btn" data-qback>${t.quizBack}</button></div>`;
  }

  return {
    render: () => (s.view === "q" ? questionHTML() : s.view === "done" ? doneHTML() : listHTML()),
    reset: () => { s = { view: "list" }; },
    passed,
    homeCard() {
      const u = api.units().find((x) => api.isLearned(x) && !passed(x.key));
      return u ? `<div class="card qhome"><div class="row"><b>${t.quizTestReady(unitLabel(u))}</b></div>
        <div class="actions" style="grid-template-columns:1fr"><button class="btn primary" data-qstart="${esc(u.key)}">${t.quizStart}</button></div></div>` : "";
    },
    click(el) {
      const d = el.dataset;
      if (d.qstart !== undefined) return begin(d.qstart);
      if (d.qretake !== undefined) return begin(s.key);
      if (d.qback !== undefined) { s = { view: "list" }; return; }
      if (d.qmiss !== undefined) { s.open = s.open === d.qmiss ? null : d.qmiss; return; }
      if (s.view !== "q") return;
      if (d.qreplay !== undefined) return playCurrent();
      if (d.qopt !== undefined && s.picked == null) {
        s.picked = Number(d.qopt);
        const q = s.questions[s.i];
        if (s.picked === q.answer) s.score++; else s.missed.push(q.item.id);
        return;
      }
      if (d.qnext !== undefined && s.picked != null) {
        if (s.i + 1 >= s.questions.length) return finish();
        s.i++; s.picked = null; playCurrent();
      }
    },
  };
}
