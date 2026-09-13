"use client";

import { formatMoneyMXN, formatNumber } from "@/lib/format";
import { SCHEME_LABELS } from "@/lib/runs/labels";
import { useCaseFile } from "./case-file-context";
import { FindingCard } from "./finding-card";
import { MethodAndLimits } from "./method-and-limits";
import { Icon } from "./ui";

/** Sección de hallazgos. Sin hallazgos se presenta como un buen resultado (EXAMPLE §11). */
export function FindingsSection() {
  const { report, navigate, openFinding } = useCaseFile();
  const { findings, leads_not_pursued: leads } = report.submission;

  if (findings.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <Icon name="shield" className="mt-0.5 h-7 w-7 text-emerald-600" />
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">
                {leads.length > 0 ? "No provable fraud was found" : "No signs of fraud were detected"}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-emerald-900">
                {leads.length > 0
                  ? `No suspicious lead survived the investigation. This is a clean result: the ${formatNumber(leads.length)} leads that were reviewed and dismissed are documented, with the reason and the tools used.`
                  : "No detector fired on these books, so there were no leads to investigate and no accusations. Below is what was reviewed and what can't be detected, so the scope is clear."}
              </p>
            </div>
          </div>
        </div>

        {leads.length > 0 ? (
          <button
            type="button"
            onClick={() => navigate({ section: "leads", finding: null })}
            className="flex w-full items-center justify-between gap-4 rounded-lg border-2 border-amber-300 bg-white px-4 py-4 text-left outline-none transition-colors hover:bg-amber-50 focus-visible:ring-2 focus-visible:ring-zinc-900 sm:px-6"
          >
            <span>
              <span className="flex items-center gap-2 text-base font-semibold text-zinc-900">
                <Icon name="minusCircle" className="h-5 w-5 text-amber-600" />
                Review the {formatNumber(leads.length)} dismissed leads
              </span>
              <span className="mt-1 block text-sm text-zinc-600">
                Proof that it was investigated: what flagged each entity and why it wasn’t accused.
              </span>
            </span>
            <Icon name="arrowRight" className="h-5 w-5 text-zinc-500" />
          </button>
        ) : (
          <MethodAndLimits />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {findings.length > 1 && (
        <nav aria-label="Findings index" className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
          <ol className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-4">
            {findings.map((finding, index) => (
              <li key={index}>
                <button type="button" onClick={() => openFinding(index)} className="flex items-center gap-2 rounded px-1 py-1 text-left hover:bg-zinc-50">
                  <span className="font-semibold text-zinc-400">#{index + 1}</span>
                  <span className="text-zinc-900">{SCHEME_LABELS[finding.scheme_type].label}</span>
                  <span className="tabular-nums text-zinc-500">{formatMoneyMXN(finding.peso_amount)}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {findings.map((finding, index) => (
        <FindingCard key={index} findingIndex={index} finding={finding} />
      ))}
    </div>
  );
}
