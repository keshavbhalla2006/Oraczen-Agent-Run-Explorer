from datetime import date

from fastapi import Query, Request

from ..models import Status, Tool
from ..store import RunFilters, RunStore


def get_store(request: Request) -> RunStore:
    return request.app.state.store


def get_filters(
    status: list[Status] = Query(default=[]),
    agent: list[str] = Query(default=[]),
    tool: list[Tool] = Query(default=[]),
    started_from: date | None = None,
    started_to: date | None = None,
    q: str | None = None,
) -> RunFilters:
    return RunFilters(
        statuses=list(status),
        agents=agent,
        tools=list(tool),
        started_from=started_from,
        started_to=started_to,
        q=q,
    )

def get_explain_provider(request: Request):
    return request.app.state.explain_provider