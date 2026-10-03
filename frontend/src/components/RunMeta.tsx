import { formatCost, formatDate, formatDuration } from "@/lib/format";
import { ISSUE_TEXT } from "@/lib/issues";
import type { RunDetail } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function RunMeta({ run }: { run: RunDetail }) {
  const stepNumber = run.error?.step_index != null ? run.error.step_index + 1 : null;
  const errorStepMissing = run.error?.step_index != null && run.error.step_index >= run.steps.length;

  return (
    <>
      <div className="run-header">
        <h1>{run.id}</h1>
        <StatusBadge status={run.status} />
      </div>

      {run.data_issues.length > 0 && (
        <div className="notice" role="note">
          <strong>Data notes</strong>
          <ul>
            {run.data_issues.map((code) => (
              <li key={code}>{ISSUE_TEXT[code] ?? code}</li>
            ))}
          </ul>
        </div>
      )}

      <dl className="meta">
        <div><dt>Agent</dt><dd>{run.agent}</dd></div>
        <div><dt>Model</dt><dd>{run.model}</dd></div>
        <div><dt>Tenant</dt><dd>{run.tenant_id}</dd></div>
        <div><dt>Started</dt><dd>{formatDate(run.started_at)}</dd></div>
        <div><dt>Ended</dt><dd>{run.ended_at ? formatDate(run.ended_at) : "—"}</dd></div>
        <div><dt>Duration</dt><dd>{formatDuration(run.duration_ms)}</dd></div>
        <div><dt>Tokens</dt><dd>{run.input_tokens} in / {run.output_tokens} out</dd></div>
        <div><dt>Cost</dt><dd>{formatCost(run.cost_usd)}</dd></div>
      </dl>

      <h2>Prompt</h2>
      <pre className="prompt">{run.prompt.trim()}</pre>

      {run.error && (
        <div className="error-box" role="alert">
          <h2>Error: {run.error.type}</h2>
          <p>{run.error.message}</p>
          {stepNumber !== null && !errorStepMissing && <p className="muted">Occurred at step {stepNumber}.</p>}
          {errorStepMissing && (
            <p className="muted">
              The error points to step {stepNumber}, but this run has no recorded step at that position.
            </p>
          )}
        </div>
      )}
    </>
  );
}