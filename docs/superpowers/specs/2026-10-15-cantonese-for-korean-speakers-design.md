# Cantonese for Korean Speakers — Design

Date: 15 October 2026
Branch: `korean`
Builds on: `2026-10-15-korean-study-app-design.md` (the pack concept)

## Purpose

A Cantonese vocabulary and grammar app for a **complete beginner who is a
Korean speaker and cannot read Chinese characters**, living in or visiting
Hong Kong. Everything is explained in Korean. The defining feature is a
**한글 pronunciation spelling for every Cantonese word and sentence**
(the role pinyin plays for Mandarin), shown front and centre on every card.

## Decisions (agreed with the user)

1. One codebase, two entry pages. `/` is the existing Korean app unchanged;
   `/yue/` is the Cantonese app with its own home-screen icon, name,
   manifest and progress. No pack switcher.
2. **한글 sound spelling is primary and always visible.** Jyutping is a
   small secondary line. Characters are shown last on the back of the card.
3. UI language is Korean. English glosses secondary.
4. Traditional characters. Written colloquial characters (嘅 咗 啲 嚟…) are
   taught in their own unit.
5. Release 1 ships without recordings; speech uses the iPhone's `zh-HK` voice.
   The data model leaves room for per-word audio files later.

## Non-goals (release 1)

Recordings, handwriting, server push, spoken-vs-written corrections,
Mandarin, accounts, sync.

## Architecture

### Pack-driven engine
`app.js` is refactored to `start(pack, ui)`:
- `pack` supplies `id`, `tiers` (ordered, with labels), `storageKey`,
  `speechLang`, `cards` (a renderer module) and the item arrays.
- `ui` is a string table (`ko` for the Cantonese app, `en` for the Korean app).
- Card and Browse-row HTML move to `cards/ko.js` and `cards/yue.js`.
- Engine modules (`sm2`, `track`, `hour`, `store`, `validate`) are unchanged
  except that `TIER_ORDER` / `TIER_LABEL` are passed in by the pack.
- **Korean-app behaviour must stay identical**; the existing 44 tests and the
  Playwright behavioural script are the lock.

### Entry pages
- `index.html` → starts the `ko-zh` pack (storage key `korean.v1`).
- `yue/index.html` + `yue/manifest.json` → starts the `yue-ko` pack
  (storage key `yue.v1`, app title `광동어 · 粵語`, distinct icon).
- Shared `sw.js` at the repo root caches both apps' files; the deploy stamps
  the commit SHA as before.

## Data model — `data/yue/`

```js
// vocab row (compact, expanded by position like the Korean pack)
[ zh, jp, ko, en, pos, exZh, exJp, exKo, flags? ]
// e.g. ["你好","nei5 hou2","안녕하세요","hello","phrase","你好，我叫美英。","nei5 hou2, ngo5 giu3 mei5 jing1","안녕하세요, 저는 미영이에요."]
```
- `hg` (한글 spelling) is **computed** from `jp` by `lib/jyutping.js`, never
  hand-typed, so it is consistent. An optional per-row override
  `hg:"…"` exists for exceptions.
- `bridge`: optional per-character Sino-Korean readings for cognates she
  already knows by sound, e.g. `學校 → 학·교`. Derived from a small
  `data/yue/hanja-ko.js` table (character → 한국 한자음). Words with no
  Korean cognate (嘅 咗 啲 …) carry `bridge: null` and show a
  "광동어에만 있는 글자" badge.
- `check` flag as before (`?` badge) for rows the author is unsure of.
- Tiers: `a0` (survival, units 1–4), `a1` (units 5–9), `a2` (units 10–12).
- Grammar rows: `[form, tier, unit, ko, en, note(ko), [[zh, jp, ko], …]]`,
  with Korean explanations contrasting Korean word order.

## 한글 pronunciation spelling — `lib/jyutping.js`

`hangul(jp)` converts Jyutping (with tone digits) to 한글, syllable by
syllable, and `tones(jp)` returns the tone numbers. Rule-based, table-driven,
test-pinned.

### Initials
| Jyutping | 한글 | Note |
|---|---|---|
| b d g z | ㅃ ㄸ ㄲ ㅉ | unaspirated; closest to Korean 경음 by timing (VOT) |
| p t k c | ㅍ ㅌ ㅋ ㅊ | aspirated |
| m n l h s | ㅁ ㄴ ㄹ ㅎ ㅅ | |
| f | ㅍ | Korean has no /f/; lossy, shared with p, flagged in the sounds unit |
| ng | ㅇ | lossy; initial ng- is often dropped in colloquial speech |
| j (y) / w | ㅇ + glide vowel | ya→야, yi→이, w+aa→와, w+o→워 |
| gw kw | ㄲ ㅋ + labial glide | aa→ㅘ, a/o→ㅝ, i→ㅟ (꽈 꿕 쾅) |

### Finals
| Jyutping | 한글 | | Jyutping | 한글 |
|---|---|---|---|---|
| aa | ㅏ | | o | ㅗ |
| a (short) | ㅓ | | u | ㅜ |
| e | ㅔ | | oe | ㅓ |
| i | ㅣ | | yu | ㅟ |
| aai / aau | 아이 / 아우 (two syllables) | | ai / au | 어이 / 어우 |
| ei / ou | 에이 / 오우 | | oi / ui | 오이 / 우이 |
| iu | 이우 | | eoi | 어이 |
| -m -n -ng | 받침 ㅁ ㄴ ㅇ | | -p -t -k | 받침 ㅂ ㄷ ㄱ |
| eon / eot | ㅓㄴ / ㅓㄷ | | yun / yut | ㅟㄴ / ㅟㄷ |
| m̩ / ng̩ | 음 / 응 | | oeng / oek | ㅓㅇ / ㅓㄱ |

The -p/-t/-k to 받침 ㅂ ㄷ ㄱ match is exact in kind: both languages leave
these final stops unreleased. This is a teaching highlight.

### Display
- Syllables separated by spaces, one tone digit as a superscript after each:
  `네이⁵ 호우²` for 你好. Digit and syllable are coloured by tone.
- Tone key (Korean labels): 1 높고 평평 · 2 올라감 · 3 중간 평평 ·
  4 낮게 내려감 · 5 낮게 올라감 · 6 낮고 평평, with contour glyphs.
- Where the spelling is lossy (f/p, ng-, tone), the card does not hide it:
  unit 1 teaches it, and `check`-style notes mark known approximations.

## Card

Front: 한글 sound (large, tone-coloured) · 🔊 · Korean meaning hidden.
Back: Korean + English meaning · Jyutping (small) · characters (last) ·
bridge line (`學 학 ↔ hok6 · 校 교 ↔ haau6`) · example sentence with its
own 한글 spelling, Jyutping, 🔊 and Korean translation.
Direction is sound → meaning; a "meaning → sound" review mode is a setting
(Review only — Learn always introduces the sound first). Home shows a tone key
with the 詩 史 試 時 市 事 drill; Unit 1 opens with a "how to read the 한글" card.
Ids are stable (`y:<zh>`, `yg:<unit>:<form>`) so data can be edited without
moving progress. (Revised after review.)

## Study track — release 1 (~300 words, ~40 grammar points)

1. 소리와 성조 (sounds and the six tones; minimal pairs 詩 史 試 時 市 事)
2. 인사와 예의 (greetings, politeness)
3. 숫자·돈·시간 (numbers, money, time)
4. 음식과 주문 (food and ordering)
5. 대중교통 (MTR, bus, taxi)
6. 쇼핑 (shopping, bargaining)
7. 사람과 가족 (people, family, pronouns)
8. 일상 동사 (daily verbs)
9. 형용사 (adjectives)
10. 장소와 길 찾기 (places, directions)
11. 건강과 약국 (health, pharmacy)
12. 광동어다운 말투 (particles 嘅 咗 啲 啦 喎 嘛…)

Grammar (in Korean, contrasting SOV): classifiers, 係/喺/有, negation 唔/冇,
aspect 咗/緊/過, questions 咩/點/邊/幾/乜, 嘅 possessive, 都/都係, 想/要/可以,
comparatives, word order of time and place.

## Speech

`speechLang: ["zh-HK", "yue-HK"]`; the *characters* are spoken (Jyutping is not
readable by TTS). Mandarin voices are never used (they would read 唔該 as "wú gāi"
under a card that says 음 꼬이); with no Cantonese voice the app shows the
Settings-path hint for downloading the Hong Kong voice. (Revised after review.)

## Testing

- `test/jyutping.test.js`: ≥ 60 reference syllables and words pinned
  (e.g. 你好 → 네이⁵ 호우², 學校 → 혹⁶ 하우⁶, 唔該 → 음⁴ 꼬이¹, 多謝 → 또¹ 쩨⁶),
  every initial and final from the tables, w/y glides, gw/kw, syllabic m/ng.
- `test/yue-data.test.js`: every row validates, jp is well-formed (syllables
  + tone digit 1–6), hangul converts without error, ids unique, per-unit counts.
- Korean-app regression: existing tests plus the Playwright behavioural script.
- Playwright pass for `/yue/` at 390×844, light and dark, no console errors.

## Risks and rulings

- Jyutping tones on colloquial words are [Likely] right but need a native
  check; uncertain rows carry `?`. The author of the data is Claude; the user
  is the native reviewer.
- The 한글 spelling is lossy by nature (tones, f/p, ng-). The spec does not
  hide this: unit 1 teaches tones with audio, and every card shows tone digit
  and colour beside the 한글.
- Choosing ㅃ ㄸ ㄲ ㅉ for unaspirated stops is a phonetic judgement; the
  mapping is data-driven (`lib/jyutping.js` tables) so it can be switched to
  ㅂ ㄷ ㄱ ㅈ in one place if the user prefers.
- TTS quality of the `zh-HK` voice is unverified from the build environment.
