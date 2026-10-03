import pytest

from app.stats import percentile_nearest_rank


def test_stats_match_hand_computed_values(client):
    s = client.get("/api/stats").json()
    # 6 runs; run_6 is running, so 5 are finished. Succeeded: run_1, run_3, run_5 = 3 of 5.
    assert s["run_count"] == 6
    assert s["finished_count"] == 5
    assert s["success_rate"] == 0.6
    # Finished durations sorted: 1000, 2000, 3000, 4000, 5000.
    assert s["median_duration_ms"] == 3000
    # Nearest rank: ceil(0.95 * 5) = 5th value = 5000.
    assert s["p95_duration_ms"] == 5000
    assert s["duration_sample_size"] == 5
    # Priced: 0.10 + 0.20 + 0.40 + 0.50 + 0.05 = 1.25. run_3 is unpriced.
    assert s["total_cost_usd"] == 1.25
    assert s["unpriced_runs"] == 1


def test_per_agent_stats_are_honest_about_unpriced_runs(client):
    per_agent = {a["agent"]: a for a in client.get("/api/stats").json()["per_agent"]}
    a, b = per_agent["agent-a"], per_agent["agent-b"]
    # agent-a: run_1, 2, 5, 6. Finished 3, succeeded 2 (run_1, run_5). Cost 0.10+0.20+0.50+0.05.
    assert (a["run_count"], a["finished_count"], a["success_rate"]) == (4, 3, 0.6667)
    assert a["total_cost_usd"] == 0.85
    assert a["unpriced_runs"] == 0
    # agent-b: run_3 (unpriced, succeeded) and run_4 (0.40, failed).
    assert (b["run_count"], b["finished_count"], b["success_rate"]) == (2, 2, 0.5)
    assert b["total_cost_usd"] == 0.4
    assert b["unpriced_runs"] == 1


def test_runs_per_day_includes_days_with_zero_runs(client):
    days = client.get("/api/stats").json()["runs_per_day"]
    assert [(d["date"], d["count"]) for d in days] == [
        ("2026-08-01", 1),
        ("2026-08-02", 2),
        ("2026-08-03", 2),
        ("2026-08-04", 0),
        ("2026-08-05", 1),
    ]


def test_stats_respect_the_same_filters_as_the_list(client):
    s = client.get("/api/stats", params={"agent": "agent-b"}).json()
    assert s["run_count"] == 2
    assert s["median_duration_ms"] == 3500  # median of 3000 and 4000
    assert s["p95_duration_ms"] == 4000  # ceil(0.95 * 2) = 2nd value
    assert s["success_rate"] == 0.5


@pytest.mark.parametrize(
    "values, p, expected",
    [
        (list(range(1, 101)), 95, 95),
        (list(range(1, 21)), 95, 19),
        ([7], 95, 7),
        ([], 95, None),
    ],
)
def test_percentile_nearest_rank(values, p, expected):
    assert percentile_nearest_rank(values, p) == expected