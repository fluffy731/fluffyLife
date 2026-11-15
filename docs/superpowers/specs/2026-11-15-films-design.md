# Films: design

Written 15 November 2026 after a short design conversation with the owner. Calls marked *my call* are open to change.

## Intent

The owner, 15 November: "Something I want to watch like Chinese English Korean Hong Kong movies and categorised into genres and eras etc. something to enjoy doing in spare time."

A home-screen app for browsing films worth watching in a free evening. You browse by where a film is from (Hong Kong, Chinese, Korean, English-language), by genre and by era. You keep a watchlist, and later get suggestions shaped by the films you've rated.

## Decisions the owner made

- **Phase A first, then phase B.** Phase A is shelves of good films for each place × genre × era, plus Surprise me. Phase B is **For you**: you rate films you've seen, and it suggests others like the ones you loved. Both are designed here. A ships and is used before B is built.
- **No "where to watch".** No streaming-service data and no filtering by service.
- **Popularity as well as rating.** "Some popular movies aren't highly rated." Every shelf offers popular films next to top-rated ones, and has a list for popular films that critics rated lower.
- **How it's built: a film list made weekly in GitHub Actions** from TMDB, the way News and Stocks build theirs (option 1 of 3, below). The owner said "1 is good. Proceed".

## Goals

- Open the app and be browsing good films in one tap. Narrow by place, era and genre in a tap each.
- Every shelf can show **Best rated**, **Most popular** and **Crowd-pleasers**.
- Each film shows its poster, its title in the original script with the English title beside it, year, place, genres, rating and how many people rated it, director, main cast, and a short plot summary.
- **Surprise me** picks one good film you haven't seen from what you're browsing.
- Keep a **Watchlist** and mark films **Seen**, saved on the phone.
- Phase B: rate films you've seen, then get a **For you** list where each suggestion says why it was picked.

## Non-goals

- Where to watch, streaming services, cinema session times.
- TV series and K-dramas. Films only (*my call*; it could come later as its own shelf).
- Every film ever made. The catalogue is the best-rated and most-rated films of each place and decade, a few thousand in all.
- Accounts, sync between phones, reviews written for others, a social feed.
- Trailers or video inside the app. A trailer is a link out to YouTube.

## Anti-goals

- **Anything personal in the repo.** The watchlist, Seen marks and ratings stay on the phone.
- **The TMDB key anywhere but the repo's Actions secrets.** It is never on the phone, never committed, and never in the published feed.
- **Breaking TMDB's terms.** TMDB's API is free for non-commercial use with attribution. The terms forbid caching its data for more than six months, and forbid using its content to train or validate AI systems. So the feed is rebuilt weekly, the build's own detail cache expires entries after 30 days, and no TMDB text is sent to an AI model. The on-phone "For you" score is simple arithmetic, not a trained model. [Likely: the six-month and AI clauses come from search results quoting the terms page, which this session could not open.]
- **Hollywood drowning out the rest.** Ranking is always within a place, never across all films (below).
- **A cluttered or gamified look.** No streaks, badges or confetti. The posters carry the page.

## Constraints

- Static site on GitHub Pages, vanilla ES modules, no build step, offline shell through `sw.js` (the app's files go in `FILES`).
- The phone only downloads a finished `films/feed.json`. Same pattern as News, Stocks and Spots: a script runs in the hourly GitHub run, writes the file, and the deploy publishes it. The feed is git-ignored, never committed.
- **The repo is public.** The GitHub Actions minutes are free.
- **This session cannot reach TMDB** (`api.themoviedb.org` and `image.tmdb.org` are refused by the network proxy). The build is developed against hand-made fixtures in TMDB's response shape. The first real build happens in Actions once the owner adds the key. Its log must print enough (counts per place and decade, a sample film) to check the fixtures against the real thing.
- Posters load from TMDB's image server (`image.tmdb.org`), which the service worker doesn't cache. Offline, the lists still work, with a plain title tile in place of each poster.
- No new dependencies.

## Approaches considered

1. **A weekly film list built in GitHub Actions** *(chosen)*. A script asks TMDB for each place × decade, keeps the best-rated and most-rated films, fetches each film's details, and writes one JSON file. Browsing is instant and works offline (apart from posters), the key stays in Actions, and "For you" runs on the phone from the file. The catch: you can only browse and search the films in the list.
2. **The phone asks TMDB directly**, with a key pasted into Settings as Spots does with Google. Every film is reachable and always current, but it needs a connection, waits on every screen, puts the key on the phone, and makes "For you" slow.
3. **A hand-written list in the repo**, like the language apps' words. No key and fully offline, but limited to a few hundred films, it never updates, and its popularity figures would be guesses.

## The owner's one-time setup

1. Make a free account at themoviedb.org. In Settings → API, request a key for personal, non-commercial use, giving the app's address `https://fluffy731.github.io/fluffyLife/films/`.
2. Add it as a repository secret named `TMDB_API_KEY` (Settings → Secrets and variables → Actions). TMDB offers both a short "API key" and a long "API Read Access Token". Either works: the build sends a token starting `eyJ` as a Bearer header, and anything else as the `api_key` parameter.

Without the secret, the build skips, there is no feed, and the app says the film list arrives once the key is added. Nothing else in the deploy changes.

## Places

Every film belongs to one or more places, decided from TMDB's `origin_country` and `original_language`:

| Place | Rule | Note |
|---|---|---|
| **Hong Kong** 香港 | origin country includes HK | Cantonese (TMDB language `cn`) or Mandarin |
| **Chinese** 華語 | origin country includes CN or TW, and the language is Chinese (`zh` or `cn`) | Each card says Mainland or Taiwan |
| **Korean** 한국 | origin country includes KR | |
| **English** | language `en` and origin country in US, GB, CA, AU, NZ or IE | |

A Hong Kong and Mainland co-production shows on both shelves (*my call*: it is honestly both, and hiding it from either would surprise). The place names show in English with the local name small beside them.

## Eras

Decades: **2020s, 2010s, 2000s, 1990s, 1980s, 1970s**, and **Classics** (before 1970). Where a place has a well-known period, its decade chip carries a small label (*my call*, kept to ones I'm confident of):

- Hong Kong 1980s and 1990s: *Golden age*
- Chinese 1980s and 1990s: *Fifth Generation* (Mainland); Taiwan 1980s: *New Cinema*
- Korean 2000s: *New Wave*

## Genres

TMDB's genres, leaving out TV Movie: Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery, Romance, Science Fiction, Thriller, War, Western. Plus **Martial arts**, from TMDB's keywords "martial arts", "wuxia" and "kung fu" (*my call*: it matters for Hong Kong and Chinese films, and TMDB has no genre for it). A genre with fewer than four films under the current filters is not shown as a chip.

## The three lists, and why ranking is per place

- **Best rated.** A weighted rating, so a 9.0 from 15 votes doesn't beat an 8.4 from 20,000: `WR = v/(v+m)·R + m/(v+m)·C`. Here R is the film's average, v its vote count, C the place's mean rating, and m the place's typical vote count (its median, *my call*). Each place gets its own m and C.
- **Most popular.** By vote count: how many people rated the film on TMDB. It stands for "how many people watched it", whenever it was made. TMDB's own `popularity` figure measures this week's activity, so it is not used here; a 1990s Stephen Chow hit would rank low on it. [Likely]
- **Crowd-pleasers.** Films in the top third of their place by vote count whose weighted rating is below their place's median, ranked by vote count. These are the popular films critics were lukewarm about, the thing the owner asked for.
- **Popular right now.** One extra row per place on Browse, from TMDB's `popularity` (this week's activity), so new releases show up (*my call*).

**Every ranking is within a place.** TMDB's users lean towards English-language films, so one global ranking would bury Hong Kong and Chinese films. "Most popular" means most popular among Hong Kong films, and so on. Under **All places**, the rows interleave the places' own rankings in turn (HK #1, Chinese #1, Korean #1, English #1, HK #2 …), so no place dominates. Mainland audiences mostly rate on Douban, which has no free data, so Chinese vote counts are a rough guide only. The film sheet links out to a Douban search for Chinese and Hong Kong films so the owner can check there. [Likely]

## The catalogue (`films/feed.json`)

Built by `scripts/build-films.mjs` in the hourly run, but only when the feed is more than 7 days old or the script has changed (as the dictionaries are). Other hours it restores the last feed from the Actions cache and stops in seconds.

**Choosing films.** For each place × decade (4 × 7 = 28 cells), TMDB's `discover/movie` with the place's filters and the decade's release dates, two ways:

- up to 100 films sorted by rating (`vote_average.desc`), with a minimum vote count per place so a handful of votes can't place a film. The builder sets the minimums so each cell's list looks sound, starting near HK 20, Chinese 20, Korean 30, English 300.
- up to 100 films sorted by vote count (`vote_count.desc`).

Plus 20 per place by `popularity.desc` for Popular right now. Together that's about 290 list calls and, after overlaps, roughly 3,000 to 4,000 films. Thin cells (Korean Classics, say) simply have fewer.

**Details.** One call per film, `movie/{id}` with `append_to_response=credits,keywords,videos`, kept in a build cache (`~/.films-cache`, in the Actions cache, never published) for 30 days. A weekly build re-fetches only what's new or expired. Calls run a few at a time and back off on HTTP 429.

**Shape** (field names are the builder's call; contents are not):

```
{ built: "2026-11-15", version: 1,
  places: { HK: { mean, m, medianVotes }, … },        // for the rankings and the phone's scoring
  films: [{ id, title, original, year, places: ["HK"], country: "HK"|"CN"|"TW"|…,
            lang, genres: ["Crime", "Thriller"], runtime, rating: 8.1, votes: 3201,
            director: "劉偉強 Andrew Lau", cast: ["Tony Leung Chiu-wai", "Andy Lau", "Anthony Wong"],
            plot: "…",                                  // TMDB's overview, cut to about 300 characters
            poster: "/abc.jpg", trailer: "YouTube key"|null,
            ranks: { rated: 3, votes: 1, now: null } }],   // within its place, for "#3 in Hong Kong"
  sources: { ok, calls, failed } }
```

- **Titles.** `original` is TMDB's original title (無間道, 살인의 추억), shown first; `title` is the English one. When they're the same (English films), only one shows.
- **People.** The director and the first three billed actors, as TMDB names them. Their TMDB ids are kept too, for phase B's matching.
- **Size.** Aim for under about 1 MB once GitHub Pages compresses it. If it's bigger, cut the plot first (shorter, or a separate file loaded when a sheet opens). That is the builder's call.
- If the build fails part-way, the last good feed stays. A run that gets fewer than half the expected films keeps the old feed and leaves a warning in the log.

## Screens

English interface (*my call*: the owner reads English, Chinese and Korean, and the original titles carry the other scripts). Light and dark follow the phone. App name **Films**, home-screen title **Films** (*my call*). It is listed on the home page and in the README table, since nothing in it is personal (*my call*).

Tab bar: **Browse · For you · Watchlist**, with search and settings in the header. For you appears in phase B; in phase A the bar has Browse and Watchlist.

### Browse (the first tab)

```
┌──────────────────────────────────────┐
│ Films                          🔍  ⚙ │
│ [All] [Hong Kong 香港] [Chinese 華語]   │
│ [Korean 한국] [English]                │
│ Era  [All] [2020s] [2010s] [2000s]    │
│      [1990s Golden age] [1980s] …     │
│ Genre [All] [Crime] [Action] [Martial │
│       arts] [Comedy] [Romance] …      │
│                     [🎲 Surprise me]  │
│ BEST RATED                       All ›│
│ [poster][poster][poster][poster] →    │
│ MOST POPULAR                     All ›│
│ [poster][poster][poster][poster] →    │
│ CROWD-PLEASERS                   All ›│
│ [poster][poster][poster][poster] →    │
│ POPULAR RIGHT NOW (no era filter set) │
│ CRIME · ACTION · COMEDY … (by genre)  │
├──────────────────────────────────────┤
│        Browse      Watchlist         │
└──────────────────────────────────────┘
```

- Filters are chip rows that scroll sideways. The chosen place, era and genre are remembered between visits.
- Each row scrolls sideways: poster, original title, English title, year, ★ rating. Seen films carry a tick and a watchlist film a ribbon.
- **All ›** opens the full list as a three-across poster grid with a switch for Best rated / Most popular / Crowd-pleasers. It loads more as you scroll.
- With no genre chosen, genre rows (best rated within each genre, the biggest genres first) follow the three lists.
- **Surprise me** picks at random from the current filters, weighted towards films that rank high on either list, and never a Seen one. It opens the film's sheet, with **Another** on it.
- **Hide films I've seen** sits in Settings, off by default.

### A film's sheet

Poster, original and English titles, year, place (with Mainland or Taiwan), runtime, genres. Then "★ 8.1 · 3,201 ratings", the list ranks ("#1 most popular in Hong Kong · #3 best rated"), director, cast, and the plot. Buttons: **Want to watch** (toggles the watchlist) and **Seen it** (phase B adds the rating). Links: **Trailer** (YouTube, when TMDB has one), **TMDB page**, and **Douban** (a search for the original title, Chinese and Hong Kong films only). Below that, **More like this**: up to ten films from the catalogue sharing the director, a lead actor, or place + genre + decade.

### Search

Searches the catalogue by English title, original title, director or cast, as you type. Case and accents are ignored. Simplified and Traditional characters match each other only if a small mapping can be reused from the repo's Chinese data. Otherwise characters match as typed. Phase A doesn't need this (builder's call).

### Watchlist

Two lists: **Want to watch** (newest first) and **Seen** (newest first, phase B shows the rating). Each item stores the film's id, both titles, year, place, genres, director and cast ids, so it survives a film dropping out of the weekly catalogue. Settings has **Back up** and **Restore** (one JSON file, merged without duplicates), as in Stocks and Spots, because iPhone can clear a website's storage.

### Settings

Hide films I've seen; Back up / Restore; when the catalogue was built and how many films it holds; and the TMDB attribution with TMDB's logo and the notice "This product uses the TMDB API but is not endorsed or certified by TMDB", which the terms require. The build downloads the logo into `films/` so it's served from the site; if that fails, the notice shows as text.

### Before there's a feed

"The film list arrives with the next update, once a TMDB key has been added to the repository." Watchlist still opens.

## Phase B: For you

- **Rating.** Seen it on any film asks **Loved it · Liked it · Not for me**, or skip. Stored on the phone with the film's details as above.
- **Getting started.** For you starts with **Rate some films you've seen**: a deck of the most-rated films in the places you've browsed most, one at a time, with Loved · Liked · Not for me · Haven't seen. The **For you** list appears once there are at least 5 ratings with at least 3 Loved or Liked. Until then, a counter shows how many to go.
- **Scoring** (on the phone, `films/foryou.js`, pure and tested). For each unseen film, add a score for each rated film it shares something with:
  - same director +3
  - each shared lead actor +2
  - each shared genre +1
  - same place +1
  - same decade +0.5

  Multiply by the rating: Loved ×2, Liked ×1, Not for me ×−1. Add a small quality term from the weighted rating, so a strong match with a poor film doesn't top the list. Weights are a starting point; the builder can tune them against a few hand-made profiles in the tests.
- **Why.** Each suggestion shows its biggest reason: "Same director as 無間道", "With Tony Leung, like 花樣年華", or "Hong Kong 1990s crime, like 英雄本色".
- **Not interested** on a For you card hides it from For you for good. Undo shows in a toast.
- The list is 30 films, recomputed when you open the tab. Watchlist films stay in it, marked.

## Code layout

Following Spots and Stocks (*my call*):

- `films/index.html`, `films/manifest.json`, `films/films.css`, `films/films.js` (screens), `films/model.js` (places, eras, genres, rankings, filters, Surprise me, More like this, search; pure and tested), `films/store.js` (watchlist, ratings, backup), `films/foryou.js` (phase B scoring).
- `scripts/build-films.mjs`: the TMDB fetching and feed writing, with its pure parts (place rules, cell queries, merging, weighted rating, crowd-pleasers, trimming) exported for tests.
- `icons/films.svg`, `-180.png`, `-512.png`.
- Wiring: `FILES` and `fallbackPage` in `sw.js`, a link in `index.html`, a README section and table row, `films/feed.json` in `.gitignore`, a step in `.github/workflows/pages.yml` after Spots: restore `films/feed.json` and `~/.films-cache`, run the build with `TMDB_API_KEY`, `continue-on-error: true`, with a timeout of about 10 minutes, and add a line to the log tail with films per place.

## Testing

- Unit tests (`node --test`): `test/films-model.test.js` (place rules on co-productions, decade edges such as 1969/1970, the weighted rating, crowd-pleasers, interleaving under All places, Surprise me never picking a Seen film, search), `test/films-build.test.js` (cell queries, merging overlaps, minimum-vote filtering, trimming, keeping the old feed on a thin build, against fixtures in `test/fixtures/films/` written in TMDB's response shape), `test/films-store.test.js` (backup and restore merge), and in phase B `test/films-foryou.test.js` (scoring, reasons, the 5-ratings threshold, Not interested).
- Browser check: `scripts/films-check.mjs` (Playwright, against a fixture feed): Browse renders, the filters narrow the rows, a sheet opens, the watchlist survives a reload, the app works offline without posters, and nothing overflows at phone width in both themes.
- After the key is added: one manual Actions run, checking the log's counts and sample film against the fixtures' assumptions, before the merge to `mainFluffy`.

## Left to the builder

The exact look within the constraints above, the minimum vote counts per place, the detail-fetch concurrency, the feed's field names, whether the plot moves to a separate file, and the phase B weights.
