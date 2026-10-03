import {
  SORT_FIELDS,
  STATUSES,
  TOOLS,
  type SortField,
  type SortOrder,
} from "./types";

export const PAGE_SIZE = 25;

// Everything the /runs page can be filtered, sorted and paged by.
export interface RunQuery {
  status: string[];
  agent: string[];
  tool: string[];
  q: string;
  started_from: string; // YYYY-MM-DD or ""
  started_to: string; // YYYY-MM-DD or ""
  sort: SortField;
  order: SortOrder;
  page: number;
}

export type RawParams = Record<string, string | string[] | undefined>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function one(value: string | string[] | undefined): string {
  return toArray(value)[0] ?? "";
}

export const DEFAULT_QUERY: RunQuery = {
  status: [],
  agent: [],
  tool: [],
  q: "",
  started_from: "",
  started_to: "",
  sort: "started_at",
  order: "desc",
  page: 1,
};

/** Turn untrusted URL params into a valid RunQuery. Bad values fall back to defaults. */
export function parseRunQuery(raw: RawParams): RunQuery {
  const sort = one(raw.sort) as SortField;
  const order = one(raw.order);
  const page = Number.parseInt(one(raw.page), 10);
  const from = one(raw.started_from);
  const to = one(raw.started_to);
  return {
    status: toArray(raw.status).filter((s) => (STATUSES as readonly string[]).includes(s)),
    agent: toArray(raw.agent),
    tool: toArray(raw.tool).filter((t) => (TOOLS as readonly string[]).includes(t)),
    q: one(raw.q),
    started_from: DATE_RE.test(from) ? from : "",
    started_to: DATE_RE.test(to) ? to : "",
    sort: SORT_FIELDS.includes(sort) ? sort : DEFAULT_QUERY.sort,
    order: order === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  };
}

/** Serialize a RunQuery. Defaults are omitted so shared URLs stay short and clean. */
export function toSearchParams(query: RunQuery): URLSearchParams {
  const p = new URLSearchParams();
  query.status.forEach((v) => p.append("status", v));
  query.agent.forEach((v) => p.append("agent", v));
  query.tool.forEach((v) => p.append("tool", v));
  if (query.q.trim()) p.set("q", query.q);
  if (query.started_from) p.set("started_from", query.started_from);
  if (query.started_to) p.set("started_to", query.started_to);
  if (query.sort !== DEFAULT_QUERY.sort) p.set("sort", query.sort);
  if (query.order !== DEFAULT_QUERY.order) p.set("order", query.order);
  if (query.page !== 1) p.set("page", String(query.page));
  return p;
}

/** Build a /runs link with some fields changed. Changing a filter resets to page 1. */
export function buildRunsHref(query: RunQuery, changes: Partial<RunQuery>): string {
  const next = { ...query, ...changes };
  if (!("page" in changes)) next.page = 1;
  const qs = toSearchParams(next).toString();
  return qs ? `/runs?${qs}` : "/runs";
}


/** Only the filters. Sort, order and page do not affect statistics. */
export function toFilterParams(query: RunQuery): URLSearchParams {
  const p = toSearchParams(query);
  ["sort", "order", "page"].forEach((key) => p.delete(key));
  return p;
}

/** A /dashboard link carrying the same filters as the current list. */
export function buildDashboardHref(query: RunQuery): string {
  const qs = toFilterParams(query).toString();
  return qs ? `/dashboard?${qs}` : "/dashboard";
}