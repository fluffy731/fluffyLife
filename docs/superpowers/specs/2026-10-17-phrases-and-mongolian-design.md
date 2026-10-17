# Phrases, Learn Switch and the Mongolian App — Design Record

Date: 17 October 2026
Branch: `korean`

The user approved both designs in chat and asked for them to be built without
further review gates: "not big stake so just proceed anyway". This file
records the decisions made.

## 1. Phrases and the Learn switch (Korean and Cantonese)

### Kinds

- `kindOf(item)` in `lib/track.js` sorts every item into one of three kinds:
  - `"grammar"`: grammar points (items with a `form`).
  - `"phrase"`: vocab with `pos` `"phrase"` or `"idiom"`.
  - `"word"`: everything else.
- **Learn** gets chips: All · Words · Phrases · Grammar.
  - The chips filter the unit's unseen items.
  - The choice is remembered in `settings.learnKind`.
  - If nothing of that kind is left in the unit but other items are, Learn says so and offers All.
- **Browse** uses the same four chips.
- **Review** stays mixed.

### Korean phrases

- **Files:** `data/phrases-int.js` (100), `data/phrases-adv.js` (70), `data/phrases-beg.js` (40).
- **Row shape:** `[ko, hanja|null, zh, en, ex, exZh, exEn, note|null, check?]`.
- **Ids:** `p-<tier>-NNN`, positional, so new rows are appended at the end only.
- **Hanja:** filled only for 사자성어 and other hanja idioms, so the hanja quiz question applies to them.
- **Units:**
  - Phrases are spread evenly over each tier's existing units: phrase *i* goes to unit `floor(i × units / count) + 1`, which gives 5 per unit.
  - Within a unit, they are interleaved through the words (`lib/interleave.js`).
  - The word units from the mixing work are untouched.
- **Notes:** a usage note, when present, shows on the card back.

### Cantonese phrases

- **File:** `data/yue/phrases.js`, keyed by unit, with the same row shape as vocab and `pos "phrase"`.
- **Ids:** `y:<zh>`, unique across all Cantonese vocab.
- **Order:** interleaved through each unit's words.

## 2. Mongolian app (`/mongolian/`, pack `mn-zh`)

### Learner and language

- **Learner:** fluent in Mandarin (Simplified Chinese) and English; a complete beginner.
- **Language:** Khalkha Mongolian in Cyrillic script.
- **UI:** Simplified Chinese (`ui/zh.js`, same keys as `ui/en.js`).

### Content

- 12 units over three tiers:
  - a0: units 1–4;
  - a1: units 5–8;
  - a2: units 9–12.
- Each unit has about 22 words and about 5 phrases (`pos "phrase"`). Basic words come first and phrases are introduced in every unit.
- About 30 grammar points, with notes in Chinese.
- **Row shape:** `[mn, zh, en, pos, exMn, exZh, exEn, check?]`, with ids `m:<mn>`.
- **Grammar row shape:** `[form, unit, zh, en, noteZh, [[mn, zh, en]…]]`, with ids `mg:<unit>:<form>`.
- **Reading aid:**
  - A Latin transliteration is computed from the Cyrillic (`lib/mongol.js`, close to MNS 5217:2012).
  - It is never hand-typed.
  - It spells the letters, not exact sounds, so the 🔊 clip is the reference.
- **Home** shows a key to the letters a Chinese reader needs help with (ө ү х ц ч ш ж з э ы л), each with a hint in Chinese and a sample word to hear.

### Validation (`lib/validate-mn.js`)

- Mongolian fields must be Cyrillic only.
- Chinese fields must contain Han characters and none of a list of common Traditional-only characters.
- The usual required fields must be present, and ids must be unique.
- `node scripts/check-data.mjs mn` prints every problem.

### Audio

- Recorded clips use the `mn-MN-YesuiNeural` voice. They are generated at deploy like the other apps.
- iPhones have no Mongolian speech voice. Without a clip, 🔊 says so (`speechLang` has two entries) rather than reading Cyrillic with a wrong voice.

### Quiz types (`quiz/mn.js`)

- `meaning`: Cyrillic → Chinese.
- `reverse`: Chinese → Cyrillic.
- `read`: Cyrillic → which Latin spelling. This is reading practice for the alphabet.
- `listen`: clip → which word.
- `grammar`: example sentence → which pattern.

### Accuracy

The content is written by Claude. Rows Claude is unsure of carry the `?` flag. A native speaker should check the first units.
