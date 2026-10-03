export const STATUSES = ["succeeded", "failed", "cancelled", "running"] as const;
export type Status = (typeof STATUSES)[number];

export const TOOLS = ["llm", "sql", "http", "vector_search", "none"] as const;
export type Tool = (typeof TOOLS)[number];

// The five agents in the dataset. A production system would load these from an API.
export const AGENTS = [
  "contract-reviewer",
  "email-drafter",
  "invoice-extractor",
  "kpi-analyst",
  "support-router",
] as const;

export const SORT_FIELDS = ["started_at", "duration_ms", "cost_usd"] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = "asc" | "desc";

export interface RunError {
  type: string;
  message: string;
  step_index: number | null;
}

// Matches the backend's RunSummary: a run without its steps.
export interface RunSummary {
  id: string;
  agent: string;
  model: string;
  status: Status;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number | null;
  prompt: string;
  error: RunError | null;
  tenant_id: string;
  step_count: number;
  data_issues: string[];
}

export interface RunPage {
  items: RunSummary[];
  total: number;
  page: number;
  page_size: number;
}