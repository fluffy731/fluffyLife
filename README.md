# 한자 Korean

A personal Korean vocabulary and grammar trainer that shows **hanja (漢字)** and Traditional Chinese beside every Sino-Korean word, so a Chinese reader gets the meaning at a glance. Spaced repetition (SM-2), a TOPIK-ordered study track, and a clock-driven "word of the hour". Static files only: no server, no account, works offline once installed.

## Hosting (one-time GitHub setup)

The workflow in `.github/workflows/pages.yml` runs the tests and deploys the repo root on every push to `korean`. Before the first deploy works:

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Repo **Settings → Environments → github-pages → Deployment branches**: add `korean` (the environment is created on the first run and may only allow the default branch).

The Korean app is then at `https://<user>.github.io/<repo>/korean/` and the Cantonese app at `…/yue/`. The bare `https://<user>.github.io/<repo>/` forwards to `/korean/`, so home-screen icons saved from the old address keep working with their progress. The deploy stamps the commit SHA into the service worker, so installed copies pick up changes on their next online launch without anyone bumping a version by hand.

## Install on iPhone

1. Open the hosted page (`…/korean/`) in Safari.
2. Share → **Add to Home Screen**.
3. Open it from the home screen once so the offline cache fills. The home-screen app keeps its own progress, separate from Safari's.

### Hourly reminder

iOS does not let a web app set its own alarm, and Shortcuts' *Time of Day* automation only repeats daily, weekly or monthly. So make one **Daily** automation per hour you want to be nudged (say 9:00 through 21:00):

1. Shortcuts → Automation → **+** → **Time of Day** → repeat **Daily** → **Run Immediately**.
2. Action: **Open App** → this app, if it appears in the list after Add to Home Screen.
3. If it does not, use **Open URL** with the page address. That opens Safari, which has separate progress, so the word it shows may differ from the home-screen app's.

The Home tab shows a word of the hour, chosen from the current unit by the clock, so it is the same word for the whole hour and changes on the hour.

## Study track

Units run **Intermediate (TOPIK 3–4) → Advanced (TOPIK 5–6) → Beginner (TOPIK 1–2)**. Each unit has 20 words and 2–3 grammar points. A unit counts as learned once every item has been introduced; the next one unlocks then, but you can jump to any unit from Settings.

- Every word shows its **pronounced form** and Revised Romanisation when a sound change applies (학문 → [항문] *hangmun*), computed by rule in `lib/pron.js`. The 🔊 button reads words and example sentences aloud with the phone's built-in Korean voice (Settings → Accessibility → Spoken Content → Voices → Korean to download a better one).
- **Learn** introduces unseen items of a unit. "Got it" and "Already knew" both schedule the first review for tomorrow; the buttons show the exact interval, and "Already knew" raises the card's ease so later gaps grow faster.
- **Review** shows everything due. Again / Hard / Good / Easy.
- **Browse** searches by 한글, 漢字, 中文 or English; tap an item to see examples, edit it, or reset its progress. **+ Add** creates your own words or grammar points.
- **Settings** exports and imports a JSON backup. Progress lives in the browser's localStorage only, so export before clearing Safari data.

## Editing the seed data

Words are in `data/vocab-int.js`, `data/vocab-adv.js`, `data/vocab-beg.js` as compact rows:

```
[ko, hanja|null, 中文, english, pos, example, 例句中文, example English, check?]
```

Grammar is in `data/grammar.js`. Ids and units are assigned by **position** (20 words per unit), so inserting a row in the middle shifts later ids and orphans their progress; append new rows at the end of a tier or add them inside the app instead. Entries marked `check: true` (shown with a `?` badge) are ones the author was unsure of.

Installed copies refresh themselves: the deploy stamps the commit SHA into `sw.js`, and the service worker fetches network-first whenever it is online.

## Development

```
npm test        # node --test: scheduler, track, storage, data validation
```

No build step. Serve the folder with any static server to try it locally.

## 광동어 · 粵語 — Cantonese for Korean speakers (`/yue/`)

A second home-screen app on the same engine, for a Korean speaker who is a complete beginner and cannot read Chinese characters yet. Everything is explained in Korean.

- **URL:** `https://<user>.github.io/<repo>/yue/` — add it to the home screen separately; it has its own icon (粵), name and progress (`yue.v1`), so it never mixes with the Korean app.
- **한글 pronunciation spelling** on every word and example, computed from Jyutping by `lib/jyutping.js` (never hand-typed). Each syllable is coloured by tone with the tone number as a superscript: 你好 → 네이⁵ 호우². Tone key: 1 높고 평평 · 2 올라감 · 3 중간 평평 · 4 낮게 내려감 · 5 낮게 올라감 · 6 낮고 평평.
- Spelling choices: b d g z → ㅃ ㄸ ㄲ ㅉ (unaspirated), p t k c → ㅍ ㅌ ㅋ ㅊ, short *a* → ㅓ, long *aa* → ㅏ, final -p -t -k → 받침 ㅂ ㄷ ㄱ, *eoi* → 어이 (佢 커이, 水 서이). Lossy by nature: f and p both become ㅍ, and 한글 cannot show tone, so always check the colour/number and listen with 🔊. The tables are in one place in `lib/jyutping.js` if you want ㅂ ㄷ ㄱ ㅈ instead.
- **Bridge to characters:** where she already knows the word by sound, the back of the card pairs each character with its 한국 한자음 (學校 학·교 ↔ 혹·하우). Characters that exist only in Cantonese (唔 冇 咗 嘅 啲 …) show a *광동어에만 있는 글자* badge.
- **Track:** 12 units, 301 words, 41 grammar points — A0 (1 소리와 성조 · 2 인사 · 3 숫자·돈·시간 · 4 음식), A1 (5 교통 · 6 쇼핑 · 7 가족 · 8 동사 · 9 형용사), A2 (10 장소 · 11 건강 · 12 광동어다운 말투). Rows marked `?` are ones to double-check with a native speaker.
- **🔊 works on silent:** every word, example and grammar point has a recorded clip (Microsoft neural voices: Cantonese HiuGaai, Korean SunHi), generated at each deploy by `scripts/gen_audio.py` and cached between deploys. The iPhone mutes its built-in speech voice on silent but plays audio files. Words you add yourself, or anything without a clip, use the device voice.
- **Speech fallback:** reads the characters with the iPhone's Hong Kong voice (or Android's Cantonese voice). It never falls back to a Mandarin voice, which would teach the wrong sounds. If 🔊 says no voice is installed: 설정 → 손쉬운 사용 → 말하기 콘텐츠 → 음성 → 중국어 → 광둥어.
- **Review direction:** Settings → 복습 방향 → 뜻 → 소리 turns Review into speaking practice (see the Korean meaning, say it, flip). Home shows a tone key; Unit 1 starts with a card on how to read the 한글.
- Cantonese words live in `data/yue/vocab-a0.js`, `vocab-a1.js`, `vocab-a2.js`, grouped by unit: `[zh, jyutping, 한국어 뜻, English, pos, example zh, example jyutping, example 한국어, check?]`. `npm test` validates every syllable. Ids come from the characters (`y:你好`), so rows can be added, removed or reordered without disturbing progress; flag a loanword with `"loan"` in the last column.

## Development checks

```
npm test                                   # unit tests: scheduler, track, storage, Korean & Cantonese data, Jyutping engine
node scripts/snapshot.mjs --check          # Korean app HTML identical to the golden snapshot
node scripts/korean-check.mjs              # Korean app behaviour (search IME, dialog, Again keeps progress …)
node scripts/yue-check.mjs                 # Cantonese app: progress isolation, speech fallback, offline
node scripts/update-check.mjs              # a new deploy reaches an installed app on the next open
```
The three scripts need Playwright; set `PLAYWRIGHT_MODULE` to its `index.mjs` if it is not importable as `playwright`.
