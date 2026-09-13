"use client";

import { useEffect, useState } from "react";
import { CHATBOT_API_BASE_URL } from "@/lib/config";

export interface HealthState {
  status: "ok" | "error" | "loading";
  ollamaConnected: boolean;
  modelAvailable: boolean;
  chromadbConnected: boolean;
  model?: string;
  error?: string;
}

const INITIAL_HEALTH: HealthState = {
  status: "loading",
  ollamaConnected: false,
  modelAvailable: false,
  chromadbConnected: false,
};

/** Polls the chatbot backend while `enabled`, so a closed widget makes no requests. */
export function useHealthCheck(enabled: boolean, pollIntervalMs = 10000): HealthState {
  const [health, setHealth] = useState<HealthState>(INITIAL_HEALTH);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function checkHealth() {
      try {
        const res = await fetch(`${CHATBOT_API_BASE_URL}/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setHealth({
          status: data.status === "ok" ? "ok" : "error",
          ollamaConnected: data.ollama_connected ?? false,
          modelAvailable: data.model_available ?? false,
          chromadbConnected: data.chromadb_connected ?? false,
          model: data.model,
        });
      } catch (err) {
        if (cancelled) return;
        setHealth({
          ...INITIAL_HEALTH,
          status: "error",
          error: err instanceof Error ? err.message : "Failed to connect to backend",
        });
      }
    }

    checkHealth();
    const timer = setInterval(checkHealth, pollIntervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, pollIntervalMs]);

  return health;
}
