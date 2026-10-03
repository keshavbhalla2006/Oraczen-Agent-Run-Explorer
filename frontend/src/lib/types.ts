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

export interface Tokens {
  input: number;
  output: number;
}

export interface Step {
  index: number; // 0-based position in the run
  name: string;
  tool: Tool;
  status: Status;
  started_at: string;
  duration_ms: number | null;
  input: string;
  output: string | null;
  tokens: Tokens;
}

// Matches the backend's Run: a summary plus the full steps array.
export interface RunDetail extends Omit<RunSummary, "step_count"> {
  steps: Step[];
}


// Matches the backend's /api/stats response.
export interface AgentStats {
  agent: string;
  run_count: number;
  finished_count: number;
  success_rate: number | null;
  total_cost_usd: number;
  priced_runs: number;
  unpriced_runs: number;
}

export interface DayCount {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
}

export interface Stats {
  run_count: number;
  finished_count: number;
  success_rate: number | null;
  median_duration_ms: number | null;
  p95_duration_ms: number | null;
  duration_sample_size: number;
  total_cost_usd: number;
  unpriced_runs: number;
  per_agent: AgentStats[];
  runs_per_day: DayCount[];
}