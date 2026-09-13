"use client";

import { formatClabe } from "@/lib/format";
import { splitEntityEndpoint, STATUS_LABELS } from "@/lib/runs/labels";
import type { EntityStatus } from "@/lib/runs/types";
import { STATUS_STYLES } from "./entity-status-badge";
import { Icon, Tooltip } from "./ui";

/** Muestra cada `CLABE:…` abreviada; RFC, EMP y separadores completos. */
export function displayEntityId(id: string) {
  return splitEntityEndpoint(id)
    .map((part) =>
      part.startsWith("CLABE:") ? `CLABE ${formatClabe(part)}` : part,
    )
    .join(" / ");
}

/**
 * Chip de una entidad (`RFC:…`, `EMP:…`) con el semáforo y el nombre en
 * tooltip. Es un botón cuando se puede abrir la entidad.
 */
export function EntityChip({
  id,
  name,
  status,
  onOpen,
  className = "",
}: {
  id: string;
  name?: string;
  status?: EntityStatus;
  onOpen?: (id: string) => void;
  className?: string;
}) {
  const style = status ? STATUS_STYLES[status] : null;
  const tooltip = (
    <>
      <span className="block font-medium">{name ?? id}</span>
      {status && <span className="block text-zinc-300">{STATUS_LABELS[status].label}</span>}
    </>
  );
  const content = (
    <>
      {style && <Icon name={style.icon} className={`h-3.5 w-3.5 ${style.text}`} />}
      <span className="truncate font-mono">{displayEntityId(id)}</span>
      {status && <span className="sr-only">({STATUS_LABELS[status].label})</span>}
    </>
  );
  const base = `inline-flex max-w-full items-center gap-1 rounded border border-zinc-200 bg-white px-1.5 py-0.5 align-middle text-xs text-zinc-800 ${className}`;

  return (
    <Tooltip content={tooltip} className="max-w-full align-middle" focusable={!onOpen}>
      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(id)}
          aria-label={`${name ?? id} (${id})${status ? `, ${STATUS_LABELS[status].label}` : ""}`}
          className={`${base} outline-none transition-colors hover:border-zinc-400 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900`}
        >
          {content}
        </button>
      ) : (
        <span className={base}>{content}</span>
      )}
    </Tooltip>
  );
}
