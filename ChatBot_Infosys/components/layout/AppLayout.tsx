'use client'

import { useState, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { Menu, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "./Sidebar"
import { ChatArea } from "../chat/ChatArea"
import { MessageInput } from "../chat/MessageInput"
import { useHealthCheck } from "@/hooks/useHealthCheck"
import { useConversations } from "@/hooks/useConversations"

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [useRag, setUseRag] = useState(false)

  const health = useHealthCheck(8000)
  const {
    conversations,
    activeId,
    setActiveId,
    createConversation,
    deleteConversation,
  } = useConversations()

  // Vercel AI SDK useChat setup
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setMessages,
    append,
  } = useChat({
    api: "/api/chat",
    body: {
      conversation_id: activeId,
      use_rag: useRag,
    },
    onError: (err) => {
      console.error("Chat error:", err)
    },
  })

  // Start new chat
  const handleNewChat = useCallback(async () => {
    setMessages([])
    const newId = await createConversation("New Chat")
    if (newId) setActiveId(newId)
  }, [createConversation, setActiveId, setMessages])

  // Select existing conversation & load history
  const handleSelectConversation = useCallback(
    async (id: string) => {
      setActiveId(id)
      try {
        const res = await fetch(`/api/conversations/${id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.history) {
            const formatted = data.history.map((h: any, idx: number) => ({
              id: `${id}-${idx}`,
              role: h.role === "user" ? "user" : "assistant",
              content: h.content,
            }))
            setMessages(formatted)
          }
        }
      } catch (err) {
        console.error("Failed to load history:", err)
      }
    },
    [setActiveId, setMessages]
  )

  // Handle prompt suggestion click
  const handleSelectPrompt = useCallback(
    (promptText: string) => {
      append({
        role: "user",
        content: promptText,
      })
    },
    [append]
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        health={health}
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={deleteConversation}
        useRag={useRag}
        onToggleRag={setUseRag}
      />

      {/* Main Chat View */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 glass-panel border-b border-white/10 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-8 w-8 text-slate-300"
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-200">
                Qwen2.5:7b Chat
              </span>
              {useRag && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
                  RAG Active
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>FastAPI + LangChain</span>
          </div>
        </header>

        {/* Chat Messages */}
        <main className="flex-1 overflow-hidden relative">
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            onSelectPrompt={handleSelectPrompt}
          />
        </main>

        {/* Bottom Input */}
        <footer className="shrink-0">
          <MessageInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            isOffline={health.status === "error"}
          />
        </footer>
      </div>
    </div>
  )
}
