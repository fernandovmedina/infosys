"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { errorMessage } from "@/lib/runs/errors";
import { getLog, startRun } from "@/lib/runs/api";
import type { RunEvent, RunState } from "@/lib/runs/types";
import { EventRow } from "./event-list";
import { Button, Icon, LoadingBlock, Notice, Spinner } from "./ui";

/** Corrida fallida (EXAMPLE §11): mensaje del backend, log y reintento. */
export function FailedRun({ run, onRetried }: { run: RunState; onRetried: (state: RunState) => void }) {
  const [events, setEvents] = useState<RunEvent[] | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLog(run.run_id)
      .then((log) => {
        if (!cancelled) setEvents(log);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [run.run_id]);

  async function retry() {
    setRetrying(true);
    setRetryError(null);
    try {
      onRetried(await startRun(run.run_id));
    } catch (error) {
      setRetryError(errorMessage(error));
      setRetrying(false);
    }
  }

  return (
    <section aria-labelledby="failed-title">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Icon name="xCircle" className="mt-0.5 h-6 w-6 text-red-600" />
          <div className="min-w-0">
            <h1 id="failed-title" className="text-xl font-semibold tracking-tight text-red-900">
              The investigation didn’t complete
            </h1>
            <p className="mt-2 text-sm text-red-900">
              {run.error?.message ?? "The backend stopped the run without further details."}
            </p>
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-red-800">
              {run.error?.code && (
                <span>
                  Code: <code className="font-mono">{run.error.code}</code>
                </span>
              )}
              <span className="truncate">File: {run.filename}</span>
              {run.finished_at && <span>Stopped: {formatDateTime(run.finished_at)}</span>}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <a
            href="#failed-log"
            className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
          >
            View log
          </a>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Upload another file
          </Link>
          <Button variant="primary" onClick={retry} disabled={retrying}>
            {retrying ? <Spinner className="h-3.5 w-3.5" /> : <Icon name="refresh" className="h-4 w-4" />}
            Retry
          </Button>
        </div>
      </div>

      {retryError && (
        <Notice tone="error" className="mt-4">
          {retryError}
        </Notice>
      )}

      <h2 id="failed-log" className="mt-8 scroll-mt-4 text-sm font-semibold text-zinc-900">
        Run log up to the failure
      </h2>
      <div className="mt-3 rounded-lg border border-zinc-200 bg-white">
        {events === null ? (
          <div className="p-4">
            <LoadingBlock />
          </div>
        ) : events.length === 0 ? (
          <p className="p-4 text-sm text-zinc-500">No events recorded.</p>
        ) : (
          <ol className="divide-y divide-zinc-100">
            {events.map((event, index) => (
              <EventRow key={event.seq} event={event} showTime pendingResolved={index < events.length - 1} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
