"use client";

import { useId, useState } from "react";
import { formatNumber } from "@/lib/format";
import type { ColumnWarning, TableDiagnostic } from "@/lib/runs/types";
import { ColumnName, Icon, TableName, type IconName } from "./ui";

const STATUS: Record<TableDiagnostic["status"], { icon: IconName; color: string; label: string }> = {
  ok: { icon: "checkCircle", color: "text-emerald-600", label: "Correcta" },
  warning: { icon: "alert", color: "text-amber-600", label: "Advertencia" },
  error: { icon: "xCircle", color: "text-red-600", label: "Error" },
};

/** Diagnóstico de tablas del dataset (EXAMPLE §4.2). */
export function TableDiagnostics({
  tables,
  columnWarnings = [],
}: {
  tables: TableDiagnostic[];
  columnWarnings?: ColumnWarning[];
}) {
  const [showColumns, setShowColumns] = useState(false);
  const panelId = useId();

  return (
    <div>
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
        {tables.map((table) => {
          const status = STATUS[table.status];
          const missing = table.status === "error" && table.rows === 0;
          return (
            <li key={table.name} className="flex flex-col gap-1 px-3 py-2.5 text-sm sm:flex-row sm:items-baseline sm:gap-3 sm:px-4">
              <span className="flex min-w-0 items-center gap-2 sm:w-64 sm:shrink-0">
                <span className={status.color}>
                  <Icon name={status.icon} className="h-4 w-4" />
                  <span className="sr-only">{status.label}:</span>
                </span>
                <TableName table={table.name} />
                <span className={`ml-auto tabular-nums sm:ml-auto ${missing ? "text-red-700" : "text-zinc-500"}`}>
                  {missing ? "no encontrada" : `${formatNumber(table.rows)} filas`}
                </span>
              </span>
              {table.warnings.length > 0 && (
                <span className={`pl-6 sm:pl-0 ${table.status === "error" ? "text-red-700" : "text-amber-800"}`}>
                  {table.warnings.map((warning) => (
                    <span key={warning} className="block">
                      <span aria-hidden>→ </span>
                      {warning}
                    </span>
                  ))}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {columnWarnings.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="text-zinc-600">
            Columnas: {columnWarnings.length} {columnWarnings.length === 1 ? "advertencia" : "advertencias"}{" "}
            <button
              type="button"
              aria-expanded={showColumns}
              aria-controls={panelId}
              onClick={() => setShowColumns((value) => !value)}
              className="font-medium text-zinc-900 underline underline-offset-4"
            >
              {showColumns ? "ocultar detalle" : "ver detalle"}
            </button>
          </p>
          {showColumns && (
            <ul id={panelId} className="mt-2 space-y-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              {columnWarnings.map((warning) => (
                <li key={`${warning.table}.${warning.column}`} className="flex flex-wrap items-baseline gap-x-2 text-amber-900">
                  <span className="font-mono text-xs">
                    <TableName table={warning.table} className="text-xs" />.<ColumnName column={warning.column} />
                  </span>
                  <span>{warning.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
