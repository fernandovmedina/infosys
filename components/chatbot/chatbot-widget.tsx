"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/components/runs/ui";
import { CHATBOT_API_BASE_URL } from "@/lib/config";
import { useConversations } from "@/lib/chatbot/use-conversations";
import { useHealthCheck, type HealthState } from "@/lib/chatbot/use-health-check";
import { ChatMessages } from "./chat-messages";
import { ConversationList } from "./conversation-list";
import { MessageInput } from "./message-input";

/**
 * Floating support-style chatbot: a fixed launcher in the bottom-right corner that
 * toggles a panel. Chat state lives here, above the panel, so closing the panel
 * (or navigating client-side, since this is mounted in the root layout) keeps the
 * conversation.
 */
export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [useRag, setUseRag] = useState(false);
  const panelId = useId();
  const titleId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const health = useHealthCheck(open, 8000);
  const {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
    fetchConversationMessages,
    refreshConversations,
    isLoading: conversationsLoading,
  } = useConversations();

  const { messages, input, handleInputChange, handleSubmit, status, error, stop, reload, setMessages, append } = useChat({
    api: `${CHATBOT_API_BASE_URL}/chat`,
    body: {
      conversation_id: activeId,
      use_rag: useRag,
    },
    // The backend keeps history per conversation and creates one when none is sent;
    // adopt its id so follow-up messages share that memory.
    onResponse: (response) => {
      const conversationId = response.headers.get("X-Conversation-Id");
      if (conversationId) setActiveId(conversationId);
    },
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";
  const isOffline = health.status === "error";

  // Focus the message box when the chat shows, but not on touch devices where it
  // would pop the keyboard over the conversation.
  useEffect(() => {
    if (open && view === "chat" && matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus();
    }
  }, [open, view]);

  function closePanel() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      closePanel();
    }
  }

  async function handleNewChat() {
    stop();
    setMessages([]);
    setView("chat");
    await createConversation("New Chat");
  }

  function handleShowHistory() {
    setView("history");
    refreshConversations();
  }

  async function handleSelectConversation(id: string) {
    stop();
    setActiveId(id);
    setView("chat");
    const history = await fetchConversationMessages(id);
    if (history) {
      setMessages(
        history.map((message, index) => ({
          id: `${id}-${index}`,
          role: message.role === "user" ? "user" : "assistant",
          content: message.content,
        })),
      );
    }
  }

  async function handleDeleteConversation(id: string) {
    if (id === activeId) {
      stop();
      setMessages([]);
    }
    await deleteConversation(id);
  }

  return (
    <>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={handlePanelKeyDown}
          className="fixed bottom-20 left-3 right-3 top-3 z-40 flex flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl transition-[opacity,translate] duration-150 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none sm:bottom-24 sm:left-auto sm:right-6 sm:top-auto sm:h-[min(36rem,calc(100dvh-8rem))] sm:w-96"
        >
          <header className="flex shrink-0 items-center gap-1 border-b border-zinc-200 py-2 pl-3 pr-2">
            {view === "history" && (
              <HeaderButton icon="arrowLeft" label="Back to chat" onClick={() => setView("chat")} />
            )}
            <div className="min-w-0 flex-1 px-1">
              <h2 id={titleId} className="text-sm font-semibold text-zinc-900">
                Chatbot
              </h2>
              <HealthLabel health={health} />
            </div>
            {view === "chat" && <HeaderButton icon="clock" label="Conversations" onClick={handleShowHistory} />}
            <HeaderButton icon="compose" label="New conversation" onClick={handleNewChat} />
            <HeaderButton icon="close" label="Close Chatbot" onClick={closePanel} />
          </header>

          {view === "history" ? (
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              isLoading={conversationsLoading}
              onSelect={handleSelectConversation}
              onDelete={handleDeleteConversation}
            />
          ) : (
            <>
              <ChatMessages
                messages={messages}
                status={status}
                model={health.model}
                disabled={isOffline}
                onSelectPrompt={(prompt) => append({ role: "user", content: prompt })}
              />
              {error && !isOffline && (
                <div role="alert" className="mx-3 mb-2 flex shrink-0 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
                  <Icon name="xCircle" className="h-3.5 w-3.5" />
                  <span className="min-w-0 flex-1">Chatbot couldn’t answer. Please try again.</span>
                  <button
                    type="button"
                    onClick={() => reload()}
                    className="rounded font-medium underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                  >
                    Retry
                  </button>
                </div>
              )}
              <MessageInput
                input={input}
                onInputChange={handleInputChange}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                onStop={stop}
                isOffline={isOffline}
                useRag={useRag}
                onToggleRag={setUseRag}
                textareaRef={textareaRef}
              />
            </>
          )}
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? "Close Chatbot" : "Open Chatbot"}
        title={open ? "Close Chatbot" : "Chatbot"}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg outline-none transition-colors hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
      >
        <Icon name={open ? "chevronDown" : "chat"} className="h-6 w-6" />
      </button>
    </>
  );
}

function HeaderButton({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-zinc-500 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900"
    >
      <Icon name={icon} className="h-5 w-5" />
    </button>
  );
}

function HealthLabel({ health }: { health: HealthState }) {
  const { dot, text } = {
    ok: { dot: "bg-emerald-500", text: health.model ? `Online · ${health.model}` : "Online" },
    error: { dot: "bg-red-500", text: "Offline" },
    loading: { dot: "bg-zinc-400", text: "Connecting…" },
  }[health.status];

  return (
    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
      <span aria-hidden className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <span className="truncate">{text}</span>
    </p>
  );
}
