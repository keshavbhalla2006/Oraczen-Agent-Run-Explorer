import Link from "next/link";

export default function RunNotFound() {
  return (
    <div className="empty">
      <h2>Run not found</h2>
      <p>There is no run with that id.</p>
      <Link href="/runs">← Back to all runs</Link>
    </div>
  );
}