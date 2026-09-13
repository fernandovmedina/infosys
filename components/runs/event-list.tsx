"use client";

import { formatTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/runs/labels";
import type { EntityStatus, RunEvent } from "@/lib/runs/types";
import { EntityChip } from "./entity-chip";
import { RichText } from "./rich-text";
import { Icon, Spinner } from "./ui";

export type EntityLookup = (id: string) => { name?: string; status?: EntityStatus };

function ResultBadge({ event }: { event: RunEvent }) {
  if (!event.result) return null;
  const status = event.result_status ?? "ok";
  const styles = {
    ok: "text-emerald-700",
    warning: "text-amber-700",
    pending: "text-zinc-500",
    error: "text-red-700",
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs sm:text-sm ${styles}`}>
      {status === "pending" ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : (
        <Icon name={status === "ok" ? "checkCircle" : status === "error" ? "xCircle" : "alert"} className="h-3.5 w-3.5" />
      )}
      {event.result}
    </span>
  );
}

/** Una línea del razonamiento del agente (pantalla en vivo y log). */
export function EventRow({
  event,
  lookup,
  onOpenEntity,
  highlighted = false,
  showTime = false,
  pendingResolved = false,
}: {
  event: RunEvent;
  lookup?: EntityLookup;
  onOpenEntity?: (id: string) => void;
  highlighted?: boolean;
  showTime?: boolean;
  /** Si ya llegó un evento posterior, un resultado "pendiente" deja de girar. */
  pendingResolved?: boolean;
}) {
  const role = ROLE_LABELS[event.role];
  const resolved = pendingResolved && event.result_status === "pending" ? { ...event, result_status: "ok" as const, result: event.result === "…" ? "hecho" : event.result } : event;

  return (
    <li
      id={`log-${event.seq}`}
      className={`grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 px-3 py-2 sm:px-4 ${highlighted ? "bg-amber-50" : ""} ${
        event.type === "failed" ? "bg-red-50" : ""
      }`}
    >
      <span aria-hidden className="text-center text-base leading-6">{role.icon}</span>
      <div className="min-w-0">
        <div className="flex flex-col gap-x-3 gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="min-w-0 text-sm leading-6 text-zinc-900">
            <span className="sr-only">{role.label}: </span>
            <RichText
              text={event.message}
              renderEntity={(id) => (
                <EntityChip
                  id={id}
                  name={lookup?.(id).name ?? event.entity_names?.[id]}
                  status={lookup?.(id).status}
                  onOpen={onOpenEntity}
                />
              )}
            />
          </p>
          <span className="shrink-0">
            <ResultBadge event={resolved} />
          </span>
        </div>
        {event.detail && (
          <p className="text-sm leading-6 text-zinc-600">
            <span aria-hidden>└ </span>
            <RichText
              text={event.detail}
              renderEntity={(id) => (
                <EntityChip id={id} name={lookup?.(id).name ?? event.entity_names?.[id]} status={lookup?.(id).status} onOpen={onOpenEntity} />
              )}
            />
          </p>
        )}
        {event.error && (
          <p className="mt-1 text-sm text-red-800">
            <code className="font-mono text-xs">{event.error.code}</code> · {event.error.message}
          </p>
        )}
        {(event.tool || showTime) && (
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {showTime && <span className="tabular-nums">{formatTime(event.ts)}</span>}
            {showTime && <span>· {role.label}</span>}
            {event.tool && <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.6875rem] text-zinc-700">{event.tool}</code>}
          </p>
        )}
      </div>
    </li>
  );
}
