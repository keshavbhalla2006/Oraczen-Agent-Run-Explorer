from fastapi import APIRouter, Depends

from ..stats import Stats, compute_stats
from ..store import RunFilters, RunStore, filter_runs
from .deps import get_filters, get_store

router = APIRouter(prefix="/api")


@router.get("/stats", response_model=Stats)
def get_stats(
    filters: RunFilters = Depends(get_filters),
    store: RunStore = Depends(get_store),
) -> Stats:
    return compute_stats(filter_runs(store.runs, filters))