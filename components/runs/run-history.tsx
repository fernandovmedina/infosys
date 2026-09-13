"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateTime, formatMoneyMXN } from "@/lib/format";
import { errorMessage } from "@/lib/runs/errors";
import { RUN_STATUS_LABELS, VERDICT_LABELS } from "@/lib/runs/labels";
import { listRuns } from "@/lib/runs/api";
import type { RunStatus, RunSummary, Verdict } from "@/lib/runs/types";
import { Icon, LoadingBlock, Notice, type IconName } from "./ui";

export const VERDICT_STYLES: Record<Verdict, { badge: string; icon: IconName }> = {
  fraud_proven: { badge: "bg-red-50 text-red-700 ring-red-200", icon: "xCircle" },
  fraud_probable: { badge: "bg-orange-50 text-orange-800 ring-orange-200", icon: "alert" },
  clean_with_leads: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "checkCircle" },
  clean: { badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: "checkCircle" },
};

const RUN_STATUS_STYLES: Record<RunStatus, string> = {
  validating: "bg-zinc-100 text-zinc-700",
  ready: "bg-sky-50 text-sky-800",
  running: "bg-sky-50 text-sky-800",
  completed: "bg-zinc-100 text-zinc-700",
  failed: "bg-red-50 text-red-700",
};

function Outcome({ run }: { run: RunSummary }) {
  if (run.status !== "completed" || !run.verdict) {
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RUN_STATUS_STYLES[run.status]}`}>
        {RUN_STATUS_LABELS[run.status]}
      </span>
    );
  }
  const style = VERDICT_STYLES[run.verdict];
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
        <Icon name={style.icon} className="h-3.5 w-3.5" />
        {VERDICT_LABELS[run.verdict]}
      </span>
      {typeof run.total_exposure === "number" && run.total_exposure > 0 && (
        <span className="text-xs tabular-nums text-zinc-600">{formatMoneyMXN(run.total_exposure)}</span>
      )}
    </span>
  );
}

/** Historial de corridas del usuario (`GET /runs`). */
export function RunHistory() {
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listRuns()
      .then((result) => {
        if (!cancelled) setRuns(result);
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section aria-labelledby="history-title">
      <h2 id="history-title" className="text-lg font-semibold tracking-tight text-zinc-900">
        Historial de corridas
      </h2>
      <div className="mt-3">
        {error ? (
          <Notice tone="error" title="No se pudo cargar el historial">
            {error}
          </Notice>
        ) : runs === null ? (
          <LoadingBlock />
        ) : runs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
            Todavía no hay corridas. Sube los libros de una empresa para iniciar la primera investigación.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {runs.map((run) => (
              <li key={run.run_id}>
                <Link
                  href={`/runs/${encodeURIComponent(run.run_id)}`}
                  className="grid gap-1.5 px-4 py-3 text-sm outline-none transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-zinc-900">{run.company_name ?? run.filename}</span>
                    <span className="block truncate text-xs text-zinc-500">
                      {run.filename} · <span className="font-mono">{run.run_id}</span>
                    </span>
                  </span>
                  <Outcome run={run} />
                  <span className="text-xs text-zinc-500 sm:text-right">{formatDateTime(run.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
