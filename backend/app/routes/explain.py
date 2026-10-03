from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from ..store import RunStore
from .deps import get_explain_provider, get_store

router = APIRouter(prefix="/api")


@router.post("/runs/{run_id}/explain")
def explain_run(
    run_id: str,
    store: RunStore = Depends(get_store),
    provider=Depends(get_explain_provider),
) -> StreamingResponse:
    run = store.by_id.get(run_id)
    if run is None:
        # Raised before streaming starts, so the client gets a real 404.
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found")
    return StreamingResponse(
        provider.stream(run),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )