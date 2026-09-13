"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";
import { errorMessage } from "@/lib/runs/errors";
import { getEntities } from "@/lib/runs/api";
import { KIND_LABELS, SIGNAL_LABELS, STATUS_LABELS } from "@/lib/runs/labels";
import type { EntityListItem, EntityStatus, Page } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { displayEntityId } from "./entity-chip";
import { EntityGraph } from "./entity-graph";
import { EntityStatusBadge } from "./entity-status-badge";
import { Button, LoadingBlock, Notice, Spinner } from "./ui";

const FILTERS: { value: EntityStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "accused", label: STATUS_LABELS.accused.label },
  { value: "declined", label: STATUS_LABELS.declined.label },
  { value: "clear", label: STATUS_LABELS.clear.label },
];

function EntityList({ status }: { status: EntityStatus | null }) {
  const { runId, openEntity } = useCaseFile();
  const [page, setPage] = useState<Page<EntityListItem> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getEntities(runId, { status: status ?? undefined, limit: 25 })
      .then((result) => {
        if (!cancelled) setPage(result);
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [runId, status]);

  async function loadMore() {
    if (!page?.next_cursor) return;
    setLoadingMore(true);
    try {
      const next = await getEntities(runId, { status: status ?? undefined, limit: 25, cursor: page.next_cursor });
      setPage({ ...next, items: [...page.items, ...next.items] });
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoadingMore(false);
    }
  }

  if (error) return <Notice tone="error" title="Could not load the entities">{error}</Notice>;
  if (!page) return <LoadingBlock />;
  if (page.items.length === 0) {
    return <p className="rounded-md border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-600">No entities with this status.</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white">
        {page.items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => openEntity(item.id)}
              className="grid w-full gap-1 px-3 py-2.5 text-left text-sm outline-none hover:bg-zinc-50 focus-visible:bg-zinc-50 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-center sm:gap-3 sm:px-4"
            >
              <EntityStatusBadge status={item.status} size="sm" className="w-fit" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-zinc-900">{item.name}</span>
                <span className="block truncate font-mono text-xs text-zinc-500">
                  {displayEntityId(item.id)} · {KIND_LABELS[item.kind].label}
                  {item.role ? ` · ${item.role}` : ""}
                </span>
              </span>
              <span className="truncate text-xs text-zinc-600">
                {item.signals.length > 0 ? item.signals.map((signal) => SIGNAL_LABELS[signal] ?? signal).join(" · ") : "No detector signals"}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>
          {formatNumber(page.items.length)} of {formatNumber(page.total)}
        </span>
        {page.next_cursor && (
          <Button onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Spinner className="h-3.5 w-3.5" />} Load more
          </Button>
        )}
      </div>
    </div>
  );
}

/** Sección Entidades: grafo global + lista paginada filtrable por semáforo. */
export function EntitiesSection() {
  const { params, navigate, report } = useCaseFile();
  const raw = params.get("status");
  const status = raw === "accused" || raw === "declined" || raw === "clear" ? raw : null;
  const counts = report.summary.entities_by_status;

  return (
    <div className="space-y-8">
      <EntityGraph />
      <div>
        <h3 className="text-base font-semibold text-zinc-900">Status of each entity</h3>
        <div role="group" aria-label="Filter by status" className="mt-2 flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const active = status === filter.value;
            const count = filter.value ? counts[filter.value] : counts.accused + counts.declined + counts.clear;
            return (
              <button
                key={filter.label}
                type="button"
                aria-pressed={active}
                onClick={() => navigate({ status: filter.value }, { replace: true })}
                className={`rounded-full px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                  active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {filter.label} <span className="tabular-nums opacity-70">{formatNumber(count)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <EntityList key={status ?? "all"} status={status} />
        </div>
      </div>
    </div>
  );
}
