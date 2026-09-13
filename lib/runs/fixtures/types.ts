import type {
  AgentRole,
  ApiErrorBody,
  ColumnWarning,
  Entity,
  FindingExtra,
  IgnoredFile,
  LeadNotPursued,
  Report,
  RunEvent,
  RunEventType,
  SourceTable,
  Submission,
  TableDiagnostic,
  TimelineLaneKey,
  Verdict,
} from "../types";
import type { Estate } from "./estate";

export type ScenarioId = "fraud" | "clean_with_leads" | "clean" | "partial" | "failed";

/** Evento con su momento (segundos simulados desde el inicio de la corrida). */
export type TimedEvent = {
  at: number;
  type: RunEventType;
  role: AgentRole;
  message: string;
  detail?: string;
  result?: string;
  result_status?: RunEvent["result_status"];
  entities?: string[];
  entity?: string;
  tool?: string;
  error?: ApiErrorBody;
};

export interface GraphRelation {
  from: string;
  to: string;
  label: string;
}

export interface ReportSeed {
  company_rfc: string;
  audit_period: { from: string; to: string };
  verdict: Verdict;
  headline: string;
  /** Suma de `peso_amount`, escrita a mano (el check de fixtures la verifica). */
  total_exposure: number;
  submission: Submission;
  findings_extra: FindingExtra[];
  /** Datos de entidades que no salen del estate (señales, tipo). */
  entity_details: Record<string, Pick<Entity, "signals"> & Partial<Entity>>;
  /** Campos a resaltar por exhibit. */
  highlights: Record<string, string[]>;
  method_and_limits: Report["method_and_limits"];
  relations: GraphRelation[];
  lane_notes?: { entity: string; lane: TimelineLaneKey; note: string }[];
  extra_annotations?: { date: string; entity: string; label: string }[];
}

export interface ScenarioDefinition {
  id: ScenarioId;
  label: string;
  description: string;
  filename: string;
  sha256: string;
  company_name: string;
  estate: Estate;
  /** Diagnóstico de tablas distinto de "ok con N filas". */
  table_overrides?: Partial<Record<SourceTable, Pick<TableDiagnostic, "status" | "warnings"> & Partial<Pick<TableDiagnostic, "missing">>>>;
  ignored_files?: IgnoredFile[];
  column_warnings: ColumnWarning[];
  events: TimedEvent[];
  final_counters: { llm_calls: number; mxn_cost: number };
  /** Simula una caída del SSE después de este `seq`. */
  disconnect_after_seq?: number;
  report: ReportSeed | null;
  failure?: ApiErrorBody;
}

export type { LeadNotPursued };
