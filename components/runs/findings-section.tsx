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
                {leads.length > 0 ? "No se encontró fraude comprobable" : "No se detectaron señales de fraude"}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-emerald-900">
                {leads.length > 0
                  ? `Ningún caso sospechoso resistió la investigación. Es un resultado limpio: los ${formatNumber(leads.length)} casos que se revisaron y descartaron están documentados, con la razón y las herramientas usadas.`
                  : "Ningún detector se activó con estos libros, así que no hubo casos que investigar ni acusaciones. Abajo está qué se revisó y qué no se puede detectar, para que el alcance quede claro."}
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
                Revisa los {formatNumber(leads.length)} casos descartados
              </span>
              <span className="mt-1 block text-sm text-zinc-600">
                La prueba de que sí se investigó: qué señaló a cada entidad y por qué no se acusó.
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
        <nav aria-label="Índice de hallazgos" className="rounded-lg border border-zinc-200 bg-white px-3 py-2">
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
