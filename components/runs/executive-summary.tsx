"use client";

import type { ReactNode } from "react";
import { formatMoneyMXN, formatNumber } from "@/lib/format";
import type { Report, Verdict } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { Icon, type IconName } from "./ui";

const BANNERS: Record<Verdict, { box: string; icon: IconName; iconColor: string }> = {
  fraud_proven: { box: "border-red-200 bg-red-50 text-red-900", icon: "xCircle", iconColor: "text-red-600" },
  fraud_probable: { box: "border-orange-200 bg-orange-50 text-orange-900", icon: "alert", iconColor: "text-orange-600" },
  clean_with_leads: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: "shield", iconColor: "text-emerald-600" },
  clean: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: "shield", iconColor: "text-emerald-600" },
};

/** Texto del veredicto global (EXAMPLE §7.2). El veredicto viene del backend. */
export function verdictText(report: Report): string {
  const { summary } = report;
  switch (summary.verdict) {
    case "fraud_proven":
      return "Se encontró fraude comprobado.";
    case "fraud_probable":
      return "Hay indicios fuertes de fraude que requieren confirmación.";
    case "clean_with_leads":
      return `No se encontró fraude comprobable. Se revisaron ${formatNumber(summary.leads_closed_count)} ${
        summary.leads_closed_count === 1 ? "caso sospechoso y se descartó" : "casos sospechosos y todos se descartaron"
      }.`;
    case "clean":
      return "No se detectaron señales de fraude en los datos analizados.";
  }
}

/** "Análisis parcial: faltó la tabla `contracts`." cuando el diagnóstico no fue limpio. */
export function PartialAnalysisNote({ report }: { report: Report }) {
  const incomplete = report.run.dataset.tables.filter((table) => table.status !== "ok");
  if (incomplete.length === 0) return null;
  return (
    <span className="mt-1 flex items-start gap-1.5 text-sm">
      <Icon name="alert" className="mt-0.5 h-4 w-4 text-amber-600" />
      <span>
        Análisis parcial: {incomplete.length === 1 ? "faltó la tabla" : "faltaron datos en las tablas"}{" "}
        {incomplete.map((table, index) => (
          <span key={table.name}>
            {index > 0 && (index === incomplete.length - 1 ? " y " : ", ")}
            <code className="rounded bg-white/70 px-1 font-mono text-xs">{table.name}</code>
          </span>
        ))}
        .
      </span>
    </span>
  );
}

function Kpi({
  icon,
  tone,
  value,
  label,
  detail,
  onClick,
  actionLabel,
}: {
  icon: IconName;
  tone: string;
  value: string;
  label: string;
  detail?: ReactNode;
  onClick?: () => void;
  actionLabel?: string;
}) {
  const body = (
    <>
      <span className={`flex items-center gap-1.5 text-sm font-medium ${tone}`}>
        <Icon name={icon} className="h-4 w-4" />
        {label}
      </span>
      <span className="mt-1 block text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">{value}</span>
      {detail && <span className="mt-0.5 block text-xs text-zinc-500">{detail}</span>}
    </>
  );
  const className = "block w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left";
  if (!onClick) return <div className={className}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel}
      className={`${className} outline-none transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900`}
    >
      {body}
    </button>
  );
}

/** Resumen ejecutivo con veredicto global y KPIs clicables (EXAMPLE §7.2). */
export function ExecutiveSummary({ report }: { report: Report }) {
  const { navigate } = useCaseFile();
  const { summary } = report;
  const banner = BANNERS[summary.verdict];
  const { proven, probable } = summary.findings_by_confidence;

  return (
    <section aria-labelledby="summary-title">
      <h2 id="summary-title" className="sr-only">Resumen ejecutivo</h2>
      <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${banner.box}`}>
        <Icon name={banner.icon} className={`mt-0.5 h-6 w-6 ${banner.iconColor}`} />
        <div className="min-w-0">
          <p className="text-base font-semibold sm:text-lg">{verdictText(report)}</p>
          <PartialAnalysisNote report={report} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={summary.findings_count > 0 ? "xCircle" : "checkCircle"}
          tone={summary.findings_count > 0 ? "text-red-700" : "text-emerald-700"}
          value={formatNumber(summary.findings_count)}
          label={summary.findings_count === 1 ? "hallazgo" : "hallazgos"}
          detail={summary.findings_count > 0 ? `${proven} comprobado${proven === 1 ? "" : "s"} · ${probable} probable${probable === 1 ? "" : "s"}` : "ninguna acusación"}
          onClick={() => navigate({ section: "findings", finding: null, lead: null })}
          actionLabel="Ir a hallazgos"
        />
        <Kpi
          icon="alert"
          tone="text-zinc-700"
          value={formatMoneyMXN(summary.total_exposure)}
          label="exposición total"
          detail="suma de los montos de los hallazgos"
        />
        <Kpi
          icon="minusCircle"
          tone="text-amber-700"
          value={formatNumber(summary.leads_closed_count)}
          label={summary.leads_closed_count === 1 ? "lead cerrado" : "leads cerrados"}
          detail="investigados sin acusación"
          onClick={() => navigate({ section: "leads", finding: null, lead: null })}
          actionLabel="Ir a leads descartados"
        />
        <Kpi
          icon="checkCircle"
          tone="text-emerald-700"
          value={formatNumber(summary.entities_by_status.clear)}
          label="sin señales"
          detail="proveedores y empleados"
          onClick={() => navigate({ section: "entities", status: "clear", finding: null, lead: null })}
          actionLabel="Ver entidades sin señales"
        />
      </div>

      <p className="mt-4 max-w-4xl text-base leading-relaxed text-zinc-800">{summary.headline}</p>
    </section>
  );
}
