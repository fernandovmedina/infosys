"use client";

import "@xyflow/react/dist/style.css";

import { MarkerType, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { Fragment, useMemo } from "react";
import { formatDate, formatMoney, formatMoneyShort } from "@/lib/format";
import type { Finding } from "@/lib/runs/types";
import { ExhibitChip } from "./case-chips";
import { useCaseFile } from "./case-file-context";
import { displayEntityId } from "./entity-chip";
import { EntityStatusBadge } from "./entity-status-badge";
import {
  EDGE_TYPES,
  NODE_TYPES,
  ZoomControls,
  bottomSpacer,
  type EntityFlowNode,
  type SpacerFlowNode,
  type FlowEdgeType,
} from "./flow/flow-parts";
import {
  NODE_HEIGHT,
  NODE_HEIGHT_WITH_CHIP,
  layoutGraph,
  parallelOffsets,
  strokeWidthFor,
} from "./flow/layout";
import { buildSvg, downloadPng, downloadSvg } from "./flow/svg-export";
import {
  KIND_LABELS,
  resolveEntityEndpoint,
} from "@/lib/runs/labels";
import { Button, Icon, Notice, useMediaQuery } from "./ui";

const circled = (index: number) => (index < 20 ? String.fromCharCode(0x2460 + index) : `(${index + 1})`);

/**
 * Rastro del dinero de un hallazgo (EXAMPLE §7.5). Siempre un diagrama: en
 * escritorio un grafo; en móvil una lista vertical de pasos con flechas.
 */
export function MoneyTrailDiagram({
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
  const { report, openEntity, openFinding } = useCaseFile();
  const isMobile = useMediaQuery("(max-width: 639px)");
  const steps = useMemo(() => finding.money_trail ?? [], [finding.money_trail]);
  const extra = report.findings_extra[findingIndex];

  const model = useMemo(() => {
    const ids: string[] = [];
    for (const step of steps) {
      if (!ids.includes(step.from)) ids.push(step.from);
      if (!ids.includes(step.to)) ids.push(step.to);
    }
    const shared = new Map<string, number[]>();
    for (const item of extra?.shared_entities ?? []) {
      shared.set(item.entity, [...(shared.get(item.entity) ?? []), item.other_finding_index]);
    }
    const resolved = new Map(
      ids.map((id) => [id, resolveEntityEndpoint(id, report.entities)]),
    );
    const layoutEdges = steps.map((step, index) => ({ id: `step-${index}`, from: step.from, to: step.to }));
    const positions = layoutGraph(
      ids.map((id) => ({
        id,
        height: shared.has(resolved.get(id)?.entityId ?? "")
          ? NODE_HEIGHT_WITH_CHIP
          : NODE_HEIGHT,
      })),
      layoutEdges,
      { ranksep: 300, nodesep: 90 },
    );
    const offsets = parallelOffsets(layoutEdges, 70);
    const maxAmount = Math.max(...steps.map((step) => step.amount), 0);
    return { ids, shared, resolved, positions, offsets, maxAmount };
  }, [steps, extra, report.entities]);

  const nodes = useMemo<(EntityFlowNode | SpacerFlowNode)[]>(() => {
    const entityNodes = model.ids.map((id): EntityFlowNode => {
        const resolved = model.resolved.get(id)!;
        const data = resolved.entityId
          ? report.entities[resolved.entityId]
          : null;
        const position = model.positions.get(id);
        return {
          id,
          type: "entity",
          position: { x: position?.x ?? 0, y: position?.y ?? 0 },
          draggable: false,
          selectable: false,
          data: {
            entityId: id,
            name: resolved.name,
            kind: data?.is_audited_company ? "company" : data?.kind ?? "unknown",
            status: data?.status ?? null,
            height: position?.height ?? NODE_HEIGHT,
            onOpen: resolved.entityId
              ? () => openEntity(resolved.entityId!)
              : undefined,
            chips: (model.shared.get(resolved.entityId ?? "") ?? []).map((other) => ({
              label: `Also in finding #${other + 1}`,
              onClick: () => openFinding(other),
            })),
          },
        };
      });
    const hasBackEdge = steps.some((step) => (model.positions.get(step.to)?.x ?? 0) < (model.positions.get(step.from)?.x ?? 0));
    return hasBackEdge ? [...entityNodes, bottomSpacer(entityNodes, 250)] : entityNodes;
  }, [model, steps, report.entities, openEntity, openFinding]);

  const edges = useMemo<FlowEdgeType[]>(
    () =>
      steps.map((step, index) => {
        const highlighted = hoveredExhibit === step.exhibit_id;
        return {
          id: `step-${index}`,
          source: step.from,
          target: step.to,
          type: "flow",
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, markerUnits: "userSpaceOnUse", color: highlighted ? "var(--color-zinc-900)" : "var(--color-zinc-500)" },
          data: {
            offset: model.offsets.get(`step-${index}`) ?? 0,
            strokeWidth: strokeWidthFor(step.amount, model.maxAmount),
            color: "var(--color-zinc-500)",
            highlighted,
            label: (
              <span onMouseEnter={() => onHoverExhibit(step.exhibit_id)} onMouseLeave={() => onHoverExhibit(null)} className="block">
                <span className="flex items-center justify-center gap-1">
                  <span aria-label={`Step ${index + 1}`} className="text-sm leading-none text-zinc-500">{circled(index)}</span>
                  <span className="text-xs font-semibold tabular-nums text-zinc-900">{formatMoneyShort(step.amount)}</span>
                </span>
                <span className="mt-0.5 flex items-center justify-center gap-1 whitespace-nowrap text-zinc-500">
                  {formatDate(step.date)} · <ExhibitChip findingIndex={findingIndex} exhibitId={step.exhibit_id} onHover={onHoverExhibit} />
                </span>
              </span>
            ),
          },
        };
      }),
    [steps, hoveredExhibit, model, findingIndex, onHoverExhibit],
  );

  if (steps.length === 0) {
    return (
      <Notice tone="error" title="Money trail unavailable">
        The backend didn’t send the money trail for this finding. The evidence and reconciliation below are still valid, but the flow can’t be drawn.
      </Notice>
    );
  }

  function exportSvg() {
    return buildSvg(
      model.ids.map((id) => {
        const resolved = model.resolved.get(id)!;
        const data = resolved.entityId
          ? report.entities[resolved.entityId]
          : null;
        return {
          position: model.positions.get(id)!,
          title: resolved.name,
          subtitle: displayEntityId(id),
          status: data?.status ?? null,
          company: Boolean(data?.is_audited_company),
        };
      }),
      steps.map((step, index) => ({
        from: step.from,
        to: step.to,
        offset: model.offsets.get(`step-${index}`) ?? 0,
        strokeWidth: strokeWidthFor(step.amount, model.maxAmount),
        lines: [`${circled(index)} ${formatMoneyShort(step.amount)}`, `${formatDate(step.date)} · ${step.exhibit_id}`],
      })),
      `Finding #${findingIndex + 1} · Money trail`,
    );
  }

  const filename = `finding-${findingIndex + 1}-money-trail`;

  return (
    <div>
      {isMobile ? (
        <ol className="space-y-0" aria-label="Money trail steps">
          {steps.map((step, index) => {
            const from = resolveEntityEndpoint(step.from, report.entities);
            const to = resolveEntityEndpoint(step.to, report.entities);
            return (
              <Fragment key={index}>
                {(index === 0 || steps[index - 1].to !== step.from) && <TrailNodeCard id={step.from} findingIndex={findingIndex} />}
                <li className="flex items-stretch gap-3 py-1 pl-5">
                  <span aria-hidden className="flex w-6 flex-col items-center">
                    <span className="w-0.5 flex-1 bg-zinc-400" style={{ width: Math.max(2, strokeWidthFor(step.amount, model.maxAmount)) }} />
                    <Icon name="arrowDown" className="-mt-1 h-4 w-4 text-zinc-500" />
                  </span>
                  <span className={`flex-1 rounded-md border bg-white px-3 py-2 text-sm ${hoveredExhibit === step.exhibit_id ? "border-zinc-900" : "border-zinc-200"}`}>
                    <span className="sr-only">
                      Step {index + 1}: from {from.name} to {to.name}.
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="text-zinc-500">{circled(index)}</span>
                      <span className="font-semibold tabular-nums">{formatMoney(step.amount)}</span>
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                      {formatDate(step.date)} · <ExhibitChip findingIndex={findingIndex} exhibitId={step.exhibit_id} onHover={onHoverExhibit} />
                    </span>
                  </span>
                </li>
                <TrailNodeCard id={step.to} findingIndex={findingIndex} returning={step.to === steps[0].from && index === steps.length - 1} />
              </Fragment>
            );
          })}
        </ol>
      ) : (
        <div className="relative h-[420px] overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.12, maxZoom: 1.1 }}
              minZoom={0.3}
              maxZoom={2}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              zoomOnScroll={false}
              preventScrolling={false}
              onEdgeMouseEnter={(_, edge) => onHoverExhibit(steps[Number(edge.id.replace("step-", ""))]?.exhibit_id ?? null)}
              onEdgeMouseLeave={() => onHoverExhibit(null)}
              aria-label={`Money trail diagram for finding #${findingIndex + 1}`}
            >
              <ZoomControls />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {circled(0)} step order · thickness is proportional to the amount
          {!isMobile && steps.some((step, index) => index > 0 && step.to === steps[0].from) && " · the lower arc is the money coming back"}
        </p>
        {!isMobile && (
          <span className="flex gap-2">
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => downloadSvg(exportSvg(), filename)}>
              <Icon name="download" className="h-3.5 w-3.5" /> SVG
            </Button>
            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => downloadPng(exportSvg(), filename)}>
              <Icon name="download" className="h-3.5 w-3.5" /> PNG
            </Button>
          </span>
        )}
      </div>

      <details className="group mt-2 rounded-md border border-zinc-200 bg-white">
        <summary className="flex cursor-pointer items-center gap-1 px-3 py-2 text-xs font-medium text-zinc-600 marker:content-none">
          <Icon name="chevronRight" className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          View steps as a table
        </summary>
        <div className="relative overflow-x-auto border-t border-zinc-200">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Money trail steps for finding #{findingIndex + 1}</caption>
            <thead className="bg-zinc-50 text-xs text-zinc-500">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">#</th>
                <th scope="col" className="px-3 py-2 font-medium">From</th>
                <th scope="col" className="px-3 py-2 font-medium">To</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
                <th scope="col" className="px-3 py-2 font-medium">Date</th>
                <th scope="col" className="px-3 py-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {steps.map((step, index) => (
                <tr key={index} className={hoveredExhibit === step.exhibit_id ? "bg-amber-50" : ""}>
                  <td className="px-3 py-2 tabular-nums text-zinc-500">{index + 1}</td>
                  <td className="px-3 py-2">{resolveEntityEndpoint(step.from, report.entities).name}</td>
                  <td className="px-3 py-2">{resolveEntityEndpoint(step.to, report.entities).name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatMoney(step.amount)}</td>
                  <td className="whitespace-nowrap px-3 py-2">{formatDate(step.date)}</td>
                  <td className="px-3 py-2">
                    <ExhibitChip findingIndex={findingIndex} exhibitId={step.exhibit_id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function TrailNodeCard({ id, findingIndex, returning = false }: { id: string; findingIndex: number; returning?: boolean }) {
  const { openEntity, openFinding, report } = useCaseFile();
  const resolved = resolveEntityEndpoint(id, report.entities);
  const data = resolved.entityId ? report.entities[resolved.entityId] : null;
  const shared = (report.findings_extra[findingIndex]?.shared_entities ?? []).filter(
    (item) => item.entity === resolved.entityId,
  );
  const kind = KIND_LABELS[data?.is_audited_company ? "company" : data?.kind ?? "unknown"];
  return (
    <li className={`rounded-md border-2 bg-white px-3 py-2 ${data?.is_audited_company ? "border-zinc-800" : data?.status === "accused" ? "border-red-500" : data?.status === "declined" ? "border-amber-500" : "border-zinc-300"}`}>
      <button type="button" onClick={() => resolved.entityId && openEntity(resolved.entityId)} className="w-full text-left">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
          <span aria-hidden>{kind.icon}</span>
          {resolved.name}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <span className="font-mono">{displayEntityId(id)}</span>
          {data && !data.is_audited_company && <EntityStatusBadge status={data.status} size="sm" />}
          {returning && <span className="font-medium text-violet-700">↺ the money returns to the start</span>}
        </span>
      </button>
      {shared.map((item) => (
        <button
          key={item.other_finding_index}
          type="button"
          onClick={() => openFinding(item.other_finding_index)}
          className="mt-1.5 inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-800 ring-1 ring-inset ring-violet-200"
        >
          Also in finding #{item.other_finding_index + 1} <Icon name="arrowRight" className="h-3 w-3" />
        </button>
      ))}
    </li>
  );
}
