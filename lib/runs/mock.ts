/**
 * Implementación falsa de `RunsApi` para desarrollo sin backend
 * (`NEXT_PUBLIC_USE_MOCKS=true`). Se carga solo desde `lib/runs/api.ts`.
 *
 * Hace el papel del backend: arma el view-model `Report` a partir de los
 * fixtures, pagina registros, agrega el grafo y simula el SSE con
 * temporizadores. Las corridas creadas se guardan en `localStorage`, así que
 * recargar `/runs/{run_id}` muestra el progreso o el resultado sin volver a
 * investigar.
 */

import type { RunsApi } from "./api";
import { formatDate } from "../format";
import { ApiError } from "./errors";
import { SCENARIOS, SCENARIO_IDS, isScenarioId, type ScenarioDefinition, type ScenarioId } from "./fixtures";
import type { Row } from "./fixtures/estate";
import { SCHEME_LABELS, STATUS_LABELS } from "./labels";
import { TABLES, TABLE_ORDER, recordKey } from "./schema";
import type {
  Entity,
  EntityListItem,
  EntityStatus,
  EntityTimeline,
  GraphData,
  GraphEdge,
  GraphNode,
  Page,
  RecordRow,
  RecordView,
  Report,
  RunEvent,
  RunState,
  RunSummary,
  SearchHit,
  SourceTable,
  TableDiagnostic,
  TimelineLane,
  ValidationResult,
} from "./types";

/** Factor de compresión del tiempo simulado (81 s de corrida ≈ 16 s reales). */
const SPEED = 5;
const VALIDATION_MS = 1800;
const RUNS_KEY = "infosys.mock.runs.v1";
const SCENARIO_KEY = "infosys.mock.scenario";
const ACCEPTED_EXTENSIONS = [".zip", ".csv", ".xlsx", ".db", ".sqlite", ".sql"];

interface MockRun {
  run_id: string;
  scenario: ScenarioId;
  filename: string;
  created_at: number;
  started_at?: number;
}

const SEEDED_RUNS: MockRun[] = [
  { run_id: "run_demo_fraud", scenario: "fraud", filename: SCENARIOS.fraud.filename, created_at: Date.parse("2026-09-12T18:04:11Z"), started_at: Date.parse("2026-09-12T18:04:14Z") },
  { run_id: "run_demo_clean_with_leads", scenario: "clean_with_leads", filename: SCENARIOS.clean_with_leads.filename, created_at: Date.parse("2026-09-11T16:20:03Z"), started_at: Date.parse("2026-09-11T16:20:09Z") },
  { run_id: "run_demo_clean", scenario: "clean", filename: SCENARIOS.clean.filename, created_at: Date.parse("2026-09-10T12:41:30Z"), started_at: Date.parse("2026-09-10T12:41:38Z") },
  { run_id: "run_demo_partial", scenario: "partial", filename: SCENARIOS.partial.filename, created_at: Date.parse("2026-09-09T09:15:00Z") },
  { run_id: "run_demo_failed", scenario: "failed", filename: SCENARIOS.failed.filename, created_at: Date.parse("2026-09-08T19:02:45Z"), started_at: Date.parse("2026-09-08T19:02:51Z") },
];

// ---------------------------------------------------------------------
// Persistencia y utilidades
// ---------------------------------------------------------------------

function readStored(): MockRun[] {
  try {
    const raw = window.localStorage.getItem(RUNS_KEY);
    return raw ? (JSON.parse(raw) as MockRun[]).filter((run) => isScenarioId(run.scenario)) : [];
  } catch {
    return [];
  }
}

function writeStored(runs: MockRun[]) {
  try {
    window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  } catch {
    // Sin almacenamiento (modo privado): las corridas nuevas duran lo que la pestaña.
  }
}

const memoryRuns: MockRun[] = [];

function allRuns(): MockRun[] {
  const stored = typeof window === "undefined" ? [] : readStored();
  const byId = new Map<string, MockRun>();
  for (const run of [...SEEDED_RUNS, ...memoryRuns, ...stored]) byId.set(run.run_id, run);
  return [...byId.values()];
}

function saveRun(run: MockRun) {
  const index = memoryRuns.findIndex((item) => item.run_id === run.run_id);
  if (index >= 0) memoryRuns[index] = run;
  else memoryRuns.push(run);
  if (SEEDED_RUNS.some((seeded) => seeded.run_id === run.run_id)) {
    const seededIndex = SEEDED_RUNS.findIndex((seeded) => seeded.run_id === run.run_id);
    SEEDED_RUNS[seededIndex] = run;
    return;
  }
  const stored = readStored().filter((item) => item.run_id !== run.run_id);
  writeStored([...stored, run]);
}

function findRun(runId: string): MockRun {
  const run = allRuns().find((item) => item.run_id === runId);
  if (!run) {
    throw new ApiError(404, { code: "run_not_found", message: `No existe la corrida ${runId}.` });
  }
  return run;
}

function delay(min = 120, max = 380) {
  return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
}

const iso = (ms: number) => new Date(ms).toISOString();
const round2 = (n: number) => Math.round(n * 100) / 100;

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ---------------------------------------------------------------------
// Índices por escenario (memoizados)
// ---------------------------------------------------------------------

interface EntityBase {
  kind: Entity["kind"];
  name: string;
  bank_clabe?: string;
  role?: string;
  is_audited_company?: boolean;
  profile?: { table: SourceTable; id: string };
}

interface ScenarioIndex {
  scenario: ScenarioDefinition;
  rows: Map<SourceTable, Map<string, Row>>;
  entities: Map<string, EntityBase>;
  status: Map<string, EntityStatus>;
  citedIn: Map<string, { finding_index: number; exhibit_id: string }[]>;
  totalRecords: number;
}

const indexCache = new Map<ScenarioId, ScenarioIndex>();

function employeeEntityId(employeeId: string) {
  return `EMP:${employeeId.replace(/^EMP-/, "")}`;
}

function indexFor(id: ScenarioId): ScenarioIndex {
  const cached = indexCache.get(id);
  if (cached) return cached;

  const scenario = SCENARIOS[id];
  const { estate } = scenario;
  const rows = new Map<SourceTable, Map<string, Row>>();
  let totalRecords = 0;
  for (const table of TABLE_ORDER) {
    const byId = new Map<string, Row>();
    for (const row of estate.tables[table]) byId.set(String(row[TABLES[table].idField]), row);
    rows.set(table, byId);
    totalRecords += estate.tables[table].length;
  }

  const entities = new Map<string, EntityBase>();
  entities.set(`RFC:${estate.company.rfc}`, {
    kind: "company",
    name: estate.company.name,
    bank_clabe: estate.company.clabe,
    is_audited_company: true,
  });
  for (const vendor of estate.tables.vendors) {
    entities.set(`RFC:${vendor.rfc}`, {
      kind: "vendor",
      name: String(vendor.legal_name),
      bank_clabe: String(vendor.bank_clabe),
      profile: { table: "vendors", id: String(vendor.rfc) },
    });
  }
  for (const employee of estate.tables.employees) {
    entities.set(employeeEntityId(String(employee.employee_id)), {
      kind: "employee",
      name: String(employee.full_name),
      role: String(employee.role),
      bank_clabe: String(employee.bank_clabe),
      profile: { table: "employees", id: String(employee.employee_id) },
    });
  }

  const status = new Map<string, EntityStatus>();
  const citedIn = new Map<string, { finding_index: number; exhibit_id: string }[]>();
  const report = scenario.report;
  if (report) {
    // Un lead cuya entidad también está en un hallazgo queda como `accused`.
    report.submission.leads_not_pursued.forEach((lead) => status.set(lead.entity, "declined"));
    report.submission.findings.forEach((finding, findingIndex) => {
      finding.entities.forEach((entity) => status.set(entity, "accused"));
      for (const exhibit of finding.exhibits) {
        const key = recordKey(exhibit.source_table, exhibit.record_id);
        citedIn.set(key, [...(citedIn.get(key) ?? []), { finding_index: findingIndex, exhibit_id: exhibit.exhibit_id }]);
      }
    });
  }

  const index = { scenario, rows, entities, status, citedIn, totalRecords };
  indexCache.set(id, index);
  return index;
}

function statusOf(index: ScenarioIndex, entityId: string): EntityStatus {
  return index.status.get(entityId) ?? "clear";
}

function entityOf(index: ScenarioIndex, entityId: string): Entity {
  const base = index.entities.get(entityId);
  const report = index.scenario.report;
  const details = report?.entity_details[entityId];
  const findingIndexes = report
    ? report.submission.findings.flatMap((finding, i) => (finding.entities.includes(entityId) ? [i] : []))
    : [];
  const leadIndex = report ? report.submission.leads_not_pursued.findIndex((lead) => lead.entity === entityId) : -1;

  return {
    kind: base?.kind ?? (entityId.startsWith("EMP:") ? "employee" : entityId.startsWith("CLABE:") ? "account" : "unknown"),
    name: base?.name ?? entityId,
    status: statusOf(index, entityId),
    ...(base?.role ? { role: base.role } : {}),
    ...(base?.bank_clabe ? { bank_clabe: base.bank_clabe } : {}),
    ...(base?.is_audited_company ? { is_audited_company: true } : {}),
    signals: details?.signals ?? [],
    finding_indexes: findingIndexes,
    lead_index: leadIndex >= 0 ? leadIndex : null,
  };
}

function rowEntity(index: ScenarioIndex, table: SourceTable, row: Row): string | null {
  const company = index.scenario.estate.company.rfc;
  switch (table) {
    case "invoices":
      return `RFC:${row.issuer_rfc === company ? row.receiver_rfc : row.issuer_rfc}`;
    case "bank_txns":
    case "ledger":
      return row.counterparty_rfc ? `RFC:${row.counterparty_rfc}` : null;
    case "purchase_orders":
    case "contracts":
      return `RFC:${row.vendor_rfc}`;
    case "vendors":
    case "efos_list":
      return `RFC:${row.rfc}`;
    case "employees":
      return employeeEntityId(String(row.employee_id));
  }
}

function relatedOf(index: ScenarioIndex, table: SourceTable, row: Row): RecordView["related"] {
  const { tables } = index.scenario.estate;
  const refs: RecordView["related"] = [];
  const add = (source_table: SourceTable, rows: Row[]) => {
    for (const item of rows) refs.push({ source_table, record_id: String(item[TABLES[source_table].idField]) });
  };
  const tokens = (text: unknown) => new Set(String(text ?? "").split(/\s+/));

  switch (table) {
    case "invoices":
      add("ledger", tables.ledger.filter((entry) => entry.source_ref === row.uuid));
      add("bank_txns", tables.bank_txns.filter((txn) => tokens(txn.reference).has(String(row.uuid))));
      break;
    case "bank_txns": {
      const refTokens = tokens(row.reference);
      add("invoices", tables.invoices.filter((invoice) => refTokens.has(String(invoice.uuid))));
      add("ledger", tables.ledger.filter((entry) => entry.source_ref === row.txn_id));
      add("purchase_orders", tables.purchase_orders.filter((po) => refTokens.has(String(po.po_id))));
      break;
    }
    case "ledger":
      add("invoices", tables.invoices.filter((invoice) => invoice.uuid === row.source_ref));
      add("bank_txns", tables.bank_txns.filter((txn) => txn.txn_id === row.source_ref));
      break;
    case "vendors":
      add("efos_list", tables.efos_list.filter((efos) => efos.rfc === row.rfc));
      add("contracts", tables.contracts.filter((contract) => contract.vendor_rfc === row.rfc));
      add("employees", tables.employees.filter((employee) => employee.bank_clabe === row.bank_clabe));
      add("vendors", tables.vendors.filter((vendor) => vendor.rfc !== row.rfc && (vendor.legal_rep === row.legal_rep || vendor.address === row.address)));
      break;
    case "efos_list":
      add("vendors", tables.vendors.filter((vendor) => vendor.rfc === row.rfc));
      break;
    case "employees":
      add("vendors", tables.vendors.filter((vendor) => vendor.bank_clabe === row.bank_clabe));
      break;
    case "purchase_orders":
      add("vendors", tables.vendors.filter((vendor) => vendor.rfc === row.vendor_rfc));
      add("contracts", tables.contracts.filter((contract) => contract.vendor_rfc === row.vendor_rfc));
      add("bank_txns", tables.bank_txns.filter((txn) => tokens(txn.reference).has(String(row.po_id))));
      break;
    case "contracts":
      add("vendors", tables.vendors.filter((vendor) => vendor.rfc === row.vendor_rfc));
      break;
  }
  return refs.slice(0, 8);
}

function recordViewOf(index: ScenarioIndex, table: SourceTable, recordId: string): RecordView | null {
  const row = index.rows.get(table)?.get(recordId);
  if (!row) return null;
  const key = recordKey(table, recordId);
  const citedIn = index.citedIn.get(key) ?? [];
  const highlights = new Set<string>();
  for (const cite of citedIn) {
    for (const field of index.scenario.report?.highlights[cite.exhibit_id] ?? []) highlights.add(field);
  }
  return {
    source_table: table,
    record_id: recordId,
    data: { ...row },
    highlight_fields: [...highlights],
    cited_in: citedIn,
    related: relatedOf(index, table, row),
  };
}

// ---------------------------------------------------------------------
// Estado de la corrida y eventos
// ---------------------------------------------------------------------

function tableDiagnostics(scenario: ScenarioDefinition): TableDiagnostic[] {
  return TABLE_ORDER.map((name) => {
    const rows = scenario.estate.tables[name].length;
    const override = scenario.table_overrides?.[name];
    if (override) return { name, rows, ...override };
    if (rows === 0) return { name, rows, status: "warning", warnings: ["Tabla vacía."] };
    return { name, rows, status: "ok", warnings: [] };
  });
}

const eventCache = new Map<string, RunEvent[]>();

function eventsFor(run: MockRun): RunEvent[] {
  if (!run.started_at) return [];
  const cacheKey = `${run.run_id}:${run.started_at}`;
  const cached = eventCache.get(cacheKey);
  if (cached) return cached;

  const index = indexFor(run.scenario);
  const { scenario } = index;
  const lastAt = scenario.events.at(-1)?.at ?? 1;
  const startedAt = run.started_at;

  const events = scenario.events.map<RunEvent>((timed, i) => {
    const fraction = timed.at / lastAt;
    const mentioned = [...new Set([...(timed.entities ?? []), ...(timed.entity ? [timed.entity] : [])])];
    const entityNames: Record<string, string> = {};
    for (const id of mentioned) entityNames[id] = index.entities.get(id)?.name ?? id;
    const { at, ...rest } = timed;
    return {
      ...rest,
      seq: i + 1,
      ts: iso(startedAt + at * 1000),
      message: timed.message.replace("{total_records}", index.totalRecords.toLocaleString("es-MX")),
      result: timed.result?.replace("{total_records}", index.totalRecords.toLocaleString("es-MX")),
      entities: mentioned,
      entity_names: entityNames,
      counters: {
        llm_calls: Math.round(scenario.final_counters.llm_calls * fraction),
        mxn_cost: round2(scenario.final_counters.mxn_cost * fraction),
        elapsed_seconds: at,
      },
      ...(timed.type === "completed"
        ? { run_id: run.run_id, report_url: `/api/v1/runs/${run.run_id}/report` }
        : {}),
    };
  });
  eventCache.set(cacheKey, events);
  return events;
}

/** Momento real (ms) en que se emite cada evento, con el tiempo comprimido. */
function dueAt(run: MockRun, event: RunEvent): number {
  const simulatedMs = Date.parse(event.ts) - (run.started_at ?? 0);
  return (run.started_at ?? 0) + simulatedMs / SPEED;
}

function stateOf(run: MockRun): RunState {
  const scenario = SCENARIOS[run.scenario];
  const now = Date.now();
  const base = { run_id: run.run_id, filename: run.filename, created_at: iso(run.created_at) };

  if (!run.started_at) {
    return { ...base, status: now - run.created_at < VALIDATION_MS ? "validating" : "ready" };
  }

  const events = eventsFor(run);
  const emitted = events.filter((event) => dueAt(run, event) <= now + 250);
  const last = emitted.at(-1);
  const terminal = last && (last.type === "completed" || last.type === "failed");
  const lastEvent = events.at(-1);

  return {
    ...base,
    status: terminal ? (last.type === "failed" ? "failed" : "completed") : "running",
    started_at: iso(run.started_at),
    ...(terminal && lastEvent ? { finished_at: lastEvent.ts } : {}),
    ...(terminal && last.type === "failed" && scenario.failure ? { error: scenario.failure } : {}),
    last_seq: last?.seq ?? 0,
    counters: last?.counters ?? { llm_calls: 0, mxn_cost: 0, elapsed_seconds: 0 },
  };
}

function requireCompleted(run: MockRun) {
  const state = stateOf(run);
  const scenario = SCENARIOS[run.scenario];
  if (state.status !== "completed" || !scenario.report) {
    throw new ApiError(409, {
      code: "run_not_completed",
      message: "La corrida todavía no tiene reporte.",
      details: { status: state.status },
    });
  }
  return { state, scenario, report: scenario.report, index: indexFor(run.scenario) };
}

// ---------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------

function buildReport(run: MockRun): Report {
  const { state, scenario, report: seed, index } = requireCompleted(run);
  const { submission } = seed;

  const ids = new Set<string>([seed.company_rfc]);
  for (const finding of submission.findings) {
    finding.entities.forEach((id) => ids.add(id));
    finding.money_trail?.forEach((step) => {
      ids.add(step.from);
      ids.add(step.to);
    });
  }
  submission.leads_not_pursued.forEach((lead) => ids.add(lead.entity));
  seed.relations.forEach((relation) => {
    ids.add(relation.from);
    ids.add(relation.to);
  });

  const entities: Record<string, Entity> = {};
  for (const id of ids) entities[id] = entityOf(index, id);

  const records: Record<string, RecordView> = {};
  for (const finding of submission.findings) {
    for (const exhibit of finding.exhibits) {
      const view = recordViewOf(index, exhibit.source_table, exhibit.record_id);
      if (!view) continue;
      records[recordKey(exhibit.source_table, exhibit.record_id)] = view;
      for (const related of view.related) {
        const key = recordKey(related.source_table, related.record_id);
        if (records[key]) continue;
        const relatedView = recordViewOf(index, related.source_table, related.record_id);
        if (relatedView) records[key] = relatedView;
      }
    }
  }

  const population = scenario.estate.tables.vendors.length + scenario.estate.tables.employees.length;
  const accused = [...index.status.values()].filter((status) => status === "accused").length;
  const declined = [...index.status.values()].filter((status) => status === "declined").length;

  return {
    run: {
      run_id: run.run_id,
      status: "completed",
      created_at: state.created_at,
      finished_at: state.finished_at,
      dataset: { filename: run.filename, sha256: scenario.sha256, tables: tableDiagnostics(scenario) },
    },
    case_header: {
      company_name: scenario.company_name,
      company_rfc: seed.company_rfc,
      audit_period: seed.audit_period,
    },
    summary: {
      verdict: seed.verdict,
      headline: seed.headline,
      findings_count: submission.findings.length,
      findings_by_confidence: {
        proven: submission.findings.filter((finding) => finding.confidence === "proven").length,
        probable: submission.findings.filter((finding) => finding.confidence === "probable").length,
      },
      total_exposure: seed.total_exposure,
      leads_closed_count: submission.leads_not_pursued.length,
      entities_by_status: { accused, declined, clear: population - accused - declined },
    },
    submission,
    findings_extra: seed.findings_extra,
    entities,
    records,
    method_and_limits: seed.method_and_limits,
  };
}

// ---------------------------------------------------------------------
// Grafo y timeline
// ---------------------------------------------------------------------

function buildGraph(run: MockRun, scope: "flagged" | "all"): GraphData {
  const { index, report: seed } = requireCompleted(run);
  const { estate } = index.scenario;
  const companyId = seed.company_rfc;
  const flagged = [...index.status.keys()];

  const nodeIds = new Set<string>([companyId, ...flagged]);
  if (scope === "all") estate.tables.vendors.forEach((vendor) => nodeIds.add(`RFC:${vendor.rfc}`));

  const trailPairs = new Map<string, number[]>();
  const cyclePairs = new Set<string>();
  seed.submission.findings.forEach((finding, findingIndex) => {
    for (const step of finding.money_trail ?? []) {
      const pair = `${step.from}>${step.to}`;
      trailPairs.set(pair, [...new Set([...(trailPairs.get(pair) ?? []), findingIndex])]);
      if (finding.scheme_type === "round_tripping") cyclePairs.add(pair);
    }
  });

  const edges = new Map<string, GraphEdge>();
  const addEdge = (from: string, to: string, amount: number | null, kind: GraphEdge["kind"], label?: string) => {
    const pair = `${from}>${to}`;
    const id = `${kind}:${pair}`;
    const existing = edges.get(id);
    if (existing) {
      existing.count += 1;
      if (amount !== null) existing.amount = round2((existing.amount ?? 0) + amount);
      return;
    }
    edges.set(id, {
      id, from, to, amount, count: 1, kind, label,
      in_cycle: cyclePairs.has(pair),
      finding_indexes: trailPairs.get(pair) ?? [],
    });
  };

  for (const txn of estate.tables.bank_txns) {
    const counterparty = `RFC:${txn.counterparty_rfc}`;
    if (!nodeIds.has(counterparty)) continue;
    if (txn.direction === "salida") addEdge(companyId, counterparty, Number(txn.amount), "payment");
    else addEdge(counterparty, companyId, Number(txn.amount), "payment");
  }
  for (const relation of seed.relations) {
    if (nodeIds.has(relation.from) && nodeIds.has(relation.to)) {
      addEdge(relation.from, relation.to, null, "relation", relation.label);
    }
  }
  for (const id of nodeIds) {
    if (id.startsWith("EMP:")) addEdge(companyId, id, null, "relation", "Empleado");
  }

  const nodes: GraphNode[] = [...nodeIds].map((id) => {
    const entity = entityOf(index, id);
    return { id, kind: entity.kind, name: entity.name, status: entity.status, finding_indexes: entity.finding_indexes, lead_index: entity.lead_index };
  });

  const population = estate.tables.vendors.length + estate.tables.employees.length + 1;
  return { scope, nodes, edges: [...edges.values()], hidden_count: Math.max(0, population - nodes.length) };
}

function buildTimeline(run: MockRun, entityId: string): EntityTimeline {
  const { index, report: seed } = requireCompleted(run);
  const { estate } = index.scenario;
  const base = index.entities.get(entityId);
  if (!base) throw new ApiError(404, { code: "entity_not_found", message: `No existe la entidad ${entityId}.` });

  const { tables, period } = estate;
  const inRange = (date: string) => date >= period.from && date <= period.to;
  const lanes: TimelineLane[] = [];
  const notes = new Map((seed.lane_notes ?? []).filter((note) => note.entity === entityId).map((note) => [note.lane, note.note]));
  const lane = (key: TimelineLane["key"], label: string, events: TimelineLane["events"], emptyNote?: string) => {
    const note = notes.get(key) ?? (events.length === 0 ? emptyNote : undefined);
    lanes.push({ key, label, events: events.filter((event) => inRange(event.date)), ...(note ? { note } : {}) });
  };

  let invoiced = 0;
  let paid = 0;
  let received = 0;

  if (base.kind === "vendor" || base.kind === "company") {
    const rfc = entityId.replace(/^RFC:/, "");
    const isCompany = base.kind === "company";
    const contracts = isCompany ? [] : tables.contracts.filter((row) => row.vendor_rfc === rfc);
    const orders = isCompany ? [] : tables.purchase_orders.filter((row) => row.vendor_rfc === rfc);
    const invoices = isCompany ? [] : tables.invoices.filter((row) => row.issuer_rfc === rfc || row.receiver_rfc === rfc);
    const txns = isCompany ? tables.bank_txns : tables.bank_txns.filter((row) => row.counterparty_rfc === rfc);

    if (!isCompany) {
      lane("contracts", "Contratos", contracts.map((row) => ({ date: String(row.start_date), amount: Number(row.value), label: `Contrato ${row.contract_id}`, record: { source_table: "contracts" as const, record_id: String(row.contract_id) } })), "sin contrato");
      lane("purchase_orders", "OC", orders.map((row) => ({ date: String(row.po_date), amount: Number(row.amount), label: `${row.po_id} · ${row.status}`, record: { source_table: "purchase_orders" as const, record_id: String(row.po_id) } })), "sin orden de compra");
    }
    lane("invoices", "Facturas", invoices.map((row) => ({ date: String(row.issue_date), amount: Number(row.total), label: `${row.uuid}${row.issuer_rfc === estate.company.rfc ? " · venta" : ""}`, record: { source_table: "invoices" as const, record_id: String(row.uuid) } })));
    lane("bank_txns", "Pagos", txns.map((row) => ({ date: String(row.txn_date), amount: Number(row.amount), label: `${row.txn_id} · ${row.direction}`, record: { source_table: "bank_txns" as const, record_id: String(row.txn_id) } })));

    const registration: TimelineLane["events"] = [];
    const vendorRow = tables.vendors.find((row) => row.rfc === rfc);
    const efosRow = tables.efos_list.find((row) => row.rfc === rfc);
    const outside: string[] = [];
    if (vendorRow) {
      const date = String(vendorRow.registered_at);
      if (inRange(date)) registration.push({ date, amount: null, label: "Alta como proveedor", record: { source_table: "vendors", record_id: rfc } });
      else outside.push(`alta el ${formatDate(date)}`);
    }
    if (efosRow) {
      const date = String(efosRow.dof_date);
      if (inRange(date)) registration.push({ date, amount: null, label: `Lista 69-B: ${efosRow.efos_status}`, record: { source_table: "efos_list", record_id: rfc } });
      else outside.push(`69-B ${efosRow.efos_status} desde ${formatDate(date)}`);
    }
    if (!isCompany) {
      lanes.push({ key: "registration", label: "Registro RFC", events: registration, ...(outside.length ? { note: `${outside.join(" · ")} (antes del periodo)` } : {}) });
    }

    invoiced = round2(invoices.filter((row) => row.issuer_rfc === rfc && row.status === "vigente").reduce((sum, row) => sum + Number(row.total), 0));
    paid = round2(txns.filter((row) => row.direction === "salida").reduce((sum, row) => sum + Number(row.amount), 0));
    received = round2(txns.filter((row) => row.direction === "entrada").reduce((sum, row) => sum + Number(row.amount), 0));
  } else if (base.kind === "employee") {
    const employeeId = `EMP-${entityId.replace(/^EMP:/, "")}`;
    const orders = tables.purchase_orders.filter((row) => row.approved_by === employeeId);
    const txns = tables.bank_txns.filter((row) => row.beneficiary_clabe === base.bank_clabe || row.origin_clabe === base.bank_clabe);
    lane("purchase_orders", "OC aprobadas", orders.map((row) => ({ date: String(row.po_date), amount: Number(row.amount), label: `${row.po_id} · ${row.status}`, record: { source_table: "purchase_orders" as const, record_id: String(row.po_id) } })), "no aprobó órdenes");
    lane("bank_txns", "Pagos a su CLABE", txns.map((row) => ({ date: String(row.txn_date), amount: Number(row.amount), label: `${row.txn_id} · ${row.direction}`, record: { source_table: "bank_txns" as const, record_id: String(row.txn_id) } })), "sin movimientos a su cuenta");
    const employeeRow = tables.employees.find((row) => row.employee_id === employeeId);
    const hire = String(employeeRow?.hire_date ?? "");
    lanes.push({
      key: "registration",
      label: "Registro",
      events: inRange(hire) ? [{ date: hire, amount: null, label: "Ingreso", record: { source_table: "employees", record_id: employeeId } }] : [],
      ...(hire && !inRange(hire) ? { note: `ingresó el ${formatDate(hire)} (antes del periodo)` } : {}),
    });
    paid = round2(txns.filter((row) => row.beneficiary_clabe === base.bank_clabe).reduce((sum, row) => sum + Number(row.amount), 0));
  }

  const annotations = [
    ...seed.findings_extra.flatMap((extra) => extra.timeline_annotations),
    ...(seed.extra_annotations ?? []),
  ].filter((annotation) => annotation.entity === entityId);

  return {
    entity_id: entityId,
    entity: entityOf(index, entityId),
    range: period,
    lanes,
    annotations,
    ...(base.profile ? { profile: recordViewOf(index, base.profile.table, base.profile.id) ?? undefined } : {}),
    totals: { invoiced, paid, received },
  };
}

// ---------------------------------------------------------------------
// API
// ---------------------------------------------------------------------

function scenarioFromFilename(filename: string): ScenarioId | null {
  const name = filename.toLowerCase();
  // `clean_with_leads` antes que `clean`.
  const ordered: ScenarioId[] = ["clean_with_leads", "fraud", "partial", "failed", "clean"];
  return ordered.find((id) => name.includes(id)) ?? null;
}

export function listScenarios() {
  return SCENARIO_IDS.map((id) => ({ id, label: SCENARIOS[id].label, description: SCENARIOS[id].description }));
}

export function getSelectedScenario(): ScenarioId {
  try {
    const stored = window.localStorage.getItem(SCENARIO_KEY);
    if (stored && isScenarioId(stored)) return stored;
  } catch {
    // Sin almacenamiento: escenario por defecto.
  }
  return "fraud";
}

export function setSelectedScenario(id: string) {
  if (!isScenarioId(id)) return;
  try {
    window.localStorage.setItem(SCENARIO_KEY, id);
  } catch {
    // Ignorado: sin almacenamiento se usa el escenario por defecto.
  }
}

export const mockApi: RunsApi = {
  async createRun(files) {
    await delay(400, 900);
    if (files.length === 0) {
      throw new ApiError(422, { code: "no_files", message: "No se recibió ningún archivo." });
    }
    const filename = files.length === 1 ? files[0].name : `${files.length} archivos CSV`;
    const unsupported = files.find((file) => !ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)));
    if (unsupported) {
      throw new ApiError(415, {
        code: "unsupported_format",
        message: `El formato de ${unsupported.name} no está soportado.`,
        details: { accepted: ACCEPTED_EXTENSIONS },
      });
    }
    if (files.some((file) => file.name.toLowerCase().includes("corrupto"))) {
      throw new ApiError(422, {
        code: "unreadable_file",
        message: "No se pudo leer el archivo: el ZIP está dañado o no contiene tablas reconocibles.",
      });
    }
    const scenario = files.map((file) => scenarioFromFilename(file.name)).find(Boolean) ?? getSelectedScenario();
    const run: MockRun = {
      run_id: `run_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      scenario,
      filename,
      created_at: Date.now(),
    };
    saveRun(run);
    return { run_id: run.run_id, status: "validating" };
  },

  async getValidation(runId): Promise<ValidationResult> {
    await delay();
    const run = findRun(runId);
    const scenario = SCENARIOS[run.scenario];
    const state = stateOf(run);
    const validating = state.status === "validating";
    return {
      run_id: runId,
      status: state.status,
      filename: run.filename,
      tables: validating ? [] : tableDiagnostics(scenario),
      column_warnings: validating ? [] : scenario.column_warnings,
    };
  },

  async startRun(runId) {
    await delay();
    const run = findRun(runId);
    const state = stateOf(run);
    const scenario = SCENARIOS[run.scenario];
    if (state.status !== "ready" && state.status !== "failed") {
      throw new ApiError(409, { code: "invalid_state", message: `No se puede iniciar una corrida en estado ${state.status}.` });
    }
    if (tableDiagnostics(scenario).some((table) => table.status === "error") || scenario.events.length === 0) {
      throw new ApiError(409, {
        code: "validation_blocked",
        message: "El diagnóstico tiene errores bloqueantes; corrige el dataset y vuelve a subirlo.",
      });
    }
    const updated = { ...run, started_at: Date.now() };
    saveRun(updated);
    return stateOf(updated);
  },

  subscribeToRunEvents(runId, lastSeq, handlers) {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let run: MockRun;
    try {
      run = findRun(runId);
    } catch {
      return () => undefined;
    }
    const scenario = SCENARIOS[run.scenario];
    const now = Date.now();
    timers.push(setTimeout(() => handlers.onConnectionChange?.("open"), 0));

    for (const event of eventsFor(run)) {
      if (event.seq <= lastSeq) continue;
      const wait = Math.max(0, dueAt(run, event) - now);
      const live = wait > 0;
      timers.push(
        setTimeout(() => {
          if (live && scenario.disconnect_after_seq && event.seq === scenario.disconnect_after_seq + 1) {
            handlers.onConnectionChange?.("open");
          }
          handlers.onEvent(event);
          if (live && event.seq === scenario.disconnect_after_seq) {
            handlers.onConnectionChange?.("reconnecting");
          }
        }, wait),
      );
    }
    return () => timers.forEach(clearTimeout);
  },

  async getRun(runId) {
    await delay(60, 160);
    return stateOf(findRun(runId));
  },

  async getReport(runId) {
    await delay(300, 700);
    return buildReport(findRun(runId));
  },

  async getRecords(runId, query): Promise<Page<RecordRow>> {
    await delay(150, 400);
    const run = findRun(runId);
    const index = indexFor(run.scenario);
    const meta = TABLES[query.table];
    const entityQuery = query.entity ? normalize(query.entity.trim()) : "";

    const rows = index.scenario.estate.tables[query.table]
      .map((row) => {
        const recordId = String(row[meta.idField]);
        const entity = rowEntity(index, query.table, row);
        const known = entity ? index.entities.has(entity) || index.status.has(entity) : false;
        return { row, recordId, entity, risk: entity && known ? statusOf(index, entity) : null };
      })
      .filter(({ row, recordId, entity, risk }) => {
        const date = String(row[meta.dateField] ?? "");
        const amount = meta.amountField ? Number(row[meta.amountField]) : null;
        if (entityQuery) {
          const name = entity ? normalize(index.entities.get(entity)?.name ?? "") : "";
          if (!entity || (!normalize(entity).includes(entityQuery) && !name.includes(entityQuery))) return false;
        }
        if (query.risk && risk !== query.risk) return false;
        if (query.cited && !index.citedIn.has(recordKey(query.table, recordId))) return false;
        if (query.from && date < query.from) return false;
        if (query.to && date > query.to) return false;
        if (query.amount_min !== undefined && (amount === null || amount < query.amount_min)) return false;
        if (query.amount_max !== undefined && (amount === null || amount > query.amount_max)) return false;
        if (query.status && row.status !== query.status) return false;
        if (query.channel && row.channel !== query.channel) return false;
        return true;
      })
      .sort((a, b) => String(a.row[meta.dateField]).localeCompare(String(b.row[meta.dateField])) || a.recordId.localeCompare(b.recordId));

    const offset = Number(query.cursor ?? 0) || 0;
    const limit = query.limit ?? 50;
    const page = rows.slice(offset, offset + limit);
    return {
      items: page.map(({ recordId, entity, risk }) => ({
        ...(recordViewOf(index, query.table, recordId) as RecordView),
        entity,
        risk,
      })),
      next_cursor: offset + limit < rows.length ? String(offset + limit) : null,
      total: rows.length,
    };
  },

  async getRecord(runId, table, recordId) {
    await delay();
    const index = indexFor(findRun(runId).scenario);
    const view = recordViewOf(index, table, recordId);
    if (!view) {
      throw new ApiError(404, { code: "record_not_found", message: `No existe ${table}/${recordId}.` });
    }
    return view;
  },

  async getEntities(runId, query): Promise<Page<EntityListItem>> {
    await delay();
    const run = findRun(runId);
    const index = indexFor(run.scenario);
    const order: Record<EntityStatus, number> = { accused: 0, declined: 1, clear: 2 };
    const items = [...index.entities.keys()]
      .filter((id) => !index.entities.get(id)?.is_audited_company)
      .map((id) => ({ id, ...entityOf(index, id) }))
      .filter((entity) => !query.status || entity.status === query.status)
      .sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name, "es"));
    const offset = Number(query.cursor ?? 0) || 0;
    const limit = query.limit ?? 50;
    return {
      items: items.slice(offset, offset + limit),
      next_cursor: offset + limit < items.length ? String(offset + limit) : null,
      total: items.length,
    };
  },

  async getGraph(runId, scope) {
    await delay(200, 500);
    return buildGraph(findRun(runId), scope);
  },

  async getEntityTimeline(runId, entityId) {
    await delay(200, 450);
    return buildTimeline(findRun(runId), entityId);
  },

  async getLog(runId, query = {}) {
    await delay();
    const run = findRun(runId);
    const now = Date.now();
    return eventsFor(run)
      .filter((event) => dueAt(run, event) <= now + 250)
      .filter((event) => !query.role || event.role === query.role)
      .filter((event) => !query.entity || event.entities?.includes(query.entity) || event.entity === query.entity);
  },

  async search(runId, q) {
    await delay(80, 180);
    const query = normalize(q.trim());
    const run = findRun(runId);
    if (!query) return { query: q, hits: [] };
    const { index, report: seed } = requireCompleted(run);
    const events = eventsFor(run);
    const { findings, leads_not_pursued: leads } = seed.submission;

    const entityHits: SearchHit[] = [...index.entities.keys()]
      .filter((id) => normalize(id).includes(query) || normalize(index.entities.get(id)?.name ?? "").includes(query))
      .map((id) => {
        const entity = entityOf(index, id);
        const lead = entity.lead_index !== null ? leads[entity.lead_index] : undefined;
        const exhibitLocations = findings.flatMap((finding, findingIndex) =>
          finding.exhibits
            .filter((exhibit) => {
              const row = index.rows.get(exhibit.source_table)?.get(exhibit.record_id);
              return row ? rowEntity(index, exhibit.source_table, row) === id : false;
            })
            .map((exhibit) => ({
              kind: "exhibit" as const,
              finding_index: findingIndex,
              exhibit_id: exhibit.exhibit_id,
              label: `${exhibit.exhibit_id} · ${TABLES[exhibit.source_table].label} ${exhibit.record_id}`,
            })),
        );
        return {
          kind: "entity" as const,
          id,
          title: entity.name,
          subtitle: `${id} · ${STATUS_LABELS[entity.status].label}`,
          status: entity.status,
          appears_in: [
            ...entity.finding_indexes.map((i) => ({ kind: "finding" as const, finding_index: i, label: `Hallazgo #${i + 1} · ${SCHEME_LABELS[findings[i].scheme_type].label}` })),
            ...(entity.lead_index !== null ? [{ kind: "lead" as const, lead_index: entity.lead_index, label: `Lead descartado · ${lead?.signal ?? ""}` }] : []),
            ...exhibitLocations,
          ],
          ...(lead ? { lead_reason: lead.reason, closed_by: lead.closed_by } : {}),
          log: events.filter((event) => event.entities?.includes(id)).slice(0, 5),
        };
      })
      .sort((a, b) => (a.status === "clear" ? 1 : 0) - (b.status === "clear" ? 1 : 0))
      .slice(0, 8);

    const exhibitHits: SearchHit[] = findings.flatMap((finding, findingIndex) =>
      finding.exhibits
        .filter((exhibit) => normalize(exhibit.exhibit_id).includes(query) || normalize(exhibit.record_id).includes(query))
        .map((exhibit) => {
          const row = index.rows.get(exhibit.source_table)?.get(exhibit.record_id);
          const entity = row ? rowEntity(index, exhibit.source_table, row) : null;
          return {
            kind: "exhibit" as const,
            id: exhibit.exhibit_id,
            title: `${exhibit.exhibit_id} · ${TABLES[exhibit.source_table].label} ${exhibit.record_id}`,
            subtitle: exhibit.note,
            status: entity ? statusOf(index, entity) : null,
            appears_in: [{ kind: "exhibit" as const, finding_index: findingIndex, exhibit_id: exhibit.exhibit_id, label: `Hallazgo #${findingIndex + 1} · ${SCHEME_LABELS[finding.scheme_type].label}` }],
            log: [],
          };
        }),
    );

    return { query: q, hits: [...exhibitHits, ...entityHits] };
  },

  getExportUrl() {
    return null;
  },

  async listRuns(): Promise<RunSummary[]> {
    await delay();
    return allRuns()
      .sort((a, b) => b.created_at - a.created_at)
      .map((run) => {
        const state = stateOf(run);
        const scenario = SCENARIOS[run.scenario];
        const completed = state.status === "completed" && scenario.report;
        return {
          run_id: run.run_id,
          status: state.status,
          filename: run.filename,
          created_at: state.created_at,
          ...(state.finished_at ? { finished_at: state.finished_at } : {}),
          company_name: scenario.company_name,
          ...(completed && scenario.report
            ? {
                verdict: scenario.report.verdict,
                findings_count: scenario.report.submission.findings.length,
                total_exposure: scenario.report.total_exposure,
              }
            : {}),
        };
      });
  },
};
