/** Base URL compartida por los clientes HTTP y SSE del frontend. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// Kept for the legacy chatbot modules that remain in the repository but are
// no longer mounted. The active UI uses the run-scoped explain endpoint.
export const CHATBOT_API_BASE_URL = "/chatbot-api";
