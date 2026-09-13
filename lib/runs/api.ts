/**
 * Capa de datos de las corridas de investigación (EXAMPLE.md §9).
 *
 * Habla con el backend FastAPI igual que `lib/auth.ts`: cookie de sesión
 * (`credentials: "include"`) y el sobre de error
 * `{ error: { code, message, details } }`.
 *
 * Con `NEXT_PUBLIC_USE_MOCKS=true` todas las funciones delegan en
 * `./mock` (cargado de forma diferida para no incluir los fixtures en el
 * bundle de producción). Ningún componente debe importar `./mock` ni los
 * fixtures directamente: todo pasa por este módulo.
 */

import { ApiError } from "./errors";
import type {
  ApiErrorBody,
  CreateRunResponse,
  EntitiesQuery,
  EntityListItem,
  EntityTimeline,
  ExportFormat,
  GraphData,
  LogQuery,
  Page,
  RecordRow,
  RecordView,
  RecordsQuery,
  Report,
  RunEvent,
  RunEventType,
  RunState,
  RunSummary,
  SearchResponse,
  SourceTable,
  SubscribeHandlers,
  ValidationResult,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const GENERIC_ERROR = "Algo salió mal. Intenta de nuevo.";

export { ApiError, isNotAuthenticated, isNotFound } from "./errors";

/** Contrato común de la implementación real y del mock. */
export interface RunsApi {
  createRun(files: File[]): Promise<CreateRunResponse>;
  getValidation(runId: string): Promise<ValidationResult>;
  startRun(runId: string): Promise<RunState>;
  subscribeToRunEvents(
    runId: string,
    lastSeq: number,
    handlers: SubscribeHandlers,
  ): () => void;
  getRun(runId: string): Promise<RunState>;
  getReport(runId: string): Promise<Report>;
  getRecords(runId: string, query: RecordsQuery): Promise<Page<RecordRow>>;
  getRecord(
    runId: string,
    table: SourceTable,
    recordId: string,
  ): Promise<RecordView>;
  getEntities(
    runId: string,
    query: EntitiesQuery,
  ): Promise<Page<EntityListItem>>;
  getGraph(runId: string, scope: "flagged" | "all"): Promise<GraphData>;
  getEntityTimeline(runId: string, entityId: string): Promise<EntityTimeline>;
  getLog(runId: string, query?: LogQuery): Promise<RunEvent[]>;
  search(runId: string, q: string): Promise<SearchResponse>;
  getExportUrl(runId: string, format: ExportFormat): string | null;
  listRuns(): Promise<RunSummary[]>;
  deleteRun(runId: string): Promise<void>;
  deleteAllRuns(): Promise<{ deleted: number }>;
}

// ---------------------------------------------------------------------
// Implementación real
// ---------------------------------------------------------------------

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { error?: Partial<ApiErrorBody> };
    return new ApiError(response.status, {
      code: body.error?.code ?? `http_${response.status}`,
      message: body.error?.message ?? GENERIC_ERROR,
      details: body.error?.details,
    });
  } catch {
    return new ApiError(response.status, {
      code: `http_${response.status}`,
      message: GENERIC_ERROR,
    });
  }
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...init,
    });
  } catch {
    throw new ApiError(0, {
      code: "network_error",
      message: "No se pudo conectar con el servidor.",
    });
  }

  if (!response.ok) throw await toApiError(response);
  return response;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return (await (await send(path, init)).json()) as T;
}

function queryString(params: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

const runPath = (runId: string) => `/runs/${encodeURIComponent(runId)}`;

const SSE_EVENT_TYPES: RunEventType[] = [
  "step",
  "detector_result",
  "finding_draft",
  "challenge",
  "validation",
  "lead_closed",
  "warning",
  "completed",
  "failed",
];

const httpApi: RunsApi = {
  createRun(files) {
    const body = new FormData();
    for (const file of files) body.append("files", file, file.name);
    return request<CreateRunResponse>("/runs", { method: "POST", body });
  },

  getValidation: (runId) =>
    request<ValidationResult>(`${runPath(runId)}/validation`),

  startRun: (runId) =>
    request<RunState>(`${runPath(runId)}/start`, { method: "POST" }),

  subscribeToRunEvents(runId, lastSeq, handlers) {
    // EventSource no permite fijar `Last-Event-ID` en la primera conexión,
    // así que el `seq` inicial viaja como query param. En reconexiones
    // automáticas el navegador manda el header con el último `id:` recibido.
    let seq = lastSeq;
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;
    let attempt = 0;

    const connect = () => {
      const url = `${API_BASE_URL}${runPath(runId)}/events${queryString({
        last_event_id: seq > 0 ? seq : undefined,
      })}`;
      source = new EventSource(url, { withCredentials: true });

      source.onopen = () => {
        attempt = 0;
        handlers.onConnectionChange?.("open");
      };

      const onMessage = (message: MessageEvent<string>) => {
        try {
          const event = JSON.parse(message.data) as RunEvent;
          if (event.seq <= seq) return;
          seq = event.seq;
          handlers.onEvent({ ...event, type: (message.type as RunEventType) || event.type });
          if (event.type === "completed" || event.type === "failed") {
            closed = true;
            source?.close();
          }
        } catch {
          // Evento mal formado: se ignora, el siguiente trae el estado.
        }
      };
      for (const type of SSE_EVENT_TYPES) {
        source.addEventListener(type, onMessage as EventListener);
      }

      source.onerror = () => {
        if (closed) return;
        handlers.onConnectionChange?.("reconnecting");
        if (source?.readyState === EventSource.CLOSED) {
          // El navegador se rindió: reabrimos con backoff desde el último seq.
          attempt += 1;
          retryTimer = setTimeout(connect, Math.min(1000 * 2 ** attempt, 15000));
        }
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  },

  getRun: (runId) => request<RunState>(runPath(runId)),

  getReport: (runId) => request<Report>(`${runPath(runId)}/report`),

  getRecords: (runId, query) =>
    request<Page<RecordRow>>(
      `${runPath(runId)}/records${queryString({ ...query })}`,
    ),

  getRecord: (runId, table, recordId) =>
    request<RecordView>(
      `${runPath(runId)}/records/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`,
    ),

  getEntities: (runId, query) =>
    request<Page<EntityListItem>>(
      `${runPath(runId)}/entities${queryString({ ...query })}`,
    ),

  getGraph: (runId, scope) =>
    request<GraphData>(`${runPath(runId)}/graph${queryString({ scope })}`),

  getEntityTimeline: (runId, entityId) =>
    request<EntityTimeline>(
      `${runPath(runId)}/entities/${encodeURIComponent(entityId)}/timeline`,
    ),

  getLog: (runId, query = {}) =>
    request<RunEvent[]>(`${runPath(runId)}/log${queryString({ ...query })}`),

  search: (runId, q) =>
    request<SearchResponse>(`${runPath(runId)}/search${queryString({ q })}`),

  getExportUrl(runId, format) {
    if (format === "submission") return `${API_BASE_URL}${runPath(runId)}/submission`;
    return `${API_BASE_URL}${runPath(runId)}/export${queryString({ format })}`;
  },

  listRuns: () => request<RunSummary[]>("/runs"),

  async deleteRun(runId) {
    await send(runPath(runId), { method: "DELETE" });
  },

  deleteAllRuns: () => request<{ deleted: number }>("/runs", { method: "DELETE" }),
};

// ---------------------------------------------------------------------
// Selección real / mock
// ---------------------------------------------------------------------

type MockModule = typeof import("./mock");
let mockModule: Promise<MockModule> | null = null;

function loadMock(): Promise<MockModule> {
  mockModule ??= import("./mock");
  return mockModule;
}

async function impl(): Promise<RunsApi> {
  return isMockMode ? (await loadMock()).mockApi : httpApi;
}

export async function createRun(files: File[]) {
  return (await impl()).createRun(files);
}

export async function getValidation(runId: string) {
  return (await impl()).getValidation(runId);
}

export async function startRun(runId: string) {
  return (await impl()).startRun(runId);
}

/** Se suscribe al SSE de la corrida desde `lastSeq`. Devuelve la función para cancelar. */
export function subscribeToRunEvents(
  runId: string,
  lastSeq: number,
  handlers: SubscribeHandlers,
): () => void {
  if (!isMockMode) return httpApi.subscribeToRunEvents(runId, lastSeq, handlers);

  let unsubscribe: (() => void) | null = null;
  let cancelled = false;
  loadMock().then(({ mockApi }) => {
    if (!cancelled) unsubscribe = mockApi.subscribeToRunEvents(runId, lastSeq, handlers);
  });
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

export async function getRun(runId: string) {
  return (await impl()).getRun(runId);
}

export async function getReport(runId: string) {
  return (await impl()).getReport(runId);
}

export async function getRecords(runId: string, query: RecordsQuery) {
  return (await impl()).getRecords(runId, query);
}

export async function getRecord(runId: string, table: SourceTable, recordId: string) {
  return (await impl()).getRecord(runId, table, recordId);
}

export async function getEntities(runId: string, query: EntitiesQuery = {}) {
  return (await impl()).getEntities(runId, query);
}

export async function getGraph(runId: string, scope: "flagged" | "all" = "flagged") {
  return (await impl()).getGraph(runId, scope);
}

export async function getEntityTimeline(runId: string, entityId: string) {
  return (await impl()).getEntityTimeline(runId, entityId);
}

export async function getLog(runId: string, query?: LogQuery) {
  return (await impl()).getLog(runId, query);
}

export async function search(runId: string, q: string) {
  return (await impl()).search(runId, q);
}

/**
 * URL del case file exportado. En modo mock devuelve `null`: la exportación
 * la genera el backend (EXAMPLE §14) y todavía no existe.
 */
export function getExportUrl(runId: string, format: ExportFormat): string | null {
  return isMockMode ? null : httpApi.getExportUrl(runId, format);
}

export async function listRuns() {
  return (await impl()).listRuns();
}

export async function deleteRun(runId: string) {
  return (await impl()).deleteRun(runId);
}

export async function deleteAllRuns() {
  return (await impl()).deleteAllRuns();
}

// ---------------------------------------------------------------------
// Solo modo mock: escenario simulado para las corridas nuevas.
// ---------------------------------------------------------------------

export type MockScenarioOption = { id: string; label: string; description: string };

export async function listMockScenarios(): Promise<MockScenarioOption[]> {
  if (!isMockMode) return [];
  return (await loadMock()).listScenarios();
}

export async function getMockScenario(): Promise<string | null> {
  if (!isMockMode) return null;
  return (await loadMock()).getSelectedScenario();
}

export async function setMockScenario(id: string): Promise<void> {
  if (!isMockMode) return;
  (await loadMock()).setSelectedScenario(id);
}
