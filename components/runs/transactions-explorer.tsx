"use client";

import { createColumnHelper, tableFeatures, useTable, type ColumnDef } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatCell, formatMoney, formatNumber } from "@/lib/format";
import { errorMessage } from "@/lib/runs/errors";
import { getRecords } from "@/lib/runs/api";
import { STATUS_LABELS } from "@/lib/runs/labels";
import { MONEY_COLUMNS, TABLES, TABLE_ORDER } from "@/lib/runs/schema";
import type { EntityStatus, RecordRow, RecordsQuery, SourceTable } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { EntityStatusBadge } from "./entity-status-badge";
import { Button, ColumnName, Icon, LoadingBlock, Notice, Spinner, TableName } from "./ui";

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, RecordRow>();
const EMPTY: RecordRow[] = [];
const PAGE_SIZE = 50;
const ROW_HEIGHT = 40;
const WIDE_COLUMNS = new Set(["concepto_text", "description", "address", "reference", "account_name", "legal_name", "full_name", "scope"]);

const columnWidth = (id: string) =>
  id === "risk" ? 130 : id === "cited" ? 140 : WIDE_COLUMNS.has(id) ? 260 : MONEY_COLUMNS.has(id) ? 130 : id.endsWith("clabe") ? 190 : 150;

type Filters = Omit<RecordsQuery, "limit" | "cursor">;

function ExplorerResults({ query }: { query: Filters }) {
  const { runId, openRecord, openExhibit } = useCaseFile();
  const [items, setItems] = useState<RecordRow[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const requested = useRef<string | null>(null);

  // Primera página: nunca se cargan todas las filas en el cliente.
  useEffect(() => {
    let cancelled = false;
    getRecords(runId, { ...query, limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.next_cursor);
        setTotal(page.total);
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [runId, query]);

  async function loadMore() {
    if (!cursor || requested.current === cursor) return;
    requested.current = cursor;
    setLoadingMore(true);
    try {
      const page = await getRecords(runId, { ...query, limit: PAGE_SIZE, cursor });
      setItems((previous) => [...(previous ?? []), ...page.items]);
      setCursor(page.next_cursor);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoadingMore(false);
    }
  }

  const columns = useMemo<ColumnDef<typeof features, RecordRow, unknown>[]>(() => {
    const meta = TABLES[query.table];
    return [
      helper.display({
        id: "risk",
        header: () => "Riesgo",
        cell: ({ row }) => (row.original.risk ? <EntityStatusBadge status={row.original.risk} size="sm" /> : <span className="text-zinc-400">—</span>),
      }),
      helper.display({
        id: "cited",
        header: () => "Citado en",
        cell: ({ row }) =>
          row.original.cited_in.length > 0 ? (
            <span className="flex flex-wrap gap-1">
              {row.original.cited_in.map((cite) => (
                <span key={`${cite.finding_index}-${cite.exhibit_id}`} className="rounded bg-zinc-900 px-1 font-mono text-[0.6875rem] text-white">
                  #{cite.finding_index + 1} · {cite.exhibit_id}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-zinc-400">—</span>
          ),
      }),
      ...meta.columns.map((column) =>
        helper.accessor((row) => row.data[column] ?? null, {
          id: column,
          header: () => <ColumnName column={column} />,
          cell: (info) => {
            const value = info.getValue() as string | number | null;
            if (typeof value === "number" && MONEY_COLUMNS.has(column)) return <span className="tabular-nums">{formatMoney(value)}</span>;
            return <span className={column === meta.idField ? "font-mono text-xs" : ""}>{formatCell(value)}</span>;
          },
        }) as ColumnDef<typeof features, RecordRow, unknown>,
      ),
    ];
  }, [query.table]);

  const table = useTable({
    features,
    columns,
    data: items ?? EMPTY,
    getRowId: (row) => `${row.source_table}:${row.record_id}`,
  });
  const rows = table.getRowModel().rows;
  const template = table
    .getAllLeafColumns()
    .map((column) => `${columnWidth(column.id)}px`)
    .join(" ");

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const lastIndex = virtualItems.at(-1)?.index ?? 0;

  useEffect(() => {
    if (cursor && !loadingMore && lastIndex >= rows.length - 10) {
      const timer = setTimeout(loadMore, 0);
      return () => clearTimeout(timer);
    }
  });

  if (error) return <Notice tone="error" title="No se pudieron cargar los registros">{error}</Notice>;
  if (!items) return <LoadingBlock label="Cargando registros…" />;
  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-600">Ningún registro coincide con los filtros.</p>;
  }

  const minWidth = table.getAllLeafColumns().reduce((sum, column) => sum + columnWidth(column.id), 0);

  return (
    <div>
      <div
        ref={scrollRef}
        role="table"
        aria-label={`${TABLES[query.table].plural}: ${formatNumber(total)} registros`}
        aria-rowcount={total + 1}
        className="h-[520px] overflow-auto rounded-md border border-zinc-200 bg-white text-sm"
      >
        <div style={{ minWidth }}>
          {table.getHeaderGroups().map((group) => (
            <div key={group.id} role="row" className="sticky top-0 z-10 grid border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500" style={{ gridTemplateColumns: template }}>
              {group.headers.map((header) => (
                <div key={header.id} role="columnheader" className="truncate px-3 py-2 font-medium">
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </div>
              ))}
            </div>
          ))}
          <div role="rowgroup" style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualItems.map((item) => {
              const row = rows[item.index];
              const cite = row.original.cited_in[0];
              return (
                <div
                  key={row.id}
                  role="row"
                  aria-rowindex={item.index + 2}
                  tabIndex={0}
                  onClick={() => (cite ? openExhibit(cite.finding_index, cite.exhibit_id) : openRecord(row.original.source_table, row.original.record_id))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.click();
                    }
                  }}
                  className={`absolute inset-x-0 grid cursor-pointer items-center border-b border-zinc-100 outline-none hover:bg-zinc-50 focus-visible:bg-sky-50 ${cite ? "bg-amber-50/40" : ""}`}
                  style={{ gridTemplateColumns: template, height: ROW_HEIGHT, transform: `translateY(${item.start}px)` }}
                >
                  {row.getAllCells().map((cell) => (
                    <div key={cell.id} role="cell" className="truncate px-3 text-zinc-800">
                      <table.FlexRender cell={cell} />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500" aria-live="polite">
        {formatNumber(items.length)} cargados de {formatNumber(total)}
        {loadingMore && <Spinner className="h-3 w-3" />}
        {cursor && !loadingMore && <span>· desplázate para cargar más</span>}
      </p>
    </div>
  );
}

/** Explorador de todas las tablas del dataset (EXAMPLE §7.10). */
export function TransactionsExplorer() {
  const { params } = useCaseFile();
  const ids = { table: useId(), entity: useId(), risk: useId(), from: useId(), to: useId(), min: useId(), max: useId(), status: useId(), channel: useId(), cited: useId() };
  const [table, setTable] = useState<SourceTable>("invoices");
  const [entity, setEntity] = useState(params.get("tx_entity") ?? "");
  const [risk, setRisk] = useState<EntityStatus | "">("");
  const [cited, setCited] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [status, setStatus] = useState("");
  const [channel, setChannel] = useState("");
  const [query, setQuery] = useState<Filters>({ table: "invoices", entity: params.get("tx_entity") ?? undefined });

  const meta = TABLES[table];

  // Aplica los filtros con un pequeño retraso para no pedir una página por tecla.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery({
        table,
        entity: entity.trim() || undefined,
        risk: risk || undefined,
        cited: cited || undefined,
        from: from || undefined,
        to: to || undefined,
        amount_min: meta.amountField && amountMin !== "" ? Number(amountMin) : undefined,
        amount_max: meta.amountField && amountMax !== "" ? Number(amountMax) : undefined,
        status: meta.columns.includes("status") && status ? status : undefined,
        channel: table === "bank_txns" && channel ? channel : undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [table, entity, risk, cited, from, to, amountMin, amountMax, status, channel, meta]);

  const inputClass = "w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900";
  const labelClass = "mb-1 block text-xs font-medium text-zinc-600";
  const statusOptions = table === "invoices" ? ["vigente", "cancelado"] : table === "purchase_orders" ? ["aprobada", "cancelada"] : table === "bank_txns" ? ["liquidada"] : table === "contracts" ? ["vigente"] : table === "vendors" ? ["activo"] : [];

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Tabla" className="-mx-4 flex gap-1 relative overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {TABLE_ORDER.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={table === name}
            onClick={() => {
              setTable(name);
              setStatus("");
              setChannel("");
            }}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 ${
              table === name ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {TABLES[name].plural}
          </button>
        ))}
      </div>
      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
        Tabla <TableName table={table} className="text-xs" /> · {meta.description}
      </p>

      <fieldset className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-white p-3 md:grid-cols-4">
        <legend className="sr-only">Filtros</legend>
        <div className="col-span-2">
          <label htmlFor={ids.entity} className={labelClass}>Entidad (RFC, EMP o nombre)</label>
          <input id={ids.entity} type="search" value={entity} onChange={(event) => setEntity(event.target.value)} className={inputClass} placeholder="RFC:CAM190305K41, Consultores…" />
        </div>
        <div>
          <label htmlFor={ids.risk} className={labelClass}>Estado de riesgo</label>
          <select id={ids.risk} value={risk} onChange={(event) => setRisk(event.target.value as EntityStatus | "")} className={inputClass}>
            <option value="">Todos</option>
            {(["accused", "declined", "clear"] as EntityStatus[]).map((value) => (
              <option key={value} value={value}>{STATUS_LABELS[value].label}</option>
            ))}
          </select>
        </div>
        <label htmlFor={ids.cited} className="flex items-end gap-2 pb-1.5 text-sm text-zinc-700">
          <input id={ids.cited} type="checkbox" checked={cited} onChange={(event) => setCited(event.target.checked)} className="h-4 w-4 rounded border-zinc-300" />
          Solo evidencia
        </label>
        <div>
          <label htmlFor={ids.from} className={labelClass}>Desde</label>
          <input id={ids.from} type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor={ids.to} className={labelClass}>Hasta</label>
          <input id={ids.to} type="date" value={to} onChange={(event) => setTo(event.target.value)} className={inputClass} />
        </div>
        {meta.amountField && (
          <>
            <div>
              <label htmlFor={ids.min} className={labelClass}>Monto mínimo</label>
              <input id={ids.min} type="number" inputMode="decimal" min={0} value={amountMin} onChange={(event) => setAmountMin(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor={ids.max} className={labelClass}>Monto máximo</label>
              <input id={ids.max} type="number" inputMode="decimal" min={0} value={amountMax} onChange={(event) => setAmountMax(event.target.value)} className={inputClass} />
            </div>
          </>
        )}
        {statusOptions.length > 0 && (
          <div>
            <label htmlFor={ids.status} className={labelClass}>status</label>
            <select id={ids.status} value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}>
              <option value="">Todos</option>
              {statusOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        )}
        {table === "bank_txns" && (
          <div>
            <label htmlFor={ids.channel} className={labelClass}>channel</label>
            <select id={ids.channel} value={channel} onChange={(event) => setChannel(event.target.value)} className={inputClass}>
              <option value="">Todos</option>
              <option value="SPEI">SPEI</option>
              <option value="cheque">cheque</option>
              <option value="efectivo">efectivo</option>
            </select>
          </div>
        )}
        <div className="col-span-2 flex items-end md:col-span-4">
          <Button
            variant="ghost"
            onClick={() => {
              setEntity("");
              setRisk("");
              setCited(false);
              setFrom("");
              setTo("");
              setAmountMin("");
              setAmountMax("");
              setStatus("");
              setChannel("");
            }}
          >
            <Icon name="close" className="h-3.5 w-3.5" /> Limpiar filtros
          </Button>
        </div>
      </fieldset>

      <ExplorerResults key={JSON.stringify(query)} query={query} />
    </div>
  );
}
