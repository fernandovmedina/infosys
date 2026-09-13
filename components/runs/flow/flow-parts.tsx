"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  Panel,
  Position,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import type { ReactNode } from "react";
import { KIND_LABELS, STATUS_LABELS } from "@/lib/runs/labels";
import type { EntityKind, EntityStatus } from "@/lib/runs/types";
import { displayEntityId } from "../entity-chip";
import { STATUS_STYLES } from "../entity-status-badge";
import { Icon } from "../ui";
import { NODE_WIDTH, edgeGeometry } from "./layout";

export type EntityNodeData = {
  entityId: string;
  name: string;
  kind: EntityKind;
  status: EntityStatus | null;
  height: number;
  highlighted?: boolean;
  /** Chip de esquema entrelazado ("También en hallazgo #2"). */
  chips?: { label: string; onClick?: () => void }[];
  onOpen?: () => void;
};

export type EntityFlowNode = Node<EntityNodeData, "entity">;

export function EntityNode({ data }: NodeProps<EntityFlowNode>) {
  const kind = KIND_LABELS[data.kind];
  const style = data.status ? STATUS_STYLES[data.status] : null;
  const border = data.kind === "company" ? "border-zinc-800" : style?.border ?? "border-zinc-300";

  return (
    <div
      style={{ width: NODE_WIDTH, height: data.height }}
      className={`flex flex-col justify-center rounded-lg border-2 bg-white px-3 py-2 text-left shadow-sm ${border} ${
        data.highlighted ? "ring-4 ring-zinc-900/15" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-1 !w-1 !min-w-0 !border-0 !bg-transparent" isConnectable={false} />
      <button
        type="button"
        onClick={data.onOpen}
        disabled={!data.onOpen}
        className="nodrag nopan min-w-0 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-default"
        aria-label={`${kind.label}: ${data.name} (${data.entityId})${data.status ? `, ${STATUS_LABELS[data.status].label}` : ""}`}
      >
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="text-base leading-none">{kind.icon}</span>
          <span className="line-clamp-2 text-[0.8125rem] font-semibold leading-tight text-zinc-900">{data.name}</span>
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-[0.6875rem] text-zinc-500">
          <span className="truncate font-mono">{displayEntityId(data.entityId)}</span>
          {style && data.status && data.kind !== "company" && (
            <span className={`inline-flex shrink-0 items-center gap-0.5 font-medium ${style.text}`}>
              <Icon name={style.icon} className="h-3 w-3" />
              {STATUS_LABELS[data.status].label}
            </span>
          )}
        </span>
      </button>
      {data.chips && data.chips.length > 0 && (
        <span className="mt-1.5 flex flex-wrap gap-1">
          {data.chips.map((chip) =>
            chip.onClick ? (
              <button
                key={chip.label}
                type="button"
                onClick={chip.onClick}
                className="nodrag nopan inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[0.6875rem] font-medium text-violet-800 ring-1 ring-inset ring-violet-200 outline-none hover:bg-violet-100 focus-visible:ring-2 focus-visible:ring-zinc-900"
              >
                {chip.label} <Icon name="arrowRight" className="h-3 w-3" />
              </button>
            ) : (
              <span key={chip.label} className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[0.6875rem] font-medium text-violet-800 ring-1 ring-inset ring-violet-200">
                {chip.label}
              </span>
            ),
          )}
        </span>
      )}
      <Handle type="source" position={Position.Right} className="!h-1 !w-1 !min-w-0 !border-0 !bg-transparent" isConnectable={false} />
    </div>
  );
}

export type FlowEdgeData = {
  offset: number;
  strokeWidth: number;
  color: string;
  dashed?: boolean;
  highlighted?: boolean;
  label?: ReactNode;
};

export type FlowEdgeType = Edge<FlowEdgeData, "flow">;

export function FlowEdge({ id, sourceX, sourceY, targetX, targetY, data, markerEnd }: EdgeProps<FlowEdgeType>) {
  const geometry = edgeGeometry(sourceX, sourceY, targetX, targetY, data?.offset ?? 0);
  const width = (data?.strokeWidth ?? 1.5) + (data?.highlighted ? 1.5 : 0);

  return (
    <>
      <BaseEdge
        id={id}
        path={geometry.path}
        markerEnd={markerEnd}
        interactionWidth={18}
        style={{
          stroke: data?.highlighted ? "var(--color-zinc-900)" : data?.color ?? "var(--color-zinc-500)",
          strokeWidth: width,
          strokeDasharray: data?.dashed ? "6 4" : undefined,
        }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%, -50%) translate(${geometry.labelX}px, ${geometry.labelY}px)` }}
            className={`nodrag nopan pointer-events-auto absolute rounded-md border bg-white px-2 py-1 text-center text-[0.6875rem] leading-tight shadow-sm ${
              data.highlighted ? "border-zinc-900" : "border-zinc-200"
            }`}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/** Zoom, alejar y ajustar a pantalla, con etiquetas en español. */
export function ZoomControls() {
  const flow = useReactFlow();
  const buttonClass =
    "flex h-7 w-7 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-600 shadow-sm outline-none hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900";
  return (
    <Panel position="top-right" className="!m-2 flex flex-col gap-1">
      <button type="button" className={buttonClass} onClick={() => flow.zoomIn()} aria-label="Zoom in">
        <Icon name="plus" className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={buttonClass} onClick={() => flow.zoomOut()} aria-label="Zoom out">
        <Icon name="minus" className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={buttonClass} onClick={() => flow.fitView({ padding: 0.15 })} aria-label="Fit to screen">
        <Icon name="fit" className="h-3.5 w-3.5" />
      </button>
    </Panel>
  );
}

function SpacerNode() {
  return <div aria-hidden style={{ width: 1, height: 1 }} />;
}

export type SpacerFlowNode = Node<Record<string, never>, "spacer">;

/**
 * Nodo invisible bajo el diagrama: `fitView` solo mide nodos, así que sin él
 * los arcos de regreso (ciclos) quedarían fuera del área visible.
 */
export function bottomSpacer(nodes: EntityFlowNode[], depth = 300): SpacerFlowNode {
  const bottom = Math.max(...nodes.map((node) => node.position.y + node.data.height));
  const left = Math.min(...nodes.map((node) => node.position.x));
  return { id: "__spacer", type: "spacer", position: { x: left, y: bottom + depth }, data: {}, draggable: false, selectable: false, focusable: false };
}

export const NODE_TYPES = { entity: EntityNode, spacer: SpacerNode };
export const EDGE_TYPES = { flow: FlowEdge };
