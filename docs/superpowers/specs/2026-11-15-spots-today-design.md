# Spots: Today (phase 2) design

Written 15 November 2026. Follows `2026-11-14-spots-design.md`; this is its phase 2, re-scoped by the owner's question on 15 November: "Didn't you already have a few places suggestion? Depending on the hours of the day and day of the week and like any new events popping up etc that you can suggest?" The owner then said "Yes go ahead" to the recommendation below. Calls marked *my call* are open to change.

## Intent

Spots today answers only when asked: pick a mode, tap Find. The owner wants it to suggest: what suits this hour and this day, what's on, and what's new in town. Phase 2 adds a **Today** screen that does that without a tap, and without spending the Google allowance.

## Goals

- Open the app and see, for this moment: two or three one-tap ideas that suit the time of day, the day of the week (public holidays count as Sundays) and the weather.
- See what's on today (tonight, after 5 pm), and what's on this weekend, from free Melbourne listings.
- See what's new in town: restaurant, bar and café openings and noteworthy events written up in the last three weeks.
- Save an event; it shows in Saved until it's over, and on the day it's offered first in Check in.

## Non-goals

- A map (the old phase 2 had one; it waits for a later round, *my call*).
- Push notifications or a daily nudge (phase 4).
- Ticket prices, bookings, or every event in greater Melbourne.
- Matching every article to a Google place automatically.

## Anti-goals

- Spending the Google allowance just by opening the app. Today makes **no** Google call until the owner taps something.
- Copying articles. Each item keeps a title, a short excerpt (at most about 200 characters), the source's name, date, picture link and a link back, as the News app does.
- Anything personal in the repo. Saved events stay on the phone.

## Constraints

- Static site on GitHub Pages; the phone only downloads a finished JSON file. Same pattern as News and Stocks: a script runs in the hourly GitHub run, writes `spots/feed.json`, and the deploy publishes it. Public repo, so the minutes are free.
- This session's network blocks the sources, so they were tested from GitHub Actions (three probe runs on 15 November, recorded below).
- No new dependencies.

## Sources (tested from GitHub Actions, 15 November 2026)

| Source | How | What it gives | Used for |
|---|---|---|---|
| **What's On Melbourne** (City of Melbourne) | Its public, keyless MCP endpoint `https://whatson.melbourne.vic.gov.au/mcp`, tool `search_tool`, plain JSON-RPC POST (no session needed) | Title, one-line blurb, page URL, venue address, start and end dates; filters `category` (`things_to_do`…), `sub_categories` (`free`, `music`, `market`…), `date_keyword` (`today`, `tomorrow`, `this_weekend`), 20 per page. About 316 listings a day, mostly long-running exhibitions, workshops and tours, in a fixed order with one-day events mixed in from page 2 | Events today, tomorrow and this weekend; the `free` sub-category marks free ones |
| **Eventfinda** | RSS: `/feed/events/melbourne/whatson/today.rss`, `this-weekend.rss`, `upcoming.rss` | Title, blurb, date range, next session time, venue, suburb (from the link), picture | Events, especially outside the City of Melbourne |
| **Time Out Melbourne** | RSS `/melbourne/feed.rss` (100 items) | Articles: things to do, news, restaurants; picture in the body | What's new |
| **Concrete Playground Melbourne** | RSS `/melbourne/feed` (10 items) | Articles in `/event/`, `/restaurants/`, `/bars/`, `/cafes/`; picture | What's new |
| **Google News search** | RSS search for Melbourne openings, and for "things to do this weekend" round-ups, in the last 7 days | Headlines from Broadsheet, Good Food, Secret Melbourne and others (Broadsheet has no feed of its own); links go through Google News | What's new; weekend round-up links |
| **Open-Meteo** | Daily forecast for Melbourne | Rain chance and top temperature, 7 days | Rain-aware and hot-day ideas |
| **Nager.Date** | Public holidays API | Australian holidays, Victoria's marked `AU-VIC` | Holidays count as Sundays |

Tried and left out: Broadsheet (no feed), Urban List and Weekend Notes (Cloudflare blocks scripts), Secret Melbourne's own feed (empty reply), allevents.in (works, but its map positions are all the city centre and it mixes in ticket resellers), Reddit, NGV's feed (collection items, not events), Beat (gig news without structured dates).

## The feed (`spots/feed.json`)

Built by `scripts/build-spots.mjs` in the hourly run (`--probe` reports each source). Dates are Melbourne dates.

```
{ built, today: "2026-11-15",
  weather: [{ date, rain, max }],            // 7 days
  holidays: [{ date, name }],                // Victoria, this year and next
  events: [{ id, src, title, blurb, url, venue, address, area, image,
             from, to,                        // overall date range, "YYYY-MM-DD"
             days: ["2026-11-15"],            // dates a source listed it for (today / tomorrow queries)
             weekend: "2026-11-21",           // the Saturday of the weekend a source listed it for, if any
             time: "19:30",                   // session start on its listed day, when known
             free: true|null, cat }],
  fresh: [{ id, src, title, blurb, url, image, date, kind, venue?: { name, address } }],
  sources: [{ id, ok, count }] }
```

- **Event categories** (`cat`), by keywords in the title (then the blurb), in this order: market, comedy, music, film, theatre, festival, arts, food, family, talk, sport, outdoors, other. Each has an emoji.
- **Free:** listed under What's On's `free` sub-category, or "free" in the title or blurb.
- **Outdoors:** park, garden, river, beach, walk, run, picnic, cruise or open-air in the title, blurb or venue. On a rainy day outdoor events sort lower.
- **What's On paging:** up to 10 pages for today, 6 each for tomorrow and this weekend, and the `free` sub-category for each, fetched at most every 3 hours (and straight after Melbourne midnight) to go easy on the City's server. Eventfinda and the article feeds are fetched every hour.
- **Duplicates** across sources (the same normalised title, or one title with an add-on such as "Opera Up Late" and "Opera Up Late with Reuben Kaye"; only when the dates overlap) keep What's On's copy, which has the address.
- **What's new** keeps items for 21 days by merging with the last published feed (restored from the Actions cache, as Stocks does, or else fetched from the live site), newest first, at most 40. Kinds: eat, drink, coffee, dessert, or other (events and things to do), from the link section and keywords. Event write-ups (Time Out's things-to-do, Concrete Playground's `/event/`) always count; other articles only when the headline reads as an opening or something new (open, opening, new, launch, first look, pop-up, coming soon, returns), and never when it's about a closure.
- **Round-ups:** "things to do this weekend / this week" articles from the last 7 days, kept as links under the weekend list.
- If a source fails, its items from the last build are kept (events that haven't ended; what's-new items still inside 21 days), so a bad hour never empties the screen. Each source's own lists are cached before merging (`~/.spots-cache/raw.json`, in the Actions cache, never published) and merged afresh every run, so a source that is down or reused never freezes or drops what the other adds (review fix, 15 November). A What's On fetch with pages missing keeps the last lists alongside and isn't counted as fetched, so the next hour tries again.
- **Times.** For markets, festivals and exhibitions, Eventfinda's start time is when it opens: they stay on all day, shown as "From 11 am"; from 5 pm only those opening at 5 or later, or festivals, stay. Everything else with a time is a session, gone an hour after it starts (15 minutes, from 5 pm).
- **Merging** never joins two events in different suburbs (Eventfinda's plain "Melbourne" fits any), and add-on title matches also need venues that don't disagree.

## The Today screen

Today becomes the first tab and opens by default. The tab bar becomes **Today · Explore · (Check in) · Saved · Passport**; Settings moves to a gear in the header (*my call*: the first plan's sketch had it there, and it's rarely needed once the key is in).

```
┌──────────────────────────────────────┐
│ Spots            Sun 15 Nov 11:40  ⚙ │
│ Sunday morning · 🌧 92% · 17°        │
│ RIGHT NOW                            │
│ [☕ Brunch     ] [🖼 Gallery or museum] │
│ [🎬 Something fun indoors          ] │
│ ON TODAY                       23 ›  │
│ 🛍 Stock Up Vintage Market   Free     │
│    Queen Victoria Market · all day   │
│ 🎤 Sunday Night Stand-Up · 8 pm      │
│ TOMORROW (Sun) / THIS WEEKEND        │
│ …                                    │
│ NEW IN TOWN                          │
│ [pic] Two new restaurants from …     │
│       Time Out · 10 Nov              │
└──────────────────────────────────────┘
```

### Right now (ideas for the moment)

Pure function `ideasFor(now, { rain, max, holiday })` in `spots/today.js`, tested. The day is weekday (Mon–Thu), Friday, Saturday or Sunday; a public holiday counts as Sunday. The part of the day: early (5–8), morning (8–11), lunch (11–2), afternoon (2–5), evening (5–9), late (9 pm–5 am). A table maps each (day, part) to an ordered list of ideas; the first three that fit are shown. Rain ≥ 60% swaps outdoor ideas for indoor ones; 30° or hotter puts a gelato idea first.

Each idea is either a preset for Explore (mode, kinds, time, travel) or an events idea ("Markets on today (3)", "Comedy tonight (2)", "Free things on today"), shown only when the feed has some. Tapping a preset switches to Explore with the preset set and runs Find, so it costs what a Find costs and nothing before; tapping an events idea filters the On today list to that kind. Examples:

| When | Ideas |
|---|---|
| Weekday early | Quick breakfast (Now · Coffee · 1 h) |
| Weekday lunch | Quick lunch (Now · Eat · 1 h), Coffee |
| Weekday evening | Dinner nearby, After-work drinks |
| Friday evening | Dinner and drinks (3 h), Plan tomorrow (Tomorrow · Surprise me) |
| Saturday or Sunday morning | Brunch (Coffee + Eat · 2 h), Markets on today, Out and about (Sights + Activities · half day) |
| Weekend afternoon | Out and about, Dessert run |
| Rainy afternoon | Gallery or museum (Sights · 3 h), Something fun indoors (Activities · 3 h) |
| Late, any day | Late-night eats (Late · Eat + Dessert), Bar still open (Late · Drink, Friday and Saturday first) |

Plan tomorrow uses Around town instead of Surprise me when tomorrow's rain chance is 60% or more.

### On today, and what's next

- **On today** (called **Tonight** from 5 pm, without sessions that have already started): events listed for today by a source (`days`), plus short events (three days or less) whose range covers today, so a stale feed still shows something. Because most listings run for months, the order is: one-day and short events first, then last chances (ending within 3 days), then just opened (started in the last 7 days), then timed sessions, then the long runs; free first among equals, outdoor last when rain is likely. Six shown, the rest behind "Show all".
- The second list depends on the day: **This weekend** Monday to Friday, **Tomorrow** on Saturday and Sunday. Same order.
- Each row: emoji, title, venue or suburb, time ("8 pm", "All day", "On till 22 Nov"), Free tag. Tapping opens a sheet: picture, blurb, dates, venue and address, **Details** (the source's page), **Google Maps** (a plain search link on the venue and address, no key), **Save**.

### New in town

Cards with the picture, title, source and date, linking to the article, food and drink first. The article feeds don't name venues reliably, so there's no automatic Google match (*my call*; What's On's restaurant listings carry no opening dates, so they can't say what's new).

### When there's no feed

Before the first hourly run after deploy, or offline with nothing cached: "Events and new openings arrive with the next hourly update." Right now ideas still work, because they need only the clock (the weather and holidays just refine them).

## Near a place (added 15 November)

The owner, the same day: "say if I'm going to a place then the app can suggest places in the area for great google reviews like more than 1000+ 5 star reviews etc".

- **What "great reviews" can mean.** Google's Places API gives a place's average rating and its total number of reviews, not the spread of stars, so the filter is an average of at least ★ 4.5 from at least 1,000 reviews by default, both adjustable (★ 4.3 / 4.5 / 4.7; 300 / 1,000 / 2,000). The screen says so in one line.
- **Where it lives.** A fourth Explore mode, **Near** ("top-rated"), with: Going to (typed venue, address or suburb, or a chip for a saved event's venue or a saved place), Within (a 500 m or 1 km walk, or a 10, 15 or 20 minute drive; the owner asked the same day for "a short drive" too, so a 15-minute drive is the default; drive minutes come from the travel model, parking included, and the search radius is that drive's reach at the time), Rated, Reviews, What (default Eat, Drink, Coffee) and Budget. **★ Top-rated near here** on the place sheet, the event sheet and the Saved rows opens it already filled in. Today's Right now puts **Near <venue>** first when a saved event is on today and hasn't started.
- **How it searches.** Where you're going is found with one small Text Search (id, name, location, address; skipped for a saved place, which has a position). Then one Text Search per kind around it (up to 20 results, Google's `minRating` filter in half-star steps; if Google ever refuses that field, the search runs without it and Spots filters by rating itself). `pickNear` in `model.js` keeps places inside the walk (by distance) or the drive (by estimated minutes), at or above the rating and review count, within budget, sorted by rating then review count, six per kind, and counts how many more would show with a third of the reviews so the empty state can suggest it.
- **Cost.** One tap is 1 + one per kind searches (4 by default), billed like any Find.

## Saved events

- **Save** on an event keeps `{ id, title, url, venue, address, area, cat, day, to, time }` on the phone (our own copy of public listing data, not Google's), where `day` is the first day it's listed for from the day of the list it was saved from (Today: today; This weekend: Saturday; Tomorrow: tomorrow), else that day or its start.
- **Saved** shows **Coming up** above the places: saved events by date, with Details, Maps and Remove. Events drop off the day after they end.
- **Check in** offers today's saved events first. The stamp's kind comes from the category: market, food → Eat; arts → Sights; everything else → Activities. Its area is the suburb, so Passport's suburb count stays honest.
- Backup and restore carry saved events.

## How it fits the repo

- `scripts/build-spots.mjs` (fetch, parse, merge; `--probe`), tested in `test/spots-feed.test.js` with recorded fixtures of each source's format.
- `spots/today.js` (pure: day and part of day, ideas, which events to show, labels), tested in `test/spots-today.test.js`.
- `spots/todayview.js` (the screen), `spots/index.html` (tabs and gear), `spots/spots.js` (the Today tab, feed loading), `spots/explore.js` (run a preset), `spots/stampbook.js` (saved events, check-in), `spots/model.js` (saved events in storage and backup), `spots/spots.css`.
- `.github/workflows/pages.yml`: restore the last `spots/feed.json` from the cache, then `node scripts/build-spots.mjs` (`continue-on-error`, like News).
- `sw.js`: the new files in `FILES`. The feed itself is cached by the service worker's normal network-first rule, so the last one works offline.
- `scripts/spots-check.mjs`: Today with a fixture feed (ideas at a fixed time, events, a saved event in Saved and Check in).
- The probe workflow and script used for recon are removed before merge.

## Risks

- **What's On's endpoint is a service for AI agents, not a documented API.** It could change shape. The parser is tolerant, the source is one of several, and the last good items are kept when it fails. [Likely to need a small fix someday]
- **Eventfinda's feeds are capped at about 20 items a page.** Two or three pages are fetched.
- **Openings are guessed from headlines.** Some noise gets through; the 21-day window keeps the list short.
- **Feed pictures are hotlinked** with no referrer; a picture that fails falls back to the emoji tile.
