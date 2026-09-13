"use client";

import { useId, useState } from "react";
import { formatNumber } from "@/lib/format";
import type { ColumnWarning, IgnoredFile, TableDiagnostic } from "@/lib/runs/types";
import { ColumnName, Icon, TableName, type IconName } from "./ui";

const STATUS: Record<TableDiagnostic["status"], { icon: IconName; color: string; label: string }> = {
  ok: { icon: "checkCircle", color: "text-emerald-600", label: "OK" },
  warning: { icon: "alert", color: "text-amber-600", label: "Warning" },
  error: { icon: "xCircle", color: "text-red-600", label: "Error" },
};

/** El backend antepone "no encontrada → " a la pérdida de capacidad; la columna de filas ya lo dice. */
const MISSING_PREFIX = /^(no encontrada|not found)\s*→\s*/i;

/** Diagnóstico de tablas del dataset (EXAMPLE §4.2). */
export function TableDiagnostics({
  tables,
  columnWarnings = [],
  ignoredFiles = [],
}: {
  tables: TableDiagnostic[];
  columnWarnings?: ColumnWarning[];
  ignoredFiles?: IgnoredFile[];
}) {
  const [showColumns, setShowColumns] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);
  const panelId = useId();
  const ignoredPanelId = useId();

  return (
    <div>
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
        {tables.map((table) => {
          const status = STATUS[table.status];
          const missing = table.missing;
          return (
            <li key={table.name} className="flex flex-col gap-1 px-3 py-2.5 text-sm sm:flex-row sm:items-baseline sm:gap-3 sm:px-4">
              <span className="flex min-w-0 items-center gap-2 sm:w-64 sm:shrink-0">
                <span className={status.color}>
                  <Icon name={status.icon} className="h-4 w-4" />
                  <span className="sr-only">{status.label}:</span>
                </span>
                <TableName table={table.name} />
                <span className={`ml-auto tabular-nums sm:ml-auto ${missing ? "text-red-700" : "text-zinc-500"}`}>
                  {missing ? "not found" : `${formatNumber(table.rows)} rows`}
                </span>
              </span>
              {table.source_file && (
                <span title={table.source_file} className="min-w-0 truncate pl-6 font-mono text-xs text-zinc-400 sm:max-w-64 sm:pl-0">
                  {table.source_file}
                </span>
              )}
              {table.warnings.length > 0 && (
                <span className={`pl-6 sm:pl-0 ${table.status === "error" ? "text-red-700" : "text-amber-800"}`}>
                  {table.warnings.map((warning) => (
                    <span key={warning} className="block">
                      <span aria-hidden>→ </span>
                      {missing ? warning.replace(MISSING_PREFIX, "") : warning}
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
            Columns: {columnWarnings.length} {columnWarnings.length === 1 ? "warning" : "warnings"}{" "}
            <button
              type="button"
              aria-expanded={showColumns}
              aria-controls={panelId}
              onClick={() => setShowColumns((value) => !value)}
              className="font-medium text-zinc-900 underline underline-offset-4"
            >
              {showColumns ? "hide details" : "show details"}
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

      {ignoredFiles.length > 0 && (
        <div className="mt-3 text-sm">
          <button
            type="button"
            aria-expanded={showIgnored}
            aria-controls={ignoredPanelId}
            onClick={() => setShowIgnored((value) => !value)}
            className="font-medium text-zinc-700 underline underline-offset-4"
          >
            Ignored files ({ignoredFiles.length})
          </button>
          {showIgnored && (
            <ul id={ignoredPanelId} className="mt-2 space-y-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
              {ignoredFiles.map((file) => (
                <li key={`${file.filename}.${file.reason}`} className="min-w-0">
                  <p className="truncate font-mono text-xs text-zinc-600" title={file.filename}>{file.filename}</p>
                  <p className="text-zinc-500">{file.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
