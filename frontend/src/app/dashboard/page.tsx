import Link from "next/link";
import DayChart from "@/components/charts/DayChart";
import HBarChart from "@/components/charts/HBarChart";
import { fetchStats } from "@/lib/api";
import { formatDuration, formatPercent, formatUsd } from "@/lib/format";
import { parseRunQuery, toFilterParams, type RawParams } from "@/lib/query";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const query = parseRunQuery(await searchParams);
  const stats = await fetchStats(query); // a failure is caught by error.tsx
  const activeFilters = [...toFilterParams(query).entries()].map(([k, v]) => `${k}=${v}`);

  const maxCost = Math.max(0, ...stats.per_agent.map((a) => a.total_cost_usd));
  const first = stats.runs_per_day[0]?.date;
  const last = stats.runs_per_day[stats.runs_per_day.length - 1]?.date;

  return (
    <>
      <h1>Dashboard</h1>

      {activeFilters.length > 0 ? (
        <div className="notice" role="note">
          Showing statistics for filtered runs only ({activeFilters.join(", ")}).{" "}
          <Link href="/dashboard">Show all runs</Link>
        </div>
      ) : (
        <p className="muted">Statistics for all runs. Filter the list, then use “See dashboard for this view”.</p>
      )}

      {stats.run_count === 0 ? (
        <div className="empty">
          <p>No runs match these filters, so there is nothing to chart.</p>
          <Link href="/dashboard">Show all runs</Link>
        </div>
      ) : (
        <>
          <div className="kpis">
            <div className="kpi">
              <span className="kpi-label">Runs</span>
              <span className="kpi-value">{stats.run_count}</span>
              <span className="kpi-note">{stats.finished_count} finished</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Success rate</span>
              <span className="kpi-value">{formatPercent(stats.success_rate)}</span>
              <span className="kpi-note">of finished runs; running runs excluded</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Median duration</span>
              <span className="kpi-value">{formatDuration(stats.median_duration_ms)}</span>
              <span className="kpi-note">{stats.duration_sample_size} finished runs with a duration</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">p95 duration</span>
              <span className="kpi-value">{formatDuration(stats.p95_duration_ms)}</span>
              <span className="kpi-note">nearest-rank method</span>
            </div>
            <div className="kpi">
              <span className="kpi-label">Total cost</span>
              <span className="kpi-value">{formatUsd(stats.total_cost_usd)}</span>
              <span className="kpi-note">
                {stats.unpriced_runs > 0
                  ? `priced runs only; ${stats.unpriced_runs} run${stats.unpriced_runs === 1 ? "" : "s"} have no cost`
                  : "all runs priced"}
              </span>
            </div>
          </div>

          <section className="card">
            <h2>Success rate by agent</h2>
            <HBarChart
              title="Success rate by agent"
              max={1}
              bars={stats.per_agent.map((a) => ({
                label: a.agent,
                value: a.success_rate ?? 0,
                valueLabel: `${formatPercent(a.success_rate)} of ${a.finished_count}`,
              }))}
            />
          </section>

          <section className="card">
            <h2>Total cost by agent</h2>
            <HBarChart
              title="Total cost by agent"
              max={maxCost}
              bars={stats.per_agent.map((a) => ({
                label: a.agent,
                value: a.total_cost_usd,
                valueLabel:
                  a.unpriced_runs > 0
                    ? `${formatUsd(a.total_cost_usd)} + ${a.unpriced_runs} unpriced`
                    : formatUsd(a.total_cost_usd),
              }))}
            />
            <p className="muted small">
              Each total adds up only the runs that have a recorded cost. Runs without a cost are counted
              separately, so a total with unpriced runs is a lower bound, not the true figure.
            </p>
          </section>

          <section className="card">
            <h2>Runs per day</h2>
            <DayChart title="Runs per day" days={stats.runs_per_day} />
            <p className="muted small">
              {first} to {last} (UTC). Days with no runs are shown as gaps.
            </p>
          </section>
        </>
      )}
    </>
  );
}