# Decisions

## The four decisions

1. **Unpriced runs (`cost_usd: null`).** "Total cost per agent" adds up only the runs that
   have a cost, and the API returns `unpriced_runs` next to every total. The dashboard
   prints "+ N unpriced" on the bar and says the figure is a lower bound, so nobody reads a
   partial total as the real one. `0.0` is a real price (15 failed runs with 0 tokens);
   only `null` counts as unpriced.
2. **Running runs.** Success rate is succeeded / finished runs (succeeded + failed +
   cancelled). Running runs have no outcome yet, so they are left out of the denominator;
   cancelled counts as not successful. Median and p95 duration use finished runs that have a
   valid duration (190 of 200). When sorting by duration or cost, runs with no value always
   go last in both directions, so "unknown" never looks like "smallest" or "largest".
3. **Records that break a naive loader.** The source file is never edited; problems are
   handled in code and written onto the run as a `data_issues` list, which the UI shows
   (a warning mark in the list, a "Data notes" box on the detail page).
   - `run_0031` appears twice with different statuses. I keep the record that is
     internally consistent: the `running` copy has no end time, while the `succeeded` copy
     claims to be finished but has no end time or duration. A warning is logged.
   - `run_0064` has a negative duration (`ended_at` is before `started_at`). The duration
     is treated as unknown and excluded from stats rather than guessed.
   - `run_0089` has an empty `steps` array, but its error points at `step_index` 3. It is
     flagged, and the explanation says it cannot confirm where the run failed instead of
     inventing a step.
4. **Stats and filters.** `/api/stats` takes the same filters as the list and uses the same
   `filter_runs` function, so the list and the dashboard cannot disagree. With no filters it
   is global. "See dashboard for this view" on `/runs` carries the current filters across.

## What I noticed about the data

- The file is not in `started_at` order (the first line is a 23 August run), so sorting is
  always explicit.
- `ended_at` mostly has microseconds, but at least one timestamp does not; parsing must
  accept both.
- Prompts: one is French with accents, one is upper case and padded with whitespace, some
  contain newlines, and 15 contain an emoji. Search uses `casefold()` and the display trims.
- Many error messages do not fit the agent that produced them (for example a support-router
  run failing with an invoice total mismatch). The data looks synthetic, so I did not read
  meaning into the pairing.
- Run-level token totals match the sum of step tokens, and step `index` matches array
  position. Those parts are clean.

## Choices worth knowing

- **p95 uses the nearest-rank method** (the value at position ceil(0.95 n) of the sorted
  list). It always returns a real observed value and can be checked by hand; interpolating
  libraries give slightly different numbers.
- **Steps are numbered from 1 in the UI**, and `#step-3` is the third step. The data's own
  `index` is 0-based.
- **Explain** is a streaming plain-text `POST`, read with `fetch` in the browser (not
  `EventSource`, which only supports GET). The mock provider builds its text only from the
  run's own fields, so the same run always gives the same words. Providers sit behind a small
  interface, so a real model could be added without touching the route.
- **The URL is the only filter state**, so links are shareable and the back button works.
  Search is debounced by 300 ms, and the list re-shows its loading state on every change.

## If the file had 20 million runs

- Use a real database (Postgres, or ClickHouse / DuckDB for the analytics) instead of memory,
  loaded by streaming ingestion.
- Index `started_at` and `(agent, status, started_at)`; keep steps in their own table and
  fetch them by run id, so the list never touches them.
- Replace the substring scan on `prompt` with full-text or trigram search.
- Replace offset paging with keyset (cursor) paging on `(started_at, id)`; an exact `total`
  becomes expensive, so it would be approximate or cached.
- Compute `/api/stats` in SQL from pre-aggregated daily rollups, with `percentile_cont` or a
  t-digest for p95, instead of sorting all durations on each request.
- Run explain through a queue and cache the result per run.

## What I would do with another day

- A real model provider behind the explain interface, selected by the same environment variable.
- Keyboard navigation in the list and a visible request counter (both from the "should build" list).
- An `/api/agents` endpoint so the agent filter is not hardcoded in the frontend.
- Component and browser tests for the filters and the streaming button.
- Virtualize the steps list so a run with hundreds of steps does not stutter, and add a Docker Compose file.
- Make "back to runs" on the detail page keep the filters you came from.

## What I am least happy with

- Frontend test coverage is thin: the URL parsing, serializing and link-building logic is
  tested, but the filters component and the streaming button are only checked by hand.
- The detail page renders every step at once. That is fine for the 5 steps in this data, not for 500.
- The agent list in the filters is hardcoded.
- The duplicate rule ("keep the consistent record") fits this dataset. With a real
  `updated_at` I would prefer "latest write wins".
- Counting cancelled runs as unsuccessful is defensible but debatable.
- The charts are hand-drawn SVG: native tooltips only, no table alternative for screen readers.

## How I built this

I am comfortable with languages such as Node, Express, MySQL, Java/Spring Boot for full stack assignments/projects; Python/FastAPI and the Next.js App, Router were new to me. I built this with Claude as a pair programmer, one phase at a time, (data loader, list endpoint, stats, explain, tests, then the frontend), reading each file and writing notes on it. I also broke the code on purpose (removing a filter, changing the p95 formula, removing the page reset) to confirm the tests fail when they should.