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
