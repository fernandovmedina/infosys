/**
 * SVG estático de un diagrama a partir del mismo layout que la vista
 * interactiva, para "descargar SVG/PNG" (EXAMPLE §7.5). No usa red ni fuentes
 * remotas.
 */

import type { EntityStatus } from "@/lib/runs/types";
import { edgeGeometry, type PositionedNode } from "./layout";

export interface SvgNode {
  position: PositionedNode;
  title: string;
  subtitle: string;
  status: EntityStatus | null;
  company: boolean;
}

export interface SvgEdge {
  from: string;
  to: string;
  offset: number;
  strokeWidth: number;
  lines: string[];
}

const STROKES: Record<EntityStatus, string> = { accused: "#ef4444", declined: "#f59e0b", clear: "#10b981" };

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export function buildSvg(nodes: SvgNode[], edges: SvgEdge[], title: string): string {
  const byId = new Map(nodes.map((node) => [node.position.id, node.position]));
  const parts: string[] = [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const grow = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const edge of edges) {
    const source = byId.get(edge.from);
    const target = byId.get(edge.to);
    if (!source || !target) continue;
    const geometry = edgeGeometry(source.x + source.width, source.y + source.height / 2, target.x, target.y + target.height / 2, edge.offset);
    grow(geometry.labelX, geometry.labelY + (geometry.back ? 40 : 0));
    parts.push(`<path d="${geometry.path}" fill="none" stroke="#71717a" stroke-width="${edge.strokeWidth.toFixed(2)}" marker-end="url(#arrow)"/>`);
    const width = Math.max(...edge.lines.map((line) => line.length)) * 6.2 + 14;
    const height = edge.lines.length * 13 + 8;
    parts.push(
      `<rect x="${geometry.labelX - width / 2}" y="${geometry.labelY - height / 2}" width="${width}" height="${height}" rx="5" fill="#fff" stroke="#e4e4e7"/>`,
    );
    edge.lines.forEach((line, index) => {
      const y = geometry.labelY - height / 2 + 15 + index * 13;
      parts.push(`<text x="${geometry.labelX}" y="${y}" text-anchor="middle" font-size="11" fill="#27272a">${escape(line)}</text>`);
    });
  }

  for (const node of nodes) {
    const { x, y, width, height } = node.position;
    grow(x, y);
    grow(x + width, y + height);
    const stroke = node.company ? "#27272a" : node.status ? STROKES[node.status] : "#d4d4d8";
    parts.push(`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="8" fill="#fff" stroke="${stroke}" stroke-width="2"/>`);
    parts.push(`<text x="${x + 12}" y="${y + height / 2 - 4}" font-size="13" font-weight="600" fill="#18181b">${escape(clip(node.title, 30))}</text>`);
    parts.push(`<text x="${x + 12}" y="${y + height / 2 + 14}" font-size="11" font-family="monospace" fill="#71717a">${escape(clip(node.subtitle, 34))}</text>`);
  }

  const pad = 24;
  const viewX = minX - pad;
  const viewY = minY - pad - 24;
  const viewWidth = maxX - minX + pad * 2;
  const viewHeight = maxY - minY + pad * 2 + 24;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewX} ${viewY} ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" font-family="Roboto, Helvetica, Arial, sans-serif">`,
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#71717a"/></marker></defs>`,
    `<rect x="${viewX}" y="${viewY}" width="${viewWidth}" height="${viewHeight}" fill="#fafafa"/>`,
    `<text x="${viewX + pad}" y="${viewY + 26}" font-size="14" font-weight="600" fill="#18181b">${escape(title)}</text>`,
    ...parts,
    "</svg>",
  ].join("");
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(svg: string, filename: string) {
  saveBlob(new Blob([svg], { type: "image/svg+xml" }), `${filename}.svg`);
}

export function downloadPng(svg: string, filename: string) {
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  image.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    context.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => blob && saveBlob(blob, `${filename}.png`), "image/png");
  };
  image.src = url;
}
