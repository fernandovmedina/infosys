/**
 * Capa de datos de las corridas de investigación (EXAMPLE.md §9).
 *
 * Habla con el backend FastAPI igual que `lib/auth.ts`: cookie de sesión
 * (`credentials: "include"`) y el sobre de error
 * `{ error: { code, message, details } }`.
 */

import { API_BASE_URL } from "../config";
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

const GENERIC_ERROR = "Something went wrong. Please try again.";

export { ApiError, isNotAuthenticated, isNotFound } from "./errors";

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
      message: "Could not connect to the server.",
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

export function createRun(files: File[]): Promise<CreateRunResponse> {
  const body = new FormData();
  for (const file of files) body.append("files", file, file.name);
  return request<CreateRunResponse>("/runs", { method: "POST", body });
}

export function getValidation(runId: string): Promise<ValidationResult> {
  return request<ValidationResult>(`${runPath(runId)}/validation`);
}

export function startRun(runId: string): Promise<RunState> {
  return request<RunState>(`${runPath(runId)}/start`, { method: "POST" });
}

/** Se suscribe al SSE de la corrida desde `lastSeq`. Devuelve una función para cancelar. */
export function subscribeToRunEvents(
  runId: string,
  lastSeq: number,
  handlers: SubscribeHandlers,
): () => void {
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
        handlers.onEvent({
          ...event,
          type: (message.type as RunEventType) || event.type,
        });
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
}

export function getRun(runId: string): Promise<RunState> {
  return request<RunState>(runPath(runId));
}

export function getReport(runId: string): Promise<Report> {
  return request<Report>(`${runPath(runId)}/report`);
}

export function getRecords(
  runId: string,
  query: RecordsQuery,
): Promise<Page<RecordRow>> {
  return request<Page<RecordRow>>(
    `${runPath(runId)}/records${queryString({ ...query })}`,
  );
}

export function getRecord(
  runId: string,
  table: SourceTable,
  recordId: string,
): Promise<RecordView> {
  return request<RecordView>(
    `${runPath(runId)}/records/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`,
  );
}

export function getEntities(
  runId: string,
  query: EntitiesQuery = {},
): Promise<Page<EntityListItem>> {
  return request<Page<EntityListItem>>(
    `${runPath(runId)}/entities${queryString({ ...query })}`,
  );
}

export function getGraph(
  runId: string,
  scope: "flagged" | "all" = "flagged",
): Promise<GraphData> {
  return request<GraphData>(
    `${runPath(runId)}/graph${queryString({ scope })}`,
  );
}

export function getEntityTimeline(
  runId: string,
  entityId: string,
): Promise<EntityTimeline> {
  return request<EntityTimeline>(
    `${runPath(runId)}/entities/${encodeURIComponent(entityId)}/timeline`,
  );
}

export function getLog(runId: string, query: LogQuery = {}): Promise<RunEvent[]> {
  return request<RunEvent[]>(
    `${runPath(runId)}/log${queryString({ ...query })}`,
  );
}

export function search(runId: string, q: string): Promise<SearchResponse> {
  return request<SearchResponse>(
    `${runPath(runId)}/search${queryString({ q })}`,
  );
}

/** URL del case file exportado por el backend. */
export function getExportUrl(runId: string, format: ExportFormat): string {
  if (format === "submission") {
    return `${API_BASE_URL}${runPath(runId)}/submission`;
  }
  return `${API_BASE_URL}${runPath(runId)}/export${queryString({ format })}`;
}

export function listRuns(): Promise<RunSummary[]> {
  return request<RunSummary[]>("/runs");
}

export async function deleteRun(runId: string): Promise<void> {
  await send(runPath(runId), { method: "DELETE" });
}

export function deleteAllRuns(): Promise<{ deleted: number }> {
  return request<{ deleted: number }>("/runs", { method: "DELETE" });
}
