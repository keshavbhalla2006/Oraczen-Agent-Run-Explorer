from app.config import DATA_PATH
from app.loader import load_runs
from tests.helpers import make_run


def test_real_dataset_loads_with_known_irregularities_handled():
    report = load_runs(DATA_PATH)
    by_id = {r.id: r for r in report.runs}
    assert len(report.runs) == 200  # 201 lines, one duplicate id removed

    # Duplicate id: the self-consistent record (running, no end time) wins.
    assert by_id["run_0031"].status == "running"
    assert "duplicate_id_resolved" in by_id["run_0031"].data_issues

    # Negative duration is treated as unknown instead of being trusted.
    assert by_id["run_0064"].duration_ms is None
    assert "negative_duration" in by_id["run_0064"].data_issues

    # Empty steps plus an error pointing at a step that does not exist.
    assert by_id["run_0089"].data_issues == ["empty_steps", "error_step_out_of_range"]

    missing_cost = {r.id for r in report.runs if "missing_cost" in r.data_issues}
    assert missing_cost == {"run_0008", "run_0042", "run_0153"}


def test_zero_cost_is_not_treated_as_missing():
    by_id = {r.id: r for r in load_runs(DATA_PATH).runs}
    assert by_id["run_0033"].cost_usd == 0
    assert "missing_cost" not in by_id["run_0033"].data_issues


def test_duplicate_keeps_the_consistent_record_in_either_order(tmp_path):
    inconsistent = make_run("dup", status="succeeded").model_copy(
        update={"ended_at": None, "duration_ms": None}
    )
    consistent = make_run("dup", status="running", duration_ms=None)
    for lines in ([inconsistent, consistent], [consistent, inconsistent]):
        path = tmp_path / "runs.jsonl"
        path.write_text("\n".join(r.model_dump_json() for r in lines), encoding="utf-8")
        report = load_runs(path)
        assert [r.status for r in report.runs] == ["running"]
        assert any("duplicate id dup" in w for w in report.warnings)


def test_unparseable_line_is_skipped_and_reported(tmp_path):
    path = tmp_path / "runs.jsonl"
    good = make_run("ok").model_dump_json()
    path.write_text(good + "\n{not valid json\n", encoding="utf-8")
    report = load_runs(path)
    assert [r.id for r in report.runs] == ["ok"]
    assert any("line 2" in w for w in report.warnings)