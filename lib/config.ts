/** Base URL compartida por los clientes HTTP y SSE del frontend. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
