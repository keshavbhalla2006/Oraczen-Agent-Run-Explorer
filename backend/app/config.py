import os
from pathlib import Path

# config.py is at <repo>/backend/app/config.py, so parents[2] is the repo root.
REPO_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = Path(os.getenv("DATA_PATH", REPO_ROOT / "data" / "runs.jsonl"))

# Which explain provider to use. "mock" needs no API key.
EXPLAIN_PROVIDER = os.getenv("EXPLAIN_PROVIDER", "mock")
# Pause between streamed words in the mock provider.
EXPLAIN_DELAY_MS = int(os.getenv("EXPLAIN_DELAY_MS", "30"))