'use client'

import { motion } from "framer-motion"
import {
  Bot,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  MessageSquare,
  Sparkles,
  Database,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { HealthState } from "@/hooks/useHealthCheck"
import type { ConversationItem } from "@/hooks/useConversations"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  health: HealthState
  conversations: ConversationItem[]
  activeId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
  useRag: boolean
  onToggleRag: (val: boolean) => void
}

export function Sidebar({
  isOpen,
  onToggle,
  health,
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  useRag,
  onToggleRag,
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isOpen ? 280 : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full glass-panel border-r border-white/10 flex flex-col overflow-hidden relative shrink-0 z-20"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 leading-none">
              ChatBot Infosys
            </h2>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Qwen2.5:7b Local
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Action: New Chat */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-950/40"
        >
          <Plus className="h-4 w-4" />
          <span>New Conversation</span>
        </Button>
      </div>

      {/* RAG Switch Toggle */}
      <div className="px-3 py-2">
        <div className="glass-card p-2.5 rounded-xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-slate-300 font-medium">ChromaDB RAG</span>
          </div>
          <button
            onClick={() => onToggleRag(!useRag)}
            className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
              useRag ? "bg-cyan-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                useRag ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-hidden px-2 py-1">
        <div className="px-2 py-1 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            History
          </span>
          <Badge variant="glass" className="text-[10px] px-1.5 py-0">
            {conversations.length}
          </Badge>
        </div>

        <ScrollArea className="h-[calc(100%-2rem)]">
          <div className="space-y-1 p-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-500 text-xs">
                No past conversations yet
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeId
                return (
                  <div
                    key={c.id}
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive
                        ? "bg-purple-600/30 border border-purple-500/40 text-purple-200"
                        : "text-slate-300 hover:bg-white/5 hover:text-slate-100"
                    }`}
                    onClick={() => onSelectConversation(c.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-purple-300" />
                      <span className="truncate">{c.title}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(c.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer: Health & Status */}
      <div className="p-3 border-t border-white/10 glass-panel">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {health.status === "ok" ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-rose-400" />
            )}
            <span
              className={
                health.status === "ok" ? "text-emerald-300" : "text-rose-300"
              }
            >
              {health.status === "ok" ? "Ollama Connected" : "Backend Offline"}
            </span>
          </div>

          <Badge variant="glass" className="text-[10px] font-mono">
            v1.0
          </Badge>
        </div>
      </div>
    </motion.aside>
  )
}
