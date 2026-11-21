# fluffyLife: notes for Claude sessions

## Report GitHub Actions minutes (owner's standing instruction, 5 November 2026)

After every push, merge or deploy, tell the owner how many GitHub Actions minutes it spent.

- Read the run's jobs (GitHub MCP `actions_list` with `list_workflow_jobs`) and add up each job's `started_at` → `completed_at` time.
- GitHub bills each job rounded **up** to the whole minute, so a 10-second job is 1 minute. Report that billed figure, and the actual run time beside it.
- A skipped job is 0 minutes.
- Give a running total for the session.
- This repo is **public**, so standard GitHub-hosted runners cost nothing and don't count against the account's free minutes. Say so in the report, so "N minutes" is never mistaken for money spent. If the repo is made private, the minutes start counting.
- A push to any branch runs the `test` job: about 10–20 s, billed as 1 minute. A merge to `mainFluffy` also runs `deploy`: about 45–75 s, billed as 1–2 minutes.
- The hourly `schedule` run (`.github/workflows/pages.yml`, news and stocks) costs about 2 minutes a run, roughly 48 a day. Mention it when the owner asks about total usage.
- A docs-only change can skip CI: put `[skip ci]` in the commit message, and in the merge commit title when merging. A skipped push runs nothing and costs 0 minutes.
- **Branch pushes keep their `test` run here** (owner's ruling, 6 November 2026). Skipping CI on a branch push, when the tests already passed locally, is for **private repos only**: there the merge's own `test` job still guards the deploy, and skipping saves 1 billed minute per change. fluffyLife is public, so the minutes are free and the pull request keeps its green tick.

## Default app design rule: behave like an iPhone app (owner's standing instruction, 21 November 2026)

Every app here is used from the iPhone home screen, so each new interactive app, and each new sheet or drill-in screen in an existing one, behaves like an iPhone app from the start. The shared layer is `lib/nav.js` with `lib/nav.css`; README's "Moving around like an iPhone app" lists what it does. Use it. Don't write per-app gesture or history code.

- **Every `<dialog>` sheet:** `nav.watchDialog(dialog, { close, swipeDown: true })`, passing the app's own animated close, so Back, the left-edge swipe and a swipe down all go through the same slide.
- **Every drill-in screen** (a full list, a detail, a form or a person's page that replaces what is on screen): `nav.push(key, onBack)` while it shows and `nav.release(key)` when the UI closes it. It counts only while it is on screen, so release it on a tab change. Tabs are not levels, and a quiz or flashcard in progress isn't one either. Back at the root does nothing.
- **Once per app:** `nav.installEdgeSwipe()`; `nav.onTabReselect(bar, selector)` if it has a tab bar (tap the tab you're on to scroll to the top); `nav.pullToRefresh(window, fn)` on any screen fed by data that can be fetched again (off where a pull means something else, such as flashcards or a chart); and `<link rel="stylesheet" href="../lib/nav.css">` in `index.html`, which also takes the 300 ms tap delay off buttons.
- **Apps that navigate by `#hash`** (Travel, Builder) skip history levels, because a history-backed sheet would fight `location.hash`: swipe down on sheets and tab re-tap only.
- **Exempt:** script and document pages (MC, Shine, Lions), PureLift's site and Foreman's studio. A new app that skips the rule says why in its pull request.
- **Keep the rest of the iPhone basics:** `viewport-fit=cover`, `apple-mobile-web-app-capable`, light and dark `theme-color`, safe-area insets on headers, tab bars and sheets, 16px text in inputs (no zoom), and drawn icons, never emoji.
- **Prove it:** add a touch-emulation browser check (`scripts/films-check.mjs`, section 10, is the pattern): Back closes a sheet, a swipe from the left edge closes it, a swipe from the edge at the root does nothing, and no history entry is left behind. Say in the report that this ran in Chromium with touch emulation, not on an iPhone; iOS's own edge swipe is only confirmed on a real device.
