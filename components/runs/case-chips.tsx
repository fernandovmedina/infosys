"use client";

import { TABLES } from "@/lib/runs/schema";
import { useCaseFile } from "./case-file-context";
import { EntityChip } from "./entity-chip";
import { Tooltip } from "./ui";

/** Chip de entidad conectado al reporte: nombre, semáforo y apertura del drawer. */
export function CaseEntityChip({ id, className }: { id: string; className?: string }) {
  const { entity, openEntity } = useCaseFile();
  const data = entity(id);
  return <EntityChip id={id} name={data.name} status={data.known ? data.status : undefined} onOpen={openEntity} className={className} />;
}

/** Chip `EX-xx` que abre el registro citado (EXAMPLE §7.5). */
export function ExhibitChip({
  findingIndex,
  exhibitId,
  onHover,
  className = "",
}: {
  findingIndex: number;
  exhibitId: string;
  onHover?: (exhibitId: string | null) => void;
  className?: string;
}) {
  const { report, openExhibit } = useCaseFile();
  const exhibit = report.submission.findings[findingIndex]?.exhibits.find((item) => item.exhibit_id === exhibitId);
  const button = (
    <button
      type="button"
      onClick={() => openExhibit(findingIndex, exhibitId)}
      onMouseEnter={() => onHover?.(exhibitId)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(exhibitId)}
      onBlur={() => onHover?.(null)}
      aria-label={`Abrir evidencia ${exhibitId}${exhibit ? `: ${exhibit.note}` : ""}`}
      className={`inline-flex items-center rounded bg-zinc-900 px-1.5 py-0.5 align-middle font-mono text-[0.6875rem] font-medium text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-400 ${className}`}
    >
      {exhibitId}
    </button>
  );
  if (!exhibit) return button;
  return (
    <Tooltip content={`${TABLES[exhibit.source_table].label} ${exhibit.record_id}: ${exhibit.note}`} className="align-middle">
      {button}
    </Tooltip>
  );
}
