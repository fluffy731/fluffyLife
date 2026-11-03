---
name: Metro line
description: The Korean, Cantonese and English study apps. The study track is a metro line and every card is a station sign; each app owns one line colour.
colors:
  ground: "#f1f3f2"
  surface: "#ffffff"
  surface-2: "#e7eae9"
  ink: "#14181c"
  muted: "#59626b"
  hair: "#dde1e3"
  hair-strong: "#c3c9ce"
  sign: "#20262c"
  sign-2: "#2b3238"
  sign-ink: "#ffffff"
  sign-muted: "#b3bcc5"
  sign-hair: "#3a424a"
  signage-yellow: "#ffd166"
  hanja-amber: "#8f5a00"
  ok: "#1e7f45"
  warn: "#a35f00"
  bad: "#c0282d"
  easy: "#1d5fb8"
  line-2-green: "#00a84d"
  line-2-green-strong: "#007a37"
  line-2-green-soft: "#cdebd8"
  line-2-green-ink: "#005c29"
  mtr-red: "#e2231a"
  mtr-red-strong: "#c41c14"
  mtr-red-soft: "#f8d0cd"
  mtr-red-ink: "#9b1410"
  line-1-blue: "#0052a4"
  line-1-blue-soft: "#cbd9ee"
  line-1-blue-ink: "#003f80"
  ground-night: "#0d1013"
  surface-night: "#171b20"
  surface-2-night: "#232931"
  ink-night: "#e8ecef"
  muted-night: "#9aa4ae"
  sign-night: "#232a32"
  hanja-night: "#f5c451"
  line-2-green-night: "#2bc06a"
  mtr-red-night: "#ff5a4f"
  line-1-blue-night: "#4d8fe8"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, Noto Sans KR, PingFang TC, system-ui, sans-serif"
    fontSize: "clamp(32px, 11.5vw, 50px)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  hanja:
    fontFamily: "PingFang TC, Heiti TC, Noto Sans CJK TC, Noto Sans TC, Apple SD Gothic Neo, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.06em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, Noto Sans KR, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, Noto Sans KR, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, Noto Sans KR, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, Noto Sans KR, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  badge: "6px"
  control: "12px"
  card: "14px"
  sign: "16px"
  dialog: "18px"
  pill: "999px"
spacing:
  gutter: "16px"
  stack-sm: "8px"
  stack-md: "12px"
  section: "26px"
components:
  button-primary:
    backgroundColor: "{colors.line-2-green-strong}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 10px"
    height: "50px"
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 10px"
    height: "50px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    height: "36px"
  chip-on:
    backgroundColor: "{colors.line-2-green-strong}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
    height: "36px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "11px 14px"
  sign:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.sign-ink}"
    rounded: "{rounded.sign}"
    padding: "20px 18px 18px"
  list-item:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  tier-badge:
    backgroundColor: "{colors.line-2-green-soft}"
    textColor: "{colors.line-2-green-ink}"
    rounded: "{rounded.badge}"
    padding: "1px 8px"
---

# Design System: Metro line

Source of truth: `metro.css` (the Korean, Cantonese and English apps). The Mongolian app keeps `style.css` and is outside this system. Product facts: `PRODUCT.md`; the direction this was built from: `docs/design/language-apps.md`.

## Overview

**Creative North Star: the Metro line.** Seoul Metro and MTR wayfinding, the signage the learners read every day. The study track is a line of stations and every study card is a station sign: the word in heavy white gothic on a charcoal panel, the hanja beneath it in signage yellow, then the meaning, as a trilingual Seoul station sign stacks 한글, 漢字 and English. Calm and grown-up: no mascots, confetti or streaks, and nothing that slows the next card. Light (platform grey by day) and dark (signboard charcoal at night) are equal; the phone's setting or Settings → Theme picks.

The world lends only type, palette, density and one signature move (the line). Navigation, buttons, inputs and lists stay the standard ones an iPhone user already knows.

## Colors

Each app owns one line colour, set by `<html data-line="ko|yue|en">`, and that colour does every accent job: the rail and stations, the you-are-here ring, the primary button, selected chips, the active tab bar marker and the header roundel.

### Primary (the line, one per app)
- **Line 2 Green** (#00a84d; strong #007a37 for filled buttons and text; soft #cdebd8 for track not yet travelled; ink #005c29 for text on soft): the Korean app.
- **MTR Red** (#e2231a; strong #c41c14; soft #f8d0cd; ink #9b1410): the Cantonese app.
- **Line 1 Blue** (#0052a4; soft #cbd9ee; ink #003f80): the English app.
- On a charcoal sign the line is drawn a step brighter (`--route-sign`: #00b453, #ff3b30, #3d8ff0) so the 4px rule reads. At night the line brightens (#2bc06a, #ff5a4f, #4d8fe8) and filled buttons take dark text (`--on-route`).

### Secondary
- **Signage Yellow** (#ffd166 on signs; #f5c451 at night): hanja, only on a sign or a dark ground.
- **Hanja Amber** (#8f5a00): hanja on a light ground (Browse rows, the bridge).

### Neutral
- **Platform Grey** (#f1f3f2) ground by day; **Signboard Charcoal** (#0d1013) ground at night.
- **Surface** (#ffffff / #171b20): lists, buttons, inputs, the tab bar.
- **Sign Charcoal** (#20262c / #232a32): every study card and the quiz prompt.
- **Ink** (#14181c / #e8ecef), **Muted** (#59626b / #9aa4ae), **Hair** (#dde1e3 / #262c33).

### State
- Again #c0282d, Hard #a35f00, Good #1e7f45, Easy #1d5fb8 (night: #ff7b72, #f2b84b, #5fd38d, #7fb2ff). Easy is blue in every app so it never reads as Good.
- Cantonese tones 1–6 keep their colours (light: #c62828 #b45309 #2e7d32 #1565c0 #6a1b9a #6d4c41; on signs and at night: #ff8a80 #ffb74d #81c784 #64b5f6 #ce93d8 #d39b6a). They carry meaning and are never decoration.

### Named Rules
**The One Line Rule.** An app uses its own line colour and no other accent. Status colours appear only where they mean a grade, a tone or a result.

**The Sign Rule.** Inside a sign, colour tokens are re-pointed (`--ink`, `--muted`, `--hanja`, `--hair`, tones, `--route`), so anything placed on a sign takes the sign's palette by itself.

## Typography

The platform's own gothic is the lettering: Apple SD Gothic Neo on iPhone for Hangul (heavy weights for headwords), PingFang TC for hanja and Chinese, San Francisco for Latin. One family carries everything; the scale steps are weight and size, not new faces.

### Hierarchy
- **Display** (800, clamp(32px, 11.5vw, 50px), 1.12, −0.02em): the headword on a sign. Grammar forms 30px; Cantonese 한글 lines clamp(28px, 9.5vw, 38px).
- **Hanja** (700, 38px on an open sign, 30px on the Home glance, 0.06em tracking): signage yellow.
- **Headline** (800, 22px): the current stop on Home ("Unit 3").
- **Title** (700, 15px): section headings; the header app name is 19px / 750.
- **Body** (400, 16px / 1.5): meanings, examples (15px), notes (14px).
- **Label** (600–700, 10.5–13px): tab labels, station names (12px), tier badges (11px), counts with tabular numerals.

## Layout

A single phone column, max 640px, 16px gutters, centred on wider screens; the header and tab bar align to the same column. Home in order: header (roundel, app name, due pill); the line panel (tier as line name, five stations around the current unit, current stop, Learn new and Review, two counts); the word-of-the-hour sign with its time strip; extras; the collapsible set-up tip. On Learn and Review the grade row is sticky just above the tab bar, so a long sign never needs a scroll before grading. Filter chip rows scroll sideways instead of wrapping. More space sits above a heading (26px) than below it (10px).

## Elevation & Depth

Flat surfaces with hairline borders; only signs and dialogs lift.

- **Sign** (`0 1px 2px rgba(15,19,23,.10), 0 14px 30px -16px rgba(15,19,23,.45)`; night: a 1px inner top highlight and a deeper drop).
- **Pop** (`0 2px 6px rgba(15,19,23,.10), 0 24px 48px -12px rgba(15,19,23,.35)`): dialogs.

## Shapes

Rounded rectangles in four steps: signs 16px, cards 14px, controls and list rows 12px, tier badges 6px; chips, the due pill and stations are full pills or circles. The line is drawn with 6px rails and circular stations: 22px stops, a 32px ringed you-are-here, filled stops for units learned, an ink-ringed interchange where the tier changes.

## Components

### The station sign (study card)
Charcoal panel, 16px radius, 20px/18px padding. Closed: the headword and its part of speech, "tap to flip" with a short line-colour dash. Open: a 4px line-colour **rule** draws across (480ms ease-out), then the subtitle lines rise in: hanja, meaning, romanisation, pictogram tile (white, 112px), notes, and examples separated by hairlines. On Home the closed sign also carries a glance line (hanja and meaning) under a hairline, beneath a "09:00 · Word of the hour" strip.

### The line (Home)
Five tappable stations; tapping one opens that unit in Learn. The rail is filled up to the current stop and part-filled toward the next by the share of the current unit introduced. Off-tier stops show the tier name under the unit; the first stop of a new tier is an interchange.

### The track (Settings, Quiz unit tests)
The same line, vertical: a 6px rail with 18px stations, filled for unlocked units, a ringed current unit on a surface row, passed unit tests filled in Good green.

### Buttons
- **Primary:** line-strong fill, 50px (54px on Home), 12px radius, 650 weight.
- **Secondary:** surface with a 1.5px hair-strong border; hover darkens the border, press scales to 0.98.
- **Grades:** four equal buttons with coloured labels and the interval underneath in muted tabular numerals.

### Chips
Pills, 36px, 1.5px border; the selected chip takes the line-strong fill.

### Inputs
Surface, 1.5px hair-strong border, 12px radius, 16px text (no iOS zoom); focus turns the border line-strong with a soft 3px line-colour halo. Search carries a drawn lens; selects a drawn chevron.

### Navigation
Bottom tab bar on surface with drawn 24px stroke icons (1.9 stroke, round caps); the active tab takes ink label, a line-strong icon and a 3px line-colour marker on the top edge. Header: a 32px line-colour roundel with the app's glyph (한, 粵, Aa), the app name, and a due pill outlined in ink ("5 due", "복습 5").

### Icons
Drawn, never glyphs: the speaker, add, back and done marks are CSS masks over `currentColor` (2.2–2.6 stroke), the tab icons inline SVG.

## Do's and Don'ts

### Do:
- **Do** put every study card on a sign (`.card.flash`) and let the sign's re-pointed tokens colour what sits on it.
- **Do** use the app's line colour for the rail, the current stop, the primary action, selection and the active tab, and nothing else.
- **Do** keep hanja in signage yellow on dark and hanja amber on light.
- **Do** keep the grade row reachable without scrolling on Learn and Review.
- **Do** draw icons as SVG or masks in the tab bar's stroke.

### Don't:
- **Don't** box examples inside a sign in a second rounded panel; separate them with a hairline.
- **Don't** add a second accent colour to an app, or use a tone colour as decoration.
- **Don't** put emoji or Unicode glyphs in labels as icons in these three apps.
- **Don't** pin a light or dark look by category; both themes are first-class.
- **Don't** restyle the Mongolian app from this file; it keeps `style.css`.

Open, not a rule: the display face is the platform gothic. The finish review asked for a self-hosted heavy Hangul face for headwords; that is awaiting the owner's ruling (3 November 2026).
