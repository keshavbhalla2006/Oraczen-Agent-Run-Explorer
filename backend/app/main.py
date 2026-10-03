from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import DATA_PATH, EXPLAIN_DELAY_MS, EXPLAIN_PROVIDER
from .explain import get_provider
from .loader import load_runs
from .routes import explain, runs, stats
from .store import RunStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup: load the dataset into memory.
    report = load_runs(DATA_PATH)
    app.state.store = RunStore(report.runs)
    app.state.load_warnings = report.warnings
    app.state.explain_provider = get_provider(EXPLAIN_PROVIDER, EXPLAIN_DELAY_MS)
    yield


app = FastAPI(title="Agent Run Explorer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(runs.router)
app.include_router(stats.router)
app.include_router(explain.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}