"use client";

import "@xyflow/react/dist/style.css";

import { MarkerType, ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import { formatMoney, formatMoneyShort, formatNumber } from "@/lib/format";
import { errorMessage } from "@/lib/runs/errors";
import { getGraph } from "@/lib/runs/api";
import type { GraphData } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { EDGE_TYPES, NODE_TYPES, ZoomControls, bottomSpacer, type EntityFlowNode, type FlowEdgeType } from "./flow/flow-parts";
import { NODE_HEIGHT, NODE_HEIGHT_WITH_CHIP, layoutGraph, parallelOffsets, strokeWidthFor } from "./flow/layout";
import { Button, Icon, LoadingBlock, Notice } from "./ui";

/** Red global de relaciones (EXAMPLE §7.9): por defecto solo entidades señaladas y sus vecinos. */
export function EntityGraph() {
  const { runId, openEntity } = useCaseFile();
  const [scope, setScope] = useState<"flagged" | "all">("flagged");
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGraph(runId, scope)
      .then((result) => {
        if (!cancelled) {
          setGraph(result);
          setError(null);
        }
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [runId, scope]);

  const flow = useMemo(() => {
    if (!graph) return null;
    const multi = (id: string) => (graph.nodes.find((node) => node.id === id)?.finding_indexes.length ?? 0) > 1;
    const layoutEdges = graph.edges.map((edge) => ({ id: edge.id, from: edge.from, to: edge.to }));
    const positions = layoutGraph(
      graph.nodes.map((node) => ({ id: node.id, height: multi(node.id) ? NODE_HEIGHT_WITH_CHIP : NODE_HEIGHT })),
      layoutEdges,
      { ranksep: 260, nodesep: 40 },
    );
    const offsets = parallelOffsets(layoutEdges, 60);
    const maxAmount = Math.max(0, ...graph.edges.map((edge) => edge.amount ?? 0));

    const nodes: EntityFlowNode[] = graph.nodes.map((node) => {
      const position = positions.get(node.id)!;
      return {
        id: node.id,
        type: "entity",
        position: { x: position.x, y: position.y },
        draggable: false,
        selectable: false,
        data: {
          entityId: node.id,
          name: node.name,
          kind: node.kind,
          status: node.status,
          height: position.height,
          onOpen: () => openEntity(node.id),
          chips: multi(node.id) ? [{ label: `Links ${node.finding_indexes.length} findings` }] : [],
        },
      };
    });

    const edges: FlowEdgeType[] = graph.edges.map((edge) => {
      const color = edge.in_cycle ? "var(--color-red-600)" : edge.kind === "relation" ? "var(--color-zinc-400)" : "var(--color-zinc-500)";
      return {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        type: "flow",
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, markerUnits: "userSpaceOnUse", color },
        data: {
          offset: offsets.get(edge.id) ?? 0,
          strokeWidth: strokeWidthFor(edge.amount, maxAmount),
          color,
          dashed: edge.kind === "relation",
          label: (
            <span className="block whitespace-nowrap">
              {edge.amount !== null ? (
                <>
                  <span className="font-semibold tabular-nums text-zinc-900">{formatMoneyShort(edge.amount)}</span>
                  <span className="text-zinc-500"> · {edge.count} {edge.count === 1 ? "payment" : "payments"}</span>
                </>
              ) : (
                <span className="text-zinc-600">{edge.label}</span>
              )}
              {edge.in_cycle && <span className="block font-medium text-red-700">↺ cycle</span>}
            </span>
          ),
        },
      };
    });
    const hasBackEdge = graph.edges.some((edge) => (positions.get(edge.to)?.x ?? 0) < (positions.get(edge.from)?.x ?? 0));
    return { nodes: hasBackEdge ? [...nodes, bottomSpacer(nodes, 320)] : nodes, edges };
  }, [graph, openEntity]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600">
          {scope === "flagged" ? "Accused and dismissed entities with their direct neighbors." : "All vendors with aggregated payments."}
        </p>
        <Button onClick={() => setScope((value) => (value === "flagged" ? "all" : "flagged"))} aria-pressed={scope === "all"}>
          {scope === "flagged" ? `Show all${graph?.hidden_count ? ` (${formatNumber(graph.hidden_count)} more)` : ""}` : "Flagged only"}
        </Button>
      </div>

      {error ? (
        <Notice tone="error" title="Could not load the graph">{error}</Notice>
      ) : !graph || !flow ? (
        <div className="flex h-[420px] items-center justify-center rounded-md border border-zinc-200 bg-zinc-50">
          <LoadingBlock label="Computing relationships…" />
        </div>
      ) : graph.nodes.length <= 1 ? (
        <div className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-600">
          <p>No flagged entities: there are no suspicious relationships to draw.</p>
          {scope === "flagged" && (
            <Button className="mt-3" onClick={() => setScope("all")}>
              View the full vendor network
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={`overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 ${scope === "all" ? "h-[560px]" : "h-[460px]"}`}>
            <ReactFlowProvider key={scope}>
              <ReactFlow
                nodes={flow.nodes}
                edges={flow.edges}
                nodeTypes={NODE_TYPES}
                edgeTypes={EDGE_TYPES}
                fitView
                fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
                minZoom={0.1}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={false}
                preventScrolling={false}
                aria-label="Entity relationship graph"
              >
                <ZoomControls />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span>Node border = status light</span>
            <span><span className="font-medium text-red-700">Red</span>: edge in a money cycle</span>
            <span>Dashed: relationship without money (same CLABE, same representative)</span>
            <span>Drag to pan; click a node to view the entity</span>
          </p>

          <details className="group mt-2 rounded-md border border-zinc-200 bg-white">
            <summary className="flex cursor-pointer items-center gap-1 px-3 py-2 text-xs font-medium text-zinc-600 marker:content-none">
              <Icon name="chevronRight" className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
              View relationships as a table
            </summary>
            <div className="relative overflow-x-auto border-t border-zinc-200">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-zinc-50 text-xs text-zinc-500">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">From</th>
                    <th scope="col" className="px-3 py-2 font-medium">To</th>
                    <th scope="col" className="px-3 py-2 font-medium">Relationship</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {graph.edges.map((edge) => {
                    const name = (id: string) => graph.nodes.find((node) => node.id === id)?.name ?? id;
                    return (
                      <tr key={edge.id} className={edge.in_cycle ? "bg-red-50" : ""}>
                        <td className="px-3 py-2">{name(edge.from)}</td>
                        <td className="px-3 py-2">{name(edge.to)}</td>
                        <td className="px-3 py-2 text-zinc-600">
                          {edge.label ?? `${edge.count} ${edge.count === 1 ? "payment" : "payments"}`}
                          {edge.in_cycle && " · cycle"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{edge.amount !== null ? formatMoney(edge.amount) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
