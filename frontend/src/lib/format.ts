export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function formatCost(cost: number | null): string {
  if (cost === null) return "—";
  return `$${cost.toFixed(4)}`;
}

// Always UTC, so the server render and the browser can never disagree.
export function formatDate(iso: string): string {
  return iso.slice(0, 16).replace("T", " ") + " UTC";
}


export function formatPercent(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}