# Films (phase A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A home-screen app at `/films/` for browsing good Hong Kong, Chinese, Korean and English-language films by place, era and genre, with Best rated, Most popular and Crowd-pleasers on every shelf, Surprise me, search, a film sheet with More like this, and a watchlist. It is fed by a weekly TMDB build in GitHub Actions.

**Architecture:** `scripts/build-films.mjs` runs in the hourly deploy, but rebuilds only when the feed is over 7 days old or the rules changed. It asks TMDB's `discover/movie` for each place × decade, fetches each film's details (cached for 30 days in `~/.films-cache`), and writes `films/feed.json`. The phone loads that file. All ranking (weighted rating, crowd-pleasers per shelf, interleaving under All places) is pure code in `films/model.js`, shared by the build and the phone. The look is the repo's Metro line system (`metro.css`, `DESIGN.md`) with a fifth line colour, `data-line="film"`.

**Tech Stack:** Vanilla ES modules, no build step, no new dependencies. Tests use `node:test` + `node:assert/strict`. Browser checks use Playwright (pre-installed; `require('playwright')` works). Node 22.

**Spec:** `docs/superpowers/specs/2026-11-15-films-design.md`. Read it first. This plan argues from it.

## Global Constraints

- Static files on GitHub Pages; every app file is listed in `FILES` in `sw.js`. No new dependencies.
- The TMDB key lives only in the Actions secret `TMDB_API_KEY`. It is never in the repo, the feed, the phone or a log. A key starting `eyJ` is sent as `Authorization: Bearer <key>`; anything else as the `api_key` query parameter.
- `films/feed.json` and `films/tmdb.svg` are git-ignored, never committed.
- TMDB terms: the feed is rebuilt weekly; detail-cache entries expire after **30 days**; no TMDB content goes to an AI model. The build log prints counts, field coverage and one sample film's id, title and year, **never plots**.
- Fixtures in `test/fixtures/films/` use real film facts (titles, years, people, countries) but **plots written by us**, never TMDB's overview text.
- Places: **HK** = origin country includes HK. **CN** = origin includes CN or TW *and* language `zh` or `cn`. **KR** = origin includes KR. **EN** = language `en` and origin in US, GB, CA, AU, NZ, IE. A film can be in several places.
- Eras: `classics` (before 1970), `1970s`, `1980s`, `1990s`, `2000s`, `2010s`, `2020s`.
- Named eras: HK 1980s and 1990s "Golden age"; CN 1980s "Fifth Generation · Taiwan New Cinema"; CN 1990s "Fifth Generation"; KR 2000s "New Wave".
- Genres: TMDB's genres without TV Movie, plus **Martial arts** (keywords "martial arts", "wuxia", "kung fu"). A genre chip shows only with **≥ 4** films under the current filters.
- Weighted rating `WR = v/(v+m)·R + m/(v+m)·C`, with C = place mean rating and m = place **median** vote count.
- Crowd-pleasers: within the current shelf, the top third by votes whose WR is below the shelf's median WR, ranked by votes. Hidden when there are **fewer than 4**.
- Under All places, every list interleaves the places' own rankings in turn (HK, CN, KR, EN), with no duplicates.
- Plots are cut to about **300** characters. Discover: up to **100** per sort per cell (5 pages of 20). Minimum votes for the rating sort start at HK 20, CN 20, KR 30, EN 300. Popular right now: 20 per place.
- A build with fewer than half the expected films keeps the old feed.
- Look (`DESIGN.md`): link `../metro.css`, then `./films.css`. Line colour Seoul Line 5 purple: route `#996cac`, strong `#7b4f92`, soft `#e6dcef`, ink `#5a3670`. The header roundel is **影**. Drawn SVG icons only, never emoji or Unicode glyphs as icons. Pretendard for names only. Both themes are first-class.
- Copy: the attribution notice is exactly "This product uses the TMDB API but is not endorsed or certified by TMDB". The no-feed message is exactly "The film list arrives with the next update, once a TMDB key has been added to the repository."
- English interface. App name **Films**. Listed on the home page and in the README table.
- Work on branch `claude/zen-knuth-idjcig`. Commit after each task. Each push runs the `test` job; report the GitHub Actions minutes after every push (see `CLAUDE.md`).

## Review Focus

1. **Missing fields from TMDB** (no poster, no runtime, no director, empty cast, no release date, no `origin_country`): the film still shows with a title tile and leaves out what's missing. A film with no release date is dropped, since it can't sit in an era. → Task 4 test `filmFrom tolerates missing fields`.
2. **A thin shelf** (KR Classics + Western, say): rows with no films hide, the grid shows "No films here yet" and genre chips with fewer than 4 films disappear. Nothing renders an empty row header. → Task 2 test `lists on an empty shelf`, Task 8 browser check.
3. **Characters in search** (Chinese, Hangul, accented names like "Amélie", mixed case, surrounding spaces): it matches as typed after case and accent folding, and an empty query shows nothing. → Task 3 test `search folds case and accents, keeps CJK`.
4. **A broken or foreign backup file** (not JSON, another app's backup, entries missing ids): Restore refuses with "This file is not a Films backup." and changes nothing. → Task 6 test `restore refuses foreign files`.
5. **A stale or missing feed on an installed phone** (offline first open, or a 404 before the first build): Browse shows the exact no-feed message, Watchlist still works from its stored snapshots, and nothing throws. → Task 7 browser check.

---

## File structure

| File | Responsibility |
|---|---|
| `films/model.js` | Pure: places, eras, genres, the place rule, stats, weighted rating, shelf lists, ranks, Surprise me, More like this, search. Shared by the build and the phone |
| `scripts/build-films.mjs` | TMDB queries, film mapping, feed assembly, freshness, the detail cache, the network runner, `--force` and `--probe` |
| `films/store.js` | Phone state in localStorage `films.v1`: settings, watchlist, Seen, backup and restore |
| `films/films.js` | Screens and DOM: shell, Browse, grid, sheet, Search, Watchlist, Settings |
| `films/films.css` | Film-only components: poster rows and grid, the era line, the film sign layout |
| `films/index.html`, `films/manifest.json` | The page shell and the home-screen manifest |
| `icons/films.svg`, `icons/films-180.png`, `icons/films-512.png` | The 影 icon in Line 5 purple |
| `test/films-model.test.js`, `test/films-build.test.js`, `test/films-store.test.js`, `test/films-ui.test.js` | Unit and wiring tests |
| `test/fixtures/films/discover.json`, `test/fixtures/films/details.json` | TMDB-shaped samples |
| `scripts/films-check.mjs` | Playwright browser check against a feed built from the fixtures |
| `.github/workflows/films-probe.yml` | Temporary: first real build on the branch. Deleted before merge |
| Modified: `metro.css`, `sw.js`, `index.html`, `.gitignore`, `.github/workflows/pages.yml`, `README.md`, `DESIGN.md`, `.impeccable/design.json` | Wiring |

The **Film** record (the feed's `films[]` entries, the shape every task uses):

```
{ id: 10775, title: "Infernal Affairs", original: "無間道", year: 2002, era: "2000s",
  places: ["HK"], country: "HK", lang: "cn", genres: ["Crime", "Thriller"],
  runtime: 101, rating: 7.9, votes: 3201, pop: 21.4,
  director: { id: 1, name: "Andrew Lau" }, cast: [{ id: 2, name: "Tony Leung Chiu-wai" }, …up to 3],
  plot: "…≤300 chars", poster: "/x.jpg" | null, trailer: "YouTube key" | null }
```

The feed: `{ version: 1, built: "2026-11-15T…Z", rules: "<12-hex fingerprint>", stats: { HK: { mean, m }, … }, films: Film[], sources: { calls, failed } }`.

---

### Task 1: Places, eras, genres and the weighted rating

**Files:**
- Create: `films/model.js`
- Test: `test/films-model.test.js`

**Interfaces:**
- Produces:
  - `PLACES: { id: "HK"|"CN"|"KR"|"EN", name: string, local: string, lang: string }[]`, in the order HK, CN, KR, EN. Names "Hong Kong" 香港 (lang `zh-Hant`), "Chinese" 華語 (`zh-Hant`), "Korean" 한국 (`ko`), "English" (local "", `en`).
  - `ERAS: { id: string, name: string, from: number, to: number }[]`, oldest first. `classics` is 0–1969 and `2020s` is 2020–2029.
  - `NAMED_ERAS: { [place]: { [eraId]: string } }`, from Global Constraints.
  - `GENRES: string[]`: the 18 TMDB genres from the spec plus "Martial arts".
  - `placesOf(originCountries: string[], lang: string): string[]`, in PLACES order.
  - `eraOf(year: number): string | null`
  - `placeStats(films: Film[]): { [place]: { mean: number, m: number } }`. A co-production counts in each of its places.
  - `weightedRating(film: Film, stat: { mean, m }): number`

- [ ] **Step 1: Write the failing tests** in `test/films-model.test.js`, with a `film(overrides)` helper that returns a valid Film:
  - `placesOf follows the place rules`:
    - `placesOf(["HK"], "cn")` → `["HK"]`
    - `placesOf(["HK","CN"], "cn")` → `["HK","CN"]`
    - `placesOf(["TW"], "zh")` → `["CN"]`
    - `placesOf(["US","CN"], "en")` → `["EN"]` (English-language US/China co-production is not Chinese)
    - `placesOf(["KR"], "ko")` → `["KR"]`
    - `placesOf(["FR"], "fr")` → `[]`
    - `placesOf(["GB"], "en")` → `["EN"]`
    - `placesOf(["IN"], "en")` → `[]`
  - `eraOf puts years in decades`: 1969 → `"classics"`, 1970 → `"1970s"`, 1999 → `"1990s"`, 2026 → `"2020s"`, NaN → `null`.
  - `weightedRating pulls small samples to the mean`: with stat `{ mean: 6.5, m: 100 }`, a 9.0 from 10 votes scores below an 8.4 from 20,000. A film with v = m scores exactly the average of R and C (e.g. R 8, C 6 → 7).
  - `placeStats uses each place's own mean and median votes`: HK films with votes [10, 20, 30] and ratings [6, 7, 8] give `{ mean: 7, m: 20 }`. A film in `["HK","CN"]` counts in both.

- [ ] **Step 2: Run them to see them fail.** Run: `node --test test/films-model.test.js`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement the five exports and constants** in `films/model.js`. No DOM, no imports. Median of an even count is the mean of the middle two.

- [ ] **Step 4: Run them to see them pass.** Run: `node --test test/films-model.test.js`. Expected: PASS.

- [ ] **Step 5: Commit.** `git add films/model.js test/films-model.test.js && git commit -m "Films: places, eras, genres and the weighted rating"`

### Task 2: Shelf lists, ranks and chips

**Files:**
- Modify: `films/model.js`
- Test: `test/films-model.test.js`

**Interfaces:**
- Consumes: Task 1's exports.
- Produces:
  - `inShelf(film: Film, f: { place: "all"|PlaceId, era: "all"|EraId, genre: "all"|string }): boolean`
  - `shelfLists(films: Film[], stats, f): { rated: Film[], popular: Film[], crowd: Film[], now: Film[] }`.
    - For a single place: `rated` is by WR (that place's stat) descending; `popular` by votes descending; `crowd` by the Global Constraints rule; `now` is the top 20 by `pop` (only when `f.era === "all"`, otherwise `[]`).
    - For `"all"`: each list is built per place, then interleaved.
    - Ties break on votes descending, then id ascending.
  - `interleave(lists: Film[][]): Film[]`: round-robin, deduplicated by id.
  - `rankMap(films, stats): Map<id, { [place]: { rated: number, popular: number } }>`: 1-based ranks within each of the film's places, over the whole place (all eras and genres).
  - `genreChips(films, f): { genre: string, count: number }[]`: genres with ≥ 4 films in the shelf (ignoring `f.genre`), biggest first.
  - `erasWithFilms(films, f): Set<EraId>`: eras with ≥ 1 film for the place and genre (ignoring `f.era`).

- [ ] **Step 1: Write the failing tests**:
  - `interleave alternates places without duplicates`: `[[a,b],[c,a],[d]]` → `[a,c,d,b]`.
  - `crowd-pleasers are popular films rated below the shelf median`: 15 HK films. The five most-voted have WRs of about 8, 5, 4.5, 4 and 3.5; the other ten sit around 7. `crowd` is the four films below 7, ordered by votes. A 9-film shelf where only two of the top three fall below the median → `[]`.
  - `crowd-pleasers are per shelf`: 12 films of 1970s HK with votes 50–600, where the four most-voted are the four lowest-rated. Even though every film is low-voted next to the 2000s, that shelf's `crowd` holds exactly those four.
  - `All places interleaves each place's ranking`: two places with two films each → `rated[0]` is HK's best and `rated[1]` is CN's best.
  - `Popular right now only without an era`: `now` has ≤ 20 films with an era of `"all"` and is `[]` with an era of `"1990s"`.
  - `lists on an empty shelf`: KR + classics + Western over films that have none → every list is `[]`, `genreChips` is `[]` and `erasWithFilms` lacks `classics`.
  - `genreChips hides genres with fewer than 4 films`.
  - `rankMap ranks a co-production in each place`.

- [ ] **Step 2: Run them to see them fail.** Run: `node --test test/films-model.test.js`. Expected: FAIL on the new tests.

- [ ] **Step 3: Implement the six exports.** The crowd rule, per place:

```js
const byVotes = [...shelf].sort(votesDesc);
const top = byVotes.slice(0, Math.ceil(byVotes.length / 3));
const med = median(shelf.map((x) => weightedRating(x, stat)));
const crowd = top.filter((x) => weightedRating(x, stat) < med);
return crowd.length >= 4 ? crowd : [];
```

- [ ] **Step 4: Run them to see them pass.** Run: `node --test test/films-model.test.js`. Expected: PASS.

- [ ] **Step 5: Commit.** `git commit -am "Films: shelf lists, crowd-pleasers per shelf, ranks and chips"`

### Task 3: Surprise me, More like this and search

**Files:**
- Modify: `films/model.js`
- Test: `test/films-model.test.js`

**Interfaces:**
- Consumes: `inShelf`, `shelfLists`.
- Produces:
  - `surprise(films, stats, f, seen: Set<number>, rand = Math.random): Film | null`. Candidates are the shelf minus Seen. A film's weight is `1 / Math.sqrt(1 + best)`, where `best` is its lower 0-based index in that shelf's `rated` or `popular` list (a film in neither list gets the list length).
  - `moreLike(film, films, n = 10): Film[]`. Score: same director id +3, each shared cast id +2, same place + genre + era +1 (counted once). The film itself is excluded. Score > 0 only. Ties go to more votes.
  - `fold(s: string): string`: NFKD, strip combining marks, lower case, trim.
  - `search(films, q: string, limit = 50): Film[]`. Matches `fold(q)` as a substring of the folded title, original, director name or a cast name. Title or original prefix matches come first, then more votes. An empty `q` returns `[]`.

- [ ] **Step 1: Write the failing tests**:
  - `surprise never picks a seen film`: over 200 draws with seeded `rand` values, no id from `seen`; with every film seen, it returns `null`.
  - `surprise favours high-ranked films`: with `rand = () => 0`, it returns the top-weighted film.
  - `moreLike prefers the same director, then cast`: fixture films sharing a director rank above those sharing one actor, and the film itself is absent.
  - `search folds case and accents, keeps CJK`: "amelie" finds "Amélie"; "  INFERNAL " finds Infernal Affairs; "無間" finds 無間道; "살인" finds 살인의 추억; "tony leung" finds by cast; "" → `[]`.

- [ ] **Step 2: Run them to see them fail.** Run: `node --test test/films-model.test.js`. Expected: FAIL on the new tests.

- [ ] **Step 3: Implement the four exports.**

- [ ] **Step 4: Run them to see them pass.** Run: `node --test test/films-model.test.js`. Expected: PASS.

- [ ] **Step 5: Commit.** `git commit -am "Films: Surprise me, More like this and search"`

### Task 4: The build's pure parts, with TMDB-shaped fixtures

**Files:**
- Create: `scripts/build-films.mjs` (pure exports only in this task), `test/fixtures/films/discover.json`, `test/fixtures/films/details.json`
- Test: `test/films-build.test.js`

**Interfaces:**
- Consumes: `placesOf`, `eraOf`, `placeStats`, `PLACES`, `ERAS` from `../films/model.js`.
- Produces:
  - `GENRE_IDS: { [id: number]: string }` (TMDB ids; 10770 TV Movie is absent).
  - `MIN_VOTES = { HK: 20, CN: 20, KR: 30, EN: 300 }`.
  - `auth(key: string): { headers: object, params: object }`
  - `cellQueries(place, era, today: string): { path: "/discover/movie", params: object }[]`: 10 queries (5 pages × 2 sorts). Params:
    - The place filter: HK `with_origin_country=HK`; CN `with_origin_country=CN|TW` + `with_original_language=zh|cn`; KR `with_origin_country=KR`; EN `with_original_language=en` + `with_origin_country=US|GB|CA|AU|NZ|IE`.
    - Dates: `primary_release_date.gte` / `.lte` (classics has no `gte`; `2020s` uses `lte = today`).
    - Fixed: `include_adult=false`, `without_genres=10770`, `page`.
    - Sorts: `sort_by=vote_average.desc` with `vote_count.gte=MIN_VOTES[place]`, or `vote_count.desc`.
  - `nowQuery(place, today): { path, params }`: `sort_by=popularity.desc`, `primary_release_date.lte=today`, `vote_count.gte=10`, page 1.
  - `filmFrom(d: TmdbDetails, foundIn: PlaceId[]): Film | null`:
    - Places come from `placesOf(d.origin_country ?? d.production_countries.map(c => c.iso_3166_1), d.original_language)`, falling back to `foundIn` when that's empty.
    - Genres: names without "TV Movie", plus "Martial arts" if any keyword name matches `/^(martial arts|wuxia|kung fu)$/i`.
    - The director is the first crew member with job "Director"; cast is the first 3 by `order`.
    - The plot goes through `trimPlot`. The trailer is the first YouTube Trailer, preferring `official`.
    - `rating` has 1 decimal and `pop` has 1 decimal.
    - Returns `null` without a release year.
  - `trimPlot(s: string, max = 300): string`: cut at the last word boundary before `max`, with an "…" added when cut.
  - `assemble(films: Film[], built: string, rules: string, sources): Feed`: adds `stats` from `placeStats`, dedupes by id (merging `places`), and sorts by id.
  - `isThin(feed, old: Feed | null, floor = 500): boolean`: true when there are fewer than half `old.films.length` films, or fewer than `floor` with no old feed.
  - `needsBuild(old: Feed | null, rules: string, now: Date): boolean`: true when there's no old feed, `old.rules !== rules`, or the build is older than 7 days.
  - `summary(feed): string`: per place a line of era counts, field coverage percentages (poster, plot, director, cast, runtime, trailer), one sample film as `id title (year)`, the feed's size in KB (`JSON.stringify(feed).length / 1024`, rounded), and `calls N, failed N`. Never any plot text.

- [ ] **Step 1: Write the fixtures.**
  - `details.json` is a map of id → a TMDB movie-details object with `credits`, `keywords` and `videos` appended. It holds at least:
    - Infernal Affairs (HK 2002, `cn`)
    - In the Mood for Love (HK 2000)
    - Kung Fu Hustle (origin `["HK","CN"]`, `cn`, keyword "kung fu")
    - Hero (CN 2002, `zh`, keyword "wuxia")
    - A City of Sadness (TW 1989, `zh`)
    - Memories of Murder (KR 2003)
    - Casablanca (US 1942)
    - The Great Wall (`["US","CN"]`, `en`)
    - one film with no poster, runtime, crew or `origin_country` (only `production_countries`)
    - one film with no `release_date`
  - Plots are short and written by us. Ids are TMDB-like integers.
  - `discover.json` is `{ page, total_pages, total_results, results: [...] }` summaries for the same ids.

- [ ] **Step 2: Write the failing tests** in `test/films-build.test.js`:
  - `auth sends a read token as Bearer and a short key as api_key`.
  - `cellQueries covers both sorts, five pages, and the place filter`: for CN 1980s, 10 queries; all have `with_origin_country=CN|TW`, `with_original_language=zh|cn` and the 1980–1989 dates; 5 have `vote_count.gte=20`. Classics has no `gte`.
  - `filmFrom maps a full record`: Infernal Affairs → `original "無間道"`, `places ["HK"]`, `era "2000s"`, director name, 3 cast, the trailer key.
  - `filmFrom: co-productions, Martial arts and English co-productions`: Kung Fu Hustle → `places ["HK","CN"]`, genres include "Martial arts"; Hero includes "Martial arts"; The Great Wall → `["EN"]`.
  - `filmFrom tolerates missing fields`: the bare film gives `poster: null`, `runtime: null`, `director: null`, `cast: []`, and places from `production_countries`. The undated film → `null`.
  - `trimPlot cuts on a word and adds an ellipsis`.
  - `assemble merges duplicate ids and adds stats`.
  - `isThin and needsBuild`: 400 films vs an old feed of 1,000 → thin; 600 with none → not thin; rules changed → build; 8 days old → build; 2 days old and same rules → no build.
  - `summary never prints a plot`: the output doesn't contain any fixture plot, and does contain `calls`.

- [ ] **Step 3: Run them to see them fail.** Run: `node --test test/films-build.test.js`. Expected: FAIL (module not found).

- [ ] **Step 4: Implement the exports.** The file starts with a header comment in the style of `scripts/build-stocks.mjs` that says what it builds and the two flags. Top-level code must not run on import; guard the runner with `if (import.meta.url === \`file://${process.argv[1]}\`)`.

- [ ] **Step 5: Run them to see them pass.** Run: `node --test test/films-build.test.js`. Expected: PASS.

- [ ] **Step 6: Commit.** `git add scripts/build-films.mjs test/films-build.test.js test/fixtures/films && git commit -m "Films: TMDB queries, film mapping and feed assembly, with fixtures"`

### Task 5: The build's network runner, cache, `--force` and `--probe`

**Files:**
- Modify: `scripts/build-films.mjs`
- Test: `test/films-build.test.js`

**Interfaces:**
- Consumes: Task 4's exports.
- Produces:
  - `run({ key, fetch, now = new Date(), out = "films/feed.json", cacheDir = join(homedir(), ".films-cache"), force = false, probe = false, thinFloor = 500, log = console.log }): Promise<{ wrote: boolean, feed: Feed | null }>`. `thinFloor` is passed through to `isThin`, so `isThin(feed, old, floor = 500)` takes it as a third parameter.
    - Without a `key`: log "TMDB_API_KEY not set: skipping films" and return `{ wrote: false, feed: null }`.
    - Unless `force` or `probe` is set, it calls `needsBuild` on the old feed at `out` and returns early when the feed is fresh.
    - Runs every `cellQueries` and `nowQuery`; collects ids with `foundIn`; reads `details.json` in `cacheDir` (entries `{ at, d }`); re-fetches `/movie/{id}?append_to_response=credits,keywords,videos` for entries that are missing or older than 30 days, **8 at a time**; retries on 429 or 5xx up to 3 times (honouring `Retry-After`, else 1 s, 2 s, 4 s); counts calls and failures.
    - Writes the cache back without entries older than 30 days.
    - Builds the films with `filmFrom` and the feed with `assemble`.
    - If the feed is thin, it logs a warning and keeps the old feed (`wrote: false`). Otherwise it writes `out`.
    - Always logs `summary(feed)`.
    - With `probe`, it writes to `join(cacheDir, "probe-feed.json")` instead of `out`.
  - `fetchLogo(fetch, dest = "films/tmdb.svg"): Promise<boolean>`: GETs `https://www.themoviedb.org/about/logos-attribution`, takes the first absolute `https://www.themoviedb.org/assets/…\.svg` URL whose path contains `logos`, downloads it to `dest`, and returns false on any failure (never throws). It runs only when a feed is written.
  - CLI: `node scripts/build-films.mjs [--force] [--probe]` reads `process.env.TMDB_API_KEY`, uses the global `fetch` and sets the `rules` fingerprint to the sha256 (12 hex) of `films/model.js` + `scripts/build-films.mjs`, as `build-stocks.mjs` does.

- [ ] **Step 1: Write the failing tests** with a fake `fetch(url, init)` that serves `discover.json` for `/discover/movie` and `details.json[id]` for `/movie/{id}`, and records calls. Use a temp `cacheDir` and `out` under `os.tmpdir()`:
  - `run skips without a key`.
  - `run builds a feed from fixtures and caches details`: a first run with `thinFloor: 1` writes `out`. A second run with `force: true` makes no detail calls.
  - `run re-fetches details older than 30 days`: set an entry's `at` to 31 days ago → exactly one detail call for it.
  - `run retries a 429 then succeeds`: the fake returns 429 once for one id, with `Retry-After: 0`.
  - `run keeps the old feed when the new one is thin`: the fake returns empty discover results → `wrote: false` and `out` unchanged.
  - `run logs no plots and never the key`: captured `log` output contains neither a fixture plot nor the key string.
  - `run returns early when the feed is fresh`.

- [ ] **Step 2: Run them to see them fail.** Run: `node --test test/films-build.test.js`. Expected: FAIL on the new tests.

- [ ] **Step 3: Implement `run`, `fetchLogo` and the CLI.**

- [ ] **Step 4: Run them to see them pass.** Run: `node --test test/films-build.test.js`. Expected: PASS.

- [ ] **Step 5: Commit.** `git commit -am "Films: build runner with a 30-day detail cache, retries, --force and --probe"`

### Task 6: Phone state, watchlist and backup

**Files:**
- Create: `films/store.js`
- Test: `test/films-store.test.js`

**Interfaces:**
- Produces:
  - `KEY = "films.v1"`
  - `load(storage = localStorage): State`. A State is `{ settings: { place: "all", era: "all", genre: "all", theme: "auto", hideSeen: false }, want: { [id]: Snap }, seen: { [id]: Snap } }`. Bad JSON gives the defaults. Wrap storage access in try/catch.
  - `save(state, storage = localStorage): void`
  - `snapshot(film: Film, at: string): Snap`, keeping `{ id, title, original, year, era, places, genres, director, cast, poster, at }`.
  - `toggleWant(state, film, at): boolean` and `toggleSeen(state, film, at): boolean`, each returning the new on/off. Marking Seen also removes the film from `want`.
  - `backupText(state): string`: `{ app: "films", version: 1, saved, want, seen }`.
  - `restore(state, text): { added: number }`. Merges by id, keeping existing entries. Throws `Error("This file is not a Films backup.")` for non-JSON, a wrong `app`, or entries without a numeric `id`, and changes nothing in those cases.

- [ ] **Step 1: Write the failing tests**:
  - `load falls back to defaults on bad storage`
  - `toggleSeen moves a film off the watchlist`
  - `backup round-trips and restore merges without duplicates`
  - `restore refuses foreign files`: `"not json"`, `{"app":"stocks-watchlist"}`, and a Films backup with an entry lacking `id` all throw the exact message, and the state is deep-equal before and after.

- [ ] **Step 2: Run them to see them fail.** Run: `node --test test/films-store.test.js`. Expected: FAIL.

- [ ] **Step 3: Implement the exports** in `films/store.js`.

- [ ] **Step 4: Run them to see them pass.** Run: `node --test test/films-store.test.js`. Expected: PASS.

- [ ] **Step 5: Commit.** `git add films/store.js test/films-store.test.js && git commit -m "Films: watchlist, Seen and backup on the phone"`

### Task 7: The shell on the Metro line, and the site wiring

**Files:**
- Modify: `metro.css` (tokens only), `sw.js`, `index.html`, `.gitignore`
- Create: `films/index.html`, `films/manifest.json`, `films/films.css`, `films/films.js`, `icons/films.svg`, `icons/films-180.png`, `icons/films-512.png`, `scripts/films-check.mjs`
- Test: `test/films-ui.test.js`

**Interfaces:**
- Consumes: `load`, `save` (Task 6), `PLACES` (Task 1).
- Produces (later tasks rely on these):
  - In `films/index.html`: `<html lang="en-AU" data-line="film">`, the Pretendard preload and `../metro.css` then `./films.css`. The header is `.top` with `<span class="roundel">影</span>`, `<h1>Films</h1>` and `<span id="want-badge" class="badge" hidden>`. Then `<main id="view" class="view">`. The tab bar is `<nav class="tabs" id="tabs">` with buttons `data-tab="browse|search|watchlist"` and `data-more`, each with an inline SVG `.ic`. The More sheet is `<dialog id="more" class="sheet">` with tiles `data-tab="settings"` and `data-act="backup"`. A film sheet `<dialog id="film" class="sheet">`, a hidden `<input type="file" id="file" accept="application/json">` and `<script type="module" src="./films.js">`.
  - In `films/films.js`:
    - `state`, `feed` (`null` until loaded), `render()`, and `go(tab)`.
    - More-sheet open and close with the swipe, Escape and backdrop behaviour of `app.js` lines 475–509, rewritten locally (`app.js` is the language engine; don't import it).
    - `applyTheme()` sets `data-theme` from `state.settings.theme`, as `app.js` line 513 does.
    - Loading: `fetch("./feed.json", { cache: "no-cache" })`; on failure or a 404, `feed = null`.
    - A screen registry, `const SCREENS = { browse, search, watchlist, settings }`, where each is `(el) => void`. Later tasks fill these in. For now each renders a placeholder heading, and Browse renders the exact no-feed message when `feed` is null.
  - `metro.css`: `:root[data-line="film"] { --route: #996cac; --route-strong: #7b4f92; --route-soft: #e6dcef; --route-ink: #5a3670; --route-sign: <brighter step> }`, plus matching rules in the dark media query and under `:root[data-theme="dark"][data-line="film"]` (night: a brightened route around `#b98fd6`, a dark soft, a light ink, a dark `--on-route`). Each night value must give at least 4.5:1 text contrast where it's used for text.
  - `icons/films.svg`: 512 × 512, `rx="110"`, fill `#7b4f92`, a white 影 (PingFang TC / Noto Sans CJK TC / WenQuanYi Zen Hei), and "Films" small beneath in `#e6dcef`. Render the PNGs at 180 and 512 with Playwright from a scratch script (not committed).
  - `sw.js`: add `"./films/", "./films/index.html", "./films/films.js", "./films/films.css", "./films/model.js", "./films/store.js", "./films/manifest.json", "./icons/films.svg", "./icons/films-180.png", "./icons/films-512.png"` to `FILES`, and a `path.includes("/films/") ? "./films/index.html"` branch in `fallbackPage`. Don't cache `feed.json` in `FILES`; the network-first fetch handler caches it on first load.
  - `index.html`: add `· <a href="./films/">Films</a>` to the link line.
  - `.gitignore`: `films/feed.json` and `films/tmdb.svg`.

- [ ] **Step 1: Write the failing wiring tests** in `test/films-ui.test.js`, modelled on `test/builder.test.js:162`:
  - `the service worker caches every Films file and routes offline Films pages home`: every `./films/…` and `./icons/films…` entry exists on disk; the listed core files are present; the `fallbackPage` branch matches.
  - `the film line is defined in light and both dark forms`: `metro.css` contains `[data-line="film"]` three times, and `#7b4f92`.
  - `the page uses the Metro shell`: `films/index.html` contains `data-line="film"`, `../metro.css` before `./films.css`, `>影<`, and no emoji (`/\p{Extended_Pictographic}/u` finds nothing).
  - `feed and logo are git-ignored; the home page links Films`.

- [ ] **Step 2: Run them to see them fail.** Run: `node --test test/films-ui.test.js`. Expected: FAIL.

- [ ] **Step 3: Build the shell, tokens, icons and wiring** as listed under Interfaces.

- [ ] **Step 4: Run the unit tests to see them pass.** Run: `npm test`. Expected: all PASS, including the existing suites.

- [ ] **Step 5: Start `scripts/films-check.mjs`.**
  - Copy the server and page setup from `scripts/spots-check.mjs` lines 1–45: 390 × 844, service workers blocked, `pageerror` collected, PASS/FAIL lines, a non-zero exit on any FAIL.
  - The feed is `FEED`, built in the script from the fixtures: `filmFrom` over `details.json` with `foundIn` from the place rules, then `assemble`.
  - Route `**/films/feed.json` to `FEED` or a 404, and `image.tmdb.org` to a 404.
  - Checks:
    - `no-feed message`: with a 404 feed, `#view` contains the exact message and there are no page errors.
    - `tabs switch`: each tab's button gets `.active`.
    - `night theme`: with `colorScheme: "dark"`, the body background is `rgb(13, 16, 19)`.
    - `Metro rules`: the computed `background-color` of `.roundel` is `rgb(153, 108, 172)`, and no text node in `body` matches `/\p{Extended_Pictographic}/u`.

- [ ] **Step 6: Run the browser check.** Run: `node scripts/films-check.mjs`. Expected: all PASS.

- [ ] **Step 7: Check the other Metro apps are untouched.** Run: `node scripts/snapshot.mjs --check && node scripts/korean-check.mjs`. Expected: both pass.

- [ ] **Step 8: Commit.** `git add -A films icons/films* metro.css sw.js index.html .gitignore test/films-ui.test.js scripts/films-check.mjs && git commit -m "Films: Metro shell, film line colour, icons and site wiring"`

### Task 8: Browse: chips, the era line, rows, the grid and Surprise me

**Files:**
- Modify: `films/films.js`, `films/films.css`, `scripts/films-check.mjs`

**Interfaces:**
- Consumes: `shelfLists`, `genreChips`, `erasWithFilms`, `rankMap`, `surprise`, `PLACES`, `ERAS`, `NAMED_ERAS`, `GENRES`, `weightedRating` (Tasks 1–3); `state.settings.place|era|genre` (Task 6); `openFilm(id, opts)` from Task 9. In this task, stub it to set `document.body.dataset.opened = id`, so the browser check can read it.
- Produces:
  - `posterURL(path: string | null, w: 185|342 = 185): string | null`, returning `https://image.tmdb.org/t/p/w${w}${path}`.
  - `tile(film): string` (HTML): the poster `<img loading="lazy">`, or a title tile when there's no poster or the image fails (an `onerror` swaps in the tile). The original title (with `lang` from the place and `.zh` for Chinese, so hanja amber applies) and the English title when it differs. The year, a drawn star and the rating. A drawn tick when Seen, a ribbon when wanted. `data-film="<id>"`.
  - DOM contract for the checks: `#place-chips button[data-place]`, `.era-line button[data-era]` (with `.on` when chosen; disabled when not in `erasWithFilms`; `.interchange` plus a `<small>` label for named eras), `#genre-chips button[data-genre]`, `#surprise`, `section.row-list[data-list="rated|popular|crowd|now|genre:<name>"]` each with `.posters` and an `All ›` button `data-all`, and `#grid` with `[data-sort="rated|popular|crowd"]`.

- [ ] **Step 1: Add the failing browser checks** to `scripts/films-check.mjs`:
  - `Browse shows the three lists`: with the fixture feed, `section[data-list="rated"]` and `[data-list="popular"]` each have ≥ 1 `[data-film]`.
  - `place narrows the rows`: tap `[data-place="KR"]` → every `[data-film]` in `rated` is a KR film id.
  - `era line rides and clears`: tap the 2000s station → it has `.on`; tap it again → none is `.on`. With KR chosen, `classics` is disabled.
  - `named era`: with HK chosen, the 1990s station has `.interchange` and the text "Golden age".
  - `thin shelf`: KR + classics → no `section.row-list` without films renders.
  - `filters persist`: reload → the same place is chosen.
  - `Surprise me opens a film`: tap `#surprise` → `body[data-opened]` holds a feed id, never one already Seen (mark one Seen first via `localStorage`).
  - `All opens the grid`: tap `All ›` on rated → `#grid` shows a three-across grid; tapping `[data-sort="popular"]` reorders it.
  - `no overflow`: `document.documentElement.scrollWidth <= 390` on Browse in both themes.

- [ ] **Step 2: Run them to see them fail.** Run: `node scripts/films-check.mjs`. Expected: the new checks FAIL.

- [ ] **Step 3: Implement Browse and the grid** in `films/films.js`. Styles go in `films/films.css`.
  - Rows are horizontal scrollers with `scroll-snap`. The grid shows 24 at a time, with more added by an `IntersectionObserver`.
  - The era line is a horizontal rail with 7 stations: it reuses the visual language of `metro.css` `.route` (a 6px rail, 22px stops, a 32px ringed you-are-here) laid out horizontally in `films.css`.
  - Genre rows (when the genre is `"all"`) come after the three lists, built from `genreChips` order, best rated within each genre, up to 6 genre rows.
  - Popular right now shows only with no era chosen.
  - Use the Surprise me icon (two drawn dice) and the star, tick and ribbon icons as inline SVG or CSS masks in the style of `metro.css` `--tick`.

- [ ] **Step 4: Run them to see them pass.** Run: `node scripts/films-check.mjs`. Expected: all PASS.

- [ ] **Step 5: Commit.** `git commit -am "Films: Browse with place chips, the era line, the three lists, the grid and Surprise me"`

### Task 9: The film sheet, More like this, Search and Watchlist

**Files:**
- Modify: `films/films.js`, `films/films.css`, `scripts/films-check.mjs`

**Interfaces:**
- Consumes: `moreLike`, `search`, `rankMap`, `PLACES` (Tasks 1–3); `toggleWant`, `toggleSeen`, `save` (Task 6); `tile`, `posterURL` (Task 8).
- Produces:
  - `openFilm(id: number): void` replaces the Task 8 stub. It fills and opens `#film`. When the film is no longer in the feed, it builds the sheet from the stored Snap (titles, year, people) and notes "No longer in this week's list".
  - Sheet DOM:
    - `.card.flash.film-sign` holds the poster (`w342`), the titles stacked (Hangul in `.k` Pretendard, Chinese in `.hanja.zh`, English in the sign ink) and a `.rule`. Below it: the year · place (Mainland or Taiwan from `country` for CN) · runtime · genres, then "8.1 · 3,201 ratings" with the drawn star, the ranks line ("#1 most popular in Hong Kong · #3 best rated"), the director, the cast and the plot.
    - `button[data-act="want"]` (text "Want to watch" or "On your watchlist") and `button[data-act="seen"]` ("Seen it" or "Seen").
    - Links: `a.trailer` (`https://www.youtube.com/watch?v=<key>`, only when there is a trailer), `a.tmdb` (`https://www.themoviedb.org/movie/<id>`), and `a.douban` (`https://search.douban.com/movie/subject_search?search_text=<encoded original>`, only for films in HK or CN). All have `target="_blank" rel="noopener"`.
    - `.more-like .posters` (from `moreLike`). Tapping one replaces the sheet's content.
    - `button[data-act="another"]` ("Another"), shown only when the sheet was opened by Surprise me. It draws again with `surprise` under the same filters and replaces the sheet.
  - `openFilm(id, { fromSurprise = false } = {})`. Task 8's `#surprise` passes `{ fromSurprise: true }`.
  - Search screen: `input[type=search]#q` (16px, with the system lens) and results as `.item` rows (a small poster, titles, year, place). Typing runs `search` (debounced 120 ms).
  - Watchlist screen: two `h2` sections, "Want to watch" and "Seen", newest first, as `.item` rows from the Snaps. Tapping a row opens `openFilm`. An empty section says "Nothing here yet".
  - `#want-badge` shows "N to watch" when N > 0.

- [ ] **Step 1: Add the failing browser checks**:
  - `film sheet`: tap a fixture tile for Infernal Affairs → `#film` is open and contains "無間道", "Infernal Affairs", "Andrew Lau", "ratings", and links `a.tmdb` and `a.douban`; Casablanca has no `a.douban`.
  - `want and seen`: tap want → the badge reads "1 to watch"; reload → it's still 1; tap seen → the badge is hidden and the film is listed under Seen on Watchlist.
  - `more like this`: the Infernal Affairs sheet's `.more-like` doesn't include itself.
  - `search`: typing "kung" lists Kung Fu Hustle; typing "살인" lists Memories of Murder; clearing it lists nothing.
  - `offline watchlist`: with a 404 feed and a stored Snap, Watchlist lists it and opening it shows "No longer in this week's list".
  - `sheet closes`: Escape closes `#film`.
  - `Another`: open via `#surprise` → `[data-act="another"]` is shown; tapping it changes the sheet to a different, unseen film. Opened from a tile, the sheet has no `[data-act="another"]`.

- [ ] **Step 2: Run them to see them fail.** Run: `node scripts/films-check.mjs`. Expected: the new checks FAIL.

- [ ] **Step 3: Implement the sheet, Search and Watchlist.** The sheet reuses the More sheet's open and close helpers.

- [ ] **Step 4: Run them to see them pass.** Run: `node scripts/films-check.mjs`. Expected: all PASS.

- [ ] **Step 5: Commit.** `git commit -am "Films: film sheet with More like this, Search and Watchlist"`

### Task 10: Settings, backup and attribution

**Files:**
- Modify: `films/films.js`, `films/films.css`, `scripts/films-check.mjs`

**Interfaces:**
- Consumes: `backupText`, `restore`, `save` (Task 6); `applyTheme` (Task 7).
- Produces: a Settings screen with these controls:
  - `button[data-theme]` cycles phone → light → dark, labelled "Theme: Phone/Light/Dark".
  - `input[type=checkbox]#hide-seen`: when on, Seen films leave the rows, the grid and Surprise me.
  - `button[data-act="backup"]` uses the share sheet or a download, as in `app.js` lines 346–353, with the file name `films-backup-YYYY-MM-DD.json`.
  - `button[data-act="restore"]` → `#file` → `restore`, then a toast "Added N films" or the error message.
  - A line "Catalogue built <d Month> · <N> films" from `feed.built`.
  - The attribution: `<img src="./tmdb.svg" alt="TMDB">` (hidden on error) and the exact notice text, always shown.
  - The More sheet's Back up tile runs the same backup.

- [ ] **Step 1: Add the failing browser checks**:
  - `theme cycles`: tapping `[data-theme]` twice → `html[data-theme="dark"]`.
  - `hide seen`: mark a film Seen, tick `#hide-seen` → its tile is gone from Browse.
  - `restore merges`: set `#file` to a backup holding 2 films (one already wanted) → the toast says "Added 1 film" and the badge counts 2. A foreign file shows "This file is not a Films backup."
  - `attribution`: Settings contains the exact notice, and "Catalogue built".

- [ ] **Step 2: Run them to see them fail.** Run: `node scripts/films-check.mjs`. Expected: the new checks FAIL.

- [ ] **Step 3: Implement Settings.** For the restore toast, use "Added 1 film" when N = 1 and "Added N films" otherwise.

- [ ] **Step 4: Run them to see them pass.** Run: `node scripts/films-check.mjs`. Expected: all PASS.

- [ ] **Step 5: Commit.** `git commit -am "Films: Settings, backup and restore, TMDB attribution"`

### Task 11: The deploy step, docs and the design system record

**Files:**
- Modify: `.github/workflows/pages.yml`, `README.md`, `DESIGN.md`, `.impeccable/design.json`
- Test: `test/films-ui.test.js`

**Interfaces:**
- Consumes: the CLI from Task 5.
- Produces:
  - In `pages.yml`, after the "Collect Spots events…" step:
    - A step "Restore the last Films feed and detail cache" (`actions/cache@v4`, paths `films/feed.json`, `films/tmdb.svg` and `~/.films-cache`, key `films-v1-${{ github.run_id }}`, restore-keys `films-v1-`).
    - Then "Build the Films catalogue (TMDB, weekly)", with `continue-on-error: true`, `timeout-minutes: 10`, `env: TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}`, and `run: node scripts/build-films.mjs`.
    - Add to the "Dictionary sizes" log-tail step a `node -e` line that prints `films: N films` and the count per place from `films/feed.json`, with `|| true`.
  - README:
    - A `# Films (/films/)` section in the style of the Spots section: what it is, the tabs, the three lists and why they're ranked within a place, the weekly build, the one-time TMDB key setup (the spec's steps), the attribution, the checks (`node --test test/films*.test.js`, `node scripts/films-check.mjs`, `node scripts/build-films.mjs --probe`) and the code layout.
    - A row in the app table.
    - A `node scripts/films-check.mjs` line in Development.
  - `DESIGN.md`:
    - Front matter colours: `line-5-purple: "#996cac"`, `line-5-purple-strong: "#7b4f92"`, `line-5-purple-soft: "#e6dcef"`, `line-5-purple-ink: "#5a3670"`, plus the night value chosen in Task 7.
    - In the Colors section, a fourth line: "**Line 5 Purple** … the Films app".
    - In Components, "The film sign" and "The era line".
    - The scope lines say "the Korean, Cantonese and English apps, and Films".
  - `.impeccable/design.json`: a matching `line-5-purple` entry in `colorMeta`.

- [ ] **Step 1: Write the failing test** `the deploy builds Films with the secret and never fails the deploy`: `pages.yml` contains `scripts/build-films.mjs`, `secrets.TMDB_API_KEY`, and `continue-on-error: true` within that step's block (slice from the step name to the next `- name:`), and `~/.films-cache`.

- [ ] **Step 2: Run it to see it fail.** Run: `node --test test/films-ui.test.js`. Expected: FAIL.

- [ ] **Step 3: Edit `pages.yml`, README, `DESIGN.md` and `design.json`** as listed under Interfaces.

- [ ] **Step 4: Run the full checks.** Run: `npm test && node scripts/films-check.mjs && node scripts/snapshot.mjs --check`. Expected: all PASS.

- [ ] **Step 5: Commit and push.** `git commit -am "Films: weekly build in the deploy, README and the design system record" && git push -u origin claude/zen-knuth-idjcig`. Report the Actions minutes.

### Task 12: The first real build (temporary probe), then the merge request

**Files:**
- Create, then delete before the merge: `.github/workflows/films-probe.yml`

**Interfaces:**
- Consumes: the `--probe` CLI from Task 5.

- [ ] **Step 1: Wait for the owner's key.** Confirm with the owner that `TMDB_API_KEY` is in the repository secrets. Don't ask for the key's value.

- [ ] **Step 2: Add the probe workflow** (modelled on commit 427f0ec's `spots-probe.yml`):

```yaml
# Temporary: the first real Films build, run from the branch before merge. Removed before merge.
name: Films probe
on:
  push:
    branches: ["claude/zen-knuth-idjcig"]
    paths: ["scripts/build-films.mjs", "films/model.js", ".github/workflows/films-probe.yml"]
permissions:
  contents: read
jobs:
  probe:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: node scripts/build-films.mjs --probe
        env:
          TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}
```

- [ ] **Step 3: Push and read the run.** Push, then read the probe job's log with the GitHub MCP tools (`actions_list` → `get_job_logs`). Expected:
  - films per place for every era (thin older cells are fine)
  - feed size under about 3,000 KB uncompressed (roughly 1 MB once Pages compresses it); if it's larger, shorten plots or move them to a separate file, the spec's fallback
  - poster coverage ≥ 90% and director coverage ≥ 90%
  - `failed` under 2% of calls
  - a sample film that reads correctly
  - the logo found (or a clear false)

- [ ] **Step 4: Fix any mismatch.** If field names or shapes differ from the fixtures, update `filmFrom` and the fixtures together (keeping our own plots), re-run the tests and push again. Repeat until the probe is clean. Adjust `MIN_VOTES` if a cell's rated list looks noisy.

- [ ] **Step 5: Delete the probe workflow and commit.** `git rm .github/workflows/films-probe.yml && git commit -m "Films: remove the probe workflow"`. Push, and report the minutes (probe runs included).

- [ ] **Step 6: Hand back to the owner.** Offer a pull request into `mainFluffy` (create it only when asked). After the merge, the first deploy builds the real feed. Check the deploy log's `films:` line and report the minutes.
