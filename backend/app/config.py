import os
from pathlib import Path

# config.py is at <repo>/backend/app/config.py, so parents[2] is the repo root.
REPO_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = Path(os.getenv("DATA_PATH", REPO_ROOT / "data" / "runs.jsonl"))