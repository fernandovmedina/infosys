"use client";

import { CLOSED_BY_LABELS, SIGNAL_LABELS, splitSignals } from "@/lib/runs/labels";
import type { LeadNotPursued } from "@/lib/runs/types";
import { CaseEntityChip } from "./case-chips";
import { useCaseFile } from "./case-file-context";
import { EntityStatusBadge } from "./entity-status-badge";
import { CardBlock } from "./finding-card";
import { RichText } from "./rich-text";
import { CopyButton, Icon } from "./ui";

/**
 * Lead no perseguido con la misma jerarquía visual que un hallazgo
 * (EXAMPLE §7.8). La razón nunca se trunca.
 */
export function DeclinedLeadCard({ leadIndex, lead }: { leadIndex: number; lead: LeadNotPursued }) {
  const { entity, openEntity, hrefFor, navigate, params } = useCaseFile();
  const data = entity(lead.entity);
  const closedBy = lead.closed_by ? CLOSED_BY_LABELS[lead.closed_by] : null;
  const tools = lead.tool_calls_made ?? [];
  const active = params.get("lead") === String(leadIndex + 1);
  const logHref = hrefFor({ section: "log", entity: null, log_entity: lead.entity, lead: null, finding: null });

  return (
    <article
      id={`lead-${leadIndex + 1}`}
      aria-labelledby={`lead-${leadIndex + 1}-title`}
      className={`scroll-mt-20 overflow-hidden rounded-lg border bg-white ${active ? "border-amber-400 ring-2 ring-amber-200" : "border-zinc-200"}`}
    >
      <div className="h-1 bg-amber-500" aria-hidden />
      <header className="px-4 pb-4 pt-3 sm:px-5">
        <h3 id={`lead-${leadIndex + 1}-title`} className="text-lg font-semibold leading-snug tracking-tight text-zinc-900">
          <button type="button" onClick={() => openEntity(lead.entity)} className="text-left hover:underline">
            {data.name}
          </button>
        </h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center font-mono text-xs text-zinc-600">
            {lead.entity}
            <CopyButton value={lead.entity} label="Copy ID" />
          </span>
          <EntityStatusBadge status={data.known ? data.status : "declined"} size="sm" />
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Closed by:{" "}
          {closedBy ? (
            <span className="font-medium text-zinc-900">
              <span aria-hidden>{closedBy.icon} </span>
              {closedBy.label}
            </span>
          ) : (
            <span className="text-zinc-500">not recorded</span>
          )}
        </p>
      </header>

      <div className="divide-y divide-zinc-100 border-t border-zinc-100">
        <CardBlock label="What flagged it?">
          <ul className="space-y-1 text-[0.9375rem] text-zinc-800">
            {splitSignals(lead.signal).map((key) => (
              <li key={key}>
                {SIGNAL_LABELS[key] ? (
                  <>
                    {SIGNAL_LABELS[key]} <code className="font-mono text-xs text-zinc-500">{key}</code>
                  </>
                ) : (
                  <code className="font-mono text-sm">{key}</code>
                )}
              </li>
            ))}
          </ul>
        </CardBlock>
        <CardBlock label="Why was it dismissed?">
          <p className="max-w-3xl text-[0.9375rem] leading-relaxed text-zinc-800">
            <RichText text={lead.reason} renderEntity={(id) => <CaseEntityChip id={id} />} />
          </p>
        </CardBlock>
        <CardBlock label="Tools used">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {tools.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {tools.map((tool) => (
                  <li key={tool}>
                    <code className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs text-zinc-700">{tool}</code>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="inline-flex items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-sm text-amber-900">
                <Icon name="alert" className="mt-0.5 h-4 w-4" />
                No tools recorded: no queries were logged for this lead, so there’s no proof it was investigated.
              </p>
            )}
            <a
              href={logHref}
              onClick={(event) => {
                event.preventDefault();
                navigate({ section: "log", log_entity: lead.entity, lead: null, finding: null });
              }}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-900 underline underline-offset-4"
            >
              View in log <Icon name="external" className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardBlock>
      </div>
    </article>
  );
}
