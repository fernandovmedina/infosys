"use client";

import { formatMoney, formatPercent, formatSignedMoney } from "@/lib/format";
import { TABLES } from "@/lib/runs/schema";
import type { Reconciliation as ReconciliationData } from "@/lib/runs/types";
import { ExhibitChip } from "./case-chips";
import { ColumnName, Icon, TableName } from "./ui";

/**
 * Aritmética que valida el monto (EXAMPLE §7.7). Todo viene calculado del
 * backend; aquí solo se muestra.
 */
export function Reconciliation({ findingIndex, data }: { findingIndex: number; data: ReconciliationData }) {
  const amountField = TABLES[data.table_used].amountField;

  return (
    <div className="rounded-md border border-zinc-200 bg-white px-3 py-3 sm:px-4">
      <p className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-600">
        Table used to reconcile: <TableName table={data.table_used} />
        {amountField && (
          <>
            (<ColumnName column={amountField} />)
          </>
        )}
      </p>

      <table className="mt-3 w-full max-w-lg text-sm tabular-nums">
        <caption className="sr-only">Reconciliation for finding #{findingIndex + 1}</caption>
        <tbody>
          {data.lines.map((line, index) => (
            <tr key={line.exhibit_id}>
              <td className="w-5 py-1 text-zinc-400" aria-hidden>{index === 0 ? "" : "+"}</td>
              <td className="py-1">
                <ExhibitChip findingIndex={findingIndex} exhibitId={line.exhibit_id} />
              </td>
              <td className="py-1 pl-2 font-mono text-xs text-zinc-600">{line.record_id}</td>
              <td className="py-1 text-right text-zinc-900">{formatMoney(line.amount)}</td>
            </tr>
          ))}
          <tr className="border-t border-zinc-300">
            <td className="py-1.5 text-zinc-400" aria-hidden>=</td>
            <td colSpan={2} className="py-1.5 text-zinc-700">Evidence total</td>
            <td className="py-1.5 text-right font-semibold text-zinc-900">{formatMoney(data.sum)}</td>
          </tr>
          <tr>
            <td />
            <td colSpan={2} className="py-1 text-zinc-700">Claimed amount</td>
            <td className="py-1 text-right text-zinc-900">{formatMoney(data.claimed)}</td>
          </tr>
          <tr>
            <td />
            <td colSpan={2} className="py-1 text-zinc-700">Difference</td>
            <td className="py-1 text-right text-zinc-900">
              {formatSignedMoney(data.diff)} ({formatPercent(data.diff_pct)})
            </td>
          </tr>
        </tbody>
      </table>

      {data.within_tolerance ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-sm font-medium text-emerald-800">
          <Icon name="checkCircle" className="h-4 w-4" /> Within the 2% tolerance
        </p>
      ) : (
        <p role="alert" className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-800">
          <Icon name="xCircle" className="h-4 w-4" /> Outside the 2% tolerance: the evidence doesn’t reconcile with the claimed amount
        </p>
      )}

      {data.other_tables.length > 0 && (
        <details className="group mt-3">
          <summary className="flex cursor-pointer items-center gap-1 text-sm text-zinc-700 marker:content-none">
            <Icon name="chevronRight" className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
            Other cited tables (not counted twice)
          </summary>
          <ul className="mt-2 space-y-1 pl-5 text-sm">
            {data.other_tables.map((other) => (
              <li key={other.table} className="flex flex-wrap items-center gap-1.5">
                <TableName table={other.table} />:
                <span className="tabular-nums text-zinc-900">{formatMoney(other.sum)}</span>
                {other.exhibit_ids.map((exhibitId) => (
                  <ExhibitChip key={exhibitId} findingIndex={findingIndex} exhibitId={exhibitId} />
                ))}
              </li>
            ))}
          </ul>
          <p className="mt-2 pl-5 text-xs text-zinc-500">
            An invoice and the payment that settles it are the same money; reconciliation uses a single table.
          </p>
        </details>
      )}
    </div>
  );
}
