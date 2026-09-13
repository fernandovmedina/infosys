"use client";

import { Icon, LoadingBlock, SectionLabel } from "@/components/runs/ui";
import type { ConversationItem } from "@/lib/chatbot/use-conversations";

export function ConversationList({
  conversations,
  activeId,
  isLoading,
  onSelect,
  onDelete,
}: {
  conversations: ConversationItem[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
      <SectionLabel className="mb-2 px-1">Conversations ({conversations.length})</SectionLabel>

      {isLoading && conversations.length === 0 ? (
        <div className="px-1 py-2">
          <LoadingBlock />
        </div>
      ) : conversations.length === 0 ? (
        <p className="px-1 py-6 text-center text-xs text-zinc-500">No past conversations yet</p>
      ) : (
        <ul className="space-y-1">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeId;
            return (
              <li
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-md transition-colors ${isActive ? "bg-zinc-100" : "hover:bg-zinc-50"}`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-current={isActive || undefined}
                  className="min-w-0 flex-1 rounded-md px-2.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
                >
                  <span className="block truncate text-sm text-zinc-900">{conversation.title}</span>
                  <span className="block text-xs text-zinc-500">
                    {conversation.message_count} {conversation.message_count === 1 ? "message" : "messages"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation.id)}
                  aria-label={`Delete conversation “${conversation.title}”`}
                  title="Delete conversation"
                  className="mr-1 rounded-md p-1.5 text-zinc-400 outline-none transition-opacity hover:text-red-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-zinc-900 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
