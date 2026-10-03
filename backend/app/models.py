from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Status = Literal["succeeded", "failed", "cancelled", "running"]
Tool = Literal["llm", "sql", "http", "vector_search", "none"]


class Tokens(BaseModel):
    input: int
    output: int


class Step(BaseModel):
    index: int
    name: str
    tool: Tool
    status: Status
    started_at: datetime
    duration_ms: int | None
    input: str
    output: str | None
    tokens: Tokens


class RunError(BaseModel):
    type: str
    message: str
    step_index: int | None = None


class Run(BaseModel):
    id: str
    agent: str
    model: str
    status: Status
    started_at: datetime
    ended_at: datetime | None
    duration_ms: int | None
    input_tokens: int
    output_tokens: int
    cost_usd: float | None
    prompt: str
    error: RunError | None
    tenant_id: str
    steps: list[Step]
    # Not in the source file. We add this to flag problems we detected.
    data_issues: list[str] = Field(default_factory=list)

class RunSummary(BaseModel):
    """A run as shown in the list: everything except the full steps array."""

    id: str
    agent: str
    model: str
    status: Status
    started_at: datetime
    ended_at: datetime | None
    duration_ms: int | None
    input_tokens: int
    output_tokens: int
    cost_usd: float | None
    prompt: str
    error: RunError | None
    tenant_id: str
    step_count: int
    data_issues: list[str]

    @classmethod
    def from_run(cls, run: Run) -> "RunSummary":
        return cls(**run.model_dump(exclude={"steps"}), step_count=len(run.steps))


class RunPage(BaseModel):
    items: list[RunSummary]
    total: int  # matches after filtering, before pagination
    page: int
    page_size: int