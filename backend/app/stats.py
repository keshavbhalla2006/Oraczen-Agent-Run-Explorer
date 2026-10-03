import statistics
from collections import Counter
from datetime import timedelta

from pydantic import BaseModel

from .models import Run


class AgentStats(BaseModel):
    agent: str
    run_count: int
    finished_count: int
    success_rate: float | None  # None when no run has finished yet
    total_cost_usd: float  # sum over priced runs only
    priced_runs: int
    unpriced_runs: int


class DayCount(BaseModel):
    date: str  # YYYY-MM-DD (UTC)
    count: int


class Stats(BaseModel):
    run_count: int
    finished_count: int
    success_rate: float | None
    median_duration_ms: float | None
    p95_duration_ms: int | None
    duration_sample_size: int
    total_cost_usd: float
    unpriced_runs: int
    per_agent: list[AgentStats]
    runs_per_day: list[DayCount]


def percentile_nearest_rank(sorted_values: list[int], p: int) -> int | None:
    """p-th percentile by the nearest-rank method. Input must be sorted."""
    n = len(sorted_values)
    if n == 0:
        return None
    rank = -(-p * n // 100)  # ceil(p * n / 100) using integer math
    return sorted_values[max(rank, 1) - 1]


def _success_rate(runs: list[Run]) -> tuple[int, float | None]:
    finished = [r for r in runs if r.status != "running"]
    if not finished:
        return 0, None
    succeeded = sum(1 for r in finished if r.status == "succeeded")
    return len(finished), round(succeeded / len(finished), 4)


def _cost(runs: list[Run]) -> tuple[float, int, int]:
    priced = [r.cost_usd for r in runs if r.cost_usd is not None]
    return round(sum(priced), 6), len(priced), len(runs) - len(priced)


def compute_stats(runs: list[Run]) -> Stats:
    finished_count, success_rate = _success_rate(runs)

    durations = sorted(
        r.duration_ms for r in runs if r.status != "running" and r.duration_ms is not None
    )
    median = statistics.median(durations) if durations else None

    total_cost, _, unpriced = _cost(runs)

    per_agent = []
    for agent in sorted({r.agent for r in runs}):
        agent_runs = [r for r in runs if r.agent == agent]
        fin, rate = _success_rate(agent_runs)
        cost, priced_n, unpriced_n = _cost(agent_runs)
        per_agent.append(
            AgentStats(
                agent=agent,
                run_count=len(agent_runs),
                finished_count=fin,
                success_rate=rate,
                total_cost_usd=cost,
                priced_runs=priced_n,
                unpriced_runs=unpriced_n,
            )
        )

    per_day: list[DayCount] = []
    if runs:
        counts = Counter(r.started_at.date() for r in runs)
        day, last = min(counts), max(counts)
        while day <= last:
            per_day.append(DayCount(date=day.isoformat(), count=counts.get(day, 0)))
            day += timedelta(days=1)

    return Stats(
        run_count=len(runs),
        finished_count=finished_count,
        success_rate=success_rate,
        median_duration_ms=median,
        p95_duration_ms=percentile_nearest_rank(durations, 95),
        duration_sample_size=len(durations),
        total_cost_usd=total_cost,
        unpriced_runs=unpriced,
        per_agent=per_agent,
        runs_per_day=per_day,
    )