# Agent Run Explorer

A small web tool to browse and understand agent runs: a **Python (FastAPI)** API that
loads `data/runs.jsonl` into memory, and a **Next.js (App Router, TypeScript)** frontend
that talks to it over HTTP. No database, no API keys.

- `/runs` - filterable, searchable, sortable, paginated list. All state lives in the URL.
- `/runs/[id]` - one run: metadata, error, expandable steps, and a streaming "Explain this run".
- `/dashboard` - success rate, cost and runs-per-day charts, plus median / p95 duration.

Design notes, data findings and trade-offs are in [DECISIONS.md](DECISIONS.md).
The original brief is in [ASSIGNMENT.md](ASSIGNMENT.md).

## What you need

- **Python 3.10 or newer** (tested on 3.11 and 3.12)
- **Node.js 20.9 or newer** with npm (tested on 22 and 24)
- Git

Nothing else. You need **two terminals**, one per service.

## Setup and run

### Terminal 1: the API (port 8000)

**Windows (PowerShell)**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

**macOS / Linux**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
```

You should see `Application startup complete.` plus two warnings about `run_0031` and
`run_0064`. Those are expected: they are the data problems the loader handles (see DECISIONS.md).
Check it: <http://localhost:8000/api/health> returns `{"status":"ok"}`, and
<http://localhost:8000/docs> lists every endpoint.

### Terminal 2: the web app (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open **<http://localhost:3000>** (it redirects to `/runs`). Use `localhost`, as in that link.

## Try it (2 minutes)

1. On `/runs`, tick **failed** and **cancelled** under Status and **kpi-analyst** under Agent.
   The URL changes and the list shows `1-9 of 9`. Copy the URL into a new tab: same view.
2. Open `run_0038`. The failing step is already expanded. Click **Explain this run** and
   watch the text stream in. Open `/runs/run_0038#step-1` to jump straight to a step.
3. Open `/runs/run_0089` (no steps recorded) and `/runs/run_0064` (negative duration) to see
   how bad records are flagged under "Data notes".
4. Open `/dashboard`. Use "See dashboard for this view" on `/runs` to chart a filtered set.

## Run the tests

```bash
# backend (from backend/, virtual environment active): 28 tests
python -m pytest -q

# frontend (from frontend/): 9 tests
npm test
```

## API reference

| Method and path | What it does |
| --- | --- |
| `GET /api/runs` | A page of runs (no `steps`). Query params below. |
| `GET /api/runs/{id}` | One run with its steps. `404` if the id does not exist. |
| `GET /api/stats` | Aggregates. Accepts the same filters as the list (not sort or paging). |
| `POST /api/runs/{id}/explain` | Streams a plain-text explanation. `404` if unknown. |
| `GET /api/health` | `{"status":"ok"}` |

`GET /api/runs` query parameters (all optional, all combine):

| Param | Meaning |
| --- | --- |
| `status`, `agent`, `tool` | Repeat the key for several values: `?status=failed&status=cancelled`. Values within one param are OR, different params are AND. `tool` matches runs with at least one step using it. |
| `started_from`, `started_to` | `YYYY-MM-DD`, both inclusive, by UTC date. |
| `q` | Case-insensitive search in the prompt. |
| `sort`, `order` | `started_at` (default), `duration_ms` or `cost_usd`; `asc` or `desc` (default). Runs with no value for the sort field always come last. |
| `page`, `page_size` | Page number from 1, and size 1-100 (default 25). The response includes `total`. |

## Configuration

Every variable is optional and has a working default, so you can ignore this section.
They are listed in [.env.example](.env.example): `DATA_PATH`, `EXPLAIN_PROVIDER`,
`EXPLAIN_DELAY_MS`, `CORS_ORIGINS` (backend) and `NEXT_PUBLIC_API_URL` (frontend, goes in
`frontend/.env.local`). The explain endpoint uses the **mock provider**: deterministic text
with a small delay per word so streaming is visible. Only `mock` is implemented.

## Project layout

```
data/runs.jsonl          the dataset, untouched
backend/
  app/
    main.py              FastAPI app, CORS, startup loading
    config.py            reads environment variables
    models.py            Pydantic models (Run, Step, RunSummary, ...)
    loader.py            reads the JSONL, dedupes ids, flags bad records
    store.py             in-memory store: filter, sort, paginate
    stats.py             success rate, median, p95, cost, per-day counts
    explain.py           provider interface, mock provider, explanation text
    routes/              the HTTP endpoints
  tests/                 pytest suite
frontend/
  src/app/               pages: /runs, /runs/[id], /dashboard
  src/components/        filters, table, steps, explain button, SVG charts
  src/lib/               typed API client, URL query logic, formatters
  tests/                 vitest suite
```

## Troubleshooting

- **PowerShell says running scripts is disabled** when activating the venv: run
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once, then retry.
- **"Could not load runs"** in the browser: the API is not running. Start Terminal 1, then click "Try again".
- **Explain does nothing**: open the app at `http://localhost:3000` and make sure the API is on port 8000.
- **Port already in use**: stop the other process, or run the API on another port and set
  `NEXT_PUBLIC_API_URL` (in `frontend/.env.local`) to match.
- **`npm install` prints vulnerability warnings**: they come from development tooling and are
  safe to ignore for this project. Do not run `npm audit fix --force`.