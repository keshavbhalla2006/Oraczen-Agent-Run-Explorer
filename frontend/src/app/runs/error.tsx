"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

export default function RunsError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  function retry() {
    // Re-fetch the server components first, then clear the error, together in one transition.
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <div className="error-box" role="alert">
      <h2>Could not load runs</h2>
      <p>{error.message}</p>
      <p className="muted">Is the Python API running on port 8000?</p>
      <button onClick={retry}>Try again</button>
    </div>
  );
}