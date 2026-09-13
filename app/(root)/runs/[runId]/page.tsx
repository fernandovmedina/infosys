import { Suspense } from "react";
import { RunScreen } from "@/components/runs/run-screen";
import { LoadingBlock } from "@/components/runs/ui";

export default async function RunPage({ params }: PageProps<"/runs/[runId]">) {
  const { runId } = await params;

  return (
    // El case file lee `useSearchParams` (sección, hallazgo, exhibit).
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          <LoadingBlock />
        </main>
      }
    >
      <RunScreen runId={runId} />
    </Suspense>
  );
}
