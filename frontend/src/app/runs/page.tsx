import { Suspense } from "react";
import Filters from "@/components/Filters";
import Pagination from "@/components/Pagination";
import RunsTable from "@/components/RunsTable";
import { fetchRuns } from "@/lib/api";
import { PAGE_SIZE, parseRunQuery, toSearchParams, type RawParams, type RunQuery } from "@/lib/query";

// The list depends on the URL, so it is rendered on every request.
export const dynamic = "force-dynamic";

async function Results({ query }: { query: RunQuery }) {
  const page = await fetchRuns(query); // a failure here is caught by error.tsx

  if (page.total === 0) {
    return (
      <div className="empty">
        <p>No runs match these filters.</p>
        <a href="/runs">Clear all filters</a>
      </div>
    );
  }

  return (
    <>
      <RunsTable runs={page.items} />
      <Pagination query={query} total={page.total} pageSize={PAGE_SIZE} />
    </>
  );
}

export default async function RunsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const query = parseRunQuery(await searchParams);
  // Changing the key makes React show the fallback again whenever the URL changes.
  const key = toSearchParams(query).toString();

  return (
    <>
      <h1>Runs</h1>
      <Filters query={query} />
      <Suspense key={key} fallback={<p className="loading">Loading runs…</p>}>
        <Results query={query} />
      </Suspense>
    </>
  );
}