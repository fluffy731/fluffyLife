# Spots Phase 1 (Find and stamp) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A home-screen web app at `/spots/` that finds places in Melbourne for "now", "late night" and "tomorrow" within a time and budget, shows real photos, prices, ratings, review summaries, hours and drive times from Google Places, and lets the owner save places, check in with a stamp, and keep a passport.

**Architecture:** Pure logic in `spots/model.js` (travel model, opening hours, prices, selection, day plan, storage) tested with `node --test`. One adapter, `spots/places.js`, turns Google Maps JavaScript API `Place` objects into a plain `Place` shape; `spots/samples.js` produces the same shape for sample mode and tests. Screens are vanilla ES modules over that shape.

**Tech Stack:** Vanilla ES modules, no build step, GitHub Pages, `sw.js` offline shell, Maps JavaScript API (Places library, loaded at runtime with the owner's key), IndexedDB for check-in photos, Playwright for the browser check.

**Spec:** `docs/superpowers/specs/2026-11-14-spots-design.md`

## Global Constraints

- English UI only; app name "Spots"; Australian spelling.
- No API key, saved place, check-in, photo or location is ever committed. The key lives in the phone's `localStorage` only.
- Storage key `spots.v1`; photos in IndexedDB database `spots-photos`, store `photos`.
- Google calls only on an explicit Find, Open place, Test or saved-place refresh; at most 8 photos per result list, loaded lazily; review summary and reviews only in Open place.
- Every screen showing Google content shows "Google Maps" attribution; photo authors are credited.
- Unknown values are shown as unknown, never guessed: no price → no price shown and the place still passes any budget; no hours → "Hours unknown" and the place is excluded from Now and Late night (it can't be shown as open).
- Day and night themes per the spec's token table; night has no glow and no violet tint.
- `prefers-reduced-motion` gives still versions of the stamp and card motion.
- Every new file is listed in `FILES` in `sw.js`.

## Review Focus

1. **Places that close after midnight** (bar open 16:00–02:00): at 01:30 Saturday it is open with 30 minutes left; at 03:00 it is closed. Pinned in Task 2.
2. **Location refused or slow**: the app falls back to Melbourne CBD and says so instead of hanging. Pinned in Task 6 (Playwright with no geolocation permission).
3. **Late night tapped in the afternoon**: results are for tonight from 10 pm, labelled "Tonight from 10 pm", with night drive speeds. Pinned in Task 3.
4. **A search returning nothing** (all closed, or budget too tight): a friendly empty state saying which limit to loosen. Pinned in Task 6.
5. **Restoring a backup on a phone that already has stamps**: merge by id, no duplicates, nothing lost. Pinned in Task 4.

---

### Task 1: Travel model, prices and kinds

**Files:**
- Create: `spots/model.js`
- Test: `test/spots-model.test.js`

**Interfaces:**
- Produces:
  - `CBD = { lat: -37.8136, lng: 144.9631 }`
  - `KINDS`: array of `{ id, label, visit, query, priced }` for `eat` (Eat, 60, "restaurant", true), `drink` (Drink, 60, "bar", true), `coffee` (Coffee, 30, "cafe", true), `sights` (Sights, 60, "tourist attraction", false), `activities` (Activities, 90, "things to do", false), `dessert` (Dessert, 30, "dessert", true); `kindOf(id)`.
  - `haversineKm(a, b) -> number`
  - `speedBand(date) -> "peak" | "day" | "night"` (peak 07:00–09:30 and 16:00–18:30 Mon–Fri; night 21:00–06:00)
  - `travelMinutes(km, { mode = "drive", at = new Date() }) -> number` (rounded, per the spec's speed table: road factor 1.3, +5 min parking; walk 4.5 km/h, factor 1.25, no parking)
  - `reachKm(minutes, { mode, at }) -> number` (straight-line km, capped at 50, inverse of `travelMinutes`)
  - `fmtMinutes(m) -> "about 25 min" | "about 1 h 10 min"`
  - `PRICE = { FREE: 0, INEXPENSIVE: 1, MODERATE: 2, EXPENSIVE: 3, VERY_EXPENSIVE: 4 }`; `priceLevelOf(value) -> 0..4 | null` (accepts those names in any case, with or without a `PRICE_LEVEL_` prefix, or a number)
  - `priceSymbols(level) -> "" | "Free" | "$" … "$$$$"`
  - `priceRangeLabel(range) -> "A$20–40" | "A$100+" | ""` where `range = { from, to, currency }` (currency AUD shows "A$", others show the code)
  - `fitsBudget(place, max) -> boolean` (max `null` = any; unknown price always fits)
  - `mapsUrl(place) -> string` (`place.mapsUrl` if set, else `https://www.google.com/maps/search/?api=1&query=<name, area>&query_place_id=<id>`; omit `query_place_id` for sample places)

- [ ] **Step 1: Write the failing tests** `travel model: 10 km at 1 pm on a Wednesday is about 31 min`, `…same 10 km at 11 pm is about 21 min`, `…peak is slower than day`, `…40 km uses the highway speed beyond 15 km`, `walk 1 km is about 17 min`, `reachKm inverts travelMinutes within 0.5 km and caps at 50`, `fmtMinutes formats 25 and 70`, `priceLevelOf reads MODERATE, PRICE_LEVEL_EXPENSIVE and 3`, `priceSymbols and priceRangeLabel`, `fitsBudget treats unknown price as fitting`, `mapsUrl builds a search link with the place id`. Use fixed dates such as `new Date(2026, 10, 18, 13, 0)` (a Wednesday).

- [ ] **Step 2: Run** `node --test test/spots-model.test.js` → FAIL (module not found).
- [ ] **Step 3: Implement** the Interfaces above in `spots/model.js`.
- [ ] **Step 4: Run** `node --test test/spots-model.test.js` → PASS.
- [ ] **Step 5: Commit** `Spots: travel model, prices and kinds`.

### Task 2: Opening hours

**Files:**
- Modify: `spots/model.js`
- Test: `test/spots-model.test.js`

**Interfaces:**
- Consumes: none.
- Produces (hours = `{ periods: [{ open: { day, hour, minute }, close: { day, hour, minute } | null }] } | null`, day 0 = Sunday, as Google gives them; `off` = the place's UTC offset in minutes or `null` for the phone's own offset):
  - `minutesLeft(hours, at, off) -> number | null` (0 when closed, `Infinity` when open 24 hours, `null` when hours unknown)
  - `isOpenAt(hours, at, off) -> boolean | null`
  - `nextOpen(hours, at, off) -> Date | null`
  - `hoursLabel(hours, at, off) -> "Open 24 hours" | "Open till 2:30 am" | "Closed · opens 9 am" | "Closed · opens Mon 9 am" | "Hours unknown"`
  - `dayHours(hours, day) -> "11:30 am – 10 pm" | "Closed" | "Open 24 hours" | ""` (several periods joined with ", ")

- [ ] **Step 1: Write the failing tests** `bar open 16:00–02:00: open at 01:30 Saturday with 30 min left`, `…closed at 03:00`, `…label at 23:00 is "Open till 2 am"`, `24-hour place (single period, no close) is open with Infinity left`, `closed place labels its next opening, naming the day when it isn't today`, `unknown hours give null and "Hours unknown"`, `utc offset: a place at +660 is evaluated in its own time`, `dayHours joins split lunch and dinner periods`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** Work in minutes of the week (0–10079) in the place's local time (`at` shifted by `off`, read with UTC getters; with `off = null` use local getters). A period whose close is earlier in the week than its open wraps past Saturday night.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Spots: opening hours`.

### Task 3: Choosing places: Now, Late night, Tomorrow

**Files:**
- Modify: `spots/model.js`
- Create: `spots/regions.js`
- Test: `test/spots-model.test.js`

**Interfaces:**
- Consumes: Task 1 and Task 2 functions.
- Produces:
  - `Place` (plain shape used everywhere): `{ id, name, kind, type, address, area, lat, lng, rating, ratingCount, price, priceRange, hours, off, photo: { url, author, authorUrl } | null, mapsUrl, summary: { text, disclosure } | null, reviews: [{ text, rating, author, when }], sample? }`
  - `score(place) -> number`: `(rating * count + 4.0 * 50) / (count + 50)`, unknown rating counts as 3.5 with count 0.
  - `driveBudget(totalMinutes, visit) -> number`: `max(5, floor((total - visit) / 2))`
  - `pickNow(places, { from, at, minutes, mode, priceMax, kind }) -> Place[]` annotated with `travel` (min) and `km`: open at `at`, `minutesLeft ≥ visit + travel`, `travel ≤ driveBudget`, fits budget; sorted by `score − 0.02 × travel`, deduped by id, at most 12.
  - `lateStart(now) -> { at: Date, tonight: boolean }`: `now` when 21:00–03:59, else today at 22:00 with `tonight: true`.
  - `pickLate(places, { from, at, maxMinutes, priceMax }) -> Place[]`: open at `at` with `minutesLeft ≥ 60`, night travel ≤ `maxMinutes`; sorted by closing time (latest first, 24 h last-but-equal to latest), then score; at most 12.
  - `DAY_SLOTS = { relaxed: [...4], full: [...5] }` of `{ id, label, time, kinds, query, visit }`: breakfast 09:00 coffee/eat "breakfast cafe" 45; morning 10:30 sights/activities "things to do" 90; lunch 12:30 eat "lunch" 60; afternoon 14:30 sights/activities "attractions" 90; dinner 18:30 eat "dinner restaurant" 75 (full only).
  - `slotTimes(slots, startHHMM, dayDate) -> Date[]` (shifts every slot by the start time's difference from 09:00)
  - `buildDayPlan(slots, candidatesBySlotId, { start, day, startTime = "09:00", priceMax }) -> [{ slot, at, place | null, travel, alternatives: Place[] }]`: for each slot in order, candidates open at that slot time with `minutesLeft ≥ visit`, fitting budget, not already used; pick max `score − 0.03 × travel from previous stop` (first stop: from `start`); alternatives = next two.
  - `tomorrow(now) -> Date` (tomorrow at 00:00 local)
  - In `spots/regions.js`: `REGIONS` array of `{ id, name, lat, lng, blurb }` for the ten regions in the spec; `surpriseRegion(recentIds, rand = Math.random) -> region` (prefers regions not in `recentIds`).

- [ ] **Step 1: Write the failing tests** `pickNow: 2 hours for Eat allows 30 min each way and drops a place 40 min away`, `…drops a place closing in 45 min`, `…drops unknown hours`, `…respects budget but keeps unknown price`, `pickLate: in the afternoon starts tonight at 22:00 and labels tonight`, `…sorts the 3 am closer before the midnight closer`, `…reaches further than the same minutes by day` (a place 22 km away passes at 23:00 with 30 min, fails at 17:00 with `pickNow` 30 min budget), `buildDayPlan: four relaxed stops, no repeats, each open at its time`, `…a slot with no open candidate gives place null, not a closed place`, `…prefers the nearer of two equal-score places`, `REGIONS have ten entries with lat/lng inside Victoria`, `surpriseRegion skips recent regions`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Spots: choosing places for now, late night and tomorrow`.

### Task 4: Storage, stamps and backup

**Files:**
- Modify: `spots/model.js`
- Test: `test/spots-model.test.js`

**Interfaces:**
- Produces:
  - `KEY = "spots.v1"`; `blank() -> { saved: [], stamps: [], settings: { key: "", sample: false, theme: "auto", lastBackup: null }, recentRegions: [] }`
  - `load(ls) -> state` and `save(ls, state)`: clean on load (drop malformed entries, coerce types), never throw.
  - `areaFromAddress(address) -> string`: suburb from "…, Fitzroy VIC 3065, Australia"; otherwise the second-last comma part; "" if none.
  - `savePlace(state, place, now) -> state` (stores `{ id, name, kind, area, lat, lng, savedAt, fetchedAt, sample? }` only), `unsave(state, id)`, `isSaved(state, id)`.
  - `staleSaved(state, now) -> ids` (fetched more than 30 days ago, not sample).
  - `addStamp(state, { place, rating, note, photoId, date }) -> { state, stamp }` with `stamp = { id, placeId, name, area, kind, date: "YYYY-MM-DD", rating, note, photoId }`.
  - `passportStats(state) -> { stamps, places, suburbs }`.
  - `backupJSON(state, photos /* {id: dataURL} */, now) -> string` (`{ app: "spots", v: 1, savedAt, saved, stamps, recentRegions, photos }`, settings and key excluded).
  - `mergeBackup(state, text) -> { state, photos, added }`: merge `saved` and `stamps` by id, keep existing on conflict, throw `Error("Not a Spots backup")` on wrong shape.

- [ ] **Step 1: Write the failing tests** `load survives junk and missing storage`, `savePlace keeps only the allowed fields`, `areaFromAddress reads Fitzroy and falls back`, `staleSaved finds entries older than 30 days`, `addStamp records today's date and the area`, `passportStats counts distinct places and suburbs`, `backup leaves out settings and the key`, `mergeBackup on a phone with stamps adds new ones, keeps existing, no duplicates`, `mergeBackup rejects other files`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Spots: storage, stamps and backup`.

### Task 5: Places adapter and samples

**Files:**
- Create: `spots/places.js`, `spots/samples.js`
- Test: `test/spots-places.test.js`

**Interfaces:**
- Consumes: `Place` shape, `kindOf`, `areaFromAddress`, `priceLevelOf`, `PRICE`.
- Produces:
  - Provider interface (both providers): `search({ query, kind, center, radiusKm, openNow, priceMax, max = 12 }) -> Promise<Place[]>`, `details(place) -> Promise<Place>` (adds `summary`, `reviews`), `label` ("Google Maps" | "Sample data").
  - `places.js`: `SEARCH_FIELDS`, `DETAIL_FIELDS` (per the spec's lists, JS camelCase: `id, displayName, location, formattedAddress, primaryType, rating, userRatingCount, priceLevel, priceRange, regularOpeningHours, utcOffsetMinutes, photos, googleMapsURI`; details add `reviewSummary, reviews`); `toPlace(gp, kind) -> Place` (defensive: `location.lat` as a function or a number, `priceLevel` as any enum spelling, `priceRange.startPrice.units` string or number, `reviewSummary.text` as a string or `{ text }`, missing fields → null); `loadGoogle(key) -> Promise<placesLibrary>` (injects `https://maps.googleapis.com/maps/api/js?key=…&v=weekly&loading=async&libraries=places&callback=…` once, times out after 15 s with `Error("Google Maps didn't load")`); `googleProvider(lib) -> provider` (search uses `Place.searchByText` with `locationBias: { center, radius }`, `isOpenNow`, `priceLevels` only for priced kinds, `maxResultCount`, `language: "en-AU"`, `region: "au"`; photos via `photo.getURI({ maxWidth: 800 })`); `testConnection(provider) -> { ok, fields: string[], error? }`.
  - `samples.js`: `sampleProvider() -> provider` producing deterministic places around any `center` (seeded by query and centre), names starting "Sample", `sample: true`, `photo: null`, a mix of hours (cafe 07:00–15:00, restaurant 11:30–14:30 and 17:30–22:00, bar 16:00–01:00, late eatery 17:00–03:00, a 24-hour diner, attraction 09:00–17:00), prices 1–4 and some unknown, ratings 3.8–4.8.

- [ ] **Step 1: Write the failing tests** `toPlace maps a Google-shaped object with method-style location`, `…with plain numbers and PRICE_LEVEL_ names`, `…keeps a review summary string or {text}`, `…missing photos, hours and price become null`, `…builds area from the formatted address`, `sampleProvider is deterministic and labelled Sample`, `sampleProvider places sit within radiusKm of the centre`, `sample hours include a place open past midnight and a 24-hour place`.
- [ ] **Step 2: Run** `node --test test/spots-places.test.js` → FAIL.
- [ ] **Step 3: Implement.** `places.js` must import cleanly in Node (no `window` at module top level).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `Spots: Google Places adapter and sample places`.

### Task 6: The app: Explore, place sheet, Saved, Check in, Passport, Settings

**Files:**
- Create: `spots/index.html`, `spots/spots.css`, `spots/spots.js` (boot, state, tabs, settings, provider choice, position), `spots/explore.js` (modes, results, place sheet), `spots/stampbook.js` (Saved, Check in, Passport, backup and restore), `spots/db.js` (IndexedDB photos, `thumb(file) -> Promise<Blob>` resized to 600 px JPEG at 0.8), `spots/manifest.json`, `icons/spots.svg`, `icons/spots-180.png`, `icons/spots-512.png`, `scripts/spots-check.mjs`
- Modify: `sw.js` (FILES, fallbackPage `/spots/`), `README.md` (a Spots section, unlisted like Travel)

**Interfaces:**
- Consumes: everything above.
- Produces: the screens described in the spec's "What the owner sees", with these exact behaviours the check script asserts:
  - Without a key or sample mode, Explore shows a setup card with "Set up Google" and "Try with sample places".
  - Mode buttons `#mode-now`, `#mode-late`, `#mode-tomorrow`; budget chips `[data-price="1".."4"|"any"]`; kind chips `[data-kind]`; Find button `#find`; results `.result`; place sheet `#sheet`; tab bar buttons `[data-tab="explore|saved|passport"]`, check-in `#fab`, settings `#settings-btn`.
  - Location refused or not answering in 8 s → CBD, with the note "Using Melbourne CBD (location is off)".
  - Empty results → "Nothing open within these limits. Try more time, a bigger budget or another kind."
  - Late night in the afternoon shows "Tonight from 10 pm".
  - Tomorrow shows one card per slot with time, place, drive between stops, and "Swap"; Save day saves all its places.
  - Check in: hold `#hold` 800 ms (Enter or Space stamps at once) → stamp animation → Passport with the new stamp first.

- [ ] **Step 1: Write `scripts/spots-check.mjs`** (pattern of `scripts/news-check.mjs`: local static server, 390×844, service workers blocked) asserting: setup card without key; sample mode Now/Eat/2 h gives results each with price or no price, rating, hours label and "about … min"; place sheet opens with a Google Maps link; Late night at a fixed 3 pm clock (Playwright `page.clock`) shows "Tonight from 10 pm"; Tomorrow relaxed gives 4 stop cards; Save on a result shows it in Saved; check-in by keyboard adds a stamp to Passport; with geolocation permission denied the CBD note shows; a 1 h + $ + Activities search far from any sample gives the empty-state text; theme switch to night sets `data-theme="dark"`; no horizontal scroll; no page errors.
- [ ] **Step 2: Run** `node scripts/spots-check.mjs` → FAIL (no app).
- [ ] **Step 3: Build the screens**, styles (spec token table, day and night), manifest, icons (render `icons/spots.svg` to the two PNGs with Playwright), `sw.js` and README.
- [ ] **Step 4: Run** `node scripts/spots-check.mjs` → all PASS; `npm test` → all PASS.
- [ ] **Step 5: Commit** `Spots: the app (Explore, Saved, Check in, Passport, Settings)`.

### Task 7: Whole-branch review and push

- [ ] **Step 1:** Fresh reviewer reads the spec, this plan and the diff; fix what it finds.
- [ ] **Step 2:** `npm test` and `node scripts/spots-check.mjs` → PASS.
- [ ] **Step 3:** Push to the session branch; report GitHub Actions minutes per `CLAUDE.md`.
