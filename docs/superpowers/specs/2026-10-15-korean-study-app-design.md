# Korean Study App — Design

Date: 15 October 2026
Branch: `korean`

## Purpose

A personal Korean vocabulary and grammar app for a B1/B2 learner who reads
Chinese. Every Sino-Korean word is shown with its hanja so the meaning is
understood at a glance. Installed to the iPhone home screen as a PWA, with
no backend and no cost.

## Constraints

- Static files only: `index.html`, `app.js`, `data/`, `manifest.json`,
  `sw.js`. No build step, no dependencies, no server.
- Works offline once installed.
- iOS cannot run hourly timers for a web app. The app computes a "word of
  the hour" from the clock; the user adds an iOS Shortcuts automation that
  opens the app hourly. Real web push is a possible later upgrade.
- Seed content is curated, not exhaustive: ~600 words and ~80 grammar
  points. Adding and editing entries must be trivial.

## Content model

```js
// data/vocab.js
{ id: "v0001", ko: "경제", hanja: "經濟", zh: "經濟", en: "economy",
  pos: "n", tier: "int", unit: 1,
  ex: "한국 경제가 빠르게 성장했다.", exZh: "韓國經濟快速成長了。",
  exEn: "The Korean economy grew quickly.", check: false }
```

- `hanja` is `null` for native Korean words.
- `check: true` marks entries the author is not confident about.
- `tier` is one of `int` (TOPIK 3–4), `adv` (TOPIK 5–6), `beg` (TOPIK 1–2).
- Chinese is in Traditional characters.

```js
// data/grammar.js
{ id: "g001", form: "-(으)ㄹ 뿐만 아니라", tier: "int", unit: 1,
  en: "not only … but also", zh: "不僅…而且…",
  note: "Attaches to verb/adjective stems. Compare 뿐 alone = 'only'.",
  ex: [{ ko: "...", zh: "...", en: "..." }, ...] }
```

User-added items use the same shape with ids prefixed `u`. They live in
localStorage alongside progress and are merged with the seed data on load.

## Study track

Units are ordered: all Intermediate units, then Advanced, then Beginner.
Each unit holds ~20 words and 2–3 grammar points. A unit is "learned" when
every item in it has been reviewed at least once. The next unit unlocks when
the previous is learned; the user may also open any unit directly. The
home screen shows current unit, items learned, and reviews due.

## Learning loop

- **Learn**: walks through the current unit's unseen items one at a time.
- **Review**: SM-2 spaced repetition over all seen items (vocab and
  grammar mixed), ordered by due date. Grades: Again / Hard / Good / Easy.
- **Card**: front shows hangul (or grammar form). Flip reveals hanja,
  Chinese, English, example sentence(s) with translations.
- **Word of the hour**: `items[hash(dateHour) % items.length]` drawn from
  the current unit, so it is stable within the hour and changes on the hour.
- **Browse**: searchable list of all items with tier and status; edit,
  add, or delete from here.

## SM-2

State per item: `{ ease: 2.5, interval: 0, reps: 0, due: epochMs }`.

- Again → reps 0, interval 0 (due now), ease −0.2 (min 1.3)
- Hard → interval × 1.2, ease −0.15
- Good → interval 1 → 6 → interval × ease
- Easy → as Good then × 1.3, ease +0.15

Intervals in days; due = now + interval.

## Storage

`localStorage` key `korean.v1`:
`{ progress: { [id]: sm2State }, custom: [items], settings: {} }`.
Export downloads this as JSON; Import replaces it after confirmation.

## UI

Single page, bottom tab bar: Home · Learn · Review · Browse · Settings.
Mobile first, 16px gutters, dark mode via `prefers-color-scheme`. Fonts:
system stack; hanja rendered with `lang="zh-Hant"` so iOS picks a
Traditional-Chinese face.

## Testing

Pure logic in `lib/` modules (ES modules shared by app and tests):
`sm2.js`, `track.js`, `hour.js`, `validate.js`. Tests in `test/` run with
`node --test`. `validate.js` checks every seed entry has required fields,
unique ids, and a valid tier. UI is verified by a Playwright screenshot pass.

## Out of scope

Server push, accounts, sync between devices, audio, TOPIK mock exams.
