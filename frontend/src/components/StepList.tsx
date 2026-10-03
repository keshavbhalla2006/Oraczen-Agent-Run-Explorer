import type { RunDetail } from "@/lib/types";
import StepItem from "./StepItem";

export default function StepList({ run }: { run: RunDetail }) {
  if (run.steps.length === 0) {
    return <p className="muted">No steps were recorded for this run.</p>;
  }
  return (
    <div className="steps">
      {run.steps.map((step) => (
        <StepItem key={step.index} step={step} isErrorStep={run.error?.step_index === step.index} />
      ))}
    </div>
  );
}