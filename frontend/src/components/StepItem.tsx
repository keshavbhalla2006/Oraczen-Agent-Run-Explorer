"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";
import type { Step } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface Props {
  step: Step;
  isErrorStep: boolean;
}

export default function StepItem({ step, isErrorStep }: Props) {
  const number = step.index + 1; // people count from 1; the anchor matches: #step-3 is the third step
  const anchor = `step-${number}`;
  const [open, setOpen] = useState(isErrorStep); // the failing step starts expanded
  const ref = useRef<HTMLDetailsElement>(null);

  // Deep link: /runs/run_0042#step-3 opens and scrolls to that step.
  useEffect(() => {
    function openIfTargeted() {
      if (window.location.hash === `#${anchor}`) {
        setOpen(true);
        ref.current?.scrollIntoView({ block: "start" });
      }
    }
    openIfTargeted();
    window.addEventListener("hashchange", openIfTargeted);
    return () => window.removeEventListener("hashchange", openIfTargeted);
  }, [anchor]);

  let outputText: string;
  if (step.output !== null) outputText = step.output;
  else if (step.status === "failed") outputText = "(no output: this step failed)";
  else if (step.status === "running") outputText = "(no output yet: this step is still running)";
  else outputText = "(no output)";

  return (
    <details
      id={anchor}
      ref={ref}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      className={isErrorStep ? "step step-error" : "step"}
    >
      <summary>
        <span className="step-title">
          Step {number}: {step.name}
        </span>
        <span className="tool">{step.tool}</span>
        <StatusBadge status={step.status} />
        <span className="step-stat">{formatDuration(step.duration_ms)}</span>
        <span className="step-stat">
          {step.tokens.input} in / {step.tokens.output} out
        </span>
        {isErrorStep && <span className="warn"> ← error occurred here</span>}
      </summary>
      <div className="step-body">
        <h4>Input</h4>
        <pre>{step.input}</pre>
        <h4>Output</h4>
        <pre>{outputText}</pre>
      </div>
    </details>
  );
}