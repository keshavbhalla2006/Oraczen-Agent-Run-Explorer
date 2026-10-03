import { PAGE_SIZE, toSearchParams, type RunQuery } from "./query";
import type { RunDetail, RunPage } from "./types";

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

/** Returns null when the run does not exist, so the page can show a proper 404. */
export async function fetchRun(id: string): Promise<RunDetail | null> {
  const res = await fetch(`${API_URL}/api/runs/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`The API returned ${res.status} while loading run ${id}.`);
  }
  return (await res.json()) as RunDetail;
}

/** The browser calls this one directly, so the response can stream. */
export function explainUrl(id: string): string {
  return `${API_URL}/api/runs/${encodeURIComponent(id)}/explain`;
}