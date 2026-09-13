/** Base URL compartida por los clientes HTTP y SSE del frontend. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** Same-origin prefix proxied to the chatbot API (see `rewrites` in next.config.ts). */
export const CHATBOT_API_BASE_URL = "/chatbot-api";
