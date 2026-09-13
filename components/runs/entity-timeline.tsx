"use client";

import { formatDate, formatMoney, formatMonthShort, parseDate } from "@/lib/format";
import type { EntityTimeline as TimelineData, SourceTable, TimelineLane } from "@/lib/runs/types";

const LANE_COLORS: Record<TimelineLane["key"], string> = {
  contracts: "#0f766e",
  purchase_orders: "#7c3aed",
  invoices: "#2563eb",
  bank_txns: "#18181b",
  registration: "#b45309",
};

/**
 * Eje temporal por entidad con un carril por tipo de registro (EXAMPLE §7.11).
 * Las anotaciones las manda el backend; el frontend no infiere patrones.
 */
export function EntityTimeline({
  timeline,
  onOpenRecord,
  compact = false,
}: {
  timeline: TimelineData;
  onOpenRecord: (table: SourceTable, recordId: string) => void;
  compact?: boolean;
}) {
  const labelWidth = compact ? 96 : 120;
  const width = compact ? 560 : 760;
  const laneHeight = compact ? 34 : 42;
  const top = 26 + Math.min(timeline.annotations.length, 3) * 14;
  const plotWidth = width - labelWidth - 16;
  const height = top + timeline.lanes.length * laneHeight + 8;

  const start = parseDate(timeline.range.from).getTime();
  const end = parseDate(timeline.range.to).getTime();
  const span = Math.max(1, end - start);
  const x = (date: string) => labelWidth + ((parseDate(date).getTime() - start) / span) * plotWidth;

  const months: Date[] = [];
  const cursor = new Date(parseDate(timeline.range.from));
  cursor.setDate(1);
  while (cursor.getTime() <= end) {
    months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const total = timeline.lanes.reduce((sum, lane) => sum + lane.events.length, 0);

  return (
    <figure className="min-w-0">
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="group"
          aria-label={`Línea de tiempo de ${timeline.entity.name}: ${total} registros`}
          className="max-w-none text-zinc-900"
        >
          {months.map((month) => {
            const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
            const mx = Math.max(labelWidth, x(iso));
            return (
              <g key={iso}>
                <line x1={mx} x2={mx} y1={top - 6} y2={height - 4} stroke="#e4e4e7" />
                <text x={mx + 3} y={top - 10} fontSize={10} fill="#71717a">{formatMonthShort(month)}</text>
              </g>
            );
          })}

          {timeline.annotations.slice(0, 3).map((annotation, index) => {
            const ax = x(annotation.date);
            const anchorEnd = ax > width - 200;
            return (
              <g key={`${annotation.date}-${index}`}>
                <line x1={ax} x2={ax} y1={10 + index * 14} y2={height - 4} stroke="#dc2626" strokeDasharray="3 3" />
                <text x={anchorEnd ? ax - 4 : ax + 4} y={12 + index * 14} fontSize={10} fill="#b91c1c" textAnchor={anchorEnd ? "end" : "start"}>
                  {annotation.label}
                </text>
              </g>
            );
          })}

          {timeline.lanes.map((lane, laneIndex) => {
            const y = top + laneIndex * laneHeight + laneHeight / 2;
            const color = LANE_COLORS[lane.key];
            const perDay = new Map<string, number>();
            return (
              <g key={lane.key}>
                <line x1={labelWidth} x2={width - 8} y1={y} y2={y} stroke="#f4f4f5" strokeWidth={laneHeight - 10} />
                <text x={0} y={y + 4} fontSize={compact ? 10 : 11} fill="#3f3f46">{lane.label}</text>
                {lane.events.length === 0 && lane.note && (
                  <text x={labelWidth + 8} y={y + 4} fontSize={10} fill="#a1a1aa" fontStyle="italic">← {lane.note}</text>
                )}
                {lane.events.length > 0 && lane.note && (
                  <text x={width - 10} y={y - laneHeight / 2 + 12} fontSize={9} fill="#a1a1aa" textAnchor="end" fontStyle="italic">{lane.note}</text>
                )}
                {lane.events.map((event) => {
                  const stack = perDay.get(event.date) ?? 0;
                  perDay.set(event.date, stack + 1);
                  const ex = x(event.date) + stack * 7;
                  const label = `${event.label} · ${formatDate(event.date)}${event.amount !== null ? ` · ${formatMoney(event.amount)}` : ""}`;
                  const open = () => onOpenRecord(event.record.source_table, event.record.record_id);
                  return (
                    <g
                      key={`${event.record.source_table}:${event.record.record_id}:${event.date}`}
                      role="button"
                      tabIndex={0}
                      aria-label={label}
                      onClick={open}
                      onKeyDown={(keyEvent) => {
                        if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                          keyEvent.preventDefault();
                          open();
                        }
                      }}
                      className="cursor-pointer outline-none [&:focus-visible>*]:stroke-zinc-900 [&:hover>*]:opacity-70"
                    >
                      <title>{label}</title>
                      {lane.key === "registration" ? (
                        <rect x={ex - 5} y={y - 5} width={10} height={10} transform={`rotate(45 ${ex} ${y})`} fill={color} stroke="white" strokeWidth={1.5} />
                      ) : (
                        <rect x={ex - 3} y={y - 9} width={6} height={18} rx={1.5} fill={color} stroke="white" strokeWidth={1} />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-1 text-xs text-zinc-500">
        {formatDate(timeline.range.from)} – {formatDate(timeline.range.to)} · ▮ registro (clic para abrirlo) · ◆ alta o publicación · línea roja: anotación del backend
      </figcaption>
    </figure>
  );
}
