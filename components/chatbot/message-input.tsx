"use client";

import { useEffect, useId, type ChangeEvent, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { Icon } from "@/components/runs/ui";

const MAX_TEXTAREA_HEIGHT = 160;

export function MessageInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  onStop,
  isOffline,
  useRag,
  onToggleRag,
  textareaRef,
}: {
  input: string;
  onInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStop: () => void;
  isOffline: boolean;
  useRag: boolean;
  onToggleRag: (value: boolean) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const textareaId = useId();
  const ragLabelId = useId();

  // Grow with the content up to a cap, then scroll inside.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [input, textareaRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (input.trim() && !isLoading && !isOffline) event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="shrink-0 border-t border-zinc-200 p-3">
      {isOffline && (
        <p role="status" className="mb-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
          <Icon name="alert" className="mt-px h-3.5 w-3.5" />
          Chatbot backend offline. Check that Ollama and the chatbot API are running.
        </p>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <label htmlFor={textareaId} className="sr-only">
          Message
        </label>
        <textarea
          id={textareaId}
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          disabled={isOffline}
          placeholder={isOffline ? "Connecting to backend…" : "Message Chatbot…"}
          rows={1}
          className="min-h-10 flex-1 resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:border-zinc-900 focus-visible:ring-1 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            title="Stop generating"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 outline-none transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <Icon name="stop" className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || isOffline}
            aria-label="Send message"
            title="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-white outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="send" className="h-4 w-4" />
          </button>
        )}
      </form>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={useRag}
            aria-labelledby={ragLabelId}
            onClick={() => onToggleRag(!useRag)}
            className={`relative h-4 w-7 shrink-0 rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 ${useRag ? "bg-zinc-900" : "bg-zinc-300"}`}
          >
            <span
              aria-hidden
              className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${useRag ? "translate-x-3" : ""}`}
            />
          </button>
          <span id={ragLabelId}>Search documents (RAG)</span>
        </div>
        <span className="hidden sm:inline">Shift+Enter for new line</span>
      </div>
    </div>
  );
}
