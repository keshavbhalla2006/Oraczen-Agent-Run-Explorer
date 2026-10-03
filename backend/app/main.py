from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import DATA_PATH
from .loader import load_runs
from .routes import runs
from .store import RunStore


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup: load the dataset into memory.
    report = load_runs(DATA_PATH)
    app.state.store = RunStore(report.runs)
    app.state.load_warnings = report.warnings
    yield


app = FastAPI(title="Agent Run Explorer API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(runs.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}