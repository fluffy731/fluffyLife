# Quizzes, Unit Tests and Mixed Korean Units — Design

Date: 16 October 2026
Branch: `korean`
Apps: Korean (`/`, pack `ko-zh`) and Cantonese (`/yue/`, pack `yue-ko`)

## Purpose

Two requests from the user:

1. **Quizzes and assessment in both apps.** A quiz checks the answer for the
   learner (multiple choice), unlike Review, where the learner grades their own
   recall. Assessment means **unit tests**: a fixed-length test per unit with
   an 80% pass mark and a score history.
2. **Mixed Korean units.** Today Korean units are cut from the word list in
   file order, 20 at a time. Hanja nouns came first and native words were
   appended later, so intermediate units 1–12 are almost all hanja nouns, and
   units 13–20 are each one part of speech (all verbs, all adjectives, all
   adverbs). Every unit should mix hanja and native words, and nouns, verbs,
   adjectives and adverbs.

Success: each app has a Quiz tab with Practice and Unit tests. Passing a unit
test is recorded and visible. Listening and tone questions play the recorded
clips with the phone on silent. Every Korean unit is a mix of word types, and
no one loses review progress.

## Part 1 — Mixed Korean units

### Current behaviour

`data/vocab.js` expands `INT`, `ADV` and `BEG`. The id and the unit both come
from the row's position: `id = v-<tier>-<index>` and `unit = floor(index / 20) + 1`.

### Change

- **Ids are unchanged.** They are still taken from the row's position in the
  file, before any reordering. Stored progress therefore stays attached to the
  same words, and no migration is needed.
- **Units are assigned by an interleave.** Per tier, rows go into five buckets,
  each keeping file order:

  | Bucket | Rule |
  |---|---|
  | `nH` | `pos === "n"` with hanja |
  | `nN` | `pos === "n"`, native |
  | `v` | `pos === "v"` (includes 하다 verbs) |
  | `adj` | `pos === "adj"` |
  | `etc` | anything else (`adv`, `idiom`, …) |

  The buckets are merged with a smooth weighted round robin. At each step, take
  the next row from the bucket that is furthest behind its proportional share:
  `share × (step + 1) − taken` is largest, and ties go to the bucket order above.
  The merged sequence is cut into units of 20. Each bucket keeps its order, so
  themed nouns stay roughly together. Unit 1's nouns are still mostly
  "society & economy".
- **Unit counts per tier are unchanged:** int 20, adv 14, beg 8.
- **Within a unit,** items appear in merged order, so Learn alternates word
  types. Nouns are about 64% of the intermediate list, so two nouns in a row
  can still occur. A run of three or more same-bucket items in the merged
  sequence should only happen when the other buckets have run out, and the
  test allows for that (see Testing).
- **Grammar is unchanged.** Grammar items keep their stated `unit`.
- **Custom (user-added) items** keep the tier and unit the user chose.
- **File comments.** The `// Unit N — …` comments in `vocab-int/adv/beg.js`
  become topic section labels, and their wording is changed to say so. The rule
  that new rows go at the **end** of a tier file is documented in `vocab.js`,
  because inserting a row in the middle would shift positional ids. That rule
  already applied before this change.

### Effect on existing progress

Review schedules are untouched. Unit completion is recomputed. A learner who
finished units 1–3 under the old layout may see unit 1 as current again, with
a few unseen verbs or adjectives in it. This is expected, and the changelog
note in the README says so.

## Part 2 — Quizzes and unit tests

### Overview

- **Quiz tab.** A new tab between Review and Browse, in both apps:
  - Korean app: Home · Learn · Review · Quiz · Browse · Settings
  - Cantonese app: 홈 · 학습 · 복습 · 퀴즈 · 찾아보기 · 설정
- **Practice.**
  - 10 questions drawn from items the learner has seen. Half are the weakest
    (lowest SM-2 ease, then earliest due), and the rest are random.
  - At least 4 items must have been seen; otherwise the tab says to learn a
    few words first.
  - There is no pass mark.
- **Unit test.**
  - Available for a unit once every item in it has been seen ("learned").
  - 15 questions, each on a different item of the unit. At most 3 are grammar
    items, and grammar is included when the unit has any.
  - For a unit with fewer than 15 items, the test length is the item count.
  - Pass mark: `ceil(0.8 × n)` correct, so 12/15.
  - It can be retaken any time. Passing does not lock or unlock anything,
    because unlocking stays based on "learned", as today.
- **Quiz tab layout.**
  - A Practice button at the top.
  - Then one row per unit, showing the tier, the unit number and title, and a
    status: not ready (the unit isn't learned), test ready, or passed 🏅 with
    the best score.
  - Not-ready rows are shown greyed out with the number of items left to learn.
- **Home.** When some learned unit is not yet passed, Home shows a card
  "Unit N test ready" for the earliest such unit, with a Start button.
- **Learn.** The unit picker shows 🏅 next to passed units, alongside the
  existing ✓.

### Question flow

- One question per screen: a prompt, then 4 options as large buttons. The tone
  question has 6 options.
- **Answering.** Tapping an option locks the answer and colours the options:
  the chosen one red if it is wrong, and the correct one green. The item's card
  is then shown underneath, flipped, as feedback. A Next button follows.
- **Audio.**
  - An audio question plays its clip on the tap that opens it (Start or Next).
    iOS allows playback inside a tap.
  - A 🔊 button replays it.
  - A 🔊 inside an option plays that option's sound without selecting it.
- **Leaving.** Leaving the Quiz tab mid-quiz abandons it, and nothing is
  recorded.
- **Results screen.**
  - The score (e.g. 13/15, 87%) and, for unit tests, Pass or Not yet.
  - The list of missed items; tapping one expands its card.
  - Buttons: Retake, and Back to Quiz.

### Question types

All questions are multiple choice and generated from existing data. Each pack
declares its own types. A type applies to an item only when the item supports
it; for example, a hanja question needs `hanja`, and an audio question needs a
recorded clip. For each question, the type is picked at random among those that
apply to the item.

**Korean app (`ko-zh`)**

| Type | Prompt | Options | Applies to |
|---|---|---|---|
| `meaning` | Korean word | 中文 meaning, with English below | vocab |
| `reverse` | 中文 + English | Korean words | vocab |
| `hanja` | Hanja | Hangul readings | vocab with hanja |
| `listen` | 🔊 clip only | Korean words | vocab with a clip |
| `grammar` | Example sentence (Korean) | Grammar forms | grammar |

**Cantonese app (`yue-ko`).** None of these types requires reading characters.

| Type | Prompt | Options | Applies to |
|---|---|---|---|
| `listen` | 🔊 clip only | Korean meanings | vocab with a clip |
| `sound` | Tone-coloured 한글 spelling + Jyutping | Korean meanings | vocab |
| `say` | Korean meaning | 한글 spellings, each with 🔊 | vocab |
| `tone` | 🔊 clip of a one-syllable word, with the 한글 spelling shown uncoloured | Tones 1–6 (tone-coloured buttons) | one-syllable vocab with a clip |
| `gsound` | Grammar form as 한글 spelling + 🔊 | Korean meanings | grammar |

The tone question is included from unit 1, because tones are the core of
Cantonese. 128 of the 301 Cantonese words are one syllable.

### Choosing wrong options (distractors)

- **Candidate order.** Candidates come from the pack's full item list,
  including custom items, and are tried in this order: same kind
  (vocab/grammar), same tier and same `pos`; then same kind and same tier;
  then same kind from any tier.
- **No duplicates.** A candidate is rejected if its displayed option text
  equals the answer's text or another option's text. This prevents, for
  example, two options both reading 經濟 / economy.
- **Korean `grammar`.** A distractor is rejected if its core form appears in
  the prompt sentence. The core form is the form with `-`, bracketed parts
  `(으)` and `/…` alternatives removed, and spaces trimmed. This stops a
  sentence matching two of the options.
- **Not enough options.** If fewer than 3 distractors survive (possible for a
  rare type), the next applicable type is tried for that item. Grammar is the
  case where this matters.
- **Tone options** are always the six tones 1–6. The answer is the tone digit
  in the item's Jyutping.
- **Order.** Options are shuffled.
- **Randomness.** All randomness comes from a seeded generator (mulberry32),
  so tests can reproduce a quiz exactly. In the app the seed is `Date.now()`.

### Effect on review (SM-2)

- A correct answer changes nothing.
- A wrong answer sets `progress[id].due = now` for that item, which must
  already have been seen, leaving `ease`, `interval` and `reps` untouched. The
  item comes up in Review straight away without the "Again" ease penalty.

### Storage

A new top-level key, `quiz`, in each app's saved state:

```js
quiz: {
  units: { "<tier>-<unit>": { best: 13, total: 15, passedAt: 1760000000000 | null,
                              attempts: [{ at, score, total }] /* newest last, max 10 */ } },
  practice: [{ at, score, total }]  // newest last, max 10
}
```

- `normalise()` in `lib/store.js` keeps `quiz` when it is a plain object and
  otherwise defaults to `{ units: {}, practice: [] }`. Today `normalise()` drops
  any key it does not know, so this change is required, or quiz history would
  vanish on the next load.
- Export and Import carry `quiz` automatically, because they serialise the
  whole state.
- "Reset all progress" also clears `quiz`.
- `best` is kept as score and total so the display is exact, e.g. "13/15".

### Architecture

| Unit | Responsibility | Depends on |
|---|---|---|
| `lib/quiz.js` (new, pure) | `rng(seed)`, `pickPracticeItems`, `pickUnitTestItems`, `buildQuestions(items, pool, types, {rng, hasClip})`, `passMark(n)`, `recordAttempt(quizState, key, score, total, now)`, `applyMisses(progress, ids, now)` | nothing (data in, data out) |
| `quiz/ko.js` (new) | Korean question types: `applies(it, env)`, `prompt`, `optionText`, `optionHTML`, `promptHTML` | `lib/pron.js` |
| `quiz/yue.js` (new) | Cantonese question types, including tone | `lib/jyutping.js`, `cards/yue.js` (`sylHTML` export) |
| `quiz-view.js` (new) | Renders the Quiz tab, the question screen and the results screen; handles quiz clicks | `lib/quiz.js`, pack, ctx |
| `app.js` | Adds the `quiz` tab to `render()`, routes `data-quiz*` clicks to `quiz-view.js`, adds the Home "test ready" card and the 🏅 marker | `quiz-view.js` |
| `packs/ko.js`, `packs/yue.js` | `quiz: { types }` | `quiz/*.js` |
| `ui/en.js`, `ui/ko.js` | New strings, keeping key parity (enforced by a test) | — |
| `index.html`, `yue/index.html` | Sixth tab button | — |
| `style.css` | Option buttons, right/wrong states, tone buttons, results list | — |
| `data/vocab.js` | Interleaved unit assignment | — |

- `cards/yue.js` exports its existing `sylHTML` so the quiz can reuse the
  tone-coloured spelling. Its behaviour does not change.
- **Clip check.** `quiz-view.js` receives `hasClip(text)`, the existing
  `clipFor` result, as a boolean. Audio types apply only when it is true. If
  clips have not loaded (offline first run, or CI generation failed), audio
  questions are simply not offered, and the quiz still works.
- **Service worker.** `sw.js` precaches an explicit `FILES` list, so
  `lib/quiz.js`, `quiz/ko.js`, `quiz/yue.js` and `quiz-view.js` are added to it.
  Otherwise the quiz would fail offline.

### Error handling

- **Too few items.** Practice needs at least 4 seen items. A unit test needs a
  learned unit; a row that isn't ready is not clickable.
- **No valid type.** If an item has no type that yields 3 distractors, it is
  skipped and another item from the same pool is used. If the pool runs out,
  the quiz is shorter, and the total reflects the questions actually asked.
- **Storage write failure.** This uses the existing `save()` path, which
  returns false; the result is still shown on screen.

## Testing

- **`test/quiz.test.js` (unit):**
  - the same seed gives the same questions;
  - options are unique by display text and include the answer exactly once;
  - the grammar substring rule;
  - the tone answer equals the Jyutping digit;
  - `passMark(15) === 12` and `passMark(5) === 4`;
  - `recordAttempt` keeps a maximum of 10 attempts, updates `best`, and sets
    `passedAt` only on a pass and never clears it;
  - `applyMisses` changes only `due`;
  - unit-test selection takes at most 3 grammar items and no item twice;
  - practice selection is limited to seen items.
- **`test/store.test.js`:**
  - `quiz` survives load, import and export;
  - a bad `quiz` value falls back to the default.
- **`test/data.test.js` (Korean mix):**
  - the set of ids is identical to before the change. A pinned list of
    `id → ko` for all seed vocab is checked into `test/golden/ko-ids.json`,
    generated from the pre-change commit;
  - each tier's unit count is unchanged, with 20 items per unit except
    possibly the last;
  - every unit has at least 3 buckets;
  - every int and adv unit has at least one verb or adjective and at least one
    native word;
  - in the merged sequence, no run of 3 or more of the same bucket occurs while
    another bucket still has rows left.
- **UI parity test.** The new strings exist in both `ui/en.js` and `ui/ko.js`.
- **Browser checks:**
  - `scripts/korean-check.mjs` and `scripts/yue-check.mjs` gain a quiz pass:
    open the Quiz tab, take a full unit test with all-correct answers using
    seeded/known answers through a test hook, check that 🏅 and the history
    appear, take one with wrong answers and check that the missed items are
    due now;
  - for Cantonese, a tone question renders 6 buttons and plays a clip (a mocked
    clip index);
  - phone viewport 390 × 844, with no horizontal scroll and 6 tabs fitting.
- **Golden snapshot.** `test/golden/ko.json` is re-taken, because the tab bar
  and unit contents change. The diff is reviewed to confirm that only those
  changed.

## Out of scope

- Level estimates or TOPIK band checks (option B; the same engine can do this
  later).
- Typed-answer questions.
- Speaking or recording.
- Timed tests.
- Changing Cantonese unit composition: its units are already themed and mixed.
- Adding new vocabulary to improve the Korean noun/verb balance.
