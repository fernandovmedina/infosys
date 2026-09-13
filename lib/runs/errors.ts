import type { ApiErrorBody } from "./types";

/** Error con el sobre del backend: `{ error: { code, message, details } }`. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

export function isNotAuthenticated(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "not_authenticated" || error.status === 401)
  );
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Algo salió mal. Intenta de nuevo.";
}
