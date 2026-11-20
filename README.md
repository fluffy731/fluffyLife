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
| A Night to Shine MC | [`/shine/`](https://fluffy731.github.io/fluffyLife/shine/) | Two-MC script (Solomon English, Wade 普通话, for now) for She Rises' 13 November black-tie Christmas night |
| 影 Films | [`/films/`](https://fluffy731.github.io/fluffyLife/films/) | Good Hong Kong, Chinese, Korean and English-language films to watch, by place, era and genre |

The bare address forwards to `/korean/`, so home-screen icons saved from it before the other apps existed keep working.

## Moving around like an iPhone app

The home-screen apps are single pages, so the browser's history knew nothing of their sheets and screens, and iOS's back swipe had nothing to go back to. `lib/nav.js` (with `lib/nav.css`) gives them the usual iPhone behaviour:

- **Back.** An open sheet or drill-in screen (a stock, a place, a film, a full list, a person's page, a song, the add form, a quiz result) is a *level*: opening one adds a history entry (same address, so apps that use the `#hash` are untouched). The browser's Back, iOS's own edge swipe, or the app's swipe from the left edge closes the top level. Tabs are not levels, so Back at the root does nothing, as on a tab-bar app. A quiz in progress is not a level either, so a stray swipe can't abandon it.
- **Swipe down** closes a sheet, only from the top of its content so scrolling still works.
- **Pull down** at the top of a screen refreshes it (Films, Spots Today, Briefing, Stocks, and Home in the study apps; not on flashcards, where a pull means something else).
- **Tap the tab you're on** to scroll to the top.
- **Where.** Korean, Cantonese, Mongolian and English (one engine, `app.js`), Briefing, Stocks, Films, Spots. Travel and Builder get swipe-down on their sheets and tab re-tap only, because they already navigate by the `#hash` and a history-backed sheet would fight it.
- **Wiring an app:** `nav.watchDialog(dialog, { close, swipeDown: true })` for a `<dialog>`, `nav.push(key, onBack)` / `nav.release(key)` for a screen, `nav.installEdgeSwipe()`, `nav.pullToRefresh(window, fn)`, `nav.onTabReselect(bar, selector)`, and link `../lib/nav.css`.
- **Tests and limits:** the bookkeeping and thresholds are unit-tested (`test/nav.test.js`); the gestures are checked in Chromium with touch emulation (`scripts/films-check.mjs`, `scripts/spots-check.mjs`), which is not an iPhone. iOS's own edge swipe cancels the touch and fires `popstate`; the layer ignores a cancelled touch so the two never both go back, but only a real device confirms that.

## How the branches work

`mainFluffy` is the live site. Every push to it runs the tests and then deploys. Each project has its own branch for work in progress:

| Branch | Holds work on |
|---|---|
| `mainFluffy` | The live site: every app |
| `languages` | `korean/`, `yue/`, `mongolian/`, `english/` and their data |
| `travel` | `travel/` |
| `builder` | `builder/` and `docs/builder/` |
| `foreman` | `foreman/` (also carries `builder/` until it is merged) |
| `MCscript` | `mc/` |
| `NightToShine` | `shine/` |
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

**Look.** The Korean, Cantonese and English apps share `metro.css` (November 2026). Each card reads like a metro station sign, and Home draws your study track as a metro line: tap any station to open that unit in Learn. Each app has its own line colour: Korean is Seoul Line 2 green, Cantonese is MTR red and English is Seoul Line 1 blue. The bottom bar keeps four tabs, and **More** slides up a sheet with the rest. Korean keeps Home, Review, Songs and Browse on the bar, with Learn, Quiz and Settings under More. Cantonese and English keep Home, Learn, Review and Quiz; Cantonese has Songs, Browse and Settings under More, and English has Browse and Settings. Light and dark follow the phone, or Settings → Theme. The Mongolian app keeps `style.css`. Headwords and names are set in [Pretendard](https://github.com/orioncactus/pretendard) ExtraBold by Kil Hyung-jin (SIL Open Font License 1.1, `fonts/Pretendard-LICENSE.txt`), shipped unmodified and cached for offline use. The design record is `DESIGN.md` (the system), `PRODUCT.md` (who the apps are for) and `docs/design/language-apps.md` (the direction).

## 한자 Korean (`/korean/`)

A personal Korean vocabulary and grammar trainer that shows **hanja (漢字)** and Traditional Chinese beside every Sino-Korean word, so a Chinese reader gets the meaning at a glance. Spaced repetition (FSRS), a TOPIK-ordered study track, and a clock-driven "word of the hour". Static files only: no server, no account, works offline once installed.

### Hourly reminder

iOS does not let a web app set its own alarm, and Shortcuts' *Time of Day* automation only repeats daily, weekly or monthly. So make one **Daily** automation per hour you want to be nudged (say 9:00 through 21:00):

1. Shortcuts → Automation → **+** → **Time of Day** → repeat **Daily** → **Run Immediately**.
2. Action: **Open App** → this app, if it appears in the list after Add to Home Screen.
3. If it does not, use **Open URL** with the page address. That opens Safari, which has separate progress, so the word it shows may differ from the home-screen app's.

The Home tab shows a word of the hour, chosen from the current unit by the clock, so it is the same word for the whole hour and changes on the hour.

### Study track

Units run **Intermediate (TOPIK 3–4) → Advanced (TOPIK 5–6) → Beginner (TOPIK 1–2)**: 28 + 14 + 12 units, 1,080 words in all. Each unit has 20 words and 1–3 grammar points. Intermediate units 21–28 and Beginner units 9–12 (added October 2026) are everyday concrete words: cooking, handling, body and housework verbs; household objects, the body, food, animals, colours and textures. Most are native words, which have no hanja to lean on. A unit counts as learned once every item has been introduced; the next one unlocks then, but you can jump to any unit from Settings.

- Every word shows its **pronounced form** and Revised Romanisation when a sound change applies (학문 → [항문] *hangmun*), computed by rule in `lib/pron.js`. The 🔊 button reads words and example sentences aloud with the phone's built-in Korean voice (Settings → Accessibility → Spoken Content → Voices → Korean to download a better one).
- **Learn** introduces unseen items of a unit. "Got it" schedules the first review for tomorrow (first sight is not a recall test); "Already knew" uses FSRS's Easy, about a week. The buttons show the exact interval.
- **Scheduling (all four language apps):** [FSRS](https://github.com/open-spaced-repetition/ts-fsrs) (MIT, vendored in `lib/vendor/ts-fsrs.js`, wrapped by `lib/fsrs.js`) replaced SM-2 in October 2026. In the open-spaced-repetition benchmark of about 10,000 Anki users it predicts forgetting far better than SM-2, so it asks for fewer reviews for the same recall (target 90%). Progress saved under SM-2 converts the first time each card is graded: stability from its interval, difficulty from its ease. Nothing is reset. Again still leaves a card due now so it comes back in the same session.
- **Leeches:** a card missed 8 times after being learned (Anki's threshold) is flagged 🩹. Review shows a tip above it, and Browse gets a 🩹 chip listing them, so you can edit the card with a note, a memory trick or your own example. A leech stays in Review as normal.
- **Review** shows everything due. Again / Hard / Good / Easy.
- **Quiz** (both apps): *Practice* asks 10 multiple-choice questions from words you have seen, hardest first (highest FSRS difficulty). *Unit tests* open once every item in a unit has been seen: 15 questions, and 12 right (80%) passes and marks the unit 🏅 (also shown in the Learn picker). Passing records a badge but does not lock or unlock anything. A wrong answer makes that word due in Review now, without the lapse "Again" records; a right answer changes nothing. Best score, pass date and the last 10 attempts are kept per unit and travel with Export/Import. Listening and tone questions use the recorded clips; without clips, or while offline (the clips are not stored on the phone), they are simply not asked.
- **Phrases:** 270 Korean phrases (everyday reactions, polite set phrases, idioms, proverbs and 사자성어 with hanja), 4–6 in every unit, spread through the words. Learn and Browse have **All · Words · Phrases · Grammar** chips, so you can study one kind at a time; Review stays mixed. Phrases are in `data/phrases-int.js`, `phrases-adv.js`, `phrases-beg.js` (append new rows at the end — ids are positional).
- **Dictionary (Korean app):** Browse search also looks up an offline dictionary of about 229,000 Korean entries (222,931 from the four sources below, 5.7 times the 39,162 it had from Wiktionary alone, plus about 6,000 slang and new-word rows, November 2026): hanja, pronounced form, English meanings and an example sentence where the source has one. Search by 한글, 漢字 (a single hanja shows its 훈음, e.g. 經 지날 경) or English. It merges four open sources, most trusted first; a later source only adds words the earlier ones lack, or the same spelling with different hanja (사과 沙果 apple, 謝過 apology):
  1. **Wiktionary** via kaikki.org (CC BY-SA 4.0): English glosses with English-translated examples.
  2. **한국어기초사전**, the National Institute of Korean Language learner's dictionary (CC BY-SA 2.0 KR): about 56,000 words, idioms and proverbs with English equivalents, hanja and a Korean example sentence.
  3. **[Kengdic](https://github.com/garfieldnate/kengdic)** by Joe Speigle (MPL 2.0 / LGPL): about 100,000 Korean–English entries. It is a rougher list, so it ranks below the Institute; phrases of three or more words and modifier forms (-는, -적인) are left out.
  4. **표준국어대사전**, the Institute's standard dictionary (CC BY-SA 2.0 KR): about 100,000 everyday Sino-Korean words (no specialist field, no names) with hanja and a short **Korean definition** (shown in Korean, not translated). It also fills in hanja for words the other sources give without it, when the spelling is only one Sino-Korean word (엽록체 → 葉綠體). Its examples are left out: some are quoted from publications and are not openly licensed.

  **Slang and new words** sit on top as extra rows, each labelled **(slang)**, **(vulgar slang)**, **(derogatory slang)** or **(new word)**, so 고구마 keeps "sweet potato" and gains "(slang) a frustrating situation". Search **slang** in English to list some.
  - `scripts/data/slang-ko.tsv`: about 160 words written for this app with an English meaning and an example sentence (대박, 갑분싸, 킹받다, 내돈내산, ㄹㅇ, 개-, -린이…). Add a row to add a word.
  - `scripts/data/urimalsaem-slang.tsv`: about 5,700 words from **우리말샘**, the Institute's open dictionary (CC BY-SA 2.0 KR), with Korean definitions: words it marks as vulgar (속되게 이르는 말), derogatory (낮잡아 이르는 말) or students' and internet slang (은어), and words coined since 2000 that the standard dictionary lacks (국룰, 근자감, 남사친). Trade jargon, names and specialist terms are left out. 우리말샘 is 1.8 GB, so the deploy does not download it: rerun `node scripts/build-dict.mjs slang <dir>` on a clone with `opendict/` and `stdict/` to refresh the file.
  - Wiktionary senses tagged slang, vulgar, derogatory or neologism get the same labels.

  The Institute's XML comes from the [spellcheck-ko/korean-dict-nikl](https://github.com/spellcheck-ko/korean-dict-nikl) mirror of its "download all" files. The Korean file is about 21 MB (about 7 MB over the network, compressed; it was 3.4 MB). **+ Add to study** opens the editor prefilled (hanja and meaning) so a word you met in real life joins your reviews. The dictionaries (Korean, Cantonese, English) are built by `scripts/build-dict.mjs` at deploy (rebuilt weekly), downloaded the first time you search, and kept for offline use.
- **Mixed units (Korean):** every unit interleaves hanja and native words, nouns, verbs, adjectives and adverbs (`lib/mix.js`), so you never get a block of 20 nouns. Ids did not change, so reviews are kept, but your current unit may move back to pick up a few unseen verbs or adjectives.
- **Pictures:** about 250 concrete words (verbs, objects, the body, food, animals, colours) show a pictogram on the back of the card and beside the word in Browse. Hanja words such as 經濟 get none on purpose: the hanja is the hook there. Pictograms are [Mulberry Symbols](https://mulberrysymbols.org) by Steve Lee (CC BY-SA 4.0, credits in `pics/ko/CREDITS.md`), each checked by eye against its word; a few gaps use an unambiguous emoji. The map is `data/pics-ko.js`, keyed by the Korean word, so a word you add yourself gets its picture too. A picture is downloaded the first time its card is shown and kept for offline use after that.
- **Browse** searches by 한글, 漢字, 中文 or English; tap an item to see examples, edit it, or reset its progress. **+ Add** creates your own words or grammar points.
- **Settings** exports and imports a JSON backup. Progress lives in the browser's localStorage only, so export before clearing Safari data.
- **♪ Songs (Korean app; Cantonese app below):** learn from the songs you listen to. Each line shows the Korean (🔊), its romanisation, Traditional Chinese and English; tap a line for its grammar points and words (with hanja), and **+ Add to study** puts any of them into your reviews (first review tomorrow, like *Got it*). A grammar point the app already teaches schedules the app's own card instead of a duplicate.
  - **Lyrics stay on the phone.** This repo and the site are public, so lyrics and their translations are never committed or published. The phone fetches lyrics from [LRCLIB](https://lrclib.net) (free, no account), or you paste them; songs are kept in the phone's IndexedDB and travel in Export/Import. LRCLIB could not be reached from the build container, so its first real test is on the phone; pasting always works.
  - **Translation** uses the Claude API with **your own key** (Settings → Songs). The key stays on the phone and is never in a backup; set a monthly spend limit on it in the Anthropic Console. Claude Haiku 5.5 is the default, at roughly US$0.003–0.01 a song; Sonnet 5.5 (about US$0.07) and Opus 5.5 (about US$0.13) write richer notes. Repeated lines (choruses) are translated once, and a translated song opens offline at no further cost.
  - **Import list** takes `Title – Artist` lines (also `-`, `—` or a tab) or a CSV with *title* and *artist* columns, such as a Google Takeout YouTube Music export. Imported songs come ticked, so one tap on *Translate N songs* fetches their lyrics and translates them all, showing the total estimate first.
  - **Long batches:** translating runs inside the app, and iPhone pauses a home-screen app when the screen locks or you switch away, so keep the Songs screen open until it finishes. The app asks iOS to keep the screen on while a batch runs (Screen Wake Lock). Each song is saved as soon as it's done. Ticks are forgotten when the app closes, so with nothing ticked the button covers every song still to translate (*Translate all N untranslated*), and resuming takes one tap. **Stop after this song** ends a batch early. A song that fails says why when you open it. Failed lyrics searches never reach Claude, so they cost nothing. API errors (rejected key, rate limit, server error) are not expected to be charged. A reply that was cut off, unreadable or too long is charged like any reply, and a mid-reply cut is charged for what was generated. That's cents at most on Haiku.
  - **Find a song:** the box above the list matches a title, an artist, a Korean lyric line or its Chinese or English translation, and grammar forms found in translated songs. Case and spaces don't matter, so 볼때마다 finds 볼 때마다. When the match is in the lyrics, the line appears under the song. The chips narrow the list to All, Translated, To translate or Needs attention.
  - **Wrong lyrics:** LRCLIB sometimes returns an English version first. The app takes the first result with Korean lines. If there is none, it marks the song *no Korean lyrics* without calling Claude, and batches skip it. On any song, **Find other lyrics** lists every result tagged *Korean · N lines*, *No Korean* or *No lyrics*, with a first-line preview. You can pick one or paste the lyrics. Changing the lyrics of a translated song asks first, because its translation is removed.
  - **Cantonese app (November 2026):** the same tab, under **More → 노래**, for a native Korean speaker who is a beginner and can't read characters yet. Each line leads with its sound in tone-coloured 한글 (🔊 reads the characters with the Cantonese voice), then Jyutping, the characters and a natural Korean meaning. Tapping a line shows grammar notes in Korean (sentence-final particles, 咗 緊 過, 唔 冇, colloquial words) and its words with the hanja bridge (掛 괘 ↔ 꽈). **학습에 추가** makes a Cantonese card with the line as its example, or schedules the app's own lesson or word when it already has one (words match on characters and reading, so 好 hou3 isn't taken for 好 hou2). Claude writes the Jyutping and the app turns it into 한글, so nothing is hand-spelt. A line, grammar point or word is marked **?** when its Jyutping is malformed, doesn't pair one syllable per character, or gives a character a reading the app's Cantonese dictionary doesn't list; the 🔊 voice reads the characters, so it is right either way. Her key (Settings → 노래) and songs are kept apart from the Korean app's, even in Safari on the same site (`yue.songs.apiKey`, IndexedDB `fluffy-songs-yue`), and her songs travel in the Cantonese app's own backup. LRCLIB can return a Mandarin version of a song, which looks the same in characters: **다른 가사 찾기** picks another or takes a paste.
  - **Code:** the engine is shared. `songs/view.js` (the tab), `songs/model.js` (lines, list import, the request and reply check, cost, Korean study cards), `songs/lrclib.js`, `songs/claude.js`, `songs/db.js`, and one profile per app with its strings, line display and request: `songs/ko.js` (Korean app, English UI) and `songs/yue.js` (Cantonese app, Korean UI, the Jyutping check). Design: `docs/superpowers/specs/2026-11-15-cantonese-songs-design.md`. The official Anthropic SDK is vendored into `lib/vendor/anthropic-sdk.js` and loaded only when translating; to update it, change the version in `package.json`, then run `npm install --no-save --ignore-scripts esbuild@0.25.12 @anthropic-ai/sdk@<version> && node scripts/vendor-sdk.mjs`.

### Editing the seed data

Words are in `data/vocab-int.js`, `data/vocab-adv.js`, `data/vocab-beg.js` as compact rows:

```
[ko, hanja|null, 中文, english, pos, example, 例句中文, example English, check?]
```

Grammar is in `data/grammar.js`. Ids are assigned by **position**, so inserting a row in the middle shifts later ids and orphans their progress; append new rows at the end of a tier or add them inside the app instead. A tier file grows in **batches**: each batch is mixed and cut into units of 20 on its own, after the units before it, so adding words never moves an existing word or phrase to another unit. To add a batch, append whole units of words (and 4–6 phrases and at least one grammar point per new unit), then add the old row counts to `CUTS` in `data/vocab.js`. `test/golden/ko-units.json` fails the tests if an existing item changes unit. Entries marked `check: true` (shown with a `?` badge) are ones the author was unsure of.

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

Left off the home page and out of the table above, and its pages ask search engines not to index them. Open it from its own address or home-screen icon. Unlisted is not private: the address still opens for anyone who has it. No trips are published in `travel/trips/`; personal trips live only on the phone (back them up from the Trips page).

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

# Spots (`/spots/`, unlisted)

Where to go in Melbourne now, tonight or tomorrow, what's on, what's new, and a passport of everywhere you've checked in. Left off the home page and out of the table above, and its pages ask search engines not to index them. Unlisted is not private: the address still opens for anyone who has it.

- **Today** (the first tab). **Right now**: two or three one-tap ideas for the time of day, the day of the week (public holidays count as Sundays) and the weather of the next three hours (Open-Meteo's hourly forecast). On a good day (dry, sunny or cloudy, 14° or warmer, under 45 km/h wind): a walk in a park, a trail or bushwalk on weekend mornings, the beach when it's 24° or more and calmer, and a sunset walk in the evening while there's daylight. When rain is likely: a gallery, something fun indoors, cafés and restaurants, and nothing outdoors. Also brunch on a weekend morning, a quick lunch on a weekday, gelato on a hot afternoon, late-night eats, Plan tomorrow before a weekend or holiday, and "Markets on today" or "Comedy tonight" when the listings have some. A place idea opens Explore with the controls set and runs Find, so Today spends no Google calls until you tap. **On today** (Tonight from 5 pm) and **This weekend** (Tomorrow on Saturday and Sunday): events with one-day and short runs first, then last chances and new openings, then the long-running exhibitions; free ones marked; outdoor ones last when rain is likely. Tap one for details, a Google Maps search and Save. **New in town**: openings and event write-ups from the last three weeks, food and drink first, linking to the article.
- **The Today feed** (`spots/feed.json`) is built in the hourly GitHub run by `scripts/build-spots.mjs` from free sources: What's On Melbourne (the City of Melbourne's public search service, asked at most every 3 hours), Eventfinda's RSS, Time Out and Concrete Playground's RSS, Google News searches, Open-Meteo (weather) and Nager.Date (holidays). The last feed, and each source's own listings before merging (`~/.spots-cache`, never published), are restored from the Actions cache first, so a source that fails or is reused keeps its items and is merged afresh with the others. `node scripts/build-spots.mjs --probe` reports each source and what Today would show. Only titles, short excerpts and links are kept, with the source named.

- **Three modes** (Explore). **Now**: the time you have (1 h to half a day), drive or walk; it shows places open now that stay open for the visit, within a drive that leaves time for it. **Late night**: places open at least another hour, within a 15, 30 or 45 min night drive (night roads are faster, so it reaches further); tapped before 9 pm it plans for tonight from 10 pm. **How far** (Now and Late night): a slider from 500 m to 50 km, ending in Any, on top of the time; it says how long that is to drive (and walk, when short) and, when your time is the tighter limit, what the time reaches. **Tomorrow**: a 4- or 5-stop day (breakfast, morning, lunch, afternoon, dinner) around town (a **How far** slider, 500 m to 50 km, 10 km to start) or in one of ten day-trip regions, each stop open at its time, with drive times between stops, **Swap** and **Save the whole day**. All share a budget ($ to $$$$), a **Cuisine** (below) and kinds (Eat, Drink, Coffee, Sights, Activities, Dessert, and for daytime Nature (parks, gardens and walking trails) and Beach; a park or beach with no listed hours counts as open). Tomorrow plans an afternoon outdoors when tomorrow looks good, and indoor stops when it looks wet.
- **Near** (the fourth mode): well-reviewed places around somewhere you're going. Type a venue, address or suburb, or pick a saved place or event; choose how far: a 500 m or 1 km walk, or a 10, 15 (the default) or 20 minute drive (by the travel model, parking included, so less far at peak), or slide to any distance from 500 m to 50 km (a radius in kilometres, whichever way you'd get there), a rating (★ 4.3, 4.5 or 4.7 and up) and a review count (300, 1,000 or 2,000 and up), and the kinds. Google gives each place its average rating and its number of reviews, not how many are five-star, so "great reviews" means an average of at least the rating from at least that many people. Results come by kind, best rated first (more reviews first on a tie), with the walk or drive from where you're going. **★ Top-rated near here** is on every place's sheet, every event's sheet and every saved place or event, and Today puts "Near <venue>" first when a saved event is on today. One search finds the spot (none when it's a saved place), then one per kind.
- **Cuisine.** When Eat is chosen (and always for Tomorrow, where it means lunch and dinner), a Cuisine row offers Any, Cantonese, Chinese, Korean, Japanese, Thai, Vietnamese, Malaysian, Indian, Italian, Greek, Mexican and Middle Eastern; pick several. Each chosen cuisine is its own search ("Korean restaurant"), and places Google types as a different cuisine are dropped, while ones it couldn't type stay (Google's search put them there). Google has no Cantonese type: a Cantonese search asks Google for it by name, and a Chinese place whose name says yum cha, dim sum, Hong Kong, congee or the like is labelled Cantonese; Cantonese and Chinese searches each keep the other's places. Cards and sheets show the cuisine (or Google's own name for the type). Only Eat has cuisines; a café Google types as Italian is still a café. An idea from Today starts with no cuisine and no distance limit.
- **Each place** shows a real photo, price level and range per person, rating, opening hours, drive time and a Google Maps link. Opening it shows Google's review summary where Google offers one (otherwise two review excerpts), and today's and tomorrow's hours.
- **Saved, Check in, Passport.** Save keeps only the place id, name, kind, suburb and position, refreshed after 30 days as Google's terms allow. Saved events (title, venue, date, link) show under **Coming up** until they're over, and on the day Check in offers them first. **Check in** (hold the red button) adds a stamp with a rating, note and your own photo, kept as a 600 px copy. Passport counts stamps, places and suburbs.
- **Google key.** Photos, prices, reviews and hours come from Google Places through the Maps JavaScript API, with the owner's own key pasted into Settings. The key stays on the phone: never in the repo, never in a backup. Settings has the setup steps: a Google Cloud project with billing on, Maps JavaScript API and Places API (New) enabled, a key restricted to `https://fluffy731.github.io/*` and those two APIs, and a daily quota cap. Google's free monthly allowance per service covers a few searches a day. **Test** lists which fields came back. Without a key, **Sample places** fills every screen with made-up places.
- **Drive times** are estimates: straight-line distance × 1.3 for roads, plus 5 min to park, at peak, daytime or night speeds (`spots/model.js`). The Google Maps link gives the real route.
- **Settings** is the gear in the header. **Back up** saves saved places, saved events, stamps and photos as one JSON file; **Restore** merges a backup in without duplicates.
- **Code:** logic in `spots/model.js` (tested in `test/spots-model.test.js`); Today's logic in `spots/today.js` (`test/spots-today.test.js`) and its screen in `spots/todayview.js`; the feed builder `scripts/build-spots.mjs` (`test/spots-feed.test.js`, with recorded samples of each source in `test/fixtures/spots/`); the Google adapter `spots/places.js` and sample places `spots/samples.js` (`test/spots-places.test.js`); regions in `spots/regions.js`. Cuisines and distances are in `spots/model.js` (`test/spots-cuisine-distance.test.js`). Browser check: `node scripts/spots-check.mjs` (Today uses a feed made from the recorded samples). Design: `docs/superpowers/specs/2026-11-14-spots-design.md`, and for Today `docs/superpowers/specs/2026-11-15-spots-today-design.md`.

# Builder (`/builder/`, unlisted)

A tracker for Solomon's Victorian Domestic Builder (Unlimited) registration with the Building and Plumbing Commission (BPC). Left off the home page, and its pages ask search engines not to index them. Unlisted is not private: the address still opens for anyone who has it. The repo is public, so it holds only the generic requirements; everything typed in (addresses, referee names, registration numbers) stays in that browser. Back it up with Export backup.

Five tabs:

- **Checklist:** what to do before applying, the qualification, experience evidence, the paperwork still to obtain for each of the three projects (drawings, building permit, inspection records, occupancy permit), technical referee, fit and proper, lodging, and after approval. Steps the public BPC pages do not spell out carry a **Confirm in portal** tag.
- **Projects:** details for the three projects, a flag for any that finished more than 7 years ago, and a grid of the 12 BPC activities against the three projects. Amber means no project shows that activity yet.
- **Referees:** one card per referee with the five steps from asking to seeing the report in your application, each date-stamped when ticked.
- **Folders:** the OneDrive structure, with Mac and Windows commands that create the folders. Project folders take the addresses typed on the Projects tab. A list of the portal's own document slots goes here too, because BPC does not name them publicly.
- **Exam:** set-up steps for the proctored online exam, and study topics taken from BPC's activity list (it has published no syllabus).

- **Content:** edit `builder/data.js`. Ticks key on each item's `key`, not its wording. Requirements and sources are written up in `docs/builder/db-u-requirements.md`; recheck them against the BPC pages before relying on them, because BPC is still rolling its reforms out.
- **Code:** state logic is in `builder/model.js`, tested in `test/builder.test.js`.

# Foreman (`/foreman/`, unlisted)

A walkable 3D study aid for the Victorian domestic builder (unlimited) exam: 18 stages from permits to handover, each with a 3D walk, zoomable labelled detail models, drawings, steps, trades, materials, quotes, inspections and exam cards. Left off the home page, and its pages ask search engines not to index them. Unlisted is not private: the address still opens for anyone who has it. Every fact carries a Verified, Typical or Confirm flag with its source. The repo is public, so no course or quiz text is stored here. Details are in `foreman/README.md`; the engine is in `foreman/engine.js` and each stage is a `foreman/step-NN.js` file with its drawings and cards in `foreman/step-NN-study.js`.

# MC script (`/mc/`)

The MC script for the 25 October 粤商酒会 / 《粤唱粤强》 final: morning in Mandarin and English, afternoon in Traditional Chinese with spoken Cantonese, with sponsors, judges, awards and a prev/next pager. Names typed into its 名单 tab stay in that browser only.

# A Night to Shine MC (`/shine/`)

The two-MC script for She Rises' A Night to Shine, Friday 13 November 2026, Rombe Rooftop. From 10 November Solomon speaks English and Wade speaks Mandarin in simplified Chinese, for now; the `SPEAKER` constant in `shine/data.js` swaps them back. The two-man opener at 6:50 is the exception: it is a Chinese three-act banter where both MCs speak Chinese, so Solomon's lines there carry `{ who: "S" }`. Timings follow the organiser's run sheet of 13 November (the 11 November meeting transcript wins over the 4 November version): guests to seats at 6:45, a warm-up opening, the Goddess Entrance at 7:02 starting on the line Mireille chose, the MC hand-off after Salli and Mireille's bell at 7:17 into Samantha, Gita, the oath, Sheryl at 7:50 and 3–4 overseas video clips, Eric at 8:00 and 8:50, fundraising sales at 8:07, lucky draws at 8:15 (Mireille draws prizes 1–5) and after the 8:42 sales close (Salli draws 6–10), awards at 8:20 (Sheryl presents the Melvin Jones awards, Gita the Long Service Awards), Best Dress by applause at 8:55, November birthdays at 9:05, cake at 9:11, the fundraising total and live band at 9:15.

- **Whose lines:** each MC picks their name at the top of the script. Their own lines show large; the partner's shrink to hand-off cues, and stage directions show in their language only.
- **TBC fields:** names, songs, prizes, prices and the like that are not confirmed yet show in yellow in the script. Tap one to fill it in on the 待填 TBC tab, which counts what is left. Entries stay in that browser; **Copy entries** makes a link (or code) the other MC opens to import them.
- **On the night:** the bar under the title shows the current segment and the minutes left, the pager and a Bluetooth page-turner step through segments, prizes can be ticked off as they are drawn, and the screen is kept awake. Add `?at=19:12` to the address to rehearse at a given time on any day.
- **Edit the script:** everything is in `shine/data.js`; `node --test test/shine.test.js` checks that every `{field}` exists, segments run back to back, Chinese lines use simplified characters, English lines have no Chinese, and both MCs speak in every spoken segment.

# Lions Charity Ball MC script (`/lions/`, unlisted)

The two-MC script and run sheet for the Lions Club of Melbourne Chinese charity ball, Saturday 21 November 2026 at RACV, written from the committee's rundown (`Event_schedule1.xlsx`). Paul (Lai) reads English and Salli reads Mandarin in simplified Chinese, for now; the speaker badge on a line, or **Swap who reads which language** in Edit lines, changes that. It has four tabs:

- **Script:** 13 segments in rundown order (doors, the Lions' entrance, formal opening, concert sessions, sponsor speeches and games, lucky draw and auction, programme close), each with both MCs' lines, stage cues and must-not-miss notes. Each MC picks their name and their own lines show large while the partner's shrink to hand-off cues. Add `?at=19:12` to the address to rehearse at a given time.
- **To fill:** what the rundown does not say (the charity, sponsor speakers, game rules, ticket price, songs, prizes, auction items and so on) shows as a yellow TBC chip in the script. Tap a chip to jump to its field; the tab counts what is left. Only facts from the rundown are pre-filled (the three sponsors); no song, prize or auction item is invented.
- **Run sheet:** the committee's cues as cards (Committee, Sound, Light and LCD in team colours, with a team filter) or as a grid like the spreadsheet.
- **Notes:** the ball chair's pack list, a **To confirm** list of open questions, and every correction made to the original sheet (three evening times the sheet stored as morning times, two missing segment names, spelling).

Everything is editable: script lines (Edit lines), the blanks, the run sheet cells, the checklists, the title, date and venue. Edits are saved in that browser.

**Sharing, as on Night to Shine** (top of the Notes tab). One phone is the master: after changing the script it taps **Publish my version**, which sends the whole sheet, compressed, to a small public relay (ntfy.sh, a room just for this event). Every other phone taps **Sync from master**, which fetches the newest version, applies it in place of that phone's edits, and offers **Undo**. If the relay cannot be reached (venue wifi), Publish copies a link instead (or opens the share sheet): opening the link shows a banner that asks before it applies anything, and **Copy a link to send** and the paste box do the same without the relay. **Reset to the original sheet** brings back `lions/data.js`. A copy saved before the script existed keeps its edits and gains the script. The relay room name is in this public repo, so anyone who finds it could publish to it; anything that arrives is rebuilt field by field as plain text, size-capped, and never applied without Undo.

Unlisted: left off the home page, and its page asks search engines not to index it. Unlisted is not private: the address still opens for anyone who has it, and the repo is public, so `lions/data.js` holds the committee's schedule, names included.

Where things are: the script and run sheet are in `lions/data.js`; the blanks and rosters are defined in `lions/meta.js`; the logic that needs no DOM (times, the live bar, blanks, the share code, the relay's parts) is in `lions/model.js`. `node --test test/lions.test.js` checks the data (times match the run sheet, every `{blank}` is a field, every English line has a Chinese partner, the Chinese is simplified), the logic and the offline wiring.

# Stocks (`/stocks/`, unlisted)

Large US, Hong Kong and UK stocks rated by fixed rules, with the rules' own scorecard, built for someone new to shares. A cut-down version of the TradingAgents idea (several analysts argue, a judge rates, every past call is scored) without the dozens of AI calls per stock. Personal research, not financial advice.

- **Tabs** (a tab bar along the bottom): Market (below), Watchlist (starred stocks with the day's move, the change since starring, rating changes since the last visit, a count on the tab when there are any; kept in the phone's storage), Ideas (index funds to start with, steady climbers, upgrades, dips in strong stocks, downgrades, each with its reason), Ratings (search, sort including the day's move, a sector filter and rating chips), and Practice (a play-money portfolio). Learn (a glossary of every term on the page, and the Scorecard under "How good are the ratings?") opens from the book button in the header.
- **Market tab** (`stocks/market.js`, the default tab): a period switch (1D, 1M, 3M, 6M, 1Y) that drives everything below it; a card per index (S&P 500, Hang Seng, FTSE 100) with its level, move and a live countdown to the next open or close in the usual weekday hours (holidays not known; tap a card to show only that market); the three indices on one chart as % change, or one index in points, drawn from each index fund's history file, tap or drag to read a day; how many stocks rose and fell and how many sit above their 200-day average; a market map of every stock coloured by its move, grouped by sector or by market (tap a tile to open the stock); the biggest rises and falls; each sector's equal-weight average (tap one for its stocks in Ratings); this week's ratings in each market as a banded bar (tap a band for those stocks); the Australian dollar's rates; and the daily note. The feed carries each index's level, moves and a six-month sparkline for the cards.
- **Each stock:** a two-year price chart (1W to 2Y, 50- and 200-day averages, the index alongside, the range's high and low marked, tap or drag to read a date), a plain-English reading of its figures (`stocks/explain.js`), key figures (52-week range, dividend yield, typical daily move), the rating with its bull and bear cases, and news. The chart's history is a small file per stock in `stocks/history/`, written by the build and loaded only when the stock is opened.
- **Index funds:** one per market (VOO, 2800.HK, ISF.L) in `stocks/universe.js`, rated and charted like the stocks but kept out of the scorecard and the news.
- **Practice:** a practice portfolio with A$10,000 of play money (`stocks/practice.js`): buy and sell any stock or fund at its latest close in Australian dollars, A$5 a trade, compared with the same money in the S&P 500 fund. Saved on the phone. The Scorecard now sits in Learn under "How good are the ratings?".
- **More on each stock:** compare it with any other stock (both as % change, key figures side by side), and see what a fixed amount each month over the past two years would be worth now. The Ratings tab filters by sector.
- **For an Australian reader:** each stock's price also shows in Australian dollars at the day's rate (Yahoo's USDAUD=X, HKDAUD=X and GBPAUD=X), its plain-English reading says what 1,000 put in a year ago would be worth now, and the Watchlist has Back up and Restore (a small JSON file), since iPhone can clear a website's storage after a week unused unless it is on the Home Screen. It is deliberately left off the home page and out of the table above, and the page asks search engines not to index it. Open it from its own address and add it to the home screen.

- **How it works:** with the hourly deploy, `scripts/build-stocks.mjs` fetches two years of daily prices from Yahoo Finance for every stock in `stocks/universe.js` and for the S&P 500, Hang Seng and FTSE 100, then writes `stocks/feed.json`. It refetches only when the feed is over 3 hours old. Today's bar is left out until that market has closed.
- **The rules** (`stocks/model.js`): four analysts each score one angle: Trend (200- and 50-day averages), Momentum (12 months leaving out the last, and 3 months), Against the index (6 months) and Risk (stretched RSI, distance from the 50-day average and the 52-week high, volatility). Their sum is the rating, from Buy at +4 or more to Sell at −4 or less. A stock without enough history, or a market whose index could not be fetched, shows **Review**, never a Hold.
- **Scorecard:** the same rules are replayed every 5 sessions over the past year, each call using only the prices known on its day. Each call is scored over the next 20 sessions from the following close, against its own index. Because the list is today's largest companies, the fair test is Buy against Sell, not against the index.
- **News:** each stock's page lists up to six headlines from the last week that Yahoo Finance has tagged with the company. For Hong Kong and UK stocks it also accepts articles tagged with their US-listed shares (the third column in `stocks/universe.js`), since Yahoo tags few articles with those exchanges' symbols. Opinion pieces are left out with the Briefing app's filter. News is shown, never rated: past headlines cannot be replayed, so a rating that used them could not be scored honestly.
- **Daily note:** add a repository secret `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions) and one short note is written by Claude Haiku for each completed US session, from the ratings and the named stocks' headlines. It costs well under a cent a day. Without the secret there is no note and nothing else changes.
- **Edit the list:** add or remove rows in `stocks/universe.js`, using Yahoo symbols (`0700.HK`, `AZN.L`). A symbol Yahoo does not know shows under "Not fetched".
- **Moving between stocks:** a stock opened from a list, card or the map has ‹ › buttons (and a sideways swipe, or the arrow keys) to step to the next one in that list without closing it.
- **Checks:** `node --test test/stocks*.test.js`; `node scripts/build-stocks.mjs --force` builds the feed and the chart histories locally. Each deploy leaves a "Stocks feed" notice on its run with the build summary.

# Films (`/films/`)

Something good to watch in a free evening: Hong Kong, Chinese, Korean and English-language films by place, era and genre, with a watchlist. It is on the Metro line look of the study apps (`DESIGN.md`) as its fourth line, Seoul Line 5 purple, with 影 on the roundel.

- **Browse** (the first tab). Choose a place (All, Hong Kong 香港, Chinese 華語, Korean 한국, English), ride the era line (Classics, then each decade to the 2020s; tap a station again for all eras; Hong Kong's 1980s and 1990s are the Golden age interchange), and pick a genre (TMDB's genres plus Martial arts, from TMDB's keywords; a genre shows once it has 4 films). Rows: **Best rated**, **Most popular**, **Crowd-pleasers** (popular films rated below their shelf's middle), **Popular right now** (this week on TMDB, with no era chosen), then the biggest genres. Each film shows in one row only (Best rated, then Crowd-pleasers, Most popular, Popular right now and the genres take turns claiming them), and **All** opens a row's full ranking as a grid with a sort switch. **Surprise me** picks one good film you haven't seen from the shelf; **Another** draws again, and between them they suggest every film on the shelf once before repeating any. The choices are remembered.
- **Why each list is ranked within its place.** TMDB's users lean towards English-language films, so one ranking across everything would bury Hong Kong and Chinese films. Best rated weighs a film's average by how many rated it (a 9.0 from 15 votes doesn't beat an 8.4 from 20,000), against its own place's average; Most popular is how many people rated it; under All the places take turns. Mainland audiences mostly rate on Douban, which has no free data, so each Chinese or Hong Kong film links to a Douban search.
- **A film's sheet** opens on a station sign: poster, the title in its own script with the English title, year, place (Mainland or Taiwan for Chinese films), runtime, genres, rating and how many rated it, its rank in its place, director, cast and plot. **Want to watch**, **Seen it**, the trailer on YouTube, the TMDB page, and **More like this** (same director, lead actors, or place, genre and decade).
- **Search** (title in English or the original script, actor or director; case and accents don't matter) covers the catalogue. Typing a name lists **People** first (the person, whether Director, Actor or both, and how many films of theirs are in the list), then the films, each saying why it came up ("Directed by …", "With …") unless its title matched. Every typed word must be in the name, in any order ("leung tony" finds Tony Leung). Tap a person, or a name on a film's sheet (the director and the first six billed actors), for their films, best known first; Back returns to the search. The list holds each film's first six billed actors, so a supporting actor can be found; More like this still goes by the first three. Names are TMDB's English ones, so a Chinese or Korean name doesn't match.
- **Refresh** (the arrow at the top right, or pull down). The list is rebuilt weekly, so most taps find nothing new and say "Already up to date"; a newer list says "Updated" and replaces what's on screen at once; a failed fetch (offline) keeps the list you have. Coming back to the app after an hour away looks for a newer list quietly. **Watchlist** lists Want to watch and Seen, newest first, and keeps each film's details, so it still shows a film after it leaves the weekly list. **Settings** (under More): theme, Hide films I've seen, **Back up** and **Restore** (one JSON file, merged without duplicates; iPhone can clear a website's storage), when the catalogue was built, and TMDB's notice.
- **How it works.** With the hourly deploy, `scripts/build-films.mjs` rebuilds `films/feed.json` once a week, or at once when its rules change, and otherwise restores the last one and stops in seconds. For each place and decade it asks TMDB's discover service for up to 100 films by rating (at least 20 votes, 300 for English) and 100 by number of ratings (at least 10), plus 20 popular right now per place, then each film's details (cached up to 30 days in `~/.films-cache`, never published). A Hong Kong and Mainland co-production is on both shelves; an English-language US–China film is English only. A build that comes back with fewer than half the films keeps the last feed. The log shows counts, field coverage and one sample film, never plots or the key.
- **One-time setup.** Make a free account at themoviedb.org, request an API key for personal, non-commercial use (Settings → API), and add it as the repository secret `TMDB_API_KEY` (Settings → Secrets and variables → Actions). The short API key and the long read access token both work. Without it the build skips and the app says the list arrives once the key is added.
- **TMDB's terms.** Free for non-commercial use with credit: Settings shows "This product uses the TMDB API but is not endorsed or certified by TMDB". TMDB's logo shows beside it once its official file is saved as `films/tmdb.svg` (download it from TMDB's logos and attribution page and commit it; the build never fetches it). Data is rebuilt weekly with this week's ratings and popularity, details are kept at most 30 days, a feed no build has refreshed in 150 days is removed, only TMDB's API is called, and no TMDB content goes to an AI model.
- **Checks:** `node --test test/films*.test.js`; `node scripts/films-check.mjs` (the app against a feed built from the TMDB-shaped samples in `test/fixtures/films/`, whose plots are our own); `node scripts/build-films.mjs --probe` builds into the cache folder and prints the summary.
- **Code:** places, eras, rankings, Surprise me, More like this and search in `films/model.js` (`test/films-model.test.js`, and people search and refresh in `test/films-people.test.js`), shared with the build; the build in `scripts/build-films.mjs` (`test/films-build.test.js`); the phone's watchlist and backup in `films/store.js` (`test/films-store.test.js`); the screens in `films/films.js` and `films/films.css` on `metro.css`. Design: `docs/superpowers/specs/2026-11-15-films-design.md`.

# PureLift Cosmetic (`/purelift/`, unlisted draft)

A website for PureLift Cosmetic, an aesthetic clinic founded by nurses, in English and Simplified Chinese (a Language button switches them; `?lang=zh` links straight to Chinese). Its layout and buttons follow a reference clinic site the owner chose, in colours taken from the clinic's photo. It carries the clinic's own philosophy, seven commitments, team, clinical-teaching and partner notices, recent updates, and a knowledge base of 17 articles (12 shown, 5 held back for a TGA advertising check; `?review=1` shows them). Frosted-glass styling (soft colour and blurred photos behind translucent panels, with opaque fallbacks). Plain HTML and CSS with self-hosted fonts and a little JavaScript. It is a draft: yellow-highlighted text is a placeholder, and the page asks search engines not to index it. Like the other unlisted apps it is left off the home page, but the address opens for anyone who has it. `purelift/README.md` explains the files, the two-language markup, the article format (`node scripts/purelift-kb.mjs` rebuilds the card index) and has the launch checklist; `node --test test/purelift.test.js` checks links, images, the English/Chinese pairing and every article.

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
node scripts/spots-check.mjs               # Spots app in sample mode (modes, place sheet, check-in, night theme)
node scripts/films-check.mjs               # Films app against a feed built from the TMDB-shaped samples
node scripts/songs-check.mjs               # Korean and Cantonese Songs with LRCLIB, the Claude API and the dictionary faked (invented lyrics only)
```
The three scripts need Playwright; set `PLAYWRIGHT_MODULE` to its `index.mjs` if it is not importable as `playwright`.
