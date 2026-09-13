"use client";

import { useEffect, useRef } from "react";
import type { Message } from "@ai-sdk/react";
import { MessageBubble } from "./message-bubble";

const SUGGESTIONS = [
  {
    title: "Write Python Code",
    prompt: "Write a Python FastAPI endpoint that processes streaming text with SSE.",
  },
  {
    title: "Explain Architecture",
    prompt: "How does LangChain LCEL chain connect with Qwen2.5:7b via Ollama?",
  },
  {
    title: "ChromaDB RAG",
    prompt: "Explain how vector similarity search with embeddings works in ChromaDB.",
  },
  {
    title: "Web Tech Stack",
    prompt: "What are the advantages of combining Next.js App Router with Vercel AI SDK?",
  },
];

/** Distance from the bottom (px) within which new content keeps the view pinned. */
const STICK_THRESHOLD = 48;

export function ChatMessages({
  messages,
  status,
  model,
  disabled,
  onSelectPrompt,
}: {
  messages: Message[];
  status: "submitted" | "streaming" | "ready" | "error";
  model?: string;
  /** Blocks the suggestion prompts, like the message box, while the backend is offline. */
  disabled: boolean;
  onSelectPrompt: (prompt: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const messageCountRef = useRef(0);

  // Follow new content while the reader is at the bottom; someone who scrolled up
  // to reread stays put, except when they send a new message themselves.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messages.length > messageCountRef.current && messages.at(-1)?.role === "user") {
      stickToBottomRef.current = true;
    }
    messageCountRef.current = messages.length;
    if (stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  return (
    <div
      ref={scrollRef}
      onScroll={(event) => {
        const el = event.currentTarget;
        stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
      }}
      role="log"
      aria-label="Conversation"
      aria-busy={status === "submitted" || status === "streaming"}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
    >
      {messages.length === 0 ? (
        <Welcome model={model} disabled={disabled} onSelectPrompt={onSelectPrompt} />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageBubble key={message.id} role={message.role} content={message.content} />
          ))}
          {status === "submitted" && <TypingIndicator />}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div role="status" className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-3">
      <span className="sr-only">Chatbot is thinking</span>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          aria-hidden
          style={{ animationDelay: `${delay}ms` }}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}

function Welcome({
  model,
  disabled,
  onSelectPrompt,
}: {
  model?: string;
  disabled: boolean;
  onSelectPrompt: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-zinc-900">Hi! How can I help?</p>
        <p className="mt-1 text-xs text-zinc-500">
          Powered by <span className="font-mono">{model ?? "a local model"}</span> running locally via Ollama. Your
          messages never leave this machine.
        </p>
      </div>
      <ul className="space-y-2">
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion.title}>
            <button
              type="button"
              onClick={() => onSelectPrompt(suggestion.prompt)}
              disabled={disabled}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-left outline-none transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-zinc-200 disabled:hover:bg-transparent"
            >
              <span className="block text-xs font-medium text-zinc-900">{suggestion.title}</span>
              <span className="mt-0.5 line-clamp-2 block text-xs text-zinc-500">{suggestion.prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
