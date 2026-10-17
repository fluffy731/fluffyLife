# Quizzes, Unit Tests and Mixed Korean Units — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Quiz tab with Practice and 80%-pass unit tests to both apps, and interleave word types inside every Korean unit.

**Architecture:**
- Pure logic lives in `lib/`: `lib/mix.js` for unit interleaving and `lib/quiz.js` for building and scoring questions.
- Each pack supplies its own question types (`quiz/ko.js`, `quiz/yue.js`).
- `quiz-view.js` renders the Quiz screens. `app.js` only routes to it and adds the Home card and the 🏅 marker.
- Quiz results live in a new top-level `quiz` key of the saved state.

**Tech Stack:**
- Vanilla ES modules with no build step.
- `node --test` for unit tests.
- Playwright check scripts (`PLAYWRIGHT_MODULE=/opt/node-tools/node_modules/playwright/index.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-16-quizzes-and-mixed-units-design.md`

## Global Constraints

- **Unit test length and pass mark:** a test has 15 questions, or the unit's item count when that is smaller. The pass mark is `Math.ceil(n * 4 / 5)`. Never write `Math.ceil(0.8 * n)`: `0.8 * 15` is `12.000000000000002`, which rounds up to 13.
- **Practice:** 10 questions. It needs at least 4 seen items.
- **Options:** 4 per question. The tone question always has 6 (tones 1–6).
- **Grammar in unit tests:** at most 3 grammar items per unit test, and at least 1 when the unit has any.
- **History:** at most 10 attempts per unit and 10 practice attempts, newest last.
- **Effect on review:** a wrong answer sets `progress[id].due = now` and nothing else. A right answer changes nothing.
- **Korean ids:** the Korean vocab ids `v-<tier>-NNN` must not change.
- **Unit size:** units stay at 20 vocab per unit, and each tier keeps its unit count (int 20, adv 14, beg 8).
- **UI string parity:** `ui/en.js` and `ui/ko.js` must have identical keys. This is enforced by `test/yue-data.test.js`.
- **No nested buttons:** an option that contains a 🔊 is a `<div role="button">`.
- **Phone layout:** at 390 × 844 the page must not scroll sideways, and 6 tabs must fit.

## Review Focus

1. **A unit whose items share meanings.** For example, two words both glossed 經濟, or homophones with the same 한글 spelling. Options must never show the same text twice. → Task 3 test `options unique by answerText`, plus the pack `reject` rules in Tasks 4 and 5.
2. **No recorded clips.** If clip generation failed or the device is offline on first run, the quiz must still work with no audio types. → Task 5 test `audio types do not apply without a clip`.
3. **Retaking a passed unit and failing.** `passedAt` and `best` must not be lost. → Task 3 test `recordAttempt never clears passedAt`.
4. **Old saved state with no `quiz` key, or a corrupt one.** It must load to the defaults. → Task 2.
5. **Leaving the Quiz tab mid-test.** Nothing is recorded, and returning shows the unit list. → Task 7 browser check `leaving mid-test records nothing`.

---

### Task 1: Interleave Korean units

**Files:**
- Create: `lib/mix.js`
- Create: `test/golden/ko-ids.json` (generated from the current code **before** changing `data/vocab.js`)
- Modify: `data/vocab.js` (`expand` and the export)
- Modify: the header comments in `data/vocab-int.js`, `data/vocab-adv.js` and `data/vocab-beg.js`
- Test: `test/mix.test.js`

**Interfaces:**
- Produces: `export const BUCKETS = ["nH", "nN", "v", "adj", "etc"]`
- Produces: `export function bucketOf(v) -> "nH"|"nN"|"v"|"adj"|"etc"`. The mapping is `pos "n"` + hanja → nH; `pos "n"` without hanja → nN; `"v"` → v; `"adj"` → adj; anything else → etc.
- Produces: `export function mixOrder(items, bucketOf, order = BUCKETS) -> items[]`

- [ ] **Step 1: Pin the current ids.** Run:
  `node -e 'import("./data/vocab.js").then(({vocab})=>require("fs").writeFileSync("test/golden/ko-ids.json", JSON.stringify(Object.fromEntries(vocab.map(v=>[v.id,v.ko])),null,0)))'`
  Expected: the file has 840 entries.
- [ ] **Step 2: Write the failing tests in `test/mix.test.js`.**
  - `mixOrder keeps every item once and each bucket's order`: use a 10-item synthetic list.
  - `ids unchanged`: `Object.fromEntries(vocab.map(v=>[v.id,v.ko]))` deep-equals the golden file.
  - `unit counts per tier`: int 20, adv 14, beg 8. Every unit has 20 items except possibly the last unit of a tier.
  - `every unit has at least 3 buckets`.
  - `every int and adv unit has a verb or adjective and a native word`: `bucketOf ∈ {v, adj}` and `hanja === null`.
  - `no bucket run longer than 3`: walk each tier's items sorted by `unit` in array order.
- [ ] **Step 3: Run `node --test test/mix.test.js`.** Expected: FAIL (`lib/mix.js` not found).
- [ ] **Step 4: Implement `mixOrder` as a smooth weighted round robin.**
  - At step `k` (0-based), from the buckets with rows left, take the next row of the bucket with the largest `count_b / total * (k + 1) - taken_b`.
  - Ties go to the earlier bucket in `order`. Compare with a `1e-9` tolerance.
- [ ] **Step 5: Update `data/vocab.js`.**
  - In `expand`, assign `id` from the row's file position, as now.
  - Then order the tier's items with `mixOrder(items, bucketOf)` and set `unit = Math.floor(positionInMixedOrder / 20) + 1`.
  - Export the items in mixed order.
  - Add a comment: append new rows at the end of a tier file only, because ids are positional.
  - Change the `// Unit N — Topic` lines in the tier files to `// Topic — …` section labels.
- [ ] **Step 6: Run `npm test`.** Expected: all pass, including `test/data.test.js`.
- [ ] **Step 7: Commit** with the message `feat(ko): mix hanja/native words and word types inside every unit`.

### Task 2: Persist quiz results

**Files:**
- Modify: `lib/store.js` (`defaults`, `normalise`)
- Test: `test/store.test.js`

**Interfaces:**
- Produces: the state shape `quiz: { units: { [unitKey]: { best, total, passedAt, attempts: [{at, score, total}] } }, practice: [{at, score, total}] }`.

- [ ] **Step 1: Write the failing tests.**
  - `load keeps quiz`: save a state with `quiz.units["int-1"]`, load it, and deep-equal it.
  - `bad quiz falls back`: `quiz: "x"`, `quiz: []` and a missing `quiz` all load to `{ units: {}, practice: [] }`.
  - `quiz with non-object units falls back`: `{ units: [], practice: {} }` loads to the defaults per field.
  - `importJSON keeps quiz`.
- [ ] **Step 2: Run `node --test test/store.test.js`.** Expected: FAIL.
- [ ] **Step 3: Implement.** Add `quiz: { units: {}, practice: [] }` to `defaults()`. `normalise` keeps `units` if it is a plain object and `practice` if it is an array, and otherwise uses the default for that field.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** with the message `feat: keep quiz history in saved state`.

### Task 3: Quiz engine (`lib/quiz.js`)

**Files:**
- Create: `lib/quiz.js`
- Test: `test/quiz.test.js`

**Interfaces:**
- **Question type**, as supplied by packs in Tasks 4–5:
  `{ key, kind: "vocab"|"grammar", applies(it, env) -> bool, answerText(it) -> string, reject?(cand, it) -> bool, fixedOptions?(it) -> string[], answerKey?(it) -> string, clip?(it) -> string|null, promptHTML(it, ctx), optionHTML(opt, ctx) }`
  - `env = { hasClip(text) -> bool }`.
  - For normal types, `opt` is an item. For fixed types, `opt` is a key string.
- **Question:** `{ type: string, item, options: Array<item|string>, answer: number }`
- Produces `rng(seed:number) -> () => number` (mulberry32) and `shuffle(arr, rand) -> new array`.
- Produces `passMark(n) -> number`.
- Produces `pickUnitTestItems(unitItems, isGrammar, rand, n = 15) -> item[]`. It returns `n` primary items (≤3 grammar, ≥1 when the unit has any) followed by the remaining vocab, shuffled, as backups.
- Produces `pickPracticeItems(items, progress, rand, n = 10) -> item[]`.
  - Only seen items (`progress[id]` is an object) are used.
  - The first `ceil(n/2)` are the weakest: ease ascending, then due ascending.
  - The rest are random.
  - All other seen items follow, shuffled, as backups.
  - Returns `[]` when fewer than 4 items have been seen.
- Produces `buildQuestions(targets, pool, types, { rand, env, n, isGrammar }) -> Question[]`.
- Produces `recordAttempt(quiz, unitKey|null, score, total, now) -> quiz` (a new object; `null` records a practice attempt).
- Produces `applyMisses(progress, ids, now) -> progress` (a new object).

- [ ] **Step 1: Write the failing tests.** Build fake types and items inline in the test file. Tests:
  - `same seed same questions`.
  - `options unique by answerText and answer appears once`: give two pool items the same `answerText` as the target. Neither may appear.
  - `distractor preference`: with enough candidates, all 3 distractors share the target's tier and `pos`.
  - `type falls through`: a type whose `reject` rejects everything leads to the next applicable type.
  - `item skipped when no type works`: the next target fills its place, and the length stays `n`.
  - `fixedOptions`: the options are exactly the 6 keys and `answer` indexes `answerKey(it)`.
  - `passMark(15) === 12`, `passMark(5) === 4` and `passMark(1) === 1`.
  - `pickUnitTestItems`: given 20 vocab and 4 grammar, the first 15 contain 1–3 grammar items and no repeats.
  - `pickPracticeItems`: returns only seen items, and returns `[]` when 3 are seen.
  - `recordAttempt`: keeps the last 10 attempts; `best` updates only on a higher `score/total`; `passedAt` is set on the first pass and kept after a later failed attempt.
  - `applyMisses`: changes only `due`, and ignores ids that aren't in `progress`.
- [ ] **Step 2: Run `node --test test/quiz.test.js`.** Expected: FAIL.
- [ ] **Step 3: Implement `buildQuestions`.** For each target, in order, until there are `n` questions:
  1. Shuffle the types that apply to the target (`types.filter(t => t.kind === kind(it) && t.applies(it, env))`).
  2. For each type in turn:
     - **Fixed type:** build the question directly from `fixedOptions` and `answerKey`.
     - **Normal type:** take candidates from `pool` of the same kind, excluding the target. Each band (same tier and `pos`, then same tier, then any) is shuffled with `rand`, and the bands are tried in that order. Skip a candidate when its `answerText` equals one already taken (the target's included) or when `type.reject?.(cand, it)` is true. Stop at 3.
     - If fewer than 3 distractors are found, try the next type.
  3. Shuffle the options. `answer` is the target's index.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** with the message `feat: quiz engine — question building, scoring, history`.

### Task 4: Korean question types

**Files:**
- Create: `quiz/ko.js`
- Modify: `packs/ko.js` (add `quiz: { types }`)
- Test: `test/quiz-types.test.js`

**Interfaces:**
- Consumes: the question-type shape from Task 3.
- Produces: `export const types` with keys `meaning`, `reverse`, `hanja`, `listen` (all `kind "vocab"`) and `grammar` (`kind "grammar"`).
- Produces: `export const grammarCore(form) -> string`.

| key | applies | answerText | prompt | option | reject |
|---|---|---|---|---|---|
| meaning | always | `it.zh` | `it.ko` | zh with en below | `c.zh === it.zh \|\| c.en === it.en` |
| reverse | always | `it.ko` | zh + en | ko | same as meaning |
| hanja | `!!it.hanja` | `it.ko` | hanja (`lang="zh-Hant"`) | ko | `c.hanja === it.hanja` |
| listen | `env.hasClip(it.ko)`; `clip(it) = it.ko` | `it.ko` | 🔊 replay button only | ko | same as meaning |
| grammar | `it.ex?.length > 0` | `it.form` | `it.ex[0].ko` | form | `grammarCore(c.form)` is non-empty and `it.ex[0].ko.includes(grammarCore(c.form))` |

- `grammarCore` drops a leading `-`, removes `(…)` groups, keeps the part before the first `/`, and trims.

- [ ] **Step 1: Write the failing tests** in `test/quiz-types.test.js` against the real Korean pack:
  - `grammarCore("-(으)ㄴ/는 반면(에)") === "ㄴ"` and `grammarCore("-기 위해(서)") === "기 위해"`.
  - Run `buildQuestions` over every int-1 item with `rng(1)` and `env.hasClip = () => true`. It yields 15 questions with 4 unique options each.
  - No `grammar` question has an option other than the answer whose core appears in the prompt sentence.
  - `hanja` never applies to an item with `hanja === null`.
- [ ] **Step 2: Run the test.** Expected: FAIL.
- [ ] **Step 3: Implement `quiz/ko.js`** and wire `quiz: { types }` into `koPack`.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** with the message `feat(ko): quiz question types`.

### Task 5: Cantonese question types

**Files:**
- Create: `quiz/yue.js`
- Modify: `cards/yue.js` (`export` the existing `sylHTML`)
- Modify: `packs/yue.js` (add `quiz: { types }`)
- Test: `test/quiz-types.test.js`

**Interfaces:**
- Consumes: `sylHTML(jp, esc)` from `cards/yue.js`, plus `syllables` and `hangul` from `lib/jyutping.js`.
- Produces: `export const types` with keys `listen`, `sound`, `say`, `tone` (all `kind "vocab"`) and `gsound` (`kind "grammar"`).
- Produces: `export const isMono(it) -> bool`. True when `syllables(it.jp)` has exactly one non-punctuation syllable.

| key | applies | answerText | prompt | option | reject |
|---|---|---|---|---|---|
| listen | `env.hasClip(it.zh)`; `clip = it.zh` | `it.ko` | 🔊 replay only | `it.ko` | `c.ko === it.ko \|\| c.en === it.en` |
| sound | always | `it.ko` | `sylHTML(jp)` + jp line | `it.ko` | same as listen |
| say | always | `hangul(c.jp)` | `it.ko` | `sylHTML(c.jp)` + `ctx.say(c.zh)` inside a `div role="button"` | same as listen |
| tone | `isMono(it) && env.hasClip(it.zh)`; `clip = it.zh` | — | 🔊 + uncoloured `hangul(it.jp)` | 6 buttons labelled `1`–`6` with class `t1`…`t6` | — |
| gsound | always | `it.ko` | `sylHTML(formJp)` + `ctx.say(it.form)` | `it.ko` | `c.ko === it.ko` |

- The tone type uses `fixedOptions = () => ["1","2","3","4","5","6"]`, and `answerKey` is the tone digit of the single syllable.

- [ ] **Step 1: Write the failing tests:**
  - `isMono` is true for 詩 (si1) and false for 你好.
  - The tone question for every mono item has `options[answer] === String(syllables(it.jp)[0].tone)`.
  - `audio types do not apply without a clip`: with `env.hasClip = () => false`, `listen` and `tone` never appear in a unit-1 build.
  - A unit-1 build with clips gives questions with unique options.
- [ ] **Step 2: Run the tests.** Expected: FAIL.
- [ ] **Step 3: Implement `quiz/yue.js`,** export `sylHTML` and wire `quiz: { types }` into `yuePack`.
- [ ] **Step 4: Run `npm test`.** Expected: PASS.
- [ ] **Step 5: Commit** with the message `feat(yue): quiz question types incl. tone`.

### Task 6: Quiz view and app integration

**Files:**
- Create: `quiz-view.js`
- Modify: `app.js`:
  - `VIEWS` gets a `quiz` entry;
  - the click selector and routing;
  - the tab switch calls `quiz.reset()`;
  - `renderHome` gets the test-ready card;
  - the `renderLearn` picker shows 🏅;
  - wipe clears `state.quiz`;
  - `hasClip` = `!!clipFor(text)`.
- Modify: `korean/index.html` and `yue/index.html`: add the tab `<button data-tab="quiz"><span class="ic">✓</span>Quiz</button>` between review and browse.
- Modify: `ui/en.js` and `ui/ko.js`. Add `tabs.quiz` plus these keys: `quizPractice`, `quizPracticeHint`, `quizNeedSeen`, `quizUnits`, `quizNotReady(left)`, `quizReady`, `quizPassed(best,total)`, `quizStart`, `quizNext`, `quizQn(i,n)`, `quizResult(score,total)`, `quizPass`, `quizNotYet`, `quizMissed`, `quizRetake`, `quizBack`, `quizTestReady(label)`, `quizReplay`. Also add the prompt captions `qMeaning`, `qReverse`, `qHanja`, `qListen`, `qGrammar`, `qSound`, `qSay`, `qTone`, `qGsound`. The Korean UI text for the Cantonese app is written in Korean.
- Modify: `style.css`. Add `.qopts` (a 1-column grid), `.qopt` (a large tap target, at least 48 px), `.qopt.right` / `.qopt.wrong` using `var(--good)` and `var(--bad)`, `.qtones` (a 3 × 2 grid reusing the `.t1`–`.t6` colours), `.qresult`, and `.unit.passed`.
- Modify: `sw.js` `FILES`: add `./lib/mix.js`, `./lib/quiz.js`, `./quiz/ko.js`, `./quiz/yue.js` and `./quiz-view.js`.

**Interfaces:**
- Consumes: Tasks 2–5.
- Produces: `export function createQuiz(api) -> { render() -> string, click(el) -> void, reset() -> void, homeCard() -> string, passed(unitKey) -> bool }`.
  - `api = { pack, t, esc, ctx, state: () => state, persist, units: () => units, items: () => items, isLearned: (u) => bool, unseenCount: (u) => number, hasClip, speak, cardHTML, isGrammar, tierLabel, unitTitle }`.
- Data attributes the view emits:
  - `data-qstart="practice" | "<unitKey>"`
  - `data-qopt="<index>"`
  - `data-qnext`
  - `data-qretake`
  - `data-qback`
  - `data-qreplay`
  - `data-qmiss="<id>"` (expands a missed item's card)

**Behaviour:**
- **Session.** `{ view: "list"|"q"|"done", key, questions, i, picked: null|number, score, missed: [] }`. The seed is `globalThis.__QUIZ_SEED__ ?? Date.now()`.
- **Answering.** `qopt` locks the answer, adds to `score` or `missed`, and shows the feedback card (`api.cardHTML(item, true)`).
- **Moving on.**
  - `qstart` and `qnext` call `api.speak(type.clip(item))` when the next question has a clip.
  - After the last question, `recordAttempt` and `applyMisses` run, then `persist`.
- **Test hook.** When `globalThis.__QUIZ_TEST__` is set, the view sets `window.__quizAnswer = () => current.answer`.
- **Routing in `app.js`.**
  - Any `[data-qstart]` click also sets `tab = "quiz"`.
  - Any `data-tab` click away from `quiz` calls `quiz.reset()`.
  - In the click selector, `[data-say]` stays first, so a 🔊 inside an option plays without selecting it.

- [ ] **Step 1: Write the failing test.** Extend the parity test in `test/yue-data.test.js`, which already compares keys, so it also asserts `"quizPractice" in enUi && "qTone" in yuePack.ui`. Run `npm test`. Expected: FAIL.
- [ ] **Step 2: Implement** `quiz-view.js`, the `app.js` wiring, the tab buttons, the UI strings, the CSS and the `sw.js` list.
- [ ] **Step 3: Run `npm test`.** Expected: PASS. Serve the folder and open `/korean/` and `/yue/` at 390 × 844. All 6 tabs must be visible, and the page must not scroll sideways.
- [ ] **Step 4: Commit** with the message `feat: Quiz tab — practice and unit tests in both apps`.

### Task 7: Browser checks, golden snapshot and docs

**Files:**
- Modify: `scripts/korean-check.mjs`, `scripts/yue-check.mjs`
- Modify: `test/golden/ko.json` (re-taken with `node scripts/snapshot.mjs --write`)
- Modify: `README.md`

- [ ] **Step 1: Add the Korean checks** to `scripts/korean-check.mjs`. In `addInitScript`, set `__QUIZ_TEST__ = true` and `__QUIZ_SEED__ = 1`. Seed `korean.v1` with every `int-1` item seen (`due` far in the future). Then:
  - **`unit test passes with all-correct answers`:** open Quiz, then Start int-1. 15 times, click `[data-qopt="${await __quizAnswer()}"]` and then Next. The result shows `quizPass`. `state.quiz.units["int-1"].passedAt` is a number, and the Learn picker option for int-1 contains 🏅.
  - **`wrong answers bring items due`:** retake, and always click an option that isn't the answer. Every missed id has `due <= Date.now()`, and `passedAt` is unchanged.
  - **`leaving mid-test records nothing`:** start, answer 1, tap Home, then tap Quiz. The unit list is shown and the attempts count is unchanged.
  - **`no horizontal scroll`:** `document.documentElement.scrollWidth <= 390` on the Quiz tab.
- [ ] **Step 2: Add the Cantonese checks** to `scripts/yue-check.mjs`. Reuse the `clipRun` mocks so every clip exists, then open `/yue/` with a seed that produces a tone question in unit 1. Try seeds from 1 upwards and fix the first one that works. Check:
  - `tone question shows 6 options`;
  - `tone question plays a clip on Next`: `__played` grows;
  - `say option 🔊 plays without selecting`: no `.qopt.right` / `.qopt.wrong` after tapping the 🔊.
- [ ] **Step 3: Run all checks.**
  - `npm test`: all pass.
  - `node scripts/korean-check.mjs` and `node scripts/yue-check.mjs`: all PASS.
  - `node scripts/update-check.mjs`: PASS.
- [ ] **Step 4: Re-take the golden snapshot** with `node scripts/snapshot.mjs --write`. Review `git diff test/golden/ko.json`: only the tab bar, the unit contents of the Learn and Home views, and the word of the hour may change.
- [ ] **Step 5: Update the README.** Document the Quiz tab, unit tests (80%), what a wrong answer does to review, and the mixed units ("your unit may move back; reviews are kept").
- [ ] **Step 6: Commit and push** with the message `test+docs: quiz browser checks, golden re-take, README`, then `git push -u origin korean`.
