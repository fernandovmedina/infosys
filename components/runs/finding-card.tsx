"use client";

import { useState, type ReactNode } from "react";
import { formatMoneyMXN } from "@/lib/format";
import { CONFIDENCE_LABELS, SCHEME_LABELS } from "@/lib/runs/labels";
import type { Finding } from "@/lib/runs/types";
import { AdversarialReview } from "./adversarial-review";
import { CaseEntityChip, ExhibitChip } from "./case-chips";
import { useCaseFile } from "./case-file-context";
import { EntityStatusBadge } from "./entity-status-badge";
import { ExhibitsTable } from "./exhibits-table";
import { MoneyTrailDiagram } from "./money-trail-diagram";
import { Reconciliation } from "./reconciliation";
import { RichText } from "./rich-text";
import { CopyButton, Icon, Notice, SectionLabel, Tooltip } from "./ui";

export function CardBlock({ label, children, className = "" }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-4 sm:px-5 ${className}`}>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/**
 * Un hallazgo, en el orden de `case_file_structure.md` (EXAMPLE §7.4):
 * heading → regla violada → monto y confianza → qué pasó → rastro del dinero
 * → evidencia → reconciliación → revisión adversarial.
 */
export function FindingCard({ findingIndex, finding }: { findingIndex: number; finding: Finding }) {
  const { report, entity, openEntity, openFinding, params } = useCaseFile();
  const [hoveredExhibit, setHoveredExhibit] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  // Si se navega a este hallazgo (índice, drawer, búsqueda) mientras está retraído, se expande.
  const targeted = params.get("finding") === String(findingIndex + 1);
  const [wasTargeted, setWasTargeted] = useState(targeted);
  if (targeted !== wasTargeted) {
    setWasTargeted(targeted);
    if (targeted) setOpen(true);
  }
  const bodyId = `finding-${findingIndex + 1}-body`;
  const extra = report.findings_extra.find((item) => item.finding_index === findingIndex);
  const [primaryId, ...otherIds] = finding.entities;
  const primary = entity(primaryId);
  const scheme = SCHEME_LABELS[finding.scheme_type];
  const confidence = CONFIDENCE_LABELS[finding.confidence];
  const sharedFor = (id: string) => (extra?.shared_entities ?? []).filter((item) => item.entity === id);

  const sharedChips = (id: string) =>
    sharedFor(id).map((item) => (
      <button
        key={item.other_finding_index}
        type="button"
        onClick={() => openFinding(item.other_finding_index)}
        className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-inset ring-violet-200 hover:bg-violet-100"
      >
        Also in finding #{item.other_finding_index + 1} <Icon name="arrowRight" className="h-3 w-3" />
      </button>
    ));

  return (
    <article
      id={`finding-${findingIndex + 1}`}
      aria-labelledby={`finding-${findingIndex + 1}-title`}
      className="scroll-mt-20 overflow-hidden rounded-lg border border-zinc-200 bg-white"
    >
      <div className="h-1 bg-red-500" aria-hidden />

      {/* Heading */}
      <header className="px-4 pb-4 pt-3 sm:px-5">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
          <span className="pt-0.5 text-lg font-semibold text-zinc-400">#{findingIndex + 1}</span>
          <div className="min-w-0 flex-1">
            <h3 id={`finding-${findingIndex + 1}-title`} className="text-lg font-semibold leading-snug tracking-tight text-zinc-900">
              <button type="button" onClick={() => openEntity(primaryId)} className="text-left hover:underline">
                {primary.name}
              </button>
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center font-mono text-xs text-zinc-600">
                {primaryId}
                <CopyButton value={primaryId} label="Copy ID" />
              </span>
              {primary.known && <EntityStatusBadge status={primary.status} size="sm" />}
              {sharedChips(primaryId)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={open ? `Collapse finding #${findingIndex + 1}` : `Expand finding #${findingIndex + 1}`}
            className="-mr-1 shrink-0 rounded-md p-1.5 text-zinc-500 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <svg aria-hidden viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}>
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
          </button>
        </div>
        {otherIds.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2 pl-8 text-xs text-zinc-500">
            <span>Also involves:</span>
            {otherIds.map((id) => (
              <span key={id} className="inline-flex flex-wrap items-center gap-1.5">
                <CaseEntityChip id={id} />
                <span className="text-zinc-700">{entity(id).name}</span>
                {sharedChips(id)}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 pl-8">
          <Tooltip content={scheme.tooltip}>
            <button type="button" className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-sm font-medium text-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900">
              {scheme.label}
              <Icon name="info" className="h-3.5 w-3.5 text-zinc-500" />
            </button>
          </Tooltip>
        </div>
      </header>

      {open && (
        <div id={bodyId} className="divide-y divide-zinc-100 border-t border-zinc-100">
          <CardBlock label="Rule broken">
            <p className="border-l-4 border-red-500 pl-3 text-base font-medium text-zinc-900">{finding.rule_broken}</p>
          </CardBlock>

          <CardBlock label="Amount and confidence">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">{formatMoneyMXN(finding.peso_amount)}</span>
              <Tooltip content={confidence.tooltip}>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ring-1 ring-inset outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                    finding.confidence === "proven" ? "bg-red-50 text-red-700 ring-red-200" : "bg-orange-50 text-orange-800 ring-orange-200"
                  }`}
                >
                  <Icon name={finding.confidence === "proven" ? "xCircle" : "alert"} className="h-4 w-4" />
                  {confidence.label}
                </button>
              </Tooltip>
            </div>
            {finding.confidence === "probable" && (
              <p className="mt-2 text-sm text-orange-900">
                <span className="font-medium">Why it’s probable and not proven:</span> {confidence.tooltip} The missing link is described in “What happened”.
              </p>
            )}
          </CardBlock>

          <CardBlock label="What happened">
            <p className="max-w-3xl text-[0.9375rem] leading-relaxed text-zinc-800">
              <RichText
                text={finding.narrative}
                renderEntity={(id) => <CaseEntityChip id={id} />}
                renderExhibit={(exhibitId) => <ExhibitChip findingIndex={findingIndex} exhibitId={exhibitId} onHover={setHoveredExhibit} />}
              />
            </p>
          </CardBlock>

          <CardBlock label="Money trail">
            <MoneyTrailDiagram findingIndex={findingIndex} finding={finding} hoveredExhibit={hoveredExhibit} onHoverExhibit={setHoveredExhibit} />
          </CardBlock>

          <CardBlock label={`Evidence (${finding.exhibits.length})`}>
            <ExhibitsTable findingIndex={findingIndex} finding={finding} hoveredExhibit={hoveredExhibit} onHoverExhibit={setHoveredExhibit} />
          </CardBlock>

          <CardBlock label="Reconciliation">
            {extra ? (
              <Reconciliation findingIndex={findingIndex} data={extra.reconciliation} />
            ) : (
              <Notice tone="error">The backend didn’t send the reconciliation for this finding.</Notice>
            )}
          </CardBlock>

          {extra?.adversarial_review && (
            <div className="px-4 py-4 sm:px-5">
              <AdversarialReview findingIndex={findingIndex} review={extra.adversarial_review} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
