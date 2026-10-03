"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildRunsHref, type RunQuery } from "@/lib/query";
import { AGENTS, SORT_FIELDS, STATUSES, TOOLS } from "@/lib/types";

const SORT_LABELS: Record<string, string> = {
  started_at: "Started",
  duration_ms: "Duration",
  cost_usd: "Cost",
};

export default function Filters({ query }: { query: RunQuery }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(query.q);
  // The last search text we pushed into the URL. Lets us tell our own update apart from
  // an outside change (Clear filters, back button) that the box must follow.
  const sentQ = useRef(query.q);

  // The URL is the single source of truth: every control just rewrites it.
  function update(changes: Partial<RunQuery>) {
    startTransition(() => {
      router.replace(buildRunsHref(query, changes));
    });
  }

  function toggle(field: "status" | "agent" | "tool", value: string) {
    const current = query[field];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    update({ [field]: next });
  }

  // Follow the URL when it changed from outside this box.
  useEffect(() => {
    if (query.q !== sentQ.current) {
      sentQ.current = query.q;
      setQ(query.q);
    }
  }, [query.q]);

  // Wait 300 ms after the last keystroke so we do not refetch on every letter.
  useEffect(() => {
    if (q === query.q) return;
    const timer = setTimeout(() => {
      sentQ.current = q;
      update({ q });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const checkboxGroup = (label: string, field: "status" | "agent" | "tool", options: readonly string[]) => (
    <fieldset>
      <legend>{label}</legend>
      {options.map((opt) => (
        <label key={opt} className="check">
          <input type="checkbox" checked={query[field].includes(opt)} onChange={() => toggle(field, opt)} />
          {opt}
        </label>
      ))}
    </fieldset>
  );

  return (
    <section className="filters" aria-label="Filters">
      <div className="filter-row">
        <label>
          Search prompt
          <input type="search" value={q} placeholder="e.g. invoice" onChange={(e) => setQ(e.target.value)} />
        </label>
        <label>
          Started from
          <input type="date" value={query.started_from} onChange={(e) => update({ started_from: e.target.value })} />
        </label>
        <label>
          Started to
          <input type="date" value={query.started_to} onChange={(e) => update({ started_to: e.target.value })} />
        </label>
        <label>
          Sort by
          <select value={query.sort} onChange={(e) => update({ sort: e.target.value as RunQuery["sort"] })}>
            {SORT_FIELDS.map((f) => (
              <option key={f} value={f}>
                {SORT_LABELS[f]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Order
          <select value={query.order} onChange={(e) => update({ order: e.target.value as RunQuery["order"] })}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </label>
      </div>
      <div className="filter-row">
        {checkboxGroup("Status", "status", STATUSES)}
        {checkboxGroup("Agent", "agent", AGENTS)}
        {checkboxGroup("Uses tool", "tool", TOOLS)}
      </div>
      <div className="filter-actions">
        <Link href="/runs">Clear all filters</Link>
        {isPending && <span className="muted">Updating…</span>}
      </div>
    </section>
  );
}