import Link from "next/link";
import { formatCost, formatDate, formatDuration } from "@/lib/format";
import type { RunSummary } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function RunsTable({ runs }: { runs: RunSummary[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Run</th>
            <th>Agent</th>
            <th>Status</th>
            <th>Started</th>
            <th>Duration</th>
            <th>Cost</th>
            <th>Steps</th>
            <th>Prompt</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>
                <Link href={`/runs/${run.id}`}>{run.id}</Link>
                {run.data_issues.length > 0 && (
                  <span className="warn" title={`Data issues: ${run.data_issues.join(", ")}`}>
                    {" "}
                    ⚠
                  </span>
                )}
              </td>
              <td>{run.agent}</td>
              <td>
                <StatusBadge status={run.status} />
              </td>
              <td>{formatDate(run.started_at)}</td>
              <td>{formatDuration(run.duration_ms)}</td>
              <td title={run.cost_usd === null ? "No cost recorded for this run" : undefined}>
                {formatCost(run.cost_usd)}
              </td>
              <td>{run.step_count}</td>
              <td className="prompt-cell">{run.prompt.trim()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}