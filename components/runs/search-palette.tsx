"use client";

import { useEffect, useId, useState } from "react";
import { formatTime } from "@/lib/format";
import { errorMessage } from "@/lib/runs/errors";
import { search } from "@/lib/runs/api";
import { CLOSED_BY_LABELS, ROLE_LABELS } from "@/lib/runs/labels";
import type { SearchHit, SearchLocation } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { EntityStatusBadge } from "./entity-status-badge";
import { Icon, Modal, Spinner } from "./ui";

/**
 * Buscador global "¿Por qué?" (⌘K / Ctrl+K, EXAMPLE §7.12): estado, dónde
 * aparece, pasos del log y razón de cierre de un RFC, nombre o EX-xx.
 */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label="Search the case file">
      {open && <PaletteBody onClose={onClose} />}
    </Modal>
  );
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const { runId, navigate, openFinding, openLead, openExhibit, openEntity } = useCaseFile();
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const term = query.trim();
    if (!term) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      search(runId, term)
        .then((result) => {
          if (cancelled) return;
          setHits(result.hits);
          setActive(0);
          setError(null);
        })
        .catch((cause) => {
          if (!cancelled) setError(errorMessage(cause));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [runId, query]);

  const visibleHits = query.trim() ? hits : null;

  function go(location: SearchLocation) {
    onClose();
    if (location.kind === "finding" && location.finding_index !== undefined) openFinding(location.finding_index);
    else if (location.kind === "lead" && location.lead_index !== undefined) openLead(location.lead_index);
    else if (location.kind === "exhibit" && location.finding_index !== undefined && location.exhibit_id) openExhibit(location.finding_index, location.exhibit_id);
  }

  function openHit(hit: SearchHit) {
    if (hit.kind === "entity") {
      onClose();
      openEntity(hit.id);
    } else if (hit.appears_in[0]) {
      go(hit.appears_in[0]);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-zinc-200 px-4">
        <Icon name="search" className="h-5 w-5 text-zinc-400" />
        <label htmlFor={inputId} className="sr-only">Search RFC, name, or EX-xx</label>
        <input
          id={inputId}
          type="search"
          value={query}
          autoComplete="off"
          role="combobox"
          aria-expanded={Boolean(visibleHits?.length)}
          aria-controls={listId}
          aria-activedescendant={visibleHits?.length ? `${listId}-${active}` : undefined}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (!visibleHits?.length) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.min(value + 1, visibleHits.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              openHit(visibleHits[active]);
            }
          }}
          placeholder="Why didn't you flag…? Type an RFC, a name, or EX-03"
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-400"
        />
        {loading && <Spinner className="h-4 w-4 text-zinc-400" />}
        <kbd className="hidden rounded border border-zinc-200 px-1.5 text-xs text-zinc-500 sm:inline">Esc</kbd>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <p className="px-4 py-6 text-sm text-red-700">{error}</p>
        ) : !visibleHits ? (
          <p className="px-4 py-6 text-sm text-zinc-500">
            Examples: <span className="font-mono">PEL790312XY1</span>, “Consultores”, <span className="font-mono">EX-05</span>, <span className="font-mono">EMP:0031</span>.
          </p>
        ) : visibleHits.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-500">No results for “{query}”. If it’s a dataset entity with no signals, look for it in Transactions.</p>
        ) : (
          <ul id={listId} role="listbox" aria-label="Results" className="divide-y divide-zinc-100">
            {visibleHits.map((hit, index) => (
              <li
                key={`${hit.kind}:${hit.id}:${index}`}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                className={`px-4 py-3 ${index === active ? "bg-zinc-50" : ""}`}
              >
                <button type="button" onClick={() => openHit(hit)} className="flex w-full flex-wrap items-center gap-2 text-left">
                  {hit.status && <EntityStatusBadge status={hit.status} size="sm" />}
                  <span className="font-medium text-zinc-900">{hit.title}</span>
                  <span className="basis-full text-xs text-zinc-500">{hit.subtitle}</span>
                </button>

                {hit.lead_reason && (
                  <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-sm text-amber-950">
                    <span className="font-medium">Why it wasn’t accused:</span> {hit.lead_reason}
                    {hit.closed_by && <span className="block text-xs text-amber-900">Closed by {CLOSED_BY_LABELS[hit.closed_by].label}</span>}
                  </p>
                )}

                {hit.appears_in.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {hit.appears_in.map((location, locationIndex) => (
                      <button
                        key={locationIndex}
                        type="button"
                        onClick={() => go(location)}
                        className={`rounded-full px-2 py-0.5 text-xs ring-1 ring-inset hover:bg-white ${
                          location.kind === "finding" ? "bg-red-50 text-red-800 ring-red-200" : location.kind === "lead" ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-zinc-100 text-zinc-700 ring-zinc-200"
                        }`}
                      >
                        {location.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  hit.kind === "entity" && <p className="mt-1 text-xs text-zinc-500">Doesn’t appear in findings or leads: no detector flagged it.</p>
                )}

                {hit.log.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-xs text-zinc-600">
                    {hit.log.map((event) => (
                      <li key={event.seq}>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate({ section: "log", seq: String(event.seq), role: null, log_entity: null, entity: null, exhibit: null, record: null });
                          }}
                          className="text-left hover:underline"
                        >
                          <span className="tabular-nums text-zinc-400">{formatTime(event.ts)}</span> {ROLE_LABELS[event.role].icon} {event.message}
                          {event.result && <span className="text-zinc-500"> → {event.result}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
