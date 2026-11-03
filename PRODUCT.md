# Product

<!-- impeccable:product-schema 1 -->

Scope: the language trainers in this repo (`korean/`, `yue/`, `english/`, `mongolian/`), which share one engine (`app.js`). The News, Travel, MC and Stocks apps are separate products and are not covered here.

## Platform

web

## Users

- **한자 Korean (`/korean/`):** one person, the owner. A Chinese reader (Cantonese and Mandarin) at intermediate Korean (TOPIK 3–4), studying alone. Confirmed 3 November 2026.
- **광동어 · 粵語 (`/yue/`) and English · 영어 (`/english/`):** a Korean speaker. Cantonese from zero, and cannot read Chinese characters yet; English at intermediate moving to advanced. Taken from README.md, not from the interview.
- **蒙古语 Mongolian (`/mongolian/`):** a Mandarin and English speaker starting from zero (README.md).

All of them use it as an iPhone home-screen app (Safari, Add to Home Screen), in short bursts through the day at the hourly nudge, on the commute (one hand, mixed light), and in the evening or in bed (low light, longer sessions). Confirmed for the Korean app.

## Product Purpose

A personal vocabulary and grammar trainer per language: learn a unit's new words, then review what is due, scheduled by FSRS. Success is steady daily review with little friction, and words that stick.

## Positioning

The Korean app opens every Sino-Korean word through the Chinese character a Chinese reader already knows: 경제 is 經濟, with Traditional Chinese beside the English. The Cantonese app does the reverse for a Korean speaker, pairing each character with its Korean hanja reading (學校 학·교 ↔ 혹·하우) and spelling every sound in 한글 coloured by tone. The Korean app also teaches from the owner's own K-songs (♪ Songs).

## Operating Context

- Tabs: Home (word of the hour, current unit), Learn, Review (Again / Hard / Good / Easy), Quiz (practice and unit tests), Browse (search plus an offline dictionary), Settings, and ♪ Songs (Korean only).
- A Shortcuts automation opens the app every hour; Home shows a word of the hour chosen by the clock.
- Offline once installed; no server, no account. Progress lives in the phone's localStorage, songs in IndexedDB; Export/Import moves them as one JSON file.

## Capabilities and Constraints

- Static files on GitHub Pages, deployed from `mainFluffy`. No build step: vanilla ES modules, a service worker (`sw.js`) caching listed files network-first.
- One engine (`app.js`) renders every app's markup; packs (`packs/*.js`) and card renderers (`cards/*.js`) supply each language's content.
- Recorded audio clips for 🔊 (the iPhone mutes its own speech voice on silent).
- Interface languages: English for Korean, Korean for Cantonese and English, Simplified Chinese for Mongolian.
- Golden DOM snapshot (`test/golden/ko.json`) and browser checks (`scripts/*-check.mjs`) guard behaviour.

## Brand Commitments

- App names and icons: 한자 Korean (한), 광동어 · 粵語 (粵), English · 영어 (Aa), 蒙古语 (蒙).
- Hanja are shown beside every Sino-Korean word, and Cantonese syllables are coloured by tone 1–6 with the tone number as a superscript.

## Evidence on Hand

- Real content: 1,080 Korean words, 270 phrases and grammar points (`data/`); 301 Cantonese words; 20 English units; Mulberry Symbols pictograms (`pics/ko/`, CC BY-SA 4.0).
- There are no testimonials, user counts or claims to show, and none should be invented.

## Product Principles

1. Fewest taps from opening the app to the next due card.
2. The characters are the hook: hanja and tone colours carry meaning, so they are never decoration.
3. Calm, grown-up study. Not childish or gamified (no mascots, confetti or streak pressure), and not corporate or sterile.
4. Every feature works offline, one-handed, in any light.

## Accessibility & Inclusion

Readable in daylight, on a moving train and in the dark: light and dark themes are both first-class, and tap targets suit one-handed use.
