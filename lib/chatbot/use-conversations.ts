"use client";

import { useCallback, useState } from "react";
import { CHATBOT_API_BASE_URL } from "@/lib/config";

export interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Server-side conversation sessions. Nothing is fetched until `refreshConversations` runs. */
export function useConversations() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${CHATBOT_API_BASE_URL}/conversations`);
      if (res.ok) setConversations(await res.json());
    } catch {
      // Backend may be offline.
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(async (title = "New Chat") => {
    try {
      const res = await fetch(`${CHATBOT_API_BASE_URL}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const data: ConversationItem = await res.json();
        setActiveId(data.id);
        return data.id;
      }
    } catch {
      // Offline: a local id the backend will replace with a real one on the next message.
      const localId = `local-${Date.now()}`;
      setActiveId(localId);
      return localId;
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`${CHATBOT_API_BASE_URL}/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveId((current) => (current === id ? null : current));
    } catch {
      // Ignore network failure on delete.
    }
  }, []);

  const fetchConversationMessages = useCallback(async (id: string): Promise<ConversationMessage[] | null> => {
    try {
      const res = await fetch(`${CHATBOT_API_BASE_URL}/conversations/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data: { messages: ConversationMessage[] } = await res.json();
      return data.messages;
    } catch (err) {
      console.error("Failed to load history:", err);
      return null;
    }
  }, []);

  return {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    fetchConversationMessages,
    refreshConversations,
    isLoading,
  };
}
