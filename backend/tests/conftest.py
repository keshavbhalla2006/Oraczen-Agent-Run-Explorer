import pytest
from fastapi.testclient import TestClient

from app.explain import MockProvider
from app.main import app
from app.store import RunStore
from tests.helpers import make_run


@pytest.fixture
def small_runs():
    """Six runs small enough to compute every expected value by hand.

    id     agent    status     day    duration  cost
    run_1  agent-a  succeeded  08-01  1000      0.10
    run_2  agent-a  failed     08-02  2000      0.20
    run_3  agent-b  succeeded  08-02  3000      None
    run_4  agent-b  failed     08-03  4000      0.40
    run_5  agent-a  succeeded  08-03  5000      0.50   (sql step)
    run_6  agent-a  running    08-05  None      0.05
    """
    return [
        make_run("run_1", "agent-a", "succeeded", "2026-08-01T10:00:00Z", 1000, 0.10, "Alpha invoice"),
        make_run("run_2", "agent-a", "failed", "2026-08-02T10:00:00Z", 2000, 0.20, "beta contract"),
        make_run("run_3", "agent-b", "succeeded", "2026-08-02T11:00:00Z", 3000, None, "Alpha CONTRACT"),
        make_run("run_4", "agent-b", "failed", "2026-08-03T10:00:00Z", 4000, 0.40, "gamma"),
        make_run("run_5", "agent-a", "succeeded", "2026-08-03T11:00:00Z", 5000, 0.50, "delta", tool="sql"),
        make_run("run_6", "agent-a", "running", "2026-08-05T10:00:00Z", None, 0.05, "Résumé"),
    ]


@pytest.fixture
def client(small_runs):
    # Entering the context runs the app's startup, which loads the real file.
    # We then swap in the small store so tests never depend on the real data.
    with TestClient(app) as c:
        app.state.store = RunStore(small_runs)
        app.state.explain_provider = MockProvider(delay_ms=0)
        yield c


def ids(response) -> list[str]:
    return sorted(item["id"] for item in response.json()["items"])