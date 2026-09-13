"use client";

import { formatDateTime } from "@/lib/format";
import { useCaseFile } from "./case-file-context";
import { TableDiagnostics } from "./table-diagnostics";
import { CopyButton, SectionLabel } from "./ui";

/** Método y límites (EXAMPLE §7.13). */
export function MethodAndLimits() {
  const { report } = useCaseFile();
  const { method_and_limits: method, run } = report;
  const incompleteTables = run.dataset.tables.filter((table) => table.status !== "ok");
  const reproduce = [
    { label: "Seed", value: String(method.reproduce.seed) },
    { label: "Version", value: method.reproduce.version },
    { label: "Dataset hash (SHA-256)", value: method.reproduce.dataset_sha256 },
    { label: "Command", value: method.reproduce.command },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 sm:px-5">
        <SectionLabel>1 · Architecture</SectionLabel>
        <p className="mt-2 max-w-3xl text-[0.9375rem] leading-relaxed text-zinc-800">{method.architecture}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 sm:px-5">
        <SectionLabel>2 · Out of scope in this run</SectionLabel>
        {method.out_of_scope.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem] text-zinc-800">
            {method.out_of_scope.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">The backend reported no limitations for this run.</p>
        )}
        {incompleteTables.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-zinc-900">Diagnostic warnings from the dataset upload</p>
            <TableDiagnostics tables={incompleteTables} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 sm:px-5">
        <SectionLabel>3 · What it can’t detect</SectionLabel>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.9375rem] text-zinc-800">
          {method.cannot_detect.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 sm:px-5">
        <SectionLabel>4 · How to reproduce</SectionLabel>
        <dl className="mt-2 divide-y divide-zinc-100 text-sm">
          {reproduce.map((item) => (
            <div key={item.label} className="grid gap-1 py-2 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-3">
              <dt className="text-zinc-600">{item.label}</dt>
              <dd className="flex min-w-0 items-start gap-1">
                <code className="min-w-0 break-all font-mono text-xs text-zinc-900">{item.value}</code>
                <CopyButton value={item.value} label={`Copy ${item.label.toLowerCase()}`} />
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-zinc-500">
          File {run.dataset.filename} · run <span className="font-mono">{run.run_id}</span> · created {formatDateTime(run.created_at)}
          {run.finished_at && ` · finished ${formatDateTime(run.finished_at)}`}
        </p>
      </div>
    </div>
  );
}
