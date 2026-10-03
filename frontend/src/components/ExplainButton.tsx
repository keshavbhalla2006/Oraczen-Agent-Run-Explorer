"use client";

import { useEffect, useRef, useState } from "react";
import { explainUrl } from "@/lib/api";

type Phase = "idle" | "streaming" | "done" | "error";

export default function ExplainButton({ runId }: { runId: string }) {
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Stop any in-flight stream if the user leaves the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function explain() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setText("");
    setError(null);
    setPhase("streaming");

    try {
      const res = await fetch(explainUrl(runId), { method: "POST", signal: controller.signal });
      if (!res.ok || !res.body) {
        throw new Error(`The API returned ${res.status} while explaining this run.`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      // Append each chunk the moment it arrives instead of waiting for the end.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setText((prev) => prev + chunk);
      }
      const tail = decoder.decode();
      if (tail) setText((prev) => prev + tail);
      setPhase("done");
    } catch (err) {
      if (controller.signal.aborted) return; // user left or clicked again: not an error
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("error");
    }
  }

  return (
    <section className="explain">
      <button onClick={explain} disabled={phase === "streaming"}>
        {phase === "streaming" ? "Explaining…" : phase === "idle" ? "Explain this run" : "Explain again"}
      </button>
      <div className="explain-text" aria-live="polite">
        {text}
        {phase === "streaming" && <span className="cursor">▍</span>}
      </div>
      {phase === "error" && (
        <p className="error-inline" role="alert">
          {error} Is the Python API running on port 8000?
        </p>
      )}
    </section>
  );
}