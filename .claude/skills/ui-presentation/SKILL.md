---
name: ui-presentation
description: House rules for anything a person looks at on a screen - pages, apps, components, dashboards, forms, artifacts - in any repo. Covers fit on every phone, type, colour and contrast, spacing, components, hierarchy, motion, optical alignment and accessibility, and the checks that prove a screen is done. Load it before building or changing UI, and before calling UI work finished.
---

# UI presentation rules

Distilled from Monnie's design system and audits (its `DESIGN.md`, `PRODUCT.md` and the phone-width rule, Oct to Nov 2026) and from the Spots overflow of 15 Nov 2026. They are portable: a repo's own `DESIGN.md` or stylesheet wins on its look (colours, font, corners); these rules win on fit, legibility, behaviour and proof.

## 0. Done means measured

UI work is not finished, and is not reported as finished, until all of these hold. Say what was measured; never claim a pass that wasn't run.

1. **Width sweep passes** (`references/width-check.mjs`): portrait phones 320, 375, 390 and 430 px; tablet 768 and 1024; laptop 1280. Light and dark if the app has both. Every `<details>` and menu open.
2. **With stress content, not tidy samples:** the longest real strings the app can hold (a 50-character venue, a 120-character file path, a long email, a word with no spaces), an empty list and a long one. Short sample names hid the Spots overflow.
3. **With iPhone's line breaking:** Safari won't break a path or address at `-`, `/`, `.` or `@` the way Chrome does, so the sweep turns those break points off before measuring. A Chrome pass is not an iPhone pass.
4. **No page overflow and no spills:** `documentElement.scrollWidth` equals the viewport, and no element's box leaves its parent (outside a box that scrolls sideways on purpose).
5. **Every text field is 16 px or more on a phone** (smaller makes iOS zoom in and stay zoomed). **Every tap target is at least 44 x 44 px.**
6. **Looked at by eye:** a screenshot at a phone width and at desktop. A sweep measures boxes, not whether the screen reads well.
7. **The check lives in the repo's tests**, so the fault can't come back (`references/css-guard.test.mjs`, and the sweep or a browser test for the screens touched).

## 1. Fit: nothing is ever wider than the phone

- **Grid:** a track that takes the rest of a row is `minmax(0, 1fr)`, never a bare `1fr` (a bare `1fr` can't shrink below its longest unbreakable line). A list that stacks rows is `grid-template-columns: minmax(0, 1fr)` too: a grid with no column template sizes to its widest content. A column sized to its content beside wrapping text is `fit-content(50%)`, not `auto`.
- **Flex:** the item that should take the squeeze gets `min-width: 0`. Short labels (pills, counts, tags, prices, buttons) get `flex-shrink: 0; white-space: nowrap`; the long words beside them wrap or truncate.
- **Long text:** body text may break anywhere it must (`overflow-wrap: anywhere` on the main content). A one-line meta line truncates with an ellipsis, and the full text is one tap away. A title in a card wraps and stops at two or three lines (`-webkit-line-clamp`). Button labels, figures and pills never break inside a word.
- **Media and fields:** `max-width: 100%`; an input in a row also gets `min-width: 0`.
- **Sideways on purpose only:** a chip row or a wide table scrolls inside its own box (`overflow-x: auto`), with an edge fade showing there's more; the page itself never scrolls sideways.
- **Safety net, last rule in the stylesheet:** `body { overflow-x: clip; }` (clip, not hidden, so `position: sticky` keeps working). It hides what still sticks out, which is why the sweep measures spills, not just page width.
- **Fixed bars:** respect `env(safe-area-inset-*)`. A bottom bar is `position: fixed` with left, right and bottom at 0, and no ancestor of it carries `transform`, `filter`, `backdrop-filter`, `perspective`, `contain`, `will-change` or `content-visibility`, or it rides with the page. Leave room under the content for the bar plus the safe area.
- **Breakpoints:** rows and forms go to one column at about 700 px and under; desktop layouts are checked again between 900 and 1280 px, where a sidebar leaves the page a narrow column.
- **Everything works on both:** any task can be finished on the phone or the computer.

## 2. Type

- **One typeface** (the system stack or one web font) for everything; a monospace only for code, paths and bank narratives.
- **A small scale, used consistently:** display (page title, `clamp()` from about 30 px), headline about 22 px, title 16 px, **body 16 px at 1.5 to 1.6 line height**, label 13 px, meta 12 to 13 px, eyebrow 11 px capitals with letter spacing. Headings set tight (slightly negative letter spacing), body plain.
- **Line length** 45 to 75 characters for reading text.
- **Fields 16 px** on every width, at least at 760 px and under (iOS zoom).
- **Figures:** `font-variant-numeric: tabular-nums` wherever numbers sit in a column, list, tile or total; amount columns right-aligned so decimals line up.
- **Words:** the user's own vocabulary, sentence case, plain and short. Australian English; dates as "15 Nov 2026"; money in A$ through one formatter.

## 3. Colour and surfaces

- **Tokens only:** every colour is a custom property on `:root`; no stray hex values in rules. Light and dark both defined (under `prefers-color-scheme: dark`, guarded by `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`), and `body` has an explicit background.
- **Colours have jobs, and keep them:**
  - one accent fill for the single main action on a view;
  - one hue for links and information;
  - amber for warnings (never the accent, so a warning never looks pressable);
  - a true red for urgent and danger, far enough from the accent that an urgent dot never reads as the button.
  - Two meanings never share a hue.
- **Contrast, WCAG AA:** text 4.5:1 (large text 3:1), controls and focus rings 3:1. Check every text-on-surface pair you introduce, in both themes. Text on a coloured fill takes that fill's own "on" colour, not white by default.
- **Status is a word, not just a colour:** coloured words on a tinted pill; never colour alone to carry meaning.
- **Depth by tone:** in a dark theme, surfaces get lighter as they come forward (page, card, field, chip), separated by a hairline. Shadows only for things that float (menus, sheets). An outlined box is the exception.

## 4. Spacing and shape

- **A 4/8-point spacing scale** as tokens (4, 8, 12, 16, 24, 32, 48). Panels pad 24 px (16 px on a phone); stacked panels have one consistent gap.
- **Padding at least the corner radius**, plus about 2 px, so words don't sit on the curve.
- **A few corner sizes**, used by role (controls, cards, floating menus). A full pill only for what is always one line; a pill that may wrap drops to a small radius.
- **Density suits the job:** working tools are compact and exact; reading pages breathe.

## 5. Components

- **Buttons:** at least 44 px tall (48 for the primary), one filled primary per view, the rest secondary, chips or text buttons. **Anything pressed to do something looks like a button**: not a bare link or a browser disclosure triangle. A destructive action uses the danger tone, never the accent. Disabled is visibly dimmed and says why when it isn't obvious.
- **Fields:** a label above every field; a field and the button beside it are the same height. **Choices before typing:** offer what the app already knows as picks, with "Other (type it)" last.
- **Disclosures:** one fold mark used everywhere (for example ▾, turning). A disclosure that opens an action's form is a button.
- **A number leads somewhere:** a count or KPI links to the list it counts, filtered to exactly those rows.
- **Empty, loading and error states:**
  - Empty says what to do next.
  - Loading holds the layout so nothing jumps.
  - An error says what happened and what to do. A failed save keeps what was typed or photographed.
- **Icons:** an icon-only control has an `aria-label`. An icon beside words centres on the lower-case letters' middle (x-height), not on the line box.

## 6. Hierarchy and behaviour

- **Exceptions first:** a screen leads with what needs the person now; everything else is one tap away, and its count leads to its list.
- **The app prepares, the person presses:** recommend, draft and preview; anything irreversible (send, issue, delete, pay, move) is a preview plus an explicit press, with Undo where it can be undone.
- **Nothing guessed:** uncertain means flagged and shown, not filled in.
- **One way to divide a page** (a section heading with a rule, or an eyebrow above a heading), used consistently.

## 7. Motion

- Small, enters once, never loops: a short rise and fade (about 8 px, 0.3 to 0.5 s, ease-out), a pulse that runs once.
- Every keyframe animation sits inside `@media (prefers-reduced-motion: no-preference)`; hover transitions 0.15 to 0.2 s.
- Nothing essential depends on animation or hover.

## 8. Optical alignment

- An icon or dot beside words centres on the x-height (often 1 px lower than flex centring puts it).
- A large page title is pulled left about `0.05em` so its first letter lines up with the body text under it.
- A label beside its figure aligns on the text baseline; a tick box beside a two-line label sits on the first line.
- A circle beside a square of the same size is drawn about a tenth larger so they read the same.

## 9. Accessibility (WCAG 2.2 AA)

Visible focus ring on everything focusable; a skip link on long pages; `lang` on `<html>`; real labels on fields; full keyboard use; tap targets 44 px; reduced motion honoured; text resizes to 200% without breaking the layout; meaning never carried by colour alone.

## 10. Tools in this folder

- `references/width-check.mjs`: the sweep. Opens each page at the widths above in light and dark, opens every disclosure, applies iPhone's line breaking, and reports page overflow, spills, fields under 16 px and small tap targets. Exits 1 on a fault. Works on a folder of static files or a running dev server, with an optional setup module (sign-in, seed data, stub responses).
- `references/safety-net.css`: the fit rules as a block to paste at the end of a stylesheet.
- `references/css-guard.test.mjs`: a `node:test` template that fails on a bare `fr` grid track and checks the safety net is still last.
- `.claude/agents/ui-auditor.md`: an agent that runs the sweep on a branch, fixes what it finds and reports a before-and-after table.

## Why these rules exist (lessons)

- **A path that iPhone wouldn't break** widened a row's bare `1fr` column. iOS zoomed the whole page out, and the page had passed a 375 px check in Chrome. (Monnie Intake, Oct 2026)
- **A 49-character venue on a one-line meta row** widened a grid with no column template. iOS shrank the page, and the sample data had only short names. (Spots, 15 Nov 2026)
- **Fields under 16 px** made Safari zoom in and stay zoomed. (Monnie, Sept 2026)
- **A fixed bottom bar floated up the screen** after the keyboard closed (iOS 26 viewport offset). Nothing above a fixed bar may create a containing block. (Monnie, Nov 2026)
- **A disclosure drawn as bare words** wasn't recognised as an action. Anything that does something looks like a button. (Monnie, Nov 2026)
