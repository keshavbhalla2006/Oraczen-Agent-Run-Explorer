import Link from "next/link";
import { notFound } from "next/navigation";
import ExplainButton from "@/components/ExplainButton";
import RunMeta from "@/components/RunMeta";
import StepList from "@/components/StepList";
import { fetchRun } from "@/lib/api";

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const run = await fetchRun(id);
  if (run === null) notFound();

  return (
    <>
      <p>
        <Link href="/runs">← All runs</Link>
      </p>
      <RunMeta run={run} />
      <ExplainButton runId={run.id} />
      <h2>Steps ({run.steps.length})</h2>
      <StepList run={run} />
    </>
  );
}