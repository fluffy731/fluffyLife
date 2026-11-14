# Spots: design

Written 14 November 2026, revised the same day after the owner's review of the first plan and mockup. Calls marked *my call* are open to change.

## Intent

A home-screen app for finding somewhere to go in Melbourne, today, tonight or tomorrow, where every place you visit becomes a stamp you collect (the 打卡 idea). Later it carries on overseas as a travel log.

The owner's own scenarios, which drive the design:

1. **A random day, not much time.** "I want to go somewhere now, but I only have a couple of hours." Limit by time or distance.
2. **Planning tomorrow as a full day.** Recommend further places, a proper day out.
3. **Late night.** Anything still open, even if it's further away, because the night drive is smooth.

Plus: a budget for each place (price range), real photos, a Google Maps link, and a summary of reviews.

## Changes from the first plan (owner, 14 November)

- **English only.** No Cantonese labels. The app is called **Spots**.
- **Budget:** every place shows its price level ($ to $$$$) and, when Google has it, a range per person ("A$20–40"). Searches filter by budget.
- **Real photos, Google Maps link, review summary, opening hours:** from Google Places, called from the phone with the owner's own key (below).
- **Three modes** on the main screen: **Now**, **Late night**, **Tomorrow**.
- **Night colours rebuilt.** The day look stays. Night drops the violet and the glow: charcoal "asphalt" with the same bright poster colours as the day.

## Goals

- Answer "where can I go right now, in the time I have, for my budget?" in two taps.
- Late at night, show what is open, and reach further because the roads are clear.
- Tomorrow, build a whole day: breakfast, a morning sight, lunch, an afternoon activity, dinner, in a sensible order, in town or on a day trip.
- Every result shows a real photo, price, rating with a review summary, opening hours and how far it is, with a one-tap Google Maps link.
- One-tap check-in that leaves a stamp, so a collection builds up.

## Non-goals

- Reviews written for other people, a social feed, bookings.
- Accounts, a server, or sync between phones.
- Live traffic. Drive times are estimates (below).

## Anti-goals

- Anything personal in the public repo: no saved places, check-ins, photos, locations or API keys are ever committed.
- Storing Google's content beyond what Google allows (below).
- A corporate or sterile look.

## Constraints

- Static files on GitHub Pages, vanilla ES modules, no build step, offline shell through `sw.js` (which only caches the site's own files, so Google's responses are never cached).
- **The repo is public.** The Google key lives only on the phone.
- Each home-screen app keeps its own storage, separate from Safari's. [Likely]
- iPhone can clear a website's storage, so backup is built in.
- GitHub Actions minutes are free while the repo is public.

## Where the data comes from

### Google Places, from the phone

- The app loads the **Maps JavaScript API** (Places library) with a key the owner pastes into Settings once. The key is stored in that phone's storage and never committed.
- **Key setup** (in the app's Settings and the README): Google Cloud project with billing turned on, enable *Maps JavaScript API* and *Places API (New)*, create a key restricted to the website `https://fluffy731.github.io/*` and to those two APIs, and set a daily quota cap on Places so a misused key can only exhaust the day's quota, not run up a bill.
- **Cost:** since March 2025 Google gives a free monthly allowance per service: 10,000 calls for Essentials, 5,000 for Pro, 1,000 for Enterprise. Searches that ask for rating, price, opening hours or review summary bill as Enterprise, and each photo shown is one photo call. A few searches a day stays inside the free allowance. [Likely: the per-service figures for Text Search Enterprise and Photos are from the pricing table, which this session could not open.] To keep inside it, the app asks Google only when you tap Find, loads at most 8 photos per search lazily, and fetches the review summary only when you open a place.
- **What a search asks for:** id, name, location, address, primary type, rating, rating count, price level, price range, regular opening hours, UTC offset, photos and Google Maps link. Opening a place also asks for the review summary and up to five reviews.
- **Review summary:** Google's AI summary where it offers one, shown with Google's own disclosure line. Google's documentation listed it for the US, UK, India and Japan; whether Australia has it is unconfirmed [Guessing]. Where it's missing: the rating, the count and the two most helpful review excerpts with their authors, plus "All reviews on Google".
- **Attribution:** "Google Maps" is shown on every screen with Google content, and photo authors are credited, as Google's terms require.
- **Storage rules:** a saved place keeps Google's place id indefinitely, its name and position for up to 30 days (refreshed when opened), and the owner's own notes, ratings and photos. Photos, ratings, hours and reviews are fetched live when shown. Nothing from Google goes into the repo.

### Without a key

- The Google Maps link still works: it's a plain Maps URL (`https://www.google.com/maps/search/?api=1&query=…&query_place_id=…`), free and with no key.
- **Sample mode:** Settings → "Try with sample places" fills the app with clearly labelled sample places, so the owner can try every screen before setting up a key. The tests use the same samples.

## The three modes

All three share a **budget** control (up to $, $$, $$$ or $$$$, or any) and **what** chips (Eat, Drink, Coffee, Sights, Activities, Dessert).

### Now (short on time)

- **Time I have:** 1 h, 2 h, 3 h, half day. **Getting there:** drive or walk.
- Each kind has a typical visit length (eat 60 min, drink 60, coffee 30, sights 60, activities 90, dessert 30). The longest drive each way is (time I have − visit length) ÷ 2, converted to a distance with the travel model below. Example: 2 hours for dinner leaves 30 min each way.
- Only places open now that stay open for at least the visit are shown, nearest-and-best first.

### Late night

- Default from 9 pm to 4 am. **Night drive:** up to 15, 30 or 45 min.
- Shows places open now that stay open at least another hour, sorted by how late they close, then by rating. Each card says "Open till 2:30 am".
- Night roads are faster in the travel model, so 30 minutes reaches about twice as far as at 5 pm.

### Tomorrow (full day)

- **Where:** Around town, a day-trip region, or Surprise me (a region you haven't been to lately). Regions (*my call*, with centre points in `spots/regions.js`): Yarra Valley, Dandenong Ranges, Mornington Peninsula, Phillip Island, Daylesford and Hepburn, Great Ocean Road (Torquay to Lorne), Bellarine and Queenscliff, Macedon Ranges, Ballarat, Werribee.
- **Start time** (default 9 am) and **pace** (relaxed: 4 stops; full: 5 stops).
- Slots: breakfast or coffee, morning sight or activity, lunch, afternoon sight or activity, dinner (full pace). One Google search per slot within about 15 km of the region's centre, filtered by budget and by being **open at that slot's time tomorrow**.
- The plan builder picks one place per slot by rating, review count and the extra driving it adds, avoiding repeats, and shows the drive to the first stop and between stops. Swap any stop for the next best. Save the whole day.

### The travel model (`spots/model.js`, tested)

Straight-line distance × 1.3 for roads, plus 5 minutes to park. Speeds:

| When | City part (first 15 km) | Beyond 15 km |
|---|---|---|
| Peak (7–9:30 am, 4–6:30 pm weekdays) | 22 km/h | 70 km/h |
| Daytime | 30 km/h | 85 km/h |
| Night (9 pm–6 am) | 50 km/h | 95 km/h |
| Walking | 4.5 km/h (road factor 1.25, no parking) | |

Times are shown as "about 25 min". The same model, run backwards, gives the search radius for a time limit (up to Google's 50 km limit on a search radius).

## What the owner sees

```
┌──────────────────────────────────────┐
│ Spots                     ⚙          │
│ Where to?                            │
│ [ Now ] [ Late night ] [ Tomorrow ]  │
│ Time I have  1h [2h] 3h  Half day    │
│ Budget  $  $$ [$$$] $$$$  Any        │
│ What   [Eat] Drink  Coffee  Sights   │
│ [        Find places        ]        │
│ ┌──────────────────────────────────┐ │
│ │ [ real photo ]           $$  ★4.6│ │
│ │ Noodle bar · Fitzroy             │ │
│ │ Open till 11 pm · 14 min · 6 km  │ │
│ │ "Generous bowls, fast service…"  │ │
│ │ [Save] [Google Maps] [Check in]  │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ Explore  Saved  (Check in)  Passport │
└──────────────────────────────────────┘
```

- **Explore:** the three modes and results. A place opens into a sheet with a bigger photo, the review summary, today's and tomorrow's hours, price range, the Google Maps link and Save / Check in.
- **Saved:** places you want to go, nearest first, with the budget filter.
- **Check in** (centre button): pick a saved or nearby place, rating, note, your own photo (from the camera roll, kept as a small copy), then hold the button for the stamp.
- **Passport:** stamps by suburb, stats, collections, backup.
- **Settings** (gear): Google key and setup steps with a Test button, sample mode, home position fallback (Melbourne CBD when location is off), theme, backup and restore.

## Look and feel ("Neon laneway", revised)

| Token | Day | Night (asphalt) | Use |
|---|---|---|---|
| Page | `#F4F1FA` pale lilac wall | `#141418` charcoal | background |
| Card | `#FFFFFF` | `#1F1F26` | surfaces |
| Ink | `#1B1035` | `#F3F1F6` | text |
| Eat | `#FF6B35` tangerine | same | kind |
| Drink | `#FF3D7F` hot pink | same | kind |
| Sights | `#2E6BFF` electric blue | `#4C82FF` | kind |
| Activities | `#7BC300` lime | same | kind |
| Coffee / Dessert | `#8B5CF6` violet | `#9D74FF` | kind |
| Stamp | `#E63946` vermilion | `#FF4D5A` | stamps |
| Gold | `#FFC93C` | same | prices, stars, complete |

- By day: paste-up posters with 2 px ink outlines and hard offset shadows. At night: the same posters on asphalt, outlines in a soft grey, black offset shadows, no glow and no violet tint.
- Type: system sans for text, heavier weights for headings; numbers in tabular figures. No web fonts needed offline.
- Moves: the stamp slams down with an ink splash; result cards slide in; everything has a still version under Reduce Motion.

## Phases (revised)

| Phase | Delivers |
|---|---|
| **1. Find and stamp** (this build) | The three modes, budget, results with photo, price, rating, review summary, hours, drive time and Maps link; place sheet; Saved; Check in with stamp; Passport; Settings with key setup, sample mode, backup and restore; offline shell; tests |
| **2. New places and map** | The once-a-day feed of new openings from free Melbourne food and what's-on sites (`scripts/build-spots.mjs`), matched to Google places on the phone; a map of saved, visited and new places |
| **3. Overseas** | Trips tab taking over Travel's planner and packing list (migrated from Travel's backup), stamps by city and country, trip recap image |
| **4. Extras** | Suburbs lighting up, collections, year in review, rain-aware picks (Open-Meteo), a daily Shortcuts nudge |

## How it fits the repo

- Folder `/spots/`: `index.html`, `spots.css`, `spots.js` (screens), `model.js` (pure logic), `places.js` (the Google adapter, which turns Google's objects into plain ones), `samples.js` (sample places), `regions.js`, `db.js` (photos in IndexedDB), `manifest.json`; icons `icons/spots.svg`, `-180.png`, `-512.png`. All listed in `FILES` in `sw.js`.
- Unlisted, like Travel and Stocks: not on `index.html`, `noindex` on the page (*my call*).
- Tests: `test/spots-model.test.js` (travel model, radius, opening hours across midnight, price mapping and filters, ranking, Now/Late/Tomorrow selection, day plan, storage cleaning, backup merge, stamps) and `test/spots-places.test.js` (the adapter against Google-shaped fixtures). `scripts/spots-check.mjs` drives the app in Playwright in sample mode.
- The Google adapter is the one part that can't be checked here without a key. Settings → Test connection reports which fields came back, so the first live run shows at once if anything needs adjusting.

## Risks

- **Field names in the live Google library differ from the documentation used here.** The adapter reads every field defensively and the Test button reports what came back. [Likely to need one small fix on first live run]
- **Review summaries may not cover Australia.** The fallback shows the rating and two review excerpts.
- **Cost if the key is misused.** The key is restricted to the site and the two APIs, kept off the repo, and has a daily quota cap.
- **Drive-time estimates are rough.** Labelled "about", with the Google Maps link for the real route.
