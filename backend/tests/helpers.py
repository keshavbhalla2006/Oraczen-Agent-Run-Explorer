from datetime import datetime

from app.models import Run, RunError, Step, Tokens


def make_run(
    id: str,
    agent: str = "agent-a",
    status: str = "succeeded",
    started: str = "2026-08-01T10:00:00Z",
    duration_ms: int | None = 1000,
    cost_usd: float | None = 0.10,
    prompt: str = "hello",
    tool: str = "llm",
) -> Run:
    """Build a small valid Run so each test controls exactly the fields it cares about."""
    started_at = datetime.fromisoformat(started.replace("Z", "+00:00"))
    step = Step(
        index=0,
        name="only_step",
        tool=tool,
        status=status,
        started_at=started_at,
        duration_ms=duration_ms,
        input="in",
        output=None if status in ("failed", "running") else "out",
        tokens=Tokens(input=0, output=0),
    )
    error = RunError(type="Boom", message="it broke", step_index=0) if status == "failed" else None
    return Run(
        id=id,
        agent=agent,
        model="test-model",
        status=status,
        started_at=started_at,
        ended_at=None if status == "running" else started_at,
        duration_ms=duration_ms,
        input_tokens=0,
        output_tokens=0,
        cost_usd=cost_usd,
        prompt=prompt,
        error=error,
        tenant_id="tenant_01",
        steps=[step],
    )