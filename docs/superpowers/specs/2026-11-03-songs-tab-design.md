# Songs Tab (Korean App): Design Record

Date: 3 November 2026
Branch: `claude/nice-fermi-xjgt3m`

The user approved this design in chat, section by section. It covers what you see and how it works. Their answers:

- **How translations are made:** Claude API with the user's own key.
- **Link to reviews:** tap-to-add only.
- **Song list:** comes from the user's YouTube Music library, imported into the app.

## Goal

Learn Korean from the songs the user already listens to:

- Each line of a song is shown with:
  - Revised Romanisation
  - Traditional Chinese
  - English
- Grammar points and key words are called out, with hanja for Sino-Korean words.
- Any of them can be added to the normal FSRS reviews with one tap.

## Hard constraint: no lyrics in the repo

The repo and the GitHub Pages site are public. Song lyrics, and translations of them, are copyrighted. If they were committed or published here, they would be redistributed.

- Lyrics live only on the phone:
  - fetched by the phone at runtime, or pasted in by the user
  - stored in the phone's IndexedDB
  - included in the user's own backup file
- Nothing about songs is written to the repo or the site. The user's song list counts as personal listening data and is not committed either.
- Tests and fixtures use lyrics written for this purpose, never real song text.

## What the user sees

### Tab

- A 7th tab, **♪ Songs**, appears in the Korean app only.
- The tab buttons are written into each app's `index.html`, so only `korean/index.html` gets the ♪ Songs button. The Korean pack sets `songs` (the view module), and `app.js` uses it to render that tab. The Cantonese, Mongolian and English apps are unchanged.
- At 320 px wide, 7 tabs are about 45 px each, which is enough for the 11 px labels.

### Song list

- Each song shows its title, artist, status and grammar-point count. The status is one of:
  - *not translated*
  - *lyrics only*
  - *translated*
  - *error*
- Buttons: **+ Add song** and **Import list**.

### Adding one song

1. **Search** by title and/or artist. The phone queries LRCLIB (below) and lists the matches with album and length. The user picks one.
2. **Paste lyrics** is always offered as well, for songs LRCLIB doesn't have or gets wrong.
3. The lyrics are shown for checking, with title and artist editable. Saving stores the song as *lyrics only*.
4. **Translate & explain** shows the estimated cost for the chosen model before sending (see Cost), then sends.

### Importing a list

**Import list** accepts either of these:

- **Pasted lines:**
  - `Title – Artist`, also accepting `-`, `—` or a tab as the separator.
  - A line with no separator is taken as a title only.
- **A CSV file, such as a Google Takeout YouTube Music library export:**
  - The first column whose header contains "title" (any case) is the title.
  - The first column whose header contains "artist" is the artist.

Each imported song is saved as *not translated*. The user can then:

- open one, which fetches its lyrics from LRCLIB (the first match, or a choice when there are several), or
- tick several, see their **total** estimated cost, and confirm a batch.

Batch songs are sent one at a time. Any song that fails is marked *error* and left for a retry. Duplicates are skipped: same title and artist after trimming, ignoring case.

### Reading a song

- **Summary at the top:**
  - The model used and the actual cost of the translation.
  - Each grammar point in the song, once, with how many lines use it.
  - A ✓ on points already in the user's reviews.
- **Each line shows:**
  - The Korean, with 🔊 using the existing `speak()`.
  - Revised Romanisation from `lib/pron.js` (`romanize`), computed offline.
  - Traditional Chinese (`lang="zh-Hant"`).
  - English.
- **Tapping a line expands it**, using the existing `.item` / `.open` pattern:
  - **Grammar:** form, English and Chinese meaning, and a note on how it works in this line.
  - **Words:** the dictionary form, hanja (or *고유어 · native word*), Chinese, English and part of speech.
  - Each grammar point and word has a **+ Add to study** button, or **✓ In reviews** if it's already there.
- **Lines with no Hangul** (English lines, ad-libs) are shown as they are, with no translation.
- **Repeated lines** (choruses) are translated once and the result is reused at each repeat.
- Songs open offline once translated.

### Adding to study

"+ Add to study" behaves like **Got it** in Learn: `grade(undefined, "good")` schedules the first review for tomorrow.

- **Grammar point the app already has** (`appId` set and found among the app's grammar): that existing card is scheduled. No duplicate is made.
- **Grammar point the app doesn't have:** a custom grammar item is created.
  - Shape: `{ id: "u…", kind: "grammar", form, en, zh, note, ex: [{ ko: line, zh: lineZh, en: lineEn }] }`.
  - Tier and unit are those of the current unit.
  - It must pass `validateItem(…, "grammar")`.
- **Word:** if a seed or custom word with the same `ko` already exists, that card is scheduled instead. Otherwise a custom vocab item is created.
  - Shape: `{ id: "u…", kind: "vocab", ko: base, hanja, zh, en, pos, ex: line, exZh: lineZh, exEn: lineEn }`.
  - Tier and unit are those of the current unit.
  - It must pass `validateItem(…, "vocab")`.
- **Notes about the new card:**
  - It shows in Browse and Review like any other custom item and can be edited there.
  - `note` records the song, for example `♪ Title – Artist`.

### Settings (Korean app)

A **Songs** section with:

- **Claude API key:**
  - A password field with Save and Clear buttons.
  - Stored under `localStorage["korean.songs.apiKey"]`, outside the main state, so `exportJSON` never includes it.
  - Shown masked (`sk-ant-…abcd`).
  - A one-line note recommends setting a monthly spend limit on the key in the Anthropic Console.
- **Model:** Claude Haiku 5.5 (default, the user's choice), Claude Sonnet 5.5 or Claude Opus 5.5. The rough per-song cost is shown beside each. Saved in `settings.songModel`.

## How it works

### Files

| File | Holds |
|---|---|
| `songs/model.js` | Pure logic, testable in Node: line splitting and dedupe, list import parsing, request building, response validation, study-item creation, cost estimate |
| `songs/lrclib.js` | LRCLIB search and result normalisation |
| `songs/claude.js` | Loads the SDK on demand and makes the call; returns validated analysis plus usage |
| `songs/db.js` | IndexedDB wrapper: database `fluffy-songs`, store `songs`, keyPath `id` |
| `songs/view.js` | Renders the Songs tab and the song page; handles their clicks |
| `lib/vendor/anthropic-sdk.js` | The official `@anthropic-ai/sdk` (version pinned in `package.json`) bundled into one ESM file by `scripts/vendor-sdk.mjs`, the same way `ts-fsrs` is vendored. Loaded with `import()` only when translating |

- **`app.js`:**
  - Renders the `songs` tab through `pack.songs`. The tab label `t.tabs.songs` is added to the UI strings.
  - Passes the view a context: state, persist, rebuild, render, grammar, items, `currentUnit`, `grade`, `esc`, `say`.
  - Adds songs to Export and Import.
  - Adds the Settings section.
- **`sw.js`:** the new files are listed in `FILES`, except the vendored SDK, which is only needed online.
- **`README.md`:** gets a Songs section.

### Lyrics source: LRCLIB

- `GET https://lrclib.net/api/search?track_name=…&artist_name=…` (or `q=…`).
- Fields used: `trackName`, `artistName`, `albumName`, `duration`, `plainLyrics`. If `plainLyrics` is empty, timestamps are stripped from `syncedLyrics`.
- `instrumental: true` results are listed as instrumental and can't be translated.
- LRCLIB is free, needs no key, and allows browser calls [Likely]. This could not be checked from the build container, because its network blocks lrclib.net. The browser test mocks it, and the first real check happens on the phone.
- If LRCLIB is down or has no match, the user pastes the lyrics instead.

### Song record (IndexedDB)

```
{ id: "s…", title, artist, album|null, source: "lrclib"|"paste"|"import",
  status: "queued"|"lyrics"|"done"|"error", error|null,
  lyrics: string|null,                       // as fetched or pasted
  analysis: { model, at, usage: {in, out, cacheRead}, costUsd,
              lines: [ { ko, zh, en, grammar: [G], words: [W] } ] } | null,   // one entry per UNIQUE Hangul line
  addedAt }
G = { form, appId|null, en, zh, note }
W = { ko, base, hanja|null, zh, en, pos }
```

To display a song, each lyric line is matched to its unique entry by its normalised text: trimmed, with spaces collapsed.

### The Claude call

- **SDK and client:** `new Anthropic({ apiKey, dangerouslyAllowBrowser: true })`. Browser use with the user's own key is the intended case for that option.
- **Model:** `settings.songModel`, default `claude-haiku-5-5`.
- **Request:**
  - `output_config: { effort: "medium", format: { type: "json_schema", schema } }`, so the reply is JSON in a fixed shape.
  - Streamed, ending in `finalMessage()`, with `max_tokens: 64000`.
- **Refusal fallbacks:** on Opus 5.5 and Sonnet 5.5, `fallbacks: "default"` with beta `server-side-fallback-2026-07-01`. Haiku 5.5, the default, has none, so a refusal on Haiku suggests retrying that song with Sonnet 5.5. If `stop_reason` is still `"refusal"` at the end, the song is marked *error* with a plain message.
- **System prompt:**
  - Fixed text, sent with `cache_control`, so a batch of songs reads it from cache.
  - Translation rules:
    - Traditional Chinese, natural rather than word for word.
    - English, natural.
    - Note poetic or casual contractions (난 = 나는, 널 = 너를) in the grammar note.
  - Grammar rules:
    - Pick points worth learning; skip particles and endings a TOPIK 3 learner already knows unless they are used unusually.
    - Set `appId` only when the line really uses that listed point.
  - Word rules:
    - Up to 5 content words per line.
    - Dictionary form, and hanja for Sino-Korean words.
  - The app's grammar list as `id | form | en`, one per line.
- **User message:** the numbered list of unique Hangul lines only.
- **Checking the response** (`songs/model.js`):
  - Every field must be a string of the right type, and the line count must match.
  - Any `appId` that is not a real grammar id becomes `null`.
  - Over-long strings are cut.
  - A failed check marks the song *error* and nothing is saved.
  - Rendering always escapes text (`esc`), so lyrics or model output can never run as code on the page, where the API key lives.

### Cost

**Estimate before sending:**

- Input tokens ≈ system prompt (measured once and written into `songs/model.js`) + lyrics characters ÷ 1.5.
- Output tokens ≈ 200 per unique Hangul line + 2,000 for thinking.

**Prices in `songs/model.js` (US$ per million tokens):**

| Model | Input | Output |
|---|---|---|
| Opus 5.5 | 4 | 20 |
| Sonnet 5.5 | 2 | 10 |
| Haiku 5.5 | 0.10 | 0.50 |

**Expected cost per typical song** [Guessing, to be checked after the first real songs]:

| Model | Per song |
|---|---|
| Opus 5.5 | US$0.10–0.25 |
| Sonnet 5.5 | about half of Opus |
| Haiku 5.5 | about US$0.01 |

**Actual cost:** worked out from `usage` and saved on the song.

### Errors

Each case below gives a plain message. Lyrics are kept, and **Retry** re-sends.

| Case | Message and action |
|---|---|
| No key | Message, with a link to Settings |
| Bad key (401) | Says to check the key |
| Offline | Says to try again when online |
| Rate limited (429) | Says to wait and retry |
| Server error (5xx) | Says to retry |
| Refusal | Says the model declined the song |
| Invalid response | Says the response couldn't be read |

### Backup

- **Export:** the backup JSON gains `songs: [...]`, read from IndexedDB.
- **Import:**
  - Songs are cleaned so only strings and numbers in the fields above are kept.
  - Each song is merged by `id`.
  - Old backups without `songs` import as before.
- The API key is never in a backup.

## Testing

- **`test/songs-model.test.js`** covers:
  - line splitting, dedupe and the no-Hangul rule
  - list parsing: separators, title only, CSV headers, duplicates
  - request building: unique lines only, and the grammar list present
  - response checking: rejects bad shapes, nulls unknown `appId`, cuts long strings
  - study items: grammar and word items pass `validateItem`, and existing cards are reused instead of duplicated
  - cost estimate and actual cost from usage
- **`test/songs-lrclib.test.js`** covers turning LRCLIB results into the app's format, with synced lyrics falling back to plain text.
- **`scripts/songs-check.mjs`** (Playwright) runs with LRCLIB and `api.anthropic.com` replaced by fakes. It checks:
  - the Songs tab shows in the Korean app only
  - search, then pick, then translate
  - the line view and line expansion
  - "+ Add to study" then puts the card in Review the next day (clock moved forward)
  - Export holds the songs but not the key
  - Import restores them
  - a translated song opens offline
- **Existing checks** must stay green:
  - `npm test`
  - `node scripts/snapshot.mjs --check`, after updating the golden file for the new tab button
  - `node scripts/korean-check.mjs`

## Out of scope

- Playing the songs. The app has no rights to the audio, so 🔊 reads the lines with the phone's voice.
- Showing lines in time with the music.
- Songs in the Cantonese, Mongolian and English apps.
- Reading YouTube Music from the app. The library reaches the phone through Import list.
