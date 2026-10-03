// Human-readable text for the data_issues codes the backend attaches to a run.
export const ISSUE_TEXT: Record<string, string> = {
  negative_duration:
    "The recorded end time is before the start time, so the duration is unreliable and shown as unknown.",
  missing_cost: "No cost was recorded for this run.",
  empty_steps: "No steps were recorded for this run.",
  error_step_out_of_range: "The error refers to a step that does not exist in this run's recorded steps.",
  duplicate_id_resolved:
    "This id appeared twice in the source data with conflicting statuses. The self-consistent record was kept.",
};