import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUERY,
  buildDashboardHref,
  buildRunsHref,
  parseRunQuery,
  toFilterParams,
  toSearchParams,
  type RawParams,
  type RunQuery,
} from "../src/lib/query";

// Turn URLSearchParams back into the shape Next.js hands to a page (repeated keys become arrays).
function toRaw(params: URLSearchParams): RawParams {
  const raw: RawParams = {};
  for (const [key, value] of params.entries()) {
    const existing = raw[key];
    if (existing === undefined) raw[key] = value;
    else raw[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
  }
  return raw;
}

describe("parseRunQuery", () => {
  it("reads repeated params as lists", () => {
    const q = parseRunQuery({ status: ["failed", "cancelled"], agent: "kpi-analyst" });
    expect(q.status).toEqual(["failed", "cancelled"]);
    expect(q.agent).toEqual(["kpi-analyst"]);
  });

  it("falls back to safe defaults for hostile or broken URLs", () => {
    const q = parseRunQuery({
      status: ["banana", "failed"],
      tool: "telepathy",
      sort: "evil",
      order: "sideways",
      page: "-3",
      started_from: "yesterday",
      started_to: "2026-13-99-nope",
    });
    expect(q.status).toEqual(["failed"]); // the valid value survives, the invalid one is dropped
    expect(q.tool).toEqual([]);
    expect(q.sort).toBe("started_at");
    expect(q.order).toBe("desc");
    expect(q.page).toBe(1);
    expect(q.started_from).toBe("");
    expect(q.started_to).toBe("");
  });

  it("returns the defaults for an empty URL", () => {
    expect(parseRunQuery({})).toEqual(DEFAULT_QUERY);
  });
});

describe("toSearchParams", () => {
  it("omits default values so shared links stay short", () => {
    expect(toSearchParams(DEFAULT_QUERY).toString()).toBe("");
    const q: RunQuery = { ...DEFAULT_QUERY, status: ["failed"] };
    expect(toSearchParams(q).toString()).toBe("status=failed");
  });

  it("round-trips a fully filtered query through the URL unchanged", () => {
    const original: RunQuery = {
      status: ["failed", "cancelled"],
      agent: ["kpi-analyst", "email-drafter"],
      tool: ["http"],
      q: "invoice 🔥",
      started_from: "2026-08-01",
      started_to: "2026-08-07",
      sort: "cost_usd",
      order: "asc",
      page: 3,
    };
    const url = toSearchParams(original).toString();
    expect(parseRunQuery(toRaw(new URLSearchParams(url)))).toEqual(original);
  });
});

describe("buildRunsHref", () => {
  const base: RunQuery = { ...DEFAULT_QUERY, status: ["failed"], page: 4 };

  it("jumps back to page 1 when a filter changes", () => {
    expect(buildRunsHref(base, { agent: ["kpi-analyst"] })).toBe("/runs?status=failed&agent=kpi-analyst");
  });

  it("keeps the requested page when only the page changes", () => {
    expect(buildRunsHref(base, { page: 5 })).toBe("/runs?status=failed&page=5");
  });

  it("returns a bare /runs when nothing is set", () => {
    expect(buildRunsHref(DEFAULT_QUERY, {})).toBe("/runs");
  });
});

describe("dashboard links", () => {
  it("carry filters but not sort, order or page", () => {
    const q: RunQuery = { ...DEFAULT_QUERY, status: ["failed"], sort: "duration_ms", order: "asc", page: 7 };
    expect(toFilterParams(q).toString()).toBe("status=failed");
    expect(buildDashboardHref(q)).toBe("/dashboard?status=failed");
    expect(buildDashboardHref(DEFAULT_QUERY)).toBe("/dashboard");
  });
});