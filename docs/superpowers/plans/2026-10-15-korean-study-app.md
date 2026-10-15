# Korean Study App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static, offline-capable PWA for learning Korean vocabulary and grammar with hanja, spaced repetition, a TOPIK-ordered study track, and a clock-driven "word of the hour".

**Architecture:** Pure ES-module logic in `lib/` (SM-2, track, hour, validate) tested with `node --test`; a single `index.html` + `app.js` renders tabs from a data pack in `data/`; `localStorage` holds progress; `sw.js` caches everything for offline.

**Tech Stack:** Vanilla JS (ES modules), HTML/CSS, Node 20+ test runner. No dependencies, no build.

**Spec:** `docs/superpowers/specs/2026-10-15-korean-study-app-design.md`

## Global Constraints

- No build step, no npm dependencies, no server.
- Chinese text in Traditional characters; `hanja` is `null` for native words.
- Tiers: `int` (TOPIK 3–4), `adv` (TOPIK 5–6), `beg` (TOPIK 1–2); track order int → adv → beg.
- Storage key `korean.v1` = `{ progress, custom, settings }`.
- Mobile first, 16px gutters, dark mode via `prefers-color-scheme`.
- Data lives in a pack: `data/pack.js` exports `{ id, target, support, fields, vocab, grammar }`.

## Review Focus

1. Empty review queue (nothing due) — Review tab shows "nothing due, next in N" not a blank card. (Task 6)
2. Corrupt or missing `localStorage` — app boots with defaults, does not throw. (Task 5)
3. Import of malformed JSON — rejected with a message, existing data untouched. (Task 5)
4. Word of the hour when the current unit is empty (all learned) — falls back to the whole tier. (Task 3)
5. Duplicate ids between seed and custom items — custom wins, no crash. (Task 4)

---

### Task 1: Scaffold + SM-2

**Files:** Create `package.json` (`"type":"module"`, `"test":"node --test test/"`), `lib/sm2.js`, `test/sm2.test.js`.

**Interfaces — Produces:** `grade(state, g, now)` where `state = {ease, interval, reps, due}` (or `undefined` for new), `g ∈ {"again","hard","good","easy"}`, `now` epoch ms; returns new state. `newState()` returns `{ease:2.5, interval:0, reps:0, due:0}`. Intervals in days; `due = now + interval*86400000`.

- [ ] Write tests: new→good gives interval 1, reps 1; second good gives 6; third good gives `round(6*2.5)=15`; again resets reps 0 interval 0 ease 2.3; ease floor 1.3; hard = interval×1.2 (min 1) ease −0.15; easy = good×1.3 ease +0.15; due computed from `now`.
- [ ] Run `npm test` → fails (module missing).
- [ ] Implement `lib/sm2.js`.
- [ ] `npm test` → pass. Commit `feat: sm2 scheduler`.

### Task 2: Track (units and unlocking)

**Files:** Create `lib/track.js`, `test/track.test.js`.

**Interfaces — Consumes:** items with `{id, tier, unit}`; progress map `{[id]: sm2State}`.
**Produces:** `TIER_ORDER = ["int","adv","beg"]`; `buildUnits(vocab, grammar)` → array of `{key:"int-1", tier, unit, items:[...]}` ordered by TIER_ORDER then unit; `isLearned(unit, progress)` → every item id has `progress[id]?.reps > 0`; `currentUnit(units, progress)` → first unit not learned (or last); `isUnlocked(units, i, progress)` → `i===0 || isLearned(units[i-1])`; `dueItems(items, progress, now)` → seen items with `due <= now`, sorted by due; `unseenItems(unit, progress)`.

- [ ] Write tests for each function with a 2-unit fixture.
- [ ] Run → fail. Implement. Run → pass. Commit `feat: study track`.

### Task 3: Word of the hour

**Files:** Create `lib/hour.js`, `test/hour.test.js`.

**Produces:** `hourKey(date)` → `"YYYY-MM-DDTHH"` local; `hash(str)` → uint32 FNV-1a; `wordOfHour(items, date)` → `items[hash(hourKey(date)) % items.length]` or `null` if empty.

- [ ] Tests: same hour same item; different hour may differ (assert deterministic value for a fixed date); empty → null.
- [ ] Review-focus 4: caller passes current-unit items, falls back to tier items — tested in Task 6 via `pickHourItems(units, current, progress)` in `lib/track.js`: returns current unit's items, or all items of the current tier if unit empty.
- [ ] Implement, pass, commit `feat: word of the hour`.

### Task 4: Data pack + validation

**Files:** Create `data/vocab.js`, `data/grammar.js`, `data/pack.js`, `lib/validate.js`, `test/validate.test.js`, `test/data.test.js`.

**Produces:** `validateItem(item, kind)` → array of error strings (empty = ok); required vocab fields `id, ko, zh, en, pos, tier, unit, ex, exZh, exEn` with `hanja` present (string or null); grammar `id, form, tier, unit, en, zh, ex[]` each ex `{ko,zh,en}`; `mergeItems(seed, custom)` → custom overrides seed by id (review-focus 5).
Pack: `{ id:"ko-zh", target:"ko", support:["zh","en"], fields:{ front:"ko", script:"hanja", gloss:["zh","en"] }, vocab, grammar }`.
Content: Intermediate ≥ 300 words / 15 units of ~20 + 2–3 grammar each; Advanced ≥ 200 / 10 units; Beginner ≥ 100 / 5 units. Grammar ≥ 80 total. Uncertain entries `check:true`.

- [ ] Write validate tests (missing field, bad tier, duplicate id, merge override).
- [ ] Write `test/data.test.js`: every seed item validates; ids unique; counts meet minimums; every unit has ≥ 1 grammar point.
- [ ] Author data files (largest step; split vocab across `data/vocab-int.js`, `data/vocab-adv.js`, `data/vocab-beg.js` re-exported by `data/vocab.js`).
- [ ] Pass, commit `feat: seed data pack`.

### Task 5: Storage

**Files:** Create `lib/store.js`, `test/store.test.js` (inject a fake `localStorage`).

**Produces:** `load(ls)` → `{progress:{}, custom:[], settings:{}}` merged over whatever parses (review-focus 2: invalid JSON → defaults); `save(ls, state)`; `exportJSON(state)` → string; `importJSON(str)` → state or throws `Error("Invalid backup")` if not an object with `progress` (review-focus 3).

- [ ] Tests, fail, implement, pass, commit `feat: storage`.

### Task 6: UI

**Files:** Create `index.html`, `app.js`, `style.css`, `manifest.json`, `sw.js`, `icons/icon.svg`, `README.md`.

**Consumes:** everything above.
Tabs: Home (track position, due count, word-of-hour card, Shortcuts tip), Learn (unseen items of current/selected unit, card flip, mark seen = grade "good"), Review (due queue, flip, 4 grade buttons; empty state with next-due time), Browse (search, tier filter, status; add/edit/delete custom items via a form), Settings (export, import, reset, unit jump).
Card: front = `ko`/`form`; back = hanja (`lang="zh-Hant"`), zh, en, pos, examples. `check:true` shows a small `?` badge.
`sw.js`: cache-first for same-origin files on install; version string bump invalidates.
README: how to host (GitHub Pages), add to home screen, set up the hourly iOS Shortcut, add words.

- [ ] Build, open with Playwright at 390×844, screenshot every tab in light and dark, confirm no console errors.
- [ ] Commit `feat: PWA UI`.

### Task 7: Pages deploy

**Files:** Create `.github/workflows/pages.yml` deploying repo root to GitHub Pages on push to `korean`.

- [ ] Commit `ci: deploy to GitHub Pages`. Push `korean`.
