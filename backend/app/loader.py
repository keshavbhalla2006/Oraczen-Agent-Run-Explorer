import logging
from dataclasses import dataclass, field
from pathlib import Path

from pydantic import ValidationError

from .models import Run

logger = logging.getLogger(__name__)


@dataclass
class LoadReport:
    runs: list[Run] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def _is_consistent(run: Run) -> bool:
    """A finished run must have an end time and duration. A running one must not."""
    if run.status == "running":
        return run.ended_at is None and run.duration_ms is None
    return run.ended_at is not None and run.duration_ms is not None


def _annotate(run: Run) -> None:
    """Detect known data problems and record them on the run itself."""
    issues = run.data_issues

    if run.duration_ms is not None and run.duration_ms < 0:
        # ended_at is before started_at, so the number cannot be trusted.
        issues.append("negative_duration")
        run.duration_ms = None
    if run.cost_usd is None:
        issues.append("missing_cost")
    if not run.steps:
        issues.append("empty_steps")
    if run.error and run.error.step_index is not None and run.error.step_index >= len(run.steps):
        issues.append("error_step_out_of_range")


def load_runs(path: Path) -> LoadReport:
    report = LoadReport()
    by_id: dict[str, Run] = {}
    duplicate_ids: set[str] = set()

    with open(path, encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            if not line.strip():
                continue
            try:
                run = Run.model_validate_json(line)
            except ValidationError as e:
                report.warnings.append(f"line {line_no}: skipped, {e.error_count()} validation errors")
                continue

            existing = by_id.get(run.id)
            if existing is None:
                by_id[run.id] = run
                continue

            # Duplicate id: keep the record that is internally consistent.
            duplicate_ids.add(run.id)
            if _is_consistent(run) and not _is_consistent(existing):
                by_id[run.id] = run
                kept = "second"
            else:
                kept = "first"
            report.warnings.append(
                f"duplicate id {run.id}: statuses were "
                f"'{existing.status}' and '{run.status}', kept the {kept} record"
            )

    for run in by_id.values():
        if run.duration_ms is not None and run.duration_ms < 0:
            report.warnings.append(f"{run.id}: negative duration {run.duration_ms} ms, treated as unknown")
        _annotate(run)
        if run.id in duplicate_ids:
            run.data_issues.append("duplicate_id_resolved")

    report.runs = list(by_id.values())
    for w in report.warnings:
        logger.warning(w)
    return report


if __name__ == "__main__":
    from .config import DATA_PATH

    result = load_runs(DATA_PATH)
    print(f"Loaded {len(result.runs)} runs")
    for w in result.warnings:
        print("WARNING:", w)
    for r in result.runs:
        if r.data_issues:
            print(r.id, r.status, r.data_issues)