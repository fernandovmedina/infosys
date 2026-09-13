"use client";

import { useEffect, useId, useState } from "react";
import { errorMessage } from "@/lib/runs/errors";
import { getLog } from "@/lib/runs/api";
import { ROLE_LABELS } from "@/lib/runs/labels";
import type { AgentRole, RunEvent } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { EventRow } from "./event-list";
import { Button, Icon, LoadingBlock, Notice } from "./ui";

const ROLES: AgentRole[] = ["system", "detector", "investigator", "challenger", "validator"];

function LogList({ role, entityFilter }: { role: AgentRole | null; entityFilter: string | null }) {
  const { runId, params, entity, openEntity } = useCaseFile();
  const [events, setEvents] = useState<RunEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const highlightSeq = Number(params.get("seq")) || null;

  useEffect(() => {
    let cancelled = false;
    getLog(runId, { role: role ?? undefined, entity: entityFilter ?? undefined })
      .then((result) => {
        if (!cancelled) setEvents(result);
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [runId, role, entityFilter]);

  useEffect(() => {
    if (!events || !highlightSeq) return;
    document.getElementById(`log-${highlightSeq}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [events, highlightSeq]);

  if (error) return <Notice tone="error" title="Could not load the log">{error}</Notice>;
  if (!events) return <LoadingBlock />;
  if (events.length === 0) {
    return <p className="rounded-md border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-600">No events match these filters.</p>;
  }
  return (
    <ol className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
      {events.map((event) => (
        <EventRow
          key={event.seq}
          event={event}
          showTime
          highlighted={event.seq === highlightSeq}
          pendingResolved
          lookup={(id) => {
            const data = entity(id);
            return { name: data.known ? data.name : event.entity_names?.[id], status: data.known ? data.status : undefined };
          }}
          onOpenEntity={openEntity}
        />
      ))}
    </ol>
  );
}

/** Log cronológico de la corrida con filtros por rol y entidad (EXAMPLE §7.12). */
export function InvestigationLog() {
  const { params, navigate, report, entity } = useCaseFile();
  const roleId = useId();
  const entityId = useId();
  const rawRole = params.get("role");
  const role = ROLES.includes(rawRole as AgentRole) ? (rawRole as AgentRole) : null;
  const entityFilter = params.get("log_entity");
  const entityOptions = Object.keys(report.entities).filter((id) => !report.entities[id].is_audited_company);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor={roleId} className="mb-1 block text-xs font-medium text-zinc-600">Role</label>
          <select
            id={roleId}
            value={role ?? ""}
            onChange={(event) => navigate({ role: event.target.value || null, seq: null }, { replace: true })}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>{ROLE_LABELS[item].icon} {ROLE_LABELS[item].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={entityId} className="mb-1 block text-xs font-medium text-zinc-600">Entity</label>
          <select
            id={entityId}
            value={entityFilter ?? ""}
            onChange={(event) => navigate({ log_entity: event.target.value || null, seq: null }, { replace: true })}
            className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {entityFilter && !entityOptions.includes(entityFilter) && <option value={entityFilter}>{entityFilter}</option>}
            {entityOptions.map((id) => (
              <option key={id} value={id}>{entity(id).name} ({id})</option>
            ))}
          </select>
        </div>
        {(role || entityFilter) && (
          <Button variant="ghost" onClick={() => navigate({ role: null, log_entity: null, seq: null }, { replace: true })}>
            <Icon name="close" className="h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>
      <LogList key={`${role}:${entityFilter}`} role={role} entityFilter={entityFilter} />
    </div>
  );
}
