import { PAGE_SIZE, toSearchParams, type RunQuery } from "./query";
import type { RunPage } from "./types";

// Used by server components (and, later, by the browser for the Explain button).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchRuns(query: RunQuery): Promise<RunPage> {
  const params = toSearchParams(query);
  params.set("page_size", String(PAGE_SIZE));
  const res = await fetch(`${API_URL}/api/runs?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`The API returned ${res.status} while loading runs.`);
  }
  return (await res.json()) as RunPage;
}