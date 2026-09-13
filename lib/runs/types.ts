// Tipos del reporte de investigación.
//
// La primera parte está copiada tal cual de EXAMPLE.md §10 (contrato oficial +
// view-model propuesto). La segunda parte ("Extensiones del frontend") define
// las respuestas implementadas por los endpoints de §9.

// ---------- Contrato oficial (submission_schema.json) ----------
export type SchemeType =
  | 'phantom_vendor' | 'kickback' | 'round_tripping'
  | 'threshold_splitting' | 'revenue_inflation';

export type SourceTable =
  | 'ledger' | 'invoices' | 'bank_txns' | 'vendors'
  | 'efos_list' | 'purchase_orders' | 'contracts' | 'employees';

export type Confidence = 'proven' | 'probable';
export type ClosedBy = 'investigator' | 'challenger' | 'validator';

export interface MoneyTrailStep {
  from: string; to: string; amount: number; date: string; exhibit_id: string;
}

export interface Exhibit {
  exhibit_id: string; source_table: SourceTable; record_id: string; note: string;
}

export interface Finding {
  scheme_type: SchemeType;
  entities: string[];            // "RFC:…" | "EMP:…"
  narrative: string;             // ≤150 palabras
  rule_broken: string;
  peso_amount: number;
  confidence: Confidence;
  money_trail?: MoneyTrailStep[];
  exhibits: Exhibit[];           // ≥3
}

export interface LeadNotPursued {
  entity: string; signal: string; reason: string;
  tool_calls_made?: string[]; closed_by?: ClosedBy;
}

export interface RunMetadata {
  llm_calls: number; mxn_cost: number; wall_clock_seconds: number;
  cost_by_role?: Record<string, number>; deterministic?: boolean;
}

export interface Submission {
  seed: number; findings: Finding[];
  leads_not_pursued: LeadNotPursued[]; run_metadata: RunMetadata;
}

// ---------- View-model propuesto ----------
export type EntityStatus = 'accused' | 'declined' | 'clear';
export type EntityKind = 'company' | 'vendor' | 'employee' | 'account' | 'unknown';
export type Verdict = 'fraud_proven' | 'fraud_probable' | 'clean_with_leads' | 'clean';
export type RunStatus = 'validating' | 'ready' | 'running' | 'completed' | 'failed';

export interface IgnoredFile {
  filename: string;
  reason: string;
}

export interface TableDiagnostic {
  name: SourceTable; rows: number; status: 'ok' | 'warning' | 'error'; warnings: string[];
  source_file: string | null;
  missing: boolean;
}

export interface Entity {
  kind: EntityKind; name: string; status: EntityStatus;
  role?: string; bank_clabe?: string; is_audited_company?: boolean;
  signals: string[]; finding_indexes: number[]; lead_index: number | null;
}

export interface Reconciliation {
  table_used: SourceTable;
  lines: { exhibit_id: string; record_id: string; amount: number }[];
  sum: number; claimed: number; diff: number; diff_pct: number; within_tolerance: boolean;
  other_tables: { table: SourceTable; sum: number; exhibit_ids: string[] }[];
}

export interface FindingExtra {
  finding_index: number;
  reconciliation: Reconciliation;
  adversarial_review?: { argument: string; rebuttal: string; outcome: 'survived' | 'downgraded' };
  shared_entities: { entity: string; other_finding_index: number }[];
  timeline_annotations: { date: string; entity: string; label: string }[];
}

export interface RecordView {
  source_table: SourceTable; record_id: string;
  data: Record<string, string | number | null>;
  highlight_fields: string[];
  cited_in: { finding_index: number; exhibit_id: string }[];
  related: { source_table: SourceTable; record_id: string }[];
}

export interface Report {
  run: {
    run_id: string; status: RunStatus; created_at: string; finished_at?: string;
    dataset: { filename: string; sha256: string; tables: TableDiagnostic[] };
  };
  case_header: { company_name: string; company_rfc: string; audit_period: { from: string; to: string } };
  summary: {
    verdict: Verdict; headline: string;
    findings_count: number; findings_by_confidence: Record<Confidence, number>;
    total_exposure: number; leads_closed_count: number;
    entities_by_status: Record<EntityStatus, number>;
  };
  submission: Submission;
  findings_extra: FindingExtra[];
  entities: Record<string, Entity>;
  records: Record<string, RecordView>;   // llave: "invoices:<uuid>"
  method_and_limits: {
    architecture: string; out_of_scope: string[]; cannot_detect: string[];
    reproduce: { seed: number; version: string; dataset_sha256: string; command: string };
  };
}

// =====================================================================
// Extensiones del frontend: respuestas implementadas para §9.
// =====================================================================

/** Sobre de error del backend: `{ error: { code, message, details } }`. */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/** `POST /runs` → 201. */
export interface CreateRunResponse {
  run_id: string;
  status: RunStatus;
}

/** Advertencia de columna del diagnóstico (§4.3). */
export interface ColumnWarning {
  table: SourceTable;
  column: string;
  message: string;
}

/** `GET /runs/{run_id}/validation`. */
export interface ValidationResult {
  run_id: string;
  status: RunStatus;
  filename: string;
  format: 'zip' | 'csv';
  sha256: string;
  tables: TableDiagnostic[];
  column_warnings: ColumnWarning[];
  ignored_files: IgnoredFile[];
}

/** Contadores en vivo de una corrida. */
export interface RunCounters {
  llm_calls: number;
  mxn_cost: number;
  elapsed_seconds: number;
}

/** `GET /runs/{run_id}`. */
export interface RunState {
  run_id: string;
  status: RunStatus;
  filename: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  /** Presente cuando `status === "failed"`. */
  error?: ApiErrorBody;
  /** Último `seq` emitido, para reanudar el SSE. */
  last_seq?: number;
  counters?: RunCounters;
}

/** Elemento de `GET /runs` (historial). */
export interface RunSummary {
  run_id: string;
  status: RunStatus;
  filename: string;
  created_at: string;
  finished_at?: string;
  company_name?: string;
  verdict?: Verdict;
  findings_count?: number;
  total_exposure?: number;
}

export type RunEventType =
  | 'step' | 'detector_result' | 'finding_draft' | 'challenge' | 'validation'
  | 'lead_closed' | 'warning' | 'completed' | 'failed';

export type AgentRole = 'system' | 'detector' | 'investigator' | 'challenger' | 'validator';

/** Evento SSE de §9.1 (también es cada línea del log). */
export interface RunEvent {
  seq: number;
  ts: string;
  type: RunEventType;
  role: AgentRole;
  kind?: string;
  message: string;
  /** Línea secundaria ("└ encontró 4 transferencias…"). */
  detail?: string;
  /** Resultado corto a la derecha ("8 tablas, 10,016 registros"). */
  result?: string;
  result_status?: 'ok' | 'warning' | 'pending' | 'error';
  entities?: string[];
  /** Nombre legible de cada entidad mencionada, para el tooltip del chip. */
  entity_names?: Record<string, string>;
  entity?: string;
  tool?: string;
  counters?: RunCounters;
  run_id?: string;
  report_url?: string;
  error?: ApiErrorBody;
}

/** Página genérica con cursor opaco. */
export interface Page<T> {
  items: T[];
  next_cursor: string | null;
  total: number;
}

/** Fila del explorador: registro + riesgo de la entidad relacionada (lo calcula el backend). */
export interface RecordRow extends RecordView {
  entity: string | null;
  risk: EntityStatus | null;
}

export interface RecordsQuery {
  table: SourceTable;
  entity?: string;
  risk?: EntityStatus;
  cited?: boolean;
  from?: string;
  to?: string;
  amount_min?: number;
  amount_max?: number;
  status?: string;
  channel?: string;
  limit?: number;
  cursor?: string | null;
}

export interface EntitiesQuery {
  status?: EntityStatus;
  limit?: number;
  cursor?: string | null;
}

export type EntityListItem = Entity & { id: string };

export interface GraphNode {
  id: string;
  kind: EntityKind;
  name: string;
  status: EntityStatus;
  finding_indexes: number[];
  lead_index: number | null;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  /** Monto agregado en MXN; `null` para relaciones sin dinero (CLABE compartida, mismo representante). */
  amount: number | null;
  count: number;
  kind: 'payment' | 'invoice' | 'relation';
  label?: string;
  /** Parte de un ciclo detectado (round-tripping). */
  in_cycle: boolean;
  finding_indexes: number[];
}

export interface GraphData {
  scope: 'flagged' | 'all';
  nodes: GraphNode[];
  edges: GraphEdge[];
  hidden_count: number;
}

export type TimelineLaneKey =
  | 'contracts' | 'purchase_orders' | 'invoices' | 'bank_txns' | 'registration';

export interface TimelineEvent {
  date: string;
  amount: number | null;
  label: string;
  record: { source_table: SourceTable; record_id: string };
}

export interface TimelineLane {
  key: TimelineLaneKey;
  label: string;
  events: TimelineEvent[];
  /** Nota del backend para el carril ("sin contrato", "límite $50,000"). */
  note?: string;
}

export interface EntityTimeline {
  entity_id: string;
  entity: Entity;
  range: { from: string; to: string };
  lanes: TimelineLane[];
  annotations: { date: string; entity: string; label: string }[];
  /** Registro de `vendors` o `employees` de la entidad. */
  profile?: RecordView;
  totals: { invoiced: number; paid: number; received: number };
}

export interface LogQuery {
  role?: AgentRole;
  entity?: string;
}

export interface SearchLocation {
  kind: 'finding' | 'lead' | 'exhibit';
  finding_index?: number;
  lead_index?: number;
  exhibit_id?: string;
  label: string;
}

export interface SearchHit {
  kind: 'entity' | 'exhibit';
  id: string;
  title: string;
  subtitle: string;
  status: EntityStatus | null;
  appears_in: SearchLocation[];
  lead_reason?: string;
  closed_by?: ClosedBy;
  log: RunEvent[];
}

export interface SearchResponse {
  query: string;
  hits: SearchHit[];
}

export type ExportFormat = 'html' | 'md' | 'submission';

export interface SubscribeHandlers {
  onEvent: (event: RunEvent) => void;
  onConnectionChange?: (state: 'open' | 'reconnecting') => void;
}
