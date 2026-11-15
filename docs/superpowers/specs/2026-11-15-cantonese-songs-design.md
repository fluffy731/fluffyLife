# ♪ Songs in the Cantonese app: design

Approved by the owner on 15 November 2026 (playback approved: "Good push and merge").

## Intent

Help a native Korean speaker learn Cantonese from her own Cantopop. She is a beginner who can't read Chinese characters yet (PRODUCT.md), so every lyric line leads with sound: the app's tone-coloured 한글 spelling, then Jyutping, the characters and the Korean meaning. She uses it herself on her own phone: the owner's Claude API key goes into her app's Settings, and she adds, imports and translates her own songs (option A).

## Goals

- **Same tab, new language.** Everything the Korean Songs tab does: add or import songs, batch translation that resumes after the app closes, find a song, swap wrong lyrics, and add a word or grammar point to her reviews.
- **Line display.** Each lyric line shows its sound as tone-coloured 한글 with superscript tones, then Jyutping, the characters and a natural Korean meaning. Tapping a line opens grammar notes in Korean and the line's words. Each word comes with the hanja bridge: its Korean hanja reading next to the Cantonese sound.
- **Grammar.** Grammar notes cover what a beginner needs: sentence-final particles, aspect markers (咗, 緊, 過), negation (唔, 冇), and colloquial words that differ from written Chinese. A point that matches one of the app's 41 grammar lessons schedules that lesson, never a duplicate.
- **Accuracy guard.** Claude supplies the Jyutping and the app turns it into 한글, so nothing is hand-spelt. A line is marked **?** when:
  - a syllable isn't valid Jyutping, or
  - the syllable count doesn't match the characters, or
  - a syllable isn't among the readings the app's Cantonese dictionary (`dict/yue.json`) lists for that character.
- **Separation.** Her songs and key are kept apart from the Korean app's, even in a Safari tab on the same site: a separate IndexedDB database and a separate key name.

## Non-goals

- No lyrics in the repo (it is public). Lyrics come from LRCLIB or a paste, as now.
- No new paid calls without a tap: translating stays a button press, with the cost shown first.

## Approaches

1. **Shared engine with language profiles** (chosen). `songs/view.js`, `model.js`, `claude.js` and `db.js` take a profile.
   - `songs/ko.js` is the Korean profile: English UI, current behaviour.
   - `songs/yue.js` is the Cantonese profile: Korean UI, the Cantonese prompt and schema, the Jyutping check, the line display and the study cards.
   - Every later fix lands in both apps.
2. A separate copy of the Songs module for Cantonese: fastest to start, but about 800 duplicated lines that drift apart.
3. A shared core with separate views: less duplication than 2, but the view holds most of the behaviour (batch, find, lyrics swap), so most of it would still be copied.

## Decisions (builder's calls)

- **Where the tab goes.** Songs is a tile in the Cantonese app's More sheet, beside Browse and Settings. The bottom bar keeps Home, Learn, Review and Quiz.
- **Prompt.** The reader is a native Korean speaker and a beginner who can't read characters. Each line comes back with `jp` (Jyutping, one syllable per character, tone digits), `ko` (a natural Korean meaning) and `en`.
  - **Grammar** entries have `form`, `formJp`, `ko`, `en`, a note in plain Korean, and `appId`, which must come from the app's grammar list.
  - **Words:** up to 5 per line, each with `zh`, `jp`, `ko`, `en` and `pos`.
- **Lyric lines** are lines with Han characters. Repeats are translated once. A result with no Han lines is "no Chinese lyrics", which the Korean app calls "no Korean lyrics".
- **Study cards.**
  - **Words** become Cantonese vocab cards: the line as the example, valid under `validateYue`.
  - **Grammar** becomes the app's own card when `appId` matches, otherwise a custom grammar card with the line as its example.
  - Either way the first review is tomorrow, like Got it.
- **Model and cost.** Haiku 5.5 is the default, as in the Korean app, with the same cost estimate and spend-limit note.
- **Backups.** Songs travel in the Cantonese app's own Export/Import backup.
