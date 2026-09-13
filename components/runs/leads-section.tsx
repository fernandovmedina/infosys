"use client";

import { useId, useState } from "react";
import { CLOSED_BY_LABELS, SIGNAL_LABELS, splitSignals } from "@/lib/runs/labels";
import type { ClosedBy } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { DeclinedLeadCard } from "./declined-lead-card";
import { Button, Icon } from "./ui";

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Leads no perseguidos, en el cuerpo del case file (EXAMPLE §7.8). */
export function LeadsSection() {
  const { report, entity } = useCaseFile();
  const leads = report.submission.leads_not_pursued;
  const [closedBy, setClosedBy] = useState<ClosedBy | "">("");
  const [detector, setDetector] = useState("");
  const [query, setQuery] = useState("");
  const ids = { closedBy: useId(), detector: useId(), query: useId() };

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-5 text-sm text-zinc-600 sm:px-6">
        <p className="font-medium text-zinc-900">There were no suspicious leads to dismiss.</p>
        <p className="mt-1">No detector flagged entities in this run. The Method and limits section explains what was reviewed.</p>
      </div>
    );
  }

  const detectors = [...new Set(leads.flatMap((lead) => splitSignals(lead.signal)))].sort((a, b) =>
    (SIGNAL_LABELS[a] ?? a).localeCompare(SIGNAL_LABELS[b] ?? b, "en"),
  );
  const closers = [...new Set(leads.flatMap((lead) => (lead.closed_by ? [lead.closed_by] : [])))];
  const needle = normalize(query.trim());
  const visible = leads
    .map((lead, index) => ({ lead, index }))
    .filter(({ lead }) => !closedBy || lead.closed_by === closedBy)
    .filter(({ lead }) => !detector || splitSignals(lead.signal).includes(detector))
    .filter(({ lead }) => !needle || normalize(lead.entity).includes(needle) || normalize(entity(lead.entity).name).includes(needle));

  const selectClass = "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900";

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        These entities looked suspicious, were investigated, and weren’t accused. Each card shows what flagged them and why they were dismissed.
      </p>

      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-3 sm:grid-cols-3">
        <div>
          <label htmlFor={ids.query} className="mb-1 block text-xs font-medium text-zinc-600">Search by name or RFC</label>
          <input id={ids.query} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Peláez, PEL790312XY1…" className={selectClass} />
        </div>
        <div>
          <label htmlFor={ids.detector} className="mb-1 block text-xs font-medium text-zinc-600">Detector</label>
          <select id={ids.detector} value={detector} onChange={(event) => setDetector(event.target.value)} className={selectClass}>
            <option value="">All</option>
            {detectors.map((item) => (
              <option key={item} value={item}>{SIGNAL_LABELS[item] ?? item}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={ids.closedBy} className="mb-1 block text-xs font-medium text-zinc-600">Closed by</label>
          <select id={ids.closedBy} value={closedBy} onChange={(event) => setClosedBy(event.target.value as ClosedBy | "")} className={selectClass}>
            <option value="">All</option>
            {closers.map((item) => (
              <option key={item} value={item}>{CLOSED_BY_LABELS[item].label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-zinc-500" aria-live="polite">
        {visible.length === leads.length ? `${leads.length} closed leads` : `${visible.length} of ${leads.length} leads`}
      </p>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-600">
          <p>No leads match the filters.</p>
          <Button
            className="mt-3"
            onClick={() => {
              setClosedBy("");
              setDetector("");
              setQuery("");
            }}
          >
            <Icon name="close" className="h-3.5 w-3.5" /> Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {visible.map(({ lead, index }) => (
            <DeclinedLeadCard key={index} leadIndex={index} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
