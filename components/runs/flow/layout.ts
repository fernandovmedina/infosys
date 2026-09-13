/**
 * Layout y geometría de los diagramas (money trail y grafo de entidades).
 *
 * dagre acomoda de izquierda a derecha. Las aristas que regresan hacia la
 * izquierda (el cierre de un ciclo de round-tripping) se dibujan como un arco
 * por debajo de los nodos: el ciclo se ve como ciclo, no desenrollado.
 */

import { Graph, layout } from "@dagrejs/dagre";

export const NODE_WIDTH = 224;
export const NODE_HEIGHT = 84;
export const NODE_HEIGHT_WITH_CHIP = 108;

export interface LayoutNodeInput {
  id: string;
  height: number;
}

export interface LayoutEdgeInput {
  id: string;
  from: string;
  to: string;
}

export interface PositionedNode {
  id: string;
  /** Esquina superior izquierda. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgeGeometry {
  path: string;
  labelX: number;
  labelY: number;
  back: boolean;
}

export function layoutGraph(
  nodes: LayoutNodeInput[],
  edges: LayoutEdgeInput[],
  options: { nodesep?: number; ranksep?: number } = {},
): Map<string, PositionedNode> {
  const graph = new Graph();
  graph.setGraph({ rankdir: "LR", nodesep: options.nodesep ?? 70, ranksep: options.ranksep ?? 170, marginx: 16, marginy: 16 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const node of nodes) graph.setNode(node.id, { width: NODE_WIDTH, height: node.height });
  const seen = new Set<string>();
  for (const edge of edges) {
    const pair = `${edge.from}>${edge.to}`;
    if (seen.has(pair) || edge.from === edge.to) continue;
    seen.add(pair);
    graph.setEdge(edge.from, edge.to);
  }
  layout(graph);

  const positions = new Map<string, PositionedNode>();
  for (const node of nodes) {
    const placed = graph.node(node.id) as { x: number; y: number } | undefined;
    positions.set(node.id, {
      id: node.id,
      x: (placed?.x ?? 0) - NODE_WIDTH / 2,
      y: (placed?.y ?? 0) - node.height / 2,
      width: NODE_WIDTH,
      height: node.height,
    });
  }
  return positions;
}

/** Índice de cada arista dentro de su grupo de paralelas (mismo par de nodos, cualquier sentido). */
export function parallelOffsets(edges: LayoutEdgeInput[], spacing: number): Map<string, number> {
  const groups = new Map<string, string[]>();
  for (const edge of edges) {
    const key = [edge.from, edge.to].sort().join("|");
    groups.set(key, [...(groups.get(key) ?? []), edge.id]);
  }
  const offsets = new Map<string, number>();
  for (const ids of groups.values()) {
    ids.forEach((id, index) => offsets.set(id, (index - (ids.length - 1) / 2) * spacing));
  }
  return offsets;
}

function cubicPoint(p0: number, p1: number, p2: number, p3: number, t = 0.5) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * Curva de `source` (borde derecho) a `target` (borde izquierdo). Si el
 * destino está a la izquierda, arco por debajo con profundidad suficiente
 * para librar los nodos intermedios.
 */
export function edgeGeometry(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offset: number,
  backDepth = 210,
): EdgeGeometry {
  const back = targetX < sourceX - 8;
  let c1x: number;
  let c1y: number;
  let c2x: number;
  let c2y: number;

  if (back) {
    // Cada paralela de regreso baja a una profundidad distinta para no encimarse.
    const depth = backDepth + 50 + offset * 1.6;
    const bottom = Math.max(sourceY, targetY) + depth;
    c1x = sourceX + 120;
    c1y = bottom;
    c2x = targetX - 120;
    c2y = bottom;
  } else {
    const dx = Math.max(60, (targetX - sourceX) / 2);
    c1x = sourceX + dx;
    c1y = sourceY + offset * 1.35;
    c2x = targetX - dx;
    c2y = targetY + offset * 1.35;
  }

  return {
    path: `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`,
    labelX: cubicPoint(sourceX, c1x, c2x, targetX),
    labelY: cubicPoint(sourceY, c1y, c2y, targetY),
    back,
  };
}

/** Grosor proporcional al monto, con mínimo y máximo para que ninguna arista desaparezca. */
export function strokeWidthFor(amount: number | null, max: number): number {
  if (amount === null || max <= 0) return 1.5;
  return 1.5 + 4.5 * Math.sqrt(Math.abs(amount) / max);
}
