"use client";

import { formatMoney } from "@/lib/format";
import { TABLES, recordKey } from "@/lib/runs/schema";
import type { Finding } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { CopyButton, Icon, TableName } from "./ui";

/** Tabla de evidencia de un hallazgo (EXAMPLE §7.6). */
export function ExhibitsTable({
  findingIndex,
  finding,
  hoveredExhibit,
  onHoverExhibit,
}: {
  findingIndex: number;
  finding: Finding;
  hoveredExhibit: string | null;
  onHoverExhibit: (exhibitId: string | null) => void;
}) {
  const { report, openExhibit, params } = useCaseFile();
  const activeExhibit = params.get("finding") === String(findingIndex + 1) ? params.get("exhibit") : null;

  return (
    <div className="relative overflow-x-auto rounded-md border border-zinc-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Evidencia del hallazgo #{findingIndex + 1}</caption>
        <thead className="bg-zinc-50 text-xs text-zinc-500">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Exhibit</th>
            <th scope="col" className="px-3 py-2 font-medium">Fuente</th>
            <th scope="col" className="px-3 py-2 font-medium">Registro</th>
            <th scope="col" className="px-3 py-2 font-medium">Qué prueba</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Monto</th>
            <th scope="col" className="px-3 py-2"><span className="sr-only">Abrir</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {finding.exhibits.map((exhibit) => {
            const record = report.records[recordKey(exhibit.source_table, exhibit.record_id)];
            const amountField = TABLES[exhibit.source_table].amountField;
            const amount = amountField && record ? record.data[amountField] : null;
            const highlighted = hoveredExhibit === exhibit.exhibit_id || activeExhibit === exhibit.exhibit_id;
            return (
              <tr
                key={exhibit.exhibit_id}
                id={`exhibit-${findingIndex + 1}-${exhibit.exhibit_id}`}
                onMouseEnter={() => onHoverExhibit(exhibit.exhibit_id)}
                onMouseLeave={() => onHoverExhibit(null)}
                className={`scroll-mt-24 transition-colors ${highlighted ? "bg-amber-50" : ""}`}
              >
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-zinc-900">{exhibit.exhibit_id}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="block text-zinc-900">{TABLES[exhibit.source_table].label}</span>
                  <TableName table={exhibit.source_table} className="text-xs" />
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <span className="inline-flex items-center font-mono text-xs text-zinc-800">
                    {exhibit.record_id}
                    <CopyButton value={exhibit.record_id} label="Copiar registro" />
                  </span>
                </td>
                <td className="px-3 py-2 text-zinc-700">{exhibit.note}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-zinc-900">
                  {typeof amount === "number" ? formatMoney(amount) : "—"}
                </td>
                <td className="px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => openExhibit(findingIndex, exhibit.exhibit_id)}
                    aria-label={`Abrir ${exhibit.exhibit_id}: ${TABLES[exhibit.source_table].label} ${exhibit.record_id}`}
                    className="rounded p-1 text-zinc-500 outline-none hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    <Icon name="external" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
