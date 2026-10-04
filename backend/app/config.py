import os
from pathlib import Path

# config.py is at <repo>/backend/app/config.py, so parents[2] is the repo root.
REPO_ROOT = Path(__file__).resolve().parents[2]


def _resolve(path: str) -> Path:
    """Relative paths are relative to the repo root, so they work from any folder."""
    p = Path(path)
    return p if p.is_absolute() else REPO_ROOT / p


DATA_PATH = _resolve(os.getenv("DATA_PATH", "data/runs.jsonl"))

# Which explain provider to use. "mock" needs no API key.
EXPLAIN_PROVIDER = os.getenv("EXPLAIN_PROVIDER", "mock")
# Pause between streamed words in the mock provider.
EXPLAIN_DELAY_MS = int(os.getenv("EXPLAIN_DELAY_MS", "30"))

# Browser origins allowed to call this API (comma separated).
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]