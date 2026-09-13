"use client";

import { useId, useRef, useState } from "react";
import { formatCost, formatDuration, formatNumber, formatPeriod } from "@/lib/format";
import { getExportUrl, isMockMode } from "@/lib/runs/api";
import { GLOSSARY, ROLE_LABELS } from "@/lib/runs/labels";
import type { AgentRole, ExportFormat, Report } from "@/lib/runs/types";
import { Button, CopyButton, Icon, Modal, Tooltip } from "./ui";

const EXPORT_OPTIONS: { format: ExportFormat; label: string }[] = [
  { format: "html", label: "Case file HTML (sin red)" },
  { format: "pdf", label: "Case file PDF" },
  { format: "md", label: "Markdown con diagramas" },
  { format: "submission", label: "Submission JSON oficial" },
];

function ExportMenu({ runId }: { runId: string }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  if (isMockMode) {
    return (
      <Tooltip content="Disponible cuando el backend implemente la exportación">
        <button
          type="button"
          aria-disabled="true"
          onClick={(event) => event.preventDefault()}
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-400 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
        >
          <Icon name="download" /> Exportar
        </button>
      </Tooltip>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <Button aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen((value) => !value)}>
        <Icon name="download" /> Exportar <Icon name="chevronDown" className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <div id={menuId} role="menu" className="absolute right-0 z-30 mt-1 w-60 rounded-md border border-zinc-200 bg-white py-1 shadow-lg">
          {EXPORT_OPTIONS.map((option) => (
            <button
              key={option.format}
              type="button"
              role="menuitem"
              onClick={() => {
                const url = getExportUrl(runId, option.format);
                if (url) window.open(url, "_blank", "noopener");
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:outline-none"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GlossaryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)} aria-label="Abrir glosario de términos">
        <Icon name="info" /> <span className="hidden sm:inline">Glosario</span>
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} label="Glosario">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
          <h2 className="text-base font-semibold text-zinc-900">Glosario</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <dl className="overflow-y-auto px-4 py-3">
          {GLOSSARY.map((item) => (
            <div key={item.term} className="border-b border-zinc-100 py-2.5 last:border-0">
              <dt className="text-sm font-semibold text-zinc-900">{item.term}</dt>
              <dd className="mt-0.5 text-sm text-zinc-600">{item.definition}</dd>
            </div>
          ))}
        </dl>
      </Modal>
    </>
  );
}

/** Encabezado del case file (EXAMPLE §7.1). */
export function RunHeader({ report, onOpenSearch }: { report: Report; onOpenSearch: () => void }) {
  const { case_header: header, submission } = report;
  const metadata = submission.run_metadata;
  const costByRole = metadata.cost_by_role ? Object.entries(metadata.cost_by_role) : [];
  const rfc = header.company_rfc.replace(/^RFC:/, "");

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{header.company_name}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600">
          <span className="inline-flex items-center font-mono text-xs">
            RFC {rfc}
            <CopyButton value={rfc} label="Copiar RFC" />
          </span>
          <span aria-hidden>·</span>
          <span>{formatPeriod(header.audit_period.from, header.audit_period.to)}</span>
          <span aria-hidden>·</span>
          <span>Seed {submission.seed}</span>
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-zinc-600">
          <span className="tabular-nums">{formatNumber(metadata.llm_calls)} llamadas LLM</span>
          <span aria-hidden>·</span>
          {costByRole.length > 0 ? (
            <Tooltip
              content={
                <span className="block">
                  <span className="mb-1 block font-medium">Costo por rol</span>
                  {costByRole.map(([role, cost]) => (
                    <span key={role} className="flex justify-between gap-6 tabular-nums">
                      <span>{ROLE_LABELS[role as AgentRole]?.label ?? role}</span>
                      <span>{formatCost(cost)}</span>
                    </span>
                  ))}
                </span>
              }
            >
              <button type="button" className="tabular-nums underline decoration-zinc-300 decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
                {formatCost(metadata.mxn_cost)}
              </button>
            </Tooltip>
          ) : (
            <span className="tabular-nums">{formatCost(metadata.mxn_cost)}</span>
          )}
          <span aria-hidden>·</span>
          <span className="tabular-nums">{formatDuration(metadata.wall_clock_seconds)}</span>
          <span aria-hidden>·</span>
          {metadata.deterministic ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Icon name="checkCircle" className="h-3.5 w-3.5" /> Determinista: la misma seed produce el mismo resultado
            </span>
          ) : (
            <Tooltip content="Esta corrida puede dar un resultado distinto aunque se repita con la misma seed (por ejemplo, porque el modelo no se fijó a temperatura cero). Repite la corrida para confirmar." focusable>
              <span className="inline-flex cursor-help items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200">
                <Icon name="info" className="h-3.5 w-3.5" /> No determinista
              </span>
            </Tooltip>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button onClick={onOpenSearch} aria-keyshortcuts="Meta+K Control+K">
          <Icon name="search" /> Buscar
          <kbd className="hidden rounded border border-zinc-200 px-1 font-sans text-[0.6875rem] text-zinc-500 sm:inline">⌘K</kbd>
        </Button>
        <GlossaryButton />
        <ExportMenu runId={report.run.run_id} />
      </div>
    </header>
  );
}
