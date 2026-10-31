# fluffyLife

All things life, and whatever comes up next: language trainers, a no-opinion news briefing, a trip planner and packing list, and the odd MC script. Each one is a small web app you can add to your iPhone home screen. They are static files only, with no server and no account, and they work offline once installed.

**Live at <https://fluffy731.github.io/fluffyLife/>**

| App | Address | What it's for |
|---|---|---|
| 한자 Korean | [`/korean/`](https://fluffy731.github.io/fluffyLife/korean/) | Korean vocabulary and grammar with hanja beside every Sino-Korean word |
| 粵語 Cantonese | [`/yue/`](https://fluffy731.github.io/fluffyLife/yue/) | Cantonese for a Korean speaker starting from zero |
| 蒙古语 Mongolian | [`/mongolian/`](https://fluffy731.github.io/fluffyLife/mongolian/) | Mongolian for a Mandarin speaker starting from zero |
| English · 영어 | [`/english/`](https://fluffy731.github.io/fluffyLife/english/) | Intermediate-to-advanced English for a Korean speaker |
| Briefing · 뉴스 | [`/news/`](https://fluffy731.github.io/fluffyLife/news/) | Hourly news from free-to-read outlets, opinion removed |
| MC 主持稿 | [`/mc/`](https://fluffy731.github.io/fluffyLife/mc/) | MC script for the 25 October 粤商酒会 / 《粤唱粤强》 final |

The bare address forwards to `/korean/`, so home-screen icons saved from it before the other apps existed keep working.

## How the branches work

`mainFluffy` is the live site. Every push to it runs the tests and then deploys. Each project has its own branch for work in progress:

| Branch | Holds work on |
|---|---|
| `mainFluffy` | The live site: every app |
| `languages` | `korean/`, `yue/`, `mongolian/`, `english/` and their data |
| `travel` | `travel/` |
| `MCscript` | `mc/` |
| `stocks` | `stocks/` |

Every branch is a full copy of the site. A project branch is where that project's folder changes, not a copy with the other apps removed. Deleting another app's files on a project branch would delete them from the live site when the branch is merged.

1. **Work** on the project's branch. Pushes there run the tests but never deploy.
2. **Go live:** open a pull request with base `mainFluffy` and compare set to the project branch. Wait for the green tick, then **Merge**. The site updates in about two minutes.
3. **Sync** the other project branches straight away: open a pull request with the project branch as base and `mainFluffy` as compare, then merge it.
4. **One at a time:** merge one branch, sync, then merge the next. `sw.js`, `index.html` and this README are shared by every app, so two branches editing them is where conflicts come from.

To add a new app: give it its own folder, list its files in `FILES` in `sw.js` so it works offline, add a link in `index.html` and a row in the table above, and put its tests in `test/`.

## Hosting (one-time GitHub setup)

The workflow in `.github/workflows/pages.yml` runs the tests on every push to any branch. It deploys the repo root only from the default branch, whatever that branch is called, so renaming it needs no change to the workflow. Before the first deploy works:

1. Repo **Settings → Pages → Source: GitHub Actions**.
2. Repo **Settings → Environments → github-pages → Deployment branches**: add the default branch by name, with matching capitals. Do this again after any rename, or the deploy is rejected.

The deploy stamps the commit SHA into the service worker, so installed copies pick up changes on their next online launch without anyone bumping a version by hand. Each app keeps its data in its own browser storage on the device. Nothing is sent anywhere, so use each app's backup or export before clearing Safari data or changing phones.

## Install on iPhone

1. Open the app's address in Safari.
2. Share → **Add to Home Screen**.
3. Open it from the home screen once so the offline cache fills. The home-screen app keeps its own data, separate from Safari's.

Add each app separately. Each has its own icon, name and data.

# Languages

## 한자 Korean (`/korean/`)

A personal Korean vocabulary and grammar trainer that shows **hanja (漢字)** and Traditional Chinese beside every Sino-Korean word, so a Chinese reader gets the meaning at a glance. Spaced repetition (SM-2), a TOPIK-ordered study track, and a clock-driven "word of the hour". Static files only: no server, no account, works offline once installed.

### Hourly reminder

iOS does not let a web app set its own alarm, and Shortcuts' *Time of Day* automation only repeats daily, weekly or monthly. So make one **Daily** automation per hour you want to be nudged (say 9:00 through 21:00):

1. Shortcuts → Automation → **+** → **Time of Day** → repeat **Daily** → **Run Immediately**.
2. Action: **Open App** → this app, if it appears in the list after Add to Home Screen.
3. If it does not, use **Open URL** with the page address. That opens Safari, which has separate progress, so the word it shows may differ from the home-screen app's.

The Home tab shows a word of the hour, chosen from the current unit by the clock, so it is the same word for the whole hour and changes on the hour.

### Study track

Units run **Intermediate (TOPIK 3–4) → Advanced (TOPIK 5–6) → Beginner (TOPIK 1–2)**. Each unit has 20 words and 2–3 grammar points. A unit counts as learned once every item has been introduced; the next one unlocks then, but you can jump to any unit from Settings.

- Every word shows its **pronounced form** and Revised Romanisation when a sound change applies (학문 → [항문] *hangmun*), computed by rule in `lib/pron.js`. The 🔊 button reads words and example sentences aloud with the phone's built-in Korean voice (Settings → Accessibility → Spoken Content → Voices → Korean to download a better one).
- **Learn** introduces unseen items of a unit. "Got it" and "Already knew" both schedule the first review for tomorrow; the buttons show the exact interval, and "Already knew" raises the card's ease so later gaps grow faster.
- **Review** shows everything due. Again / Hard / Good / Easy.
- **Quiz** (both apps): *Practice* asks 10 multiple-choice questions from words you have seen, weakest first. *Unit tests* open once every item in a unit has been seen: 15 questions, and 12 right (80%) passes and marks the unit 🏅 (also shown in the Learn picker). Passing records a badge but does not lock or unlock anything. A wrong answer makes that word due in Review now, without the ease penalty "Again" gives; a right answer changes nothing. Best score, pass date and the last 10 attempts are kept per unit and travel with Export/Import. Listening and tone questions use the recorded clips; without clips, or while offline (the clips are not stored on the phone), they are simply not asked.
- **Phrases:** 210 Korean phrases (everyday reactions, polite set phrases, idioms, proverbs and 사자성어 with hanja), 5 in every unit, spread through the words. Learn and Browse have **All · Words · Phrases · Grammar** chips, so you can study one kind at a time; Review stays mixed. Phrases are in `data/phrases-int.js`, `phrases-adv.js`, `phrases-beg.js` (append new rows at the end — ids are positional).
- **Dictionary (Korean app):** Browse search also looks up an offline dictionary of about 50,000 Korean entries (Wiktionary via kaikki.org, CC BY-SA 4.0): hanja, pronounced form, English meanings and an example where Wiktionary has one. Search by 한글, 漢字 (a single hanja shows its 훈음, e.g. 經 지날 경) or English. **+ Add to study** opens the editor prefilled (hanja and meaning) so a word you met in real life joins your reviews. The dictionaries (Korean, Cantonese, English) are built by `scripts/build-dict.mjs` at deploy (rebuilt weekly), downloaded the first time you search, and kept for offline use.
- **Mixed units (Korean):** every unit interleaves hanja and native words, nouns, verbs, adjectives and adverbs (`lib/mix.js`), so you never get a block of 20 nouns. Ids did not change, so reviews are kept, but your current unit may move back to pick up a few unseen verbs or adjectives.
- **Browse** searches by 한글, 漢字, 中文 or English; tap an item to see examples, edit it, or reset its progress. **+ Add** creates your own words or grammar points.
- **Settings** exports and imports a JSON backup. Progress lives in the browser's localStorage only, so export before clearing Safari data.

### Editing the seed data

Words are in `data/vocab-int.js`, `data/vocab-adv.js`, `data/vocab-beg.js` as compact rows:

```
[ko, hanja|null, 中文, english, pos, example, 例句中文, example English, check?]
```

Grammar is in `data/grammar.js`. Ids and units are assigned by **position** (20 words per unit), so inserting a row in the middle shifts later ids and orphans their progress; append new rows at the end of a tier or add them inside the app instead. Entries marked `check: true` (shown with a `?` badge) are ones the author was unsure of.

Installed copies refresh themselves: the deploy stamps the commit SHA into `sw.js`, and the service worker fetches network-first whenever it is online.

## 광동어 · 粵語 — Cantonese for Korean speakers (`/yue/`)

A second home-screen app on the same engine, for a Korean speaker who is a complete beginner and cannot read Chinese characters yet. Everything is explained in Korean.

- **URL:** `https://<user>.github.io/<repo>/yue/` — add it to the home screen separately; it has its own icon (粵), name and progress (`yue.v1`), so it never mixes with the Korean app.
- **한글 pronunciation spelling** on every word and example, computed from Jyutping by `lib/jyutping.js` (never hand-typed). Each syllable is coloured by tone with the tone number as a superscript: 你好 → 네이⁵ 호우². Tone key: 1 높고 평평 · 2 올라감 · 3 중간 평평 · 4 낮게 내려감 · 5 낮게 올라감 · 6 낮고 평평.
- Spelling choices: b d g z → ㅃ ㄸ ㄲ ㅉ (unaspirated), p t k c → ㅍ ㅌ ㅋ ㅊ, short *a* → ㅓ, long *aa* → ㅏ, final -p -t -k → 받침 ㅂ ㄷ ㄱ, *eoi* → 어이 (佢 커이, 水 서이). Lossy by nature: f and p both become ㅍ, and 한글 cannot show tone, so always check the colour/number and listen with 🔊. The tables are in one place in `lib/jyutping.js` if you want ㅂ ㄷ ㄱ ㅈ instead.
- **Bridge to characters:** where she already knows the word by sound, the back of the card pairs each character with its 한국 한자음 (學校 학·교 ↔ 혹·하우). Characters that exist only in Cantonese (唔 冇 咗 嘅 啲 …) show a *광동어에만 있는 글자* badge.
- **사전 (dictionary):** 찾아보기 search also looks up an offline Cantonese dictionary built from CC-CEDICT and CC-Canto (cantonese.org): every hit shows the tone-coloured 한글 spelling, the characters, a **Korean meaning taken from the matching Korean hanja word** (經濟 → 경제) where one exists, and the English. Search by Korean meaning, characters, Jyutping (spaces and tones optional: `mou5man`) or English. **+ 학습에 추가** saves the word as a study card in the current unit.
- **Track:** 12 units, 301 words, 41 grammar points — A0 (1 소리와 성조 · 2 인사 · 3 숫자·돈·시간 · 4 음식), A1 (5 교통 · 6 쇼핑 · 7 가족 · 8 동사 · 9 형용사), A2 (10 장소 · 11 건강 · 12 광동어다운 말투). Rows marked `?` are ones to double-check with a native speaker.
- **🔊 works on silent:** every word, example and grammar point has a recorded clip (Microsoft neural voices: Cantonese HiuGaai, Korean SunHi), generated at each deploy by `scripts/gen_audio.py` and cached between deploys. The iPhone mutes its built-in speech voice on silent but plays audio files. Words you add yourself, or anything without a clip, use the device voice.
- **Speech fallback:** reads the characters with the iPhone's Hong Kong voice (or Android's Cantonese voice). It never falls back to a Mandarin voice, which would teach the wrong sounds. If 🔊 says no voice is installed: 설정 → 손쉬운 사용 → 말하기 콘텐츠 → 음성 → 중국어 → 광둥어.
- **퀴즈:** question types work without reading characters: listen → meaning, 한글 spelling → meaning, meaning → which sound (each option has 🔊), and **which tone (1–6)** for one-syllable words, played from the recorded clip.
- **Review direction:** Settings → 복습 방향 → 뜻 → 소리 turns Review into speaking practice (see the Korean meaning, say it, flip). Home shows a tone key; Unit 1 starts with a card on how to read the 한글.
- Cantonese words live in `data/yue/vocab-a0.js`, `vocab-a1.js`, `vocab-a2.js`, grouped by unit: `[zh, jyutping, 한국어 뜻, English, pos, example zh, example jyutping, example 한국어, check?]`. `npm test` validates every syllable. Ids come from the characters (`y:你好`), so rows can be added, removed or reordered without disturbing progress; flag a loanword with `"loan"` in the last column.

## 蒙古语 · Монгол хэл — Mongolian for Mandarin speakers (`/mongolian/`)

A third home-screen app on the same engine, for a Mandarin + English speaker starting Mongolian from zero. The interface is Simplified Chinese.

- **URL:** `https://<user>.github.io/<repo>/mongolian/` — its own icon (蒙), name and progress (`mn.v1`).
- **Khalkha Mongolian in Cyrillic.** Every word and example shows a grey Latin reading aid computed from the Cyrillic (`lib/mongol.js`); it spells the letters, so the 🔊 recording (Microsoft voice Yesui) is the reference for sounds. Home has a key to the letters a Chinese reader needs help with (ө ү х ц ч ш ж з э ы л), each tappable.
- **Track:** 12 units, about 350 words and phrases, 34 grammar points with notes in Chinese — A0 (1 问候与基本 · 2 数字与时间 · 3 家人与人 · 4 食物与饮料), A1 (5 购物与钱 · 6 交通与方向 · 7 日常动词 · 8 常用形容词), A2 (9 身体与健康 · 10 天气与自然 · 11 家与生活 · 12 社交与文化). Every unit starts with basic words and includes set phrases.
- **Quiz:** meaning, Chinese → Mongolian, **reading practice** (Cyrillic → Latin spelling), listening, and grammar.
- **Content:** rows live in `data/mn/vocab-a0/a1/a2.js` as `[mn, zh, en, pos, exMn, exZh, exEn, check?]`; grammar in `data/mn/grammar.js`. `node scripts/check-data.mjs mn` checks Cyrillic, Simplified Chinese and required fields. Written by Claude; rows marked `?` and the first units deserve a native speaker's check.

## English · 영어 — English for Korean speakers (`/english/`)

A fourth home-screen app on the same engine, for a Korean speaker at intermediate level moving to advanced. Everything is explained in Korean.

- **URL:** `https://<user>.github.io/<repo>/english/` — its own icon (Aa), name and progress (`en.v1`).
- **Track:** 20 units — 중급 B1–B2 (1 일상 대화와 감정 · 2 일과 직장 · 3 학교와 공부 · 4 여행과 교통 · 5 건강과 생활 · 6 쇼핑과 돈 · 7 관계와 성격 · 8 미디어와 기술 · 9 환경과 사회 · 10 의견 말하기), then 고급 C1 (11 비즈니스 회의와 협상 · 12 학술 글쓰기 · 13 경제와 금융 · 14 정치와 법 · 15 과학과 연구 · 16 심리와 행동 · 17 문화와 예술 · 18 뉘앙스 있는 형용사·부사 · 19 관용구와 은유 · 20 토론과 설득). Each unit mixes words, phrases (phrasal verbs, idioms, collocations) and 3 grammar points explained in Korean.
- **Pronunciation:** General American IPA with stress marks, plus a recorded clip (Microsoft voice Jenny) for every word and example; the iPhone's own English voice is the fallback.
- **Usage notes** in Korean where Korean speakers usually slip: Konglish (핸드폰 ✗ → cell phone), ✗/✓ pairs (✗ I'm boring ✓ I'm bored), prepositions, articles, register and near-synonym nuance.
- **사전 (dictionary):** 찾아보기 search also looks up an offline English→Korean dictionary built from Wiktionary's Korean translations (kaikki.org, CC BY-SA 4.0): word, IPA, part of speech, Korean meanings (with hanja where given) and a short English definition. Search in English (exact, then prefix) or Korean. **+ 학습에 추가** saves the word as a study card.
- **Quiz:** meaning, Korean → English, **fill in the blank** (the word removed from its example), listening, and grammar.
- **Content:** `data/en/part1–4.js`; vocab rows `[en, ipa, ko, pos, ex, exKo, note|null, check?]`, grammar rows `[form, unit, ko, note, [[en, ko], …]]`. `node scripts/check-data.mjs en` checks it; `node scripts/en-check.mjs` checks the app in a browser.

# Briefing · 뉴스 — news without paywalls or opinion (`/news/`)

A fifth home-screen app. It reads only free-to-read outlets and never bypasses a paywall.

- **URL:** `https://<user>.github.io/<repo>/news/` — its own icon and name (Briefing).
- **How it works:** every hour GitHub Actions runs `scripts/build-news.mjs`, which reads the outlets' public RSS feeds (`scripts/news-sources.mjs`), drops anything older than 48 hours, removes opinion, commentary, editorials, analysis and columns (by URL, title prefix, feed category and Korean tags such as [사설] [칼럼]), groups the same story across outlets, and writes `news/feed.json`. The phone only reads that file; nothing is summarised by AI.
- **Tabs:** Top · Australia · World · Asia · 한국어 · Construction · Engineering · Property · Regulation. Top is English only. Australia lists Victorian stories first (Melbourne and regional Victoria, tagged *Victoria*), then the rest of Australia; Asia lists stories about Asian countries from any outlet. Sport is left out. Topic tabs combine trade press with general stories matched by keyword.
- **Lean labels:** each outlet carries an approximate left/centre/right label (AllSides, Media Bias/Fact Check; Korean outlets by the usual 진보·중도·보수 split). Every story shows a lean bar, a note when coverage is lopsided, and **Compare N headlines** to read each outlet's headline and open the original. Tabloid-only stories (Daily Mail) are shown only when another outlet also covers them.
- **Korean learning:** in 한국어 stories every word is tappable and looked up in the Korean app's offline dictionary.
- **Checks:** `node --test test/news*.test.js`; `node scripts/build-news.mjs --probe` prints each feed's status; `node scripts/news-check.mjs` checks the app in a browser against a fixture feed.
- **Note:** GitHub pauses scheduled workflows after 60 days without repository activity; any push (or re-enabling the workflow in Actions) restarts the hourly updates.

# Travel (`/travel/`, unlisted)

Left off the home page and out of the table above, and its pages ask search engines not to index them. Open it from its own address or home-screen icon. Unlisted is not private: the address still opens for anyone who has it, and trip files in `travel/trips/` stay readable in this public repo.

Two tabs: **Plan** and **Packing**.

- **Plan** (`/travel/plan.html`) holds trips. Each trip has a name, dates and type, then each day's plans: flights, stays, food, things to do and transport. A plan can have a time, a place that opens in Maps, and notes for booking refs.
- **Opening mid-trip:** during a trip, Plan opens straight onto that trip, scrolled to today.
- **Share** sends the itinerary as text.
- **Pack for this trip** sets the packing list to the trip's type, and to Long trip from 7 nights.
- **Changing dates:** move both dates by the same amount and every plan moves with the trip. Change only one end and plans stay on their dates; any that now fall outside the trip show under "Not on a trip day" until you move them.
- **Back up** (Trips page) now and then, because plans stay in that browser only.
- **Trips from a link:** a backup file saved as `travel/trips/<name>.json` opens with `…/travel/plan.html#import=<name>`. The link loads the trip into that phone's planner, where it can be edited. If the trip is already there, it asks before replacing it. List the name in `travel/trips/index.json` too: the Trips page then offers it under "On the website". That is how a home-screen app gets it, because the app keeps its own storage and tapped links open in Safari. To change a published trip, edit its file and raise its `"rev"` number. Phones holding an older copy then show "Updated on the website · tap to get it", which asks before replacing the phone's copy. This repo is public, so anything in `travel/trips/` can be read by anyone who finds it, and stays in the history even after it's deleted.
- **Packing** is the checklist. Edit the list in `travel/items.js`. Each section has `always` items, plus `long` items that only show in Long trip mode. Tag an item `["text", "overseas domestic"]` to limit it to those trip types (Overseas, Domestic, Road trip). Ticks, and items added on the phone, stay in that browser.
- **Code:** planner logic is in `travel/plan-model.js` and packing logic in `travel/model.js`, both tested in `test/`.

# MC script (`/mc/`)

The MC script for the 25 October 粤商酒会 / 《粤唱粤强》 final: morning in Mandarin and English, afternoon in Traditional Chinese with spoken Cantonese, with sponsors, judges, awards and a prev/next pager. Names typed into its 名单 tab stay in that browser only.

# Stocks (`/stocks/`, unlisted)

Large US, Hong Kong and UK stocks rated by fixed rules, with the rules' own scorecard. A cut-down version of the TradingAgents idea (several analysts argue, a judge rates, every past call is scored) without the dozens of AI calls per stock. Personal research, not financial advice. It is deliberately left off the home page and out of the table above, and the page asks search engines not to index it. Open it from its own address and add it to the home screen.

- **How it works:** with the hourly deploy, `scripts/build-stocks.mjs` fetches two years of daily prices from Yahoo Finance for every stock in `stocks/universe.js` and for the S&P 500, Hang Seng and FTSE 100, then writes `stocks/feed.json`. It refetches only when the feed is over 3 hours old. Today's bar is left out until that market has closed.
- **The rules** (`stocks/model.js`): four analysts each score one angle: Trend (200- and 50-day averages), Momentum (12 months leaving out the last, and 3 months), Against the index (6 months) and Risk (stretched RSI, distance from the 50-day average and the 52-week high, volatility). Their sum is the rating, from Buy at +4 or more to Sell at −4 or less. A stock without enough history, or a market whose index could not be fetched, shows **Review**, never a Hold.
- **Scorecard:** the same rules are replayed every 5 sessions over the past year, each call using only the prices known on its day. Each call is scored over the next 20 sessions from the following close, against its own index. Because the list is today's largest companies, the fair test is Buy against Sell, not against the index.
- **Daily note:** add a repository secret `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions) and one short note is written by Claude Haiku for each completed US session, from the ratings only. It costs well under a cent a day. Without the secret there is no note and nothing else changes.
- **Edit the list:** add or remove rows in `stocks/universe.js`, using Yahoo symbols (`0700.HK`, `AZN.L`). A symbol Yahoo does not know shows under "Not fetched".
- **Checks:** `node --test test/stocks*.test.js`; `node scripts/build-stocks.mjs --force` builds the feed locally.

# Development

No build step. Serve the folder with any static server to try it locally.

```
npm test                                   # unit tests: scheduler, track, storage, Korean & Cantonese data, Jyutping engine
node scripts/snapshot.mjs --check          # Korean app HTML identical to the golden snapshot
node scripts/mn-check.mjs                  # Mongolian app behaviour (Chinese UI, Learn chips, quiz, offline)
node scripts/korean-check.mjs              # Korean app behaviour (search IME, dialog, Again keeps progress …)
node scripts/yue-check.mjs                 # Cantonese app: progress isolation, speech fallback, offline
node scripts/update-check.mjs              # a new deploy reaches an installed app on the next open
node scripts/news-check.mjs                # Briefing news app against a fixture feed
```
The three scripts need Playwright; set `PLAYWRIGHT_MODULE` to its `index.mjs` if it is not importable as `playwright`.
