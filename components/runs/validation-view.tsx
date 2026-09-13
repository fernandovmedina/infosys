"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";
import { ApiError, errorMessage } from "@/lib/runs/errors";
import { deleteRun, getValidation, startRun } from "@/lib/runs/api";
import type { RunState, ValidationResult } from "@/lib/runs/types";
import { TableDiagnostics } from "./table-diagnostics";
import { Button, LoadingBlock, Notice, Spinner } from "./ui";

/** Diagnóstico de tablas antes de investigar (EXAMPLE §4). */
export function ValidationView({
  runId,
  onStarted,
  onError,
}: {
  runId: string;
  onStarted: (state: RunState) => void;
  onError: (error: unknown) => void;
}) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<{ code?: string; message: string } | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);
  const router = useRouter();
  const reportError = useEffectEvent(onError);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = () => {
      getValidation(runId)
        .then((result) => {
          if (cancelled) return;
          setValidation(result);
          if (result.status === "validating") timer = setTimeout(load, 1200);
        })
        .catch((error) => {
          if (!cancelled) reportError(error);
        });
    };
    load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [runId]);

  async function handleStart() {
    setStarting(true);
    setStartError(null);
    try {
      onStarted(await startRun(runId));
    } catch (error) {
      setStartError({
        code: error instanceof ApiError ? error.code : undefined,
        message: errorMessage(error),
      });
      setStarting(false);
    }
  }

  /** Una corrida bloqueada nunca podrá iniciarse: se borra para que no quede en el historial. */
  async function handleDiscard() {
    setDiscarding(true);
    setDiscardError(null);
    try {
      await deleteRun(runId);
      router.push("/dashboard");
    } catch (error) {
      setDiscardError(errorMessage(error));
      setDiscarding(false);
    }
  }

  const validating = !validation || validation.status === "validating";
  const errors = validation?.tables.filter((table) => table.status === "error") ?? [];
  const warnings = validation?.tables.filter((table) => table.status === "warning") ?? [];

  return (
    <section aria-labelledby="validation-title">
      <p className="text-sm text-zinc-500">Paso 1 de 3 · Diagnóstico del dataset</p>
      <h1 id="validation-title" className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
        {validating ? "Revisando las tablas…" : "Tablas detectadas"}
      </h1>
      {validation && (
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600">
          <p className="min-w-0 max-w-full truncate">{validation.filename}</p>
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600">
            {validation.format.toUpperCase()}
          </span>
          <span className="font-mono text-xs text-zinc-400" title={validation.sha256}>
            SHA-256 {validation.sha256.slice(0, 12)}…
          </span>
        </div>
      )}

      <div className="mt-6">
        {validating ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <LoadingBlock label="Leyendo el archivo y buscando las 8 tablas del estate…" />
          </div>
        ) : (
          <TableDiagnostics
            tables={validation.tables}
            columnWarnings={validation.column_warnings}
            ignoredFiles={validation.ignored_files}
          />
        )}
      </div>

      {!validating && errors.length > 0 && (
        <Notice tone="error" title="No se puede iniciar la investigación" className="mt-4">
          Falta información imprescindible. Corrige {errors.length === 1 ? "la tabla marcada" : "las tablas marcadas"} en rojo y vuelve a subir el archivo.
        </Notice>
      )}
      {!validating && errors.length === 0 && warnings.length > 0 && (
        <Notice tone="warning" title="Se puede investigar, con un análisis parcial" className="mt-4">
          Las advertencias aparecerán en la sección Método y límites del case file.
        </Notice>
      )}
      {startError?.code === "investigation_unavailable" && (
        <Notice tone="info" title="Dataset validado y guardado" className="mt-4">
          La investigación automática aún no está disponible.
        </Notice>
      )}
      {startError && startError.code !== "investigation_unavailable" && (
        <Notice tone="error" className="mt-4">
          {startError.message}
        </Notice>
      )}

      {discardError && (
        <Notice tone="error" className="mt-4">
          No se pudo descartar la corrida: {discardError}
        </Notice>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {!validating && errors.length > 0 ? (
          <Button onClick={() => void handleDiscard()} disabled={discarding} aria-busy={discarding}>
            {discarding && <Spinner className="h-3.5 w-3.5" />}
            Descartar y subir otro
          </Button>
        ) : (
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Cancelar
          </Link>
        )}
        <Button
          variant="primary"
          onClick={handleStart}
          disabled={validating || errors.length > 0 || starting}
        >
          {starting && <Spinner className="h-3.5 w-3.5" />}
          {starting ? "Iniciando…" : "Iniciar investigación"}
        </Button>
      </div>
    </section>
  );
}
