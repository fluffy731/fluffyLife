# Cantonese for Korean Speakers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A second home-screen app, `/yue/`, teaching Cantonese to a Korean-speaking complete beginner with a rule-generated 한글 pronunciation spelling on every card, built on the existing engine without changing the Korean app.

**Architecture:** `app.js` becomes `start(pack)`; a pack supplies tiers, data, UI strings, card renderers, storage key and speech languages. A pure `lib/jyutping.js` converts Jyutping to 한글 syllables with tone numbers. The Korean app is locked by a DOM golden snapshot taken before the refactor.

**Tech Stack:** Vanilla ES modules, Node 22 `node --test`, Playwright (local, for snapshots and screenshots only).

**Spec:** `docs/superpowers/specs/2026-10-15-cantonese-for-korean-speakers-design.md`

## Global Constraints

- No build step, no runtime dependencies, no server.
- Korean app behaviour and HTML output unchanged; storage key stays `korean.v1`. Cantonese app uses `yue.v1`.
- Chinese text in Traditional characters. Cantonese UI language is Korean; app title `광동어 · 粵語`.
- Tiers for Cantonese: `a0` (units 1–4), `a1` (5–9), `a2` (10–12); labels in Korean.
- 한글 spelling is **computed** from Jyutping (never hand-typed); initials b d g z → ㅃ ㄸ ㄲ ㅉ and p t k c → ㅍ ㅌ ㅋ ㅊ; f → ㅍ; ng → ㅇ; short `a` → ㅓ, `aa` → ㅏ; finals -p -t -k → 받침 ㅂ ㄷ ㄱ; diphthong glides `이`/`우` as a separate syllable; `eoi` → 우이; `yu` → ㅟ; syllabic `m`/`ng` → 음/응; tone digit shown as a superscript after each syllable.
- Speech: `speechLang` order `zh-HK`, then `zh-TW`; the characters are spoken, never the Jyutping.
- Release 1 content: ≥ 300 words in 12 units, ≥ 40 grammar points; Cantonese app has no Add/Edit (Browse is read-only plus Reset progress).

## Review Focus

1. A Jyutping syllable outside the mapping table (e.g. `hm1`) must never render blank: show the raw syllable and have the validator report it. (Task 1, 2)
2. Example sentences with punctuation, capitals and digits (`Mei5 Jing1.`, `hou2 gwai3?`, `HK$`) must pass through without throwing and without a stray space before punctuation. (Task 1)
3. Existing Korean progress survives the refactor and Cantonese progress never touches `korean.v1`. (Task 4, 5)
4. `/yue/` works offline after the first visit. (Task 9)
5. No `zh-HK` voice installed: speech falls back to `zh-TW`, then shows a Korean hint instead of failing silently. (Task 5)

---

### Task 1: Hangul helpers and Jyutping → 한글

**Files:**
- Create: `lib/hangul.js`, `lib/jyutping.js`, `test/jyutping.test.js`
- Modify: `lib/pron.js` (import the shared helpers instead of redefining them)

**Interfaces:**
- Produces from `lib/hangul.js`: `CHO: string[]`, `JUNG: string[]`, `JONG: string[]`, `isHangul(ch: string): boolean`, `split(ch: string): {c, v, j}`, `join({c, v, j}): string`.
- Produces from `lib/jyutping.js`:
  - `syllables(jp: string): Array<{ jp: string, hg: string, tone: number | null, ok: boolean, punct?: true }>` — tokenises on whitespace; each Jyutping syllable (`[a-z]+[1-6]?`, case-insensitive) is converted; punctuation/other tokens come back with `punct: true, hg: token, ok: true`; an unmapped syllable has `ok: false, hg: <raw jp>`.
  - `hangul(jp: string, opts?: { tones?: boolean }): string` — joins `hg` with single spaces, punctuation attached to the previous token with no space; with `tones` each syllable is followed by a superscript digit `¹²³⁴⁵⁶`.
  - `TONE_SUP: string[]` (index 1–6).

- [ ] **Step 1: Write the failing tests** in `test/jyutping.test.js`, `hangul(x, {tones:true})` unless noted:
  `nei5 hou2` → `네이⁵ 호우²`; `hok6 haau6` → `혹⁶ 하우⁶`; `m4 goi1` → `음⁴ 꼬이¹`; `do1 ze6` → `또¹ 쩨⁶`; `heoi3` → `후이³`; `gwok3` → `꿕³`; `gwaai1` → `꽈이¹`; `ngo5` → `오⁵`; `ng5` → `응⁵`; `jau5` → `여우⁵`; `waa6` → `와⁶`; `seoi2` → `수이²`; `syu1` → `쉬¹`; `sap6` → `섭⁶`; `saam1` → `삼¹`; `sam1` → `섬¹`; `saang1` → `상¹`; `faan6` → `판⁶`; `daai6` → `따이⁶`; `hai2` → `허이²`; `coi3` → `초이³`; `gong2` → `꽁²`.
  Every initial from the spec table and every final from the spec table appears in at least one assertion (loop over a table of `[jp, expected]`).
  Review Focus 1: `syllables("hm1")` → `[{ jp:"hm1", hg:"hm1", tone:1, ok:false }]`.
  Review Focus 2: `hangul("nei5 hou2, ngo5 giu3 Mei5 Jing1.")` → `네이 호우, 오 끼우 메이 잉.` (tones off); `hangul("hou2 gwai3?")` ends `?` with no preceding space; `hangul("HK$ 5")` does not throw and keeps `HK$` and `5`.
  Missing tone digit: `hangul("nei hou", {tones:true})` → `네이 호우` (no superscript).
- [ ] **Step 2: Run** `npm test` → FAIL (`lib/jyutping.js` missing). Existing 44+ tests still pass.
- [ ] **Step 3: Extract `lib/hangul.js`** from the private helpers in `lib/pron.js` and import them there. Run `npm test` → all `pron` tests still pass (this is the refactor's own check).
- [ ] **Step 4: Implement `lib/jyutping.js`.** Table-driven: an `INITIALS` map, a `FINALS` map `{ v: vowelJamo, c: codaJamo|"", t: ""|"이"|"우" }` for every final in the spec, `GLIDE_W` (`aa→ㅘ, a→ㅝ, o→ㅝ, i→ㅟ, u→ㅜ, e→ㅞ`) for `w`/`gw`/`kw`, `GLIDE_Y` (`aa→ㅑ, a→ㅕ, e→ㅖ, o→ㅛ, u→ㅠ, oe→ㅕ`) for `j`. Split a syllable by longest-prefix initial match (`ng`, `gw`, `kw` before single letters); syllabic `m`/`ng` handled before initial matching. Compose with `join`; append the `t` trailing syllable (`이`/`우`) as its own syllable.
- [ ] **Step 5: Run** `npm test` → PASS. **Commit** `feat: Jyutping to 한글 spelling engine`.

### Task 2: Character bridge and Cantonese validator

**Files:**
- Create: `lib/bridge.js`, `lib/validate-yue.js`, `test/bridge.test.js`, `test/validate-yue.test.js`

**Interfaces:**
- Consumes: `syllables` from Task 1.
- Produces: `bridge(zh: string, jp: string, table: Record<string,string>): Array<{ ch, jp, hg, ko: string | null }> | null` — one entry per Han character paired with its syllable; `null` when the counts differ. `hasBridge(rows): boolean` (at least one `ko`). `validateYue(item, kind: "vocab"|"grammar"): string[]` and `YUE_TIERS = ["a0","a1","a2"]`.

- [ ] **Step 1: Failing tests.** `bridge("學校","hok6 haau6",{學:"학",校:"교"})` → `[{ch:"學",jp:"hok6",hg:"혹",ko:"학"},{ch:"校",jp:"haau6",hg:"하우",ko:"교"}]`; `bridge("唔該","m4 goi1",{})` rows have `ko:null` and `hasBridge` false; `bridge("你好嗎","nei5 hou2",{})` → `null`. `validateYue` accepts a well-formed vocab row and grammar row; reports: missing `ko`, tier `x`, `jp` token `nei hou2` (no tone digit on a syllable that needs one is allowed only for punctuation), unmapped syllable `hm1`, `unit` not a positive integer, grammar `ex` empty or missing `jp`.
- [ ] **Step 2: Run → FAIL. Step 3: Implement. Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `feat: character bridge and Cantonese validator`.

### Task 3: Golden snapshot of the Korean app (lock before refactor)

**Files:**
- Create: `scripts/snapshot.mjs`, `test/golden/ko.json`

- [ ] **Step 1: Write `scripts/snapshot.mjs`** (`node scripts/snapshot.mjs --write|--check`). It starts a static server on the repo root, opens `/` in Playwright at 390×844 (module path from `PLAYWRIGHT_MODULE`, default `playwright`), fixes `Date` to 2026-10-15T09:30 via `addInitScript`, seeds nothing, and records `#view` innerHTML for: Home; Learn (unflipped and flipped); Review empty; Browse with query `경제`; Browse with `kind=grammar`, tier `int`, first item opened; Settings; and the page `<title>` and tab labels. `--check` diffs against `test/golden/ko.json` and exits non-zero with the first differing view name.
- [ ] **Step 2: Run `--write` on the current code. Commit** `test: golden snapshot of Korean app views`.

### Task 4: Pack-driven engine

**Files:**
- Create: `packs/ko.js`, `cards/ko.js`, `ui/en.js`, `test/track-tiers.test.js`
- Modify: `app.js` (→ `export function start(pack)`), `lib/track.js`, `lib/store.js`, `index.html`, `sw.js` (file list)

**Interfaces:**
- Produces: `buildUnits(vocab, grammar, tierOrder = TIER_ORDER)`; `load(ls, opts?: { key?: string, validate?: (item, kind) => string[] })`, `save(ls, state, key = KEY)`, `importJSON(str, validate?)` — defaults reproduce today's behaviour exactly (`KEY = "korean.v1"`).
- Pack shape consumed by `start(pack)`:
  `{ id, title, htmlLang, storageKey, speechLang: string[], speechClean(text): string, tiers: [{key,label}], vocab, grammar, ui: Record<string,string|Function>, cards: { card(it, open, ctx), browseRow(it, ctx), searchText(it): string[], speakText(it): string, front... }, editable: boolean, validate(item, kind): string[] }`; `ctx = { esc, say(text), t(key, vars?), isGrammar(it) }`.

- [ ] **Step 1: Failing tests** in `test/track-tiers.test.js`: `buildUnits` with `tierOrder=["a0","a1"]` orders `a0` before `a1` and ignores an item whose tier is not listed; `load(ls, {key:"yue.v1"})` reads and `save(ls, s, "yue.v1")` writes only that key (Review Focus 3: `korean.v1` untouched); `load(ls, {validate})` drops custom items the validator rejects; default `load`/`save` still use `korean.v1`.
- [ ] **Step 2: Run → FAIL. Step 3: Implement** the `track.js`/`store.js` parameters with unchanged defaults. **Step 4: Run → PASS.**
- [ ] **Step 5: Refactor `app.js`** to `start(pack)`: wrap module state in the function, replace `pack.vocab` imports, `TIER_ORDER/TIER_LABEL`, card/browse-row/search/speech/editor/strings with pack hooks. Move today's Korean card and browse-row templates verbatim into `cards/ko.js`; move every user-visible English string into `ui/en.js` with the exact current text. `index.html` imports `start` and `packs/ko.js` in an inline module. Add the new files to `sw.js`.
- [ ] **Step 6: Run** `node scripts/snapshot.mjs --check` → no difference; `npm test` → PASS; the earlier behavioural script (`verify.mjs`, 9 checks) → all PASS.
- [ ] **Step 7: Commit** `refactor: pack-driven engine (Korean app unchanged)`.

### Task 5: Cantonese runtime and Unit 1

**Files:**
- Create: `packs/yue.js`, `cards/yue.js`, `ui/ko.js`, `yue/index.html`, `yue/manifest.json`, `icons/yue.svg`, `icons/yue-180.png`, `icons/yue-512.png`, `data/yue/vocab.js`, `data/yue/vocab-a0.js`, `data/yue/grammar.js`, `data/yue/hanja-ko.js`, `data/yue/pack.js`, `test/yue-data.test.js`
- Modify: `style.css` (tone colours `.t1`–`.t6`, `.hg` large, `.jp` small), `sw.js` (yue files, `./yue/`, register path `../sw.js`), `app.js` (speech voice chain)

**Interfaces:**
- Consumes: `start(pack)` (Task 4), `syllables/hangul` (Task 1), `bridge/validateYue` (Task 2).
- Produces: vocab rows `[zh, jp, ko, en, pos, exZh, exJp, exKo, flags?]` expanded by position (25 per unit within a tier; ids `y-a0-001`); grammar rows `[formZh, formJp, tier, unit, ko, en, note, [[zh, jp, ko], …]]` (ids `yg-a0-001`); `hanja-ko.js` exports `HANJA_KO: Record<char, 한국 한자음>`.
- Card front: tone-coloured 한글 syllables (`.hg`) + 🔊 + part of speech; back: Korean meaning, English, Jyutping (`.jp`), characters, bridge line, example with its own 한글/Jyutping/🔊/Korean. Grammar card front: 한글 of `formJp` with the characters beneath.

- [ ] **Step 1: Failing test** `test/yue-data.test.js` (Unit 1 stage): every row validates via `validateYue`; ids unique; no duplicate `zh`; every unit has ≥ 1 grammar point; the pack shape (`id "yue-ko"`, `speechLang ["zh-HK","zh-TW"]`, `storageKey "yue.v1"`, `editable false`, `tiers` a0–a2 with Korean labels).
- [ ] **Step 2: Run → FAIL. Step 3: Implement** the pack, cards, Korean UI strings (tabs `홈 학습 복습 찾아보기 설정`; Learn buttons `알겠어요` / `이미 알아요`; Review grades `다시 / 어려움 / 좋음 / 쉬움`; empty states; Settings; the Korean version of the hourly-reminder tip), data expander and **Unit 1 "소리와 성조"** (≥ 24 rows: the six-tone minimal pairs 詩 史 試 時 市 事 `si1 si2 si3 si4 si5 si6`, and the first sounds: 一二三 numbers 1–6 for tone drills, 你 我 好 etc.) plus 3 grammar points. Speech: try each `speechLang` in order against `speechSynthesis.getVoices()`; if none matches, `alert(ui.noVoice)` with the Korean Settings path hint. Edit/Add hidden when `editable` is false.
- [ ] **Step 4: Run** `npm test` and `snapshot --check` (Korean unchanged) → PASS. Screenshot `/yue/` Home/Learn/Review/Browse/Settings at 390×844, light and dark; read them; fix layout defects.
- [ ] **Step 5: Commit** `feat: Cantonese app runtime with Unit 1`.

### Task 6: Content — units 2–6 and their grammar

**Files:** Create `data/yue/vocab-a0.js` rows for units 2–4, `data/yue/vocab-a1.js` for units 5–6; modify `data/yue/grammar.js`.

Units: 2 인사와 예의 · 3 숫자·돈·시간 · 4 음식과 주문 · 5 대중교통 · 6 쇼핑 — 25 words each, 2–3 grammar points each (係/唔係, 有/冇, classifiers 個/杯/張, numbers & 兩, 想/要, 幾多錢, 邊度/喺…).

- [ ] **Step 1: Raise the minimums in `test/yue-data.test.js`** to units 1–6 present with ≥ 24 words each; run → FAIL. **Step 2: Author the rows. Step 3: Run → PASS** (validator catches every malformed or unmapped Jyutping syllable). Mark uncertain rows `check` flag `1`.
- [ ] **Step 4: Commit** `content: Cantonese units 2–6`.

### Task 7: Content — units 7–12 and their grammar

Units: 7 사람과 가족 · 8 일상 동사 · 9 형용사 · 10 장소와 길 찾기 · 11 건강과 약국 · 12 광동어다운 말투 (嘅 咗 啲 啦 喎 嘛 呀 㗎 囉 咋 …). Grammar: 咗/緊/過, 嘅 possession, 都, comparatives 比/咁, 可以/會/要, questions 咩/點/乜/邊/幾, time-before-place word order, 唔該 vs 多謝.

- [ ] **Step 1: Raise minimums to the release-1 totals** (≥ 300 words, 12 units each ≥ 24, ≥ 40 grammar points); run → FAIL. **Step 2: Author. Step 3: Run → PASS. Step 4: Commit** `content: Cantonese units 7–12`.

### Task 8: Sino-Korean bridge table

**Files:** Modify `data/yue/hanja-ko.js`, `test/yue-data.test.js`.

- [ ] **Step 1: Failing tests:** every vocab row with equal character and syllable counts produces a `bridge` result; a coverage report asserts ≥ 55 % of rows have at least one Sino-Korean reading; characters marked Cantonese-only (`嘅 咗 啲 嚟 喺 冇 係 睇 佢 哋 …`) are absent from `HANJA_KO` and render the `광동어에만 있는 글자` badge. **Step 2: Run → FAIL. Step 3: Fill the table. Step 4: Run → PASS. Step 5: Commit** `content: Sino-Korean reading table for the bridge`.

### Task 9: Verification, docs, deploy

**Files:** Modify `README.md`, `yue/index.html` if needed; `scripts/yue-check.mjs` (create).

- [ ] **Step 1: `scripts/yue-check.mjs`** (Playwright): learn through Unit 1; after grading, `korean.v1` is absent and `yue.v1` has progress (Review Focus 3); with a mocked `speechSynthesis` exposing only `zh-TW`, tapping 🔊 speaks with `zh-TW`; with none, shows the Korean hint (Review Focus 5); offline: after one load and `serviceWorker.ready`, `context.setOffline(true)` and a reload of `/yue/` still renders (Review Focus 4); no console errors.
- [ ] **Step 2: Run all checks** (`npm test`, `snapshot --check`, `yue-check`, the Korean behavioural script) → PASS. README: Cantonese app URL, how to read the 한글 spelling and tone colours, the Add-to-Home-Screen and hourly-reminder steps for her phone.
- [ ] **Step 3: Commit and push `korean`; confirm the Pages deploy run is green** and both URLs return the pages (`/` and `/yue/`).
