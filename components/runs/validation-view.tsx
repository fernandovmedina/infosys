"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";
import { errorMessage } from "@/lib/runs/errors";
import { getValidation, startRun } from "@/lib/runs/api";
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
  const [startError, setStartError] = useState<string | null>(null);
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
      setStartError(errorMessage(error));
      setStarting(false);
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
      {validation && <p className="mt-1 truncate text-sm text-zinc-600">{validation.filename}</p>}

      <div className="mt-6">
        {validating ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <LoadingBlock label="Leyendo el archivo y buscando las 8 tablas del estate…" />
          </div>
        ) : (
          <TableDiagnostics tables={validation.tables} columnWarnings={validation.column_warnings} />
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
      {startError && (
        <Notice tone="error" className="mt-4">
          {startError}
        </Notice>
      )}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Cancelar
        </Link>
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
