"use client";

import { useEffect, useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";
import { errorMessage, isNotFound } from "@/lib/runs/errors";
import { getRecord } from "@/lib/runs/api";
import { SCHEME_LABELS } from "@/lib/runs/labels";
import {
  CLABE_COLUMNS,
  EMPLOYEE_COLUMNS,
  MONEY_COLUMNS,
  RFC_COLUMNS,
  TABLES,
  codeLabel,
  entityIdFromValue,
  parseRecordKey,
  recordKey,
} from "@/lib/runs/schema";
import type { RecordView, SourceTable } from "@/lib/runs/types";
import { CaseEntityChip } from "./case-chips";
import { useCaseFile } from "./case-file-context";
import { EntityStatusBadge } from "./entity-status-badge";
import { ColumnName, CopyButton, Drawer, Icon, LoadingBlock, Notice, SectionLabel, TableName, Tooltip } from "./ui";

type Target = { table: SourceTable; recordId: string; exhibit?: { findingIndex: number; exhibitId: string; note: string } };

function useDrawerTarget(): Target | null {
  const { params, report } = useCaseFile();
  const exhibitId = params.get("exhibit");
  if (exhibitId) {
    const findingNumber = Number(params.get("finding"));
    const candidates = Number.isInteger(findingNumber) && findingNumber > 0 ? [findingNumber - 1] : report.submission.findings.map((_, i) => i);
    for (const findingIndex of candidates) {
      const exhibit = report.submission.findings[findingIndex]?.exhibits.find((item) => item.exhibit_id === exhibitId);
      if (exhibit) {
        return { table: exhibit.source_table, recordId: exhibit.record_id, exhibit: { findingIndex, exhibitId, note: exhibit.note } };
      }
    }
    return null;
  }
  const key = params.get("record");
  const parsed = key ? parseRecordKey(key) : null;
  return parsed ? { table: parsed.table, recordId: parsed.recordId } : null;
}

function FieldValue({ column, value }: { column: string; value: string | number | null }) {
  const { report, entity } = useCaseFile();
  if (value === null || value === "") return <span className="text-zinc-400">—</span>;

  if (MONEY_COLUMNS.has(column) && typeof value === "number") {
    return <span className="tabular-nums">{formatMoney(value)}</span>;
  }

  const text = String(value);
  if (RFC_COLUMNS.has(column) || EMPLOYEE_COLUMNS.has(column)) {
    const id = entityIdFromValue(column, text);
    if (id) {
      return (
        <span className="inline-flex flex-wrap items-center gap-1.5">
          <CaseEntityChip id={id} />
          {entity(id).known && <span className="text-xs text-zinc-500">{entity(id).name}</span>}
        </span>
      );
    }
  }

  if (CLABE_COLUMNS.has(column)) {
    const owners = Object.entries(report.entities).filter(([, item]) => item.bank_clabe === text);
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <Tooltip content={text}>
          <span className="font-mono text-xs">{text}</span>
        </Tooltip>
        <CopyButton value={text} label="Copiar CLABE" />
        {owners.map(([id]) => (
          <CaseEntityChip key={id} id={id} />
        ))}
        {owners.length > 1 && <span className="text-xs font-medium text-red-700">misma CLABE en {owners.length} entidades</span>}
      </span>
    );
  }

  const code = codeLabel(column, value);
  if (code) {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span>{text}</span>
        <Tooltip content={code} focusable className="rounded outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
          <span className="inline-flex cursor-help items-center gap-0.5 text-xs text-zinc-500">
            <Icon name="info" className="h-3.5 w-3.5" /> {code}
          </span>
        </Tooltip>
      </span>
    );
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return (
      <span>
        {text} <span className="text-xs text-zinc-500">({formatDate(text)})</span>
      </span>
    );
  }

  return <span className="break-words">{text}</span>;
}

function RecordBody({ target }: { target: Target }) {
  const { report, runId, openExhibit, openRecord } = useCaseFile();
  const key = recordKey(target.table, target.recordId);
  const cached = report.records[key];
  const [fetched, setFetched] = useState<RecordView | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    getRecord(runId, target.table, target.recordId)
      .then((record) => {
        if (!cancelled) setFetched(record);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause);
      });
    return () => {
      cancelled = true;
    };
  }, [cached, runId, target.table, target.recordId]);

  const record = cached ?? fetched;

  if (error) {
    return isNotFound(error) ? (
      <Notice tone="error" title="Registro citado no encontrado">
        El backend no tiene <code className="font-mono">{target.table}/{target.recordId}</code>. La cita existe en el hallazgo pero el registro no se pudo recuperar.
      </Notice>
    ) : (
      <Notice tone="error" title="No se pudo cargar el registro">
        {errorMessage(error)}
      </Notice>
    );
  }
  if (!record) return <LoadingBlock label="Cargando registro…" />;

  const meta = TABLES[record.source_table];
  const columns = [...meta.columns, ...Object.keys(record.data).filter((column) => !meta.columns.includes(column))];
  const highlights = new Set(record.highlight_fields);
  const otherCitations = record.cited_in.filter(
    (cite) => !(target.exhibit && cite.finding_index === target.exhibit.findingIndex && cite.exhibit_id === target.exhibit.exhibitId),
  );

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
        {columns.map((column) => {
          const highlighted = highlights.has(column);
          return (
            <div key={column} className={`grid grid-cols-1 gap-1 px-3 py-2 text-sm sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-3 ${highlighted ? "bg-amber-50" : ""}`}>
              <dt className="flex items-center gap-1">
                <ColumnName column={column} />
              </dt>
              <dd className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-zinc-900">
                <FieldValue column={column} value={record.data[column] ?? null} />
                {highlighted && (
                  <span className="shrink-0 text-xs font-medium text-amber-800">
                    <span aria-hidden>◀ </span>citado
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {otherCitations.length > 0 && (
        <div>
          <SectionLabel>{target.exhibit ? "Aparece también en" : "Citado en"}</SectionLabel>
          <ul className="mt-2 space-y-1 text-sm">
            {otherCitations.map((cite) => (
              <li key={`${cite.finding_index}-${cite.exhibit_id}`}>
                <button type="button" onClick={() => openExhibit(cite.finding_index, cite.exhibit_id)} className="text-left font-medium text-zinc-900 underline underline-offset-4">
                  Hallazgo #{cite.finding_index + 1} ({cite.exhibit_id})
                </button>{" "}
                <span className="text-zinc-500">· {SCHEME_LABELS[report.submission.findings[cite.finding_index]?.scheme_type]?.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {record.related.length > 0 && (
        <div>
          <SectionLabel>Registros relacionados</SectionLabel>
          <ul className="mt-2 divide-y divide-zinc-100 rounded-md border border-zinc-200 text-sm">
            {record.related.map((related) => {
              const relatedRecord = report.records[recordKey(related.source_table, related.record_id)];
              const cite = relatedRecord?.cited_in[0];
              return (
                <li key={`${related.source_table}:${related.record_id}`}>
                  <button
                    type="button"
                    onClick={() => (cite ? openExhibit(cite.finding_index, cite.exhibit_id) : openRecord(related.source_table, related.record_id))}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-zinc-50"
                  >
                    <span className="min-w-0">
                      <span className="text-zinc-900">{TABLES[related.source_table].label}</span>{" "}
                      <span className="font-mono text-xs text-zinc-700">{related.record_id}</span>{" "}
                      <span className="text-xs text-zinc-500">({related.source_table})</span>
                      {cite && <span className="ml-1 rounded bg-zinc-900 px-1 font-mono text-[0.6875rem] text-white">{cite.exhibit_id}</span>}
                    </span>
                    <Icon name="external" className="h-4 w-4 text-zinc-400" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Panel lateral con todas las columnas de un registro (EXAMPLE §7.6). */
export function RecordDrawer() {
  const { closeDrawer, report, entity } = useCaseFile();
  const target = useDrawerTarget();
  const meta = target ? TABLES[target.table] : null;
  const entityValue = target && (target.table === "vendors" || target.table === "efos_list") ? `RFC:${target.recordId}` : null;

  return (
    <Drawer
      open={Boolean(target)}
      onClose={closeDrawer}
      title={
        target && meta ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {target.exhibit && <span className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-xs text-white">{target.exhibit.exhibitId}</span>}
            <span>{meta.label}</span>
            <span className="font-mono text-sm font-medium text-zinc-600">{target.recordId}</span>
          </span>
        ) : (
          ""
        )
      }
      subtitle={
        target && (
          <span className="block space-y-1">
            {target.exhibit && (
              <span className="block">
                <span className="font-medium text-zinc-900">Qué prueba:</span> {target.exhibit.note}
              </span>
            )}
            <span className="flex flex-wrap items-center gap-1.5 text-xs">
              Tabla <TableName table={target.table} className="text-xs" />
              {target.exhibit && <span>· Hallazgo #{target.exhibit.findingIndex + 1}</span>}
              {entityValue && entity(entityValue).known && <EntityStatusBadge status={report.entities[entityValue].status} size="sm" />}
            </span>
          </span>
        )
      }
    >
      {target && <RecordBody key={`${target.table}:${target.recordId}`} target={target} />}
    </Drawer>
  );
}
