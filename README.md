# 한자 Korean

A personal Korean vocabulary and grammar trainer that shows **hanja (漢字)** and Traditional Chinese beside every Sino-Korean word, so a Chinese reader gets the meaning at a glance. Spaced repetition (SM-2), a TOPIK-ordered study track, and a clock-driven "word of the hour". Static files only: no server, no account, works offline once installed.

## Install on iPhone

1. Open the hosted page in Safari (GitHub Pages: `https://<user>.github.io/<repo>/`).
2. Share → **Add to Home Screen**.
3. Open it from the home screen once so the offline cache fills.

### Hourly reminder

iOS does not let a web app set its own alarm. Use a Shortcuts automation:

1. Shortcuts → Automation → **+** → **Time of Day**, repeat **Hourly**.
2. Action: **Open App** → choose the home-screen app (or **Open URL** with the page address).
3. Turn off *Ask Before Running*.

The Home tab shows a word of the hour, chosen from the current unit by the clock, so it is the same word for the whole hour and changes on the hour.

## Study track

Units run **Intermediate (TOPIK 3–4) → Advanced (TOPIK 5–6) → Beginner (TOPIK 1–2)**. Each unit has 20 words and 2–3 grammar points. A unit counts as learned once every item has been introduced; the next one unlocks then, but you can jump to any unit from Settings.

- **Learn** introduces unseen items of a unit. "Got it" schedules a review tomorrow; "Already knew" in two days.
- **Review** shows everything due. Again / Hard / Good / Easy.
- **Browse** searches by 한글, 漢字, 中文 or English; tap an item to see examples, edit it, or reset its progress. **+ Add** creates your own words or grammar points.
- **Settings** exports and imports a JSON backup. Progress lives in the browser's localStorage only, so export before clearing Safari data.

## Editing the seed data

Words are in `data/vocab-int.js`, `data/vocab-adv.js`, `data/vocab-beg.js` as compact rows:

```
[ko, hanja|null, 中文, english, pos, example, 例句中文, example English, check?]
```

Grammar is in `data/grammar.js`. Ids and units are assigned by **position** (20 words per unit), so inserting a row in the middle shifts later ids and orphans their progress; append new rows at the end of a tier or add them inside the app instead. Entries marked `check: true` (shown with a `?` badge) are ones the author was unsure of.

After changing any file, bump `VERSION` in `sw.js` so installed copies refresh.

## Development

```
npm test        # node --test: scheduler, track, storage, data validation
```

No build step. Serve the folder with any static server to try it locally.

## Future

The data is a *pack* (`data/pack.js`) with `target` and `support` languages, so a reverse pack — Cantonese for Korean speakers, with jyutping instead of hanja — can slot in without changing the app.
