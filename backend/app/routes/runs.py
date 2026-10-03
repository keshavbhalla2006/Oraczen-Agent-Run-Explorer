from fastapi import APIRouter, Depends, HTTPException, Query

from ..models import Run, RunPage, RunSummary

from ..store import RunFilters, RunStore, SortField, SortOrder
from .deps import get_filters, get_store

router = APIRouter(prefix="/api")


@router.get("/runs", response_model=RunPage)
def list_runs(
    filters: RunFilters = Depends(get_filters),
    sort: SortField = "started_at",
    order: SortOrder = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    store: RunStore = Depends(get_store),
) -> RunPage:
    runs, total = store.query(filters, sort, order, page, page_size)
    return RunPage(
        items=[RunSummary.from_run(r) for r in runs],
        total=total,
        page=page,
        page_size=page_size,
    )

@router.get("/runs/{run_id}", response_model=Run)
def get_run(run_id: str, store: RunStore = Depends(get_store)) -> Run:
    run = store.by_id.get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return run