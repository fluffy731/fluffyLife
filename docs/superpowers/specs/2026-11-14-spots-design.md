# 打卡 Spots: design

Written 14 November 2026. Status: plan approved in outline ("all good go 好似一個打卡點咁"); the calls below marked *my call* are open to change.

## Intent

A home-screen app for daily 玩樂好去處: new restaurants, sights and what's on in Melbourne, where every place is a **打卡點** you collect. The same app carries on overseas as a travel log. It should feel fun, interactive and colourful, not like the calm study apps.

The owner asked for it directly. Why it matters, in their words so far: something new to do every day, and a record that feels like collecting check-ins.

## Goals

- **Something new every day with no effort.** A short daily shortlist appears without the owner typing anything.
- **One-tap 打卡.** Arriving somewhere and stamping it takes seconds, with an optional photo, rating and note.
- **A collection that fills up.** Stamps by suburb in Melbourne, by city and country overseas, plus themed collections.
- **One home for travel.** Overseas, the plan, the check-ins and the memories live in the same place.

## Non-goals

- Reviews for other people, a social feed, followers or likes.
- Bookings, opening hours or menus (the app links out to the venue or a map instead).
- Accounts, sync between phones, or a server.

## Anti-goals (would make it a failure even if it works)

- An endless feed to scroll. The daily view is a small, finished set.
- Getting around paywalls. Only free-to-read sources, as in Briefing.
- Anything personal in the public repo: no spots, check-ins, photos or locations are ever committed.
- A corporate or sterile look.

## Constraints (from the repo as it stands)

- Static files on GitHub Pages, no build step, vanilla ES modules, offline through `sw.js`. Same as every other app here.
- **The repo is public.** Personal data lives on the phone only, as in Travel. The only thing published is the public feed of new places.
- Each home-screen app keeps its own storage, separate from Safari's and from the other apps (README). [Likely]
- iPhone can clear a website's storage. Home-screen apps are safer, but a photo log still needs backup built in from day one.
- iOS Safari has no vibration API, so the stamp effect has to come from animation (and sound, if wanted), not haptics.
- GitHub Actions minutes are free while the repo is public. The feed build adds a few seconds to the existing hourly deploy run and starts no new runs.

## Approaches considered

| | Approach | Trade-off |
|---|---|---|
| A | New app `/spots/` with its own simple trip log; Travel stays as it is | Quickest. But each home-screen app keeps its own storage, so the log can never see Travel's plans. Two apps and two backups for one trip. |
| **B** | **New app `/spots/` that, in Phase 3, takes over Travel's planner and packing by reusing `travel/plan-model.js` and `travel/model.js`** | One app for before, during and after a trip: a plan's Eat and Do items become 想去 pins, and the check-ins land on that trip. One backup. More work in Phase 3, and Travel has to be migrated before it retires. |
| C | Grow `/travel/` into the 打卡 app | Bends a calm teal checklist into a playful app. The Melbourne side has nothing to do with packing, and changing Travel's address would break its home-screen icon. |

**Picked: B** (*my call*, since the owner handed over the how). Travel keeps working until Phase 3 is done and its trips are moved across with Travel's own backup file; after that, `/travel/` forwards to `/spots/#trips`.

## What the owner sees

### The thing everything is built on: a Spot

A Spot is a place: name, kind, area (suburb or city), country, map position if known, links, where it came from (a feed or "me"), and its state:

- **New:** in today's feed, not saved yet. Feed items are not Spots until saved, so the feed stays disposable.
- **想去 (want to go):** saved.
- **去咗 (been):** has at least one 打卡: date, rating (one to five), note, a small photo, who with, and the trip if it was overseas.

Kinds, each with its own colour and stamp shape: **食 Eat · 飲 Drink · 睇 See · 玩 Do · 節目 Event**.

### Tabs (bottom bar)

```
┌──────────────────────────────────────┐
│  今日 Today                    ☀ 24° │
│  ┌────────────────────────────────┐  │
│  │   🍜  NEW · Fitzroy            │  │
│  │   [ feed photo / colour tile ] │  │
│  │   Hand-pulled noodle bar ...   │  │
│  │   ← 下次          想去! →     │  │
│  └────────────────────────────────┘  │
│   ● ○ ○   食 · 玩 · 驚喜             │
│  This weekend ▸ [Night market][Expo] │
├──────────────────────────────────────┤
│ 今日   地圖   ( 打卡 )   護照   旅程 │
└──────────────────────────────────────┘
```

1. **今日 Today.** The Daily 3: three swipeable cards, one to eat (食), one to do (玩) and one wildcard (驚喜). They come from the feed's last 14 days and from your 想去 list (the oldest not yet visited, nearest first when location is allowed). The date picks them, so they stay the same all day, as the Korean app's word of the hour does; **再抽** draws again. Swipe right for 想去, left for 下次, tap for details. Under the cards: a "This weekend" strip of events and **See all new** (the full feed, filtered by kind and area).
2. **地圖 Map.** Pins coloured by kind: filled for 去咗, outlined for 想去, glowing for New. Filter chips, a Near me button, and a List toggle that also works offline.
3. **打卡 (centre button).** "I'm here": shows the nearest 想去 spots by location, or makes a new spot. Add a photo, rating and note, then hold the button: a ring fills and the stamp slams down with an ink splash.
4. **護照 Passport.** Every stamp, page by page: Melbourne by suburb, overseas by country and city. Melbourne's suburb map fills in as you go, and so does a world map. Collections ("Laneway coffee 3/10", "Every cuisine on Victoria St"), month counts, and a year in review.
5. **旅程 Trips** (Phase 3). Travel's planner and packing list, moved here. During a trip, 打卡 files stamps under that trip. Afterwards there's a trip recap card (route, top eats, photo strip) to share as an image.

### Adding places by hand

Paste a Google Maps, Instagram or 小紅書 link with a name, or type one in. Links are kept and open in their own app. No scraping of those sites.

## The daily feed (Phase 2)

- `scripts/build-spots.mjs` with its source list in `scripts/spots-sources.mjs`, modelled on `build-news.mjs`. It runs in the deploy job and refetches only when `spots/feed.json` is over 20 hours old. The last good feed is restored from the Actions cache first, as Stocks does, so a failed fetch leaves yesterday's places up.
- **Sources** (free-to-read RSS, each to be checked with `--probe` from Actions, since this session's network blocks them): Broadsheet Melbourne, Concrete Playground Melbourne, Time Out Melbourne, The Urban List Melbourne, City of Melbourne What's On, Visit Melbourne events. Paywalled food guides are left out. [Likely: feed addresses unconfirmed]
- **Each item** keeps a headline, a short excerpt, its link, source and date, and the feed's own image if it supplies one (shown with the source, linking back). Without an image the card uses a colour tile with the kind's emoji.
- **Kind and area** come from keywords and a bundled list of Melbourne suburbs with their centre points, so a New pin sits on its suburb, not its exact door. "Open in Maps" searches the venue's name.
- Items stay for 30 days, and the same venue seen in two sources becomes one item.
- **Optional, Phase 4:** with the `ANTHROPIC_API_KEY` secret already used by Stocks, Claude Haiku writes one line in 廣東話 and one in English for each Daily 3 pick, from the article's own text only, labelled as an AI blurb. Well under a cent a day. Without the secret nothing changes.

## Data on the phone

- Spots and check-ins in `localStorage` under `spots.v1`. Photos as small JPEGs (about 600 px, around 60 KB each) in IndexedDB. Full-size photos stay in the Photos app; the app keeps only its thumbnail.
- **Backup:** one JSON file, thumbnails included, through the share sheet to Files or iCloud Drive. Restore merges by id rather than replacing. Passport shows "Last backup N days ago" and nudges after 30 days.
- **Location:** asked for only when you tap Near me or 打卡. Positions never leave the phone. Overseas, the city name comes from the position via OpenStreetMap's Nominatim, one request per 打卡, or is typed.

## Look and feel ("Neon laneway")

Melbourne laneway street art meets Hong Kong neon signs. A deliberate break from the language apps' calm look (`PRODUCT.md` covers those apps only). The full direction goes in `docs/design/spots.md`.

| Token | Light | Dark | Use |
|---|---|---|---|
| Wall / Night | `#F4F1FA` pale lilac wall | `#140B2E` night violet | page |
| Ink | `#1B1035` aubergine | `#F6F0FF` | text |
| 食 Eat | `#FF6B35` tangerine | `#FF8A5C` | kind |
| 飲 Drink | `#FF3D7F` hot pink | `#FF6B9E` | kind |
| 睇 See | `#2E6BFF` electric blue | `#6F98FF` | kind |
| 玩 Do | `#7BC300` lime | `#A6E635` | kind |
| 節目 Event | `#8B5CF6` violet | `#B194FF` | kind |
| Stamp | `#E63946` 印章 vermilion | `#FF5A66` | stamps |
| Gold | `#FFC93C` | `#FFD86B` | collection complete |

Colour exact values get checked for contrast in the build; text on lime and gold is always dark ink.

- **Type:** Pretendard ExtraBold (already shipped and cached) for headlines and numbers; PingFang HK for Chinese. Big chunky labels and sticker-like chips.
- **Moves:** cards tilt as they're dragged, with a 想去 / 下次 colour wash; the stamp lands at a random slight angle with an ink splash and a small shake; a suburb lights up on the map with a pop; Passport pages turn. Everything has a still version under Reduce Motion.
- **Language:** labels in Traditional Chinese with Cantonese wording (想去, 去咗, 打卡, 搵嘢食) and small English beneath. Feed text stays in its own language.
- Light and dark themes, both first-class. By day, paste-up posters on a pale lilac wall, with hard ink sticker shadows. After dark, neon signs glowing on night violet.
- A clickable mockup of this direction (Today deck, Map, hold-to-打卡 stamp, Passport, Trips) was published as a private artifact with this plan.

## Phases

| Phase | Delivers | Works without |
|---|---|---|
| **1. Stamp it** | App shell and tabs, add a spot by hand or link, 想去 list, 打卡 with photo, rating and note, stamp animation, Passport grid by suburb, backup and restore, offline, tests | the feed and the map |
| **2. Daily** | `build-spots.mjs`, `spots/feed.json`, Today's Daily 3 swipe deck, See all new, Map with Leaflet and OpenStreetMap tiles | — |
| **3. Overseas** | Trips tab taking over Travel's planner and packing, migration from Travel's backup, trip 打卡, country and city stamps, world map, trip recap image; `/travel/` forwards | — |
| **4. Delight** | Suburb map fill-in, collections, year in review, Haiku 廣東話 blurbs, weather-aware picks (Open-Meteo, free, no key: rain means indoor picks), a daily Shortcuts nudge as the Korean app has | — |

Phase 1 is useful alone: the owner can start stamping places straight away while the feed is built.

## How it fits the repo

- Folder `/spots/` with `index.html`, `spots.js`, `spots.css`, `model.js`, `manifest.json`, and icons `icons/spots.svg`, `-180.png` and `-512.png`. Add every file to `FILES` in `sw.js`, and give it a README section.
- Unlisted at first, like Travel and Stocks: left off `index.html`, with pages asking search engines not to index them (*my call*).
- **Libraries:** Leaflet, vendored into `lib/vendor/` like `ts-fsrs.js`. OpenStreetMap tiles with attribution, no bulk pre-downloading (their usage policy). Suburb shapes from Vicmap (CC BY 4.0) and countries from Natural Earth (public domain), simplified to keep each file small.
- **Tests:** `node --test test/spots*.test.js` for the model (cleaning spots, 打卡, Daily 3 picking by date, collections, merging backups) and the feed builder against fixture feeds. `scripts/spots-check.mjs` runs the app in Playwright against a fixture feed, as `news-check.mjs` does.
- **Branch:** the README gives each project its own branch, so the build would use a `spots` branch, merged into `mainFluffy` one phase at a time.
- **Minutes:** each push runs `test`, billed as 1 minute; each merge also runs `deploy`, billed as 1–2. The feed adds seconds to the hourly run. All free while the repo is public.

## Risks

- **A source has no feed, or changes it.** Mitigation: the probe, several sources, and Phase 1 working without any feed. [Likely]
- **Photos lost when the phone clears storage.** Mitigation: thumbnails only (the originals stay in Photos), and the backup nudge.
- **Map tiles need a signal.** The List view and Passport work offline; the map says so when tiles can't load.
- **Copyright.** Headline, short excerpt and link only, as Briefing does; images only when the feed itself offers them.

## Left to the builder

The exact feed addresses after probing, the suburb list's source and simplification, stamp shapes, final contrast-checked colour values, the sound (if any), and the name: "打卡 Spots" is a working title.
