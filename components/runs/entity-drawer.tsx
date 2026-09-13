"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/format";
import { errorMessage, isNotFound } from "@/lib/runs/errors";
import { getEntityTimeline } from "@/lib/runs/api";
import { CLOSED_BY_LABELS, KIND_LABELS, SCHEME_LABELS, SIGNAL_LABELS } from "@/lib/runs/labels";
import { MONEY_COLUMNS } from "@/lib/runs/schema";
import type { EntityTimeline as TimelineData } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { displayEntityId } from "./entity-chip";
import { EntityStatusBadge } from "./entity-status-badge";
import { EntityTimeline } from "./entity-timeline";
import { ColumnName, CopyButton, Drawer, Icon, LoadingBlock, Notice, SectionLabel } from "./ui";

function EntityBody({ entityId }: { entityId: string }) {
  const { runId, report, entity, openFinding, openLead, openRecord, navigate } = useCaseFile();
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    getEntityTimeline(runId, entityId)
      .then((result) => {
        if (!cancelled) setTimeline(result);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause);
      });
    return () => {
      cancelled = true;
    };
  }, [runId, entityId]);

  // El estado viene del reporte; si la entidad no está ahí, del timeline del backend.
  const known = entity(entityId);
  const data = known.known ? known : timeline?.entity ?? known;
  const lead = data.lead_index !== null ? report.submission.leads_not_pursued[data.lead_index] : null;

  return (
    <div className="space-y-6">
      {!known.known && timeline && timeline.entity.name !== entityId && (
        <p className="-mb-4 text-base font-semibold text-zinc-900">{timeline.entity.name}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(known.known || timeline) && <EntityStatusBadge status={data.status} />}
        <span className="text-zinc-600">
          <span aria-hidden>{KIND_LABELS[data.is_audited_company ? "company" : data.kind].icon} </span>
          {KIND_LABELS[data.is_audited_company ? "company" : data.kind].label}
          {data.role && ` · ${data.role}`}
        </span>
      </div>

      {(data.finding_indexes.length > 0 || lead) && (
        <div>
          <SectionLabel>Dónde aparece</SectionLabel>
          <ul className="mt-2 space-y-2 text-sm">
            {data.finding_indexes.map((index) => (
              <li key={index}>
                <button type="button" onClick={() => openFinding(index)} className="inline-flex items-center gap-1 font-medium text-red-700 underline underline-offset-4">
                  Hallazgo #{index + 1} · {SCHEME_LABELS[report.submission.findings[index].scheme_type].label}
                  <Icon name="arrowRight" className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {lead && data.lead_index !== null && (
              <li className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <button type="button" onClick={() => openLead(data.lead_index!)} className="inline-flex items-center gap-1 font-medium text-amber-900 underline underline-offset-4">
                  Lead descartado <Icon name="arrowRight" className="h-3.5 w-3.5" />
                </button>
                <p className="mt-1 text-amber-950">
                  <span className="font-medium">Por qué se descartó:</span> {lead.reason}
                </p>
                {lead.closed_by && <p className="mt-1 text-xs text-amber-900">Cerrado por {CLOSED_BY_LABELS[lead.closed_by].label}</p>}
              </li>
            )}
          </ul>
        </div>
      )}

      <div>
        <SectionLabel>Detectores que dispararon</SectionLabel>
        {data.signals.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {data.signals.map((signal) => (
              <li key={signal} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-800" title={signal}>
                {SIGNAL_LABELS[signal] ?? signal}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">Ningún detector señaló a esta entidad.</p>
        )}
      </div>

      {error ? (
        isNotFound(error) ? (
          <Notice tone="warning" title="Sin datos adicionales">El backend no tiene registros de esta entidad en el estate.</Notice>
        ) : (
          <Notice tone="error" title="No se pudo cargar la entidad">{errorMessage(error)}</Notice>
        )
      ) : !timeline ? (
        <LoadingBlock label="Cargando registros de la entidad…" />
      ) : (
        <>
          <div>
            <SectionLabel>Totales en el periodo</SectionLabel>
            <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
              {[
                { label: "Facturado", value: timeline.totals.invoiced },
                { label: "Pagado", value: timeline.totals.paid },
                { label: "Recibido de", value: timeline.totals.received },
              ].map((item) => (
                <div key={item.label} className="rounded-md border border-zinc-200 px-2 py-2">
                  <dt className="text-xs text-zinc-500">{item.label}</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-zinc-900">{formatMoney(item.value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <SectionLabel>Línea de tiempo</SectionLabel>
            <div className="mt-2">
              <EntityTimeline timeline={timeline} onOpenRecord={openRecord} compact />
            </div>
          </div>

          {timeline.profile && (
            <div>
              <div className="flex items-center justify-between">
                <SectionLabel>Datos de {timeline.profile.source_table}</SectionLabel>
                <button
                  type="button"
                  onClick={() => openRecord(timeline.profile!.source_table, timeline.profile!.record_id)}
                  className="text-xs font-medium text-zinc-700 underline underline-offset-4"
                >
                  Abrir registro
                </button>
              </div>
              <dl className="mt-2 divide-y divide-zinc-100 rounded-md border border-zinc-200 text-sm">
                {Object.entries(timeline.profile.data).map(([column, value]) => (
                  <div key={column} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2 px-3 py-1.5">
                    <dt><ColumnName column={column} /></dt>
                    <dd className="break-words text-zinc-900">
                      {typeof value === "number" && MONEY_COLUMNS.has(column) ? formatMoney(value) : String(value ?? "—")}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate({ section: "transactions", tx_entity: entityId, entity: null })}
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-900 underline underline-offset-4"
          >
            Ver sus transacciones <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

/** Drawer de una entidad (EXAMPLE §7.9). */
export function EntityDrawer() {
  const { params, entity, closeDrawer } = useCaseFile();
  const entityId = params.get("entity");
  const data = entityId ? entity(entityId) : null;

  return (
    <Drawer
      open={Boolean(entityId)}
      onClose={closeDrawer}
      title={data?.name ?? ""}
      subtitle={
        entityId && (
          <span className="inline-flex items-center font-mono text-xs">
            {displayEntityId(entityId)}
            <CopyButton value={entityId} label="Copiar id" />
          </span>
        )
      }
    >
      {entityId && <EntityBody key={entityId} entityId={entityId} />}
    </Drawer>
  );
}
