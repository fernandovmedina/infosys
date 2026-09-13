"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateTime, formatMoneyMXN } from "@/lib/format";
import { errorMessage } from "@/lib/runs/errors";
import { RUN_STATUS_LABELS, VERDICT_LABELS } from "@/lib/runs/labels";
import { deleteAllRuns, deleteRun, getValidation, listRuns } from "@/lib/runs/api";
import type { RunStatus, RunSummary, Verdict } from "@/lib/runs/types";
import { Button, Icon, LoadingBlock, Notice, Spinner, type IconName } from "./ui";

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

function Outcome({ run, blocked }: { run: RunSummary; blocked: boolean }) {
  if (blocked) {
    return (
      <span className="inline-flex items-center gap-1 justify-self-start rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
        <Icon name="xCircle" className="h-3.5 w-3.5" />
        Dataset incompleto
      </span>
    );
  }
  if (run.status !== "completed" || !run.verdict) {
    return (
      <span className={`inline-flex justify-self-start rounded-full px-2 py-0.5 text-xs font-medium ${RUN_STATUS_STYLES[run.status]}`}>
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
  const [blockedRunIds, setBlockedRunIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [confirmingRunId, setConfirmingRunId] = useState<string | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [runDeleteErrors, setRunDeleteErrors] = useState<Record<string, string>>({});
  const [confirmingDeleteAll, setConfirmingDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null);
  const deletableCount = runs?.filter((run) => run.status !== "running").length ?? 0;

  useEffect(() => {
    let cancelled = false;
    listRuns()
      .then((result) => {
        if (cancelled) return;
        setRuns(result);
        // `GET /runs` no dice si una corrida lista quedó bloqueada por su validación: se consulta aparte.
        const ready = result.filter((run) => run.status === "ready");
        return Promise.all(
          ready.map((run) =>
            getValidation(run.run_id)
              .then((validation) => (validation.tables.some((table) => table.status === "error") ? run.run_id : null))
              .catch(() => null),
          ),
        ).then((ids) => {
          if (!cancelled) setBlockedRunIds(new Set(ids.filter((id): id is string => id !== null)));
        });
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDeleteRun(runId: string) {
    setDeletingRunId(runId);
    try {
      await deleteRun(runId);
      setRuns((current) => current?.filter((run) => run.run_id !== runId) ?? current);
      setConfirmingRunId(null);
      setRunDeleteErrors((current) => {
        const next = { ...current };
        delete next[runId];
        return next;
      });
    } catch (cause) {
      setRunDeleteErrors((current) => ({ ...current, [runId]: errorMessage(cause) }));
    } finally {
      setDeletingRunId(null);
    }
  }

  async function handleDeleteAll() {
    setDeletingAll(true);
    setDeleteAllError(null);
    try {
      await deleteAllRuns();
      setRuns(await listRuns());
      setConfirmingDeleteAll(false);
      setConfirmingRunId(null);
      setRunDeleteErrors({});
    } catch (cause) {
      setDeleteAllError(errorMessage(cause));
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <section aria-labelledby="history-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="history-title" className="text-lg font-semibold tracking-tight text-zinc-900">
          Historial de corridas
        </h2>
        {deletableCount > 0 && !confirmingDeleteAll && (
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() => {
              setDeleteAllError(null);
              setConfirmingDeleteAll(true);
            }}
            disabled={deletingAll || deletingRunId !== null}
          >
            Borrar historial
          </Button>
        )}
      </div>
      {confirmingDeleteAll && runs && deletableCount > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>
            {deletableCount === 1 ? "Se eliminará 1 corrida y su dataset." : `Se eliminarán ${deletableCount} corridas y sus datasets.`}{" "}
            {deletableCount < runs.length && "Las corridas en curso se conservan. "}
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmingDeleteAll(false);
                setDeleteAllError(null);
              }}
              disabled={deletingAll}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void handleDeleteAll()} disabled={deletingAll} aria-busy={deletingAll}>
              {deletingAll && <Spinner className="h-3.5 w-3.5" />}
              Borrar historial
            </Button>
          </div>
          {deleteAllError && <p className="mt-2 text-red-700" role="alert">{deleteAllError}</p>}
        </div>
      )}
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
                <div className="flex items-stretch">
                  <Link
                    href={`/runs/${encodeURIComponent(run.run_id)}`}
                    className="grid min-w-0 flex-1 gap-1.5 px-4 py-3 text-sm outline-none transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-zinc-900">{run.company_name ?? run.filename}</span>
                      <span className="block truncate text-xs text-zinc-500">
                        {run.filename} · <span className="font-mono">{run.run_id}</span>
                      </span>
                    </span>
                    <Outcome run={run} blocked={run.status === "ready" && blockedRunIds.has(run.run_id)} />
                    <span className="text-xs text-zinc-500 sm:text-right">{formatDateTime(run.created_at)}</span>
                  </Link>
                  {run.status !== "running" && (
                    <div className="flex shrink-0 items-center px-3">
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs"
                        aria-label={`Eliminar corrida ${run.filename}`}
                        onClick={() => {
                          setConfirmingRunId(run.run_id);
                          setRunDeleteErrors((current) => {
                            const next = { ...current };
                            delete next[run.run_id];
                            return next;
                          });
                        }}
                        disabled={deletingAll || deletingRunId !== null}
                      >
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
                {confirmingRunId === run.run_id && (
                  <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
                    <p className="text-zinc-700">¿Eliminar esta corrida? Se borra también el dataset subido.</p>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setConfirmingRunId(null);
                          setRunDeleteErrors((current) => {
                            const next = { ...current };
                            delete next[run.run_id];
                            return next;
                          });
                        }}
                        disabled={deletingRunId === run.run_id}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => void handleDeleteRun(run.run_id)}
                        disabled={deletingRunId !== null}
                        aria-busy={deletingRunId === run.run_id}
                      >
                        {deletingRunId === run.run_id && <Spinner className="h-3.5 w-3.5" />}
                        Eliminar
                      </Button>
                    </div>
                    {runDeleteErrors[run.run_id] && (
                      <p className="mt-2 text-red-700" role="alert">{runDeleteErrors[run.run_id]}</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
