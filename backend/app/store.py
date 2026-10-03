from dataclasses import dataclass, field
from datetime import date
from typing import Literal

from .models import Run

SortField = Literal["started_at", "duration_ms", "cost_usd"]
SortOrder = Literal["asc", "desc"]


@dataclass
class RunFilters:
    statuses: list[str] = field(default_factory=list)
    agents: list[str] = field(default_factory=list)
    tools: list[str] = field(default_factory=list)
    started_from: date | None = None  # inclusive
    started_to: date | None = None  # inclusive, whole day
    q: str | None = None


def filter_runs(runs: list[Run], f: RunFilters) -> list[Run]:
    """Keep runs matching ALL given filters. Within one filter, any value may match."""
    needle = f.q.strip().casefold() if f.q and f.q.strip() else None
    result = []
    for run in runs:
        if f.statuses and run.status not in f.statuses:
            continue
        if f.agents and run.agent not in f.agents:
            continue
        if f.tools and not any(step.tool in f.tools for step in run.steps):
            continue
        # Timestamps end in Z, so .date() is the UTC date.
        day = run.started_at.date()
        if f.started_from and day < f.started_from:
            continue
        if f.started_to and day > f.started_to:
            continue
        if needle and needle not in run.prompt.casefold():
            continue
        result.append(run)
    return result


def sort_runs(runs: list[Run], by: SortField, order: SortOrder) -> list[Run]:
    """Sort by a field. Runs where the field is null always go last, in both directions."""
    with_value = [r for r in runs if getattr(r, by) is not None]
    without_value = [r for r in runs if getattr(r, by) is None]
    # Sort by id first, then by the field. Python's sort is stable, so ties stay in id order.
    with_value.sort(key=lambda r: r.id)
    with_value.sort(key=lambda r: getattr(r, by), reverse=(order == "desc"))
    without_value.sort(key=lambda r: r.id)
    return with_value + without_value


class RunStore:
    def __init__(self, runs: list[Run]):
        self.runs = runs
        self.by_id = {r.id: r for r in runs}

    def query(
        self,
        filters: RunFilters,
        sort_by: SortField,
        order: SortOrder,
        page: int,
        page_size: int,
    ) -> tuple[list[Run], int]:
        matched = sort_runs(filter_runs(self.runs, filters), sort_by, order)
        start = (page - 1) * page_size
        return matched[start : start + page_size], len(matched)