import asyncio
from collections.abc import AsyncIterator
from typing import Protocol

from .models import Run


def _seconds(ms: int) -> str:
    return f"{ms / 1000:.1f} seconds"


def build_explanation(run: Run) -> str:
    """Deterministic, canned explanation built only from the run's own data."""
    prompt = " ".join(run.prompt.split())  # collapse newlines and padding
    parts = [
        f"Run {run.id} was handled by the {run.agent} agent using {run.model} "
        f"for {run.tenant_id}, starting on {run.started_at.date().isoformat()}.",
        f'It was asked: "{prompt}".',
    ]

    if run.steps:
        names = ", ".join(s.name for s in run.steps)
        parts.append(f"It recorded {len(run.steps)} step(s): {names}.")
    else:
        parts.append("No steps were recorded for this run.")

    if run.status == "succeeded":
        parts.append("It finished successfully.")
    elif run.status == "cancelled":
        stopped = next((s for s in run.steps if s.status == "cancelled"), None)
        where = f" during step '{stopped.name}'" if stopped else ""
        parts.append(f"It was cancelled before completing{where}.")
    elif run.status == "running":
        active = next((s for s in run.steps if s.status == "running"), None)
        where = f" It is currently on step '{active.name}'." if active else ""
        parts.append(f"It has not finished yet, so there is no final outcome.{where}")
    elif run.status == "failed":
        if run.error:
            parts.append(f"It failed with a {run.error.type}: {run.error.message}.")
            idx = run.error.step_index
            if idx is not None and 0 <= idx < len(run.steps):
                step = run.steps[idx]
                parts.append(
                    f"The failure happened at step {idx + 1} ('{step.name}', tool: {step.tool})."
                )
            elif idx is not None:
                parts.append(
                    f"The error points to step index {idx}, but this run has no recorded "
                    f"step at that position, so where it failed cannot be confirmed."
                )
        else:
            parts.append("It failed, but no error details were recorded.")

    if run.duration_ms is not None:
        parts.append(f"It took {_seconds(run.duration_ms)}.")
    else:
        parts.append("Its duration is not available.")

    if run.cost_usd is None:
        parts.append(f"Its cost was not recorded, after {run.input_tokens + run.output_tokens} tokens.")
    else:
        parts.append(f"It used {run.input_tokens + run.output_tokens} tokens and cost ${run.cost_usd:.4f}.")

    return " ".join(parts)


class ExplainProvider(Protocol):
    def stream(self, run: Run) -> AsyncIterator[str]: ...


class MockProvider:
    """No API key needed. Streams the canned text word by word with a small delay."""

    def __init__(self, delay_ms: int = 30):
        self.delay = delay_ms / 1000

    async def stream(self, run: Run) -> AsyncIterator[str]:
        words = build_explanation(run).split(" ")
        for i, word in enumerate(words):
            await asyncio.sleep(self.delay)
            yield word + (" " if i < len(words) - 1 else "")


def get_provider(name: str, delay_ms: int) -> ExplainProvider:
    if name == "mock":
        return MockProvider(delay_ms)
    raise ValueError(f"Unknown EXPLAIN_PROVIDER '{name}'. Supported: mock")