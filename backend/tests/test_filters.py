from tests.conftest import ids


def test_two_filters_compose(client):
    # failed runs are run_2 (agent-a) and run_4 (agent-b); agent-a runs include run_1, 2, 5, 6.
    # Only run_2 is in both sets, so the filters must be ANDed.
    r = client.get("/api/runs", params={"status": "failed", "agent": "agent-a"})
    assert r.status_code == 200
    assert ids(r) == ["run_2"]
    assert r.json()["total"] == 1


def test_values_within_one_filter_are_ored(client):
    r = client.get("/api/runs", params={"status": ["failed", "running"]})
    assert ids(r) == ["run_2", "run_4", "run_6"]


def test_status_agent_and_date_range_compose(client):
    r = client.get(
        "/api/runs",
        params={"agent": "agent-a", "status": "succeeded", "started_from": "2026-08-02"},
    )
    # agent-a + succeeded = run_1 (08-01) and run_5 (08-03); the date cuts run_1.
    assert ids(r) == ["run_5"]


def test_date_range_is_inclusive_on_both_ends(client):
    r = client.get("/api/runs", params={"started_from": "2026-08-03", "started_to": "2026-08-03"})
    assert ids(r) == ["run_4", "run_5"]


def test_search_is_case_insensitive_and_handles_accents(client):
    assert ids(client.get("/api/runs", params={"q": "ALPHA"})) == ["run_1", "run_3"]
    assert ids(client.get("/api/runs", params={"q": "résumé"})) == ["run_6"]


def test_tool_filter_matches_runs_with_a_step_using_that_tool(client):
    assert ids(client.get("/api/runs", params={"tool": "sql"})) == ["run_5"]


def test_null_values_sort_last_in_both_directions(client):
    for order in ("asc", "desc"):
        items = client.get("/api/runs", params={"sort": "cost_usd", "order": order}).json()["items"]
        assert items[-1]["id"] == "run_3"  # the only null cost
        assert items[-1]["cost_usd"] is None
    asc = client.get("/api/runs", params={"sort": "duration_ms", "order": "asc"}).json()["items"]
    assert [i["id"] for i in asc] == ["run_1", "run_2", "run_3", "run_4", "run_5", "run_6"]


def test_pagination_returns_total_and_empty_page_past_the_end(client):
    page2 = client.get("/api/runs", params={"page_size": 4, "page": 2}).json()
    assert page2["total"] == 6
    assert len(page2["items"]) == 2
    beyond = client.get("/api/runs", params={"page_size": 4, "page": 9}).json()
    assert beyond["items"] == []
    assert beyond["total"] == 6


def test_list_items_do_not_include_steps(client):
    item = client.get("/api/runs").json()["items"][0]
    assert "steps" not in item
    assert item["step_count"] == 1


def test_invalid_status_is_rejected(client):
    assert client.get("/api/runs", params={"status": "banana"}).status_code == 422


def test_unknown_run_returns_404(client):
    r = client.get("/api/runs/does_not_exist")
    assert r.status_code == 404
    assert client.get("/api/runs/run_2").json()["steps"][0]["name"] == "only_step"