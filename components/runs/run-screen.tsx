"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { errorMessage, isNotAuthenticated, isNotFound } from "@/lib/runs/errors";
import { getRun } from "@/lib/runs/api";
import type { RunState } from "@/lib/runs/types";
import { useRequireUser } from "@/lib/use-require-user";
import { CaseFile } from "./case-file";
import { FailedRun } from "./failed-run";
import { LiveProgress } from "./live-progress";
import { Button, LoadingBlock, Notice } from "./ui";
import { ValidationView } from "./validation-view";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * `/runs/[runId]`: una sola ruta que muestra, según `run.status`, el
 * diagnóstico, la investigación en vivo, el case file o el error.
 */
export function RunScreen({ runId }: { runId: string }) {
  const user = useRequireUser();
  const router = useRouter();
  const [run, setRun] = useState<RunState | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [justFinished, setJustFinished] = useState(false);

  function handleError(cause: unknown) {
    if (isNotAuthenticated(cause)) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/runs/${runId}`)}`);
      return;
    }
    setError(cause);
  }
  const onLoadError = useEffectEvent(handleError);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getRun(runId)
      .then((state) => {
        if (!cancelled) setRun(state);
      })
      .catch((cause) => {
        if (!cancelled) onLoadError(cause);
      });
    return () => {
      cancelled = true;
    };
  }, [user, runId]);

  async function refreshAfterFinish() {
    // El evento `completed` puede llegar un instante antes de que el estado
    // de la corrida cambie; se reintenta unas veces antes de mostrarlo.
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const state = await getRun(runId);
        if (state.status === "completed" || state.status === "failed") {
          setJustFinished(state.status === "completed");
          setRun(state);
          return;
        }
      } catch (cause) {
        handleError(cause);
        return;
      }
      await sleep(500);
    }
  }

  const wide = run?.status === "completed";

  return (
    <main className={`mx-auto w-full flex-1 px-4 py-8 sm:py-10 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
      {!user ? (
        <LoadingBlock />
      ) : error ? (
        isNotFound(error) ? (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">We couldn’t find this run</h1>
            <p className="mt-2 text-sm text-zinc-600">
              The link may be mistyped, or the run belongs to another account.
            </p>
            <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-zinc-900 underline underline-offset-4">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <Notice tone="error" title="Could not load the run">
            <p>{errorMessage(error)}</p>
            <Button className="mt-3" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Notice>
        )
      ) : !run ? (
        <LoadingBlock label="Loading run…" />
      ) : run.status === "validating" || run.status === "ready" ? (
        <ValidationView key={run.run_id} runId={run.run_id} onStarted={setRun} onError={handleError} />
      ) : run.status === "running" ? (
        <LiveProgress
          key={`${run.run_id}:${run.started_at}`}
          runId={run.run_id}
          filename={run.filename}
          initialCounters={run.counters}
          onFinished={refreshAfterFinish}
        />
      ) : run.status === "failed" ? (
        <FailedRun run={run} onRetried={setRun} />
      ) : (
        <CaseFile runId={run.run_id} justFinished={justFinished} />
      )}
    </main>
  );
}
