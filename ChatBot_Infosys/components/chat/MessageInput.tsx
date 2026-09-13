'use client'

import { useRef, useEffect } from "react"
import { Send, Square, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MessageInputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  stop: () => void
  isOffline?: boolean
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  stop,
  isOffline = false,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading && !isOffline) {
        const form = e.currentTarget.form
        if (form) form.requestSubmit()
      }
    }
  }

  return (
    <div className="p-4 glass-panel border-t border-white/10 relative">
      {isOffline && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Backend offline. Check that Ollama & FastAPI are running.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-4xl mx-auto">
        <div className="relative flex-1 glass-input rounded-xl border border-white/15 focus-within:border-purple-500/60 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isOffline}
            placeholder={
              isOffline
                ? "Connecting to backend..."
                : "Ask Qwen2.5:7b anything... (Shift+Enter for newline)"
            }
            rows={1}
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 resize-none outline-none disabled:opacity-50"
          />
        </div>

        {isLoading ? (
          <Button
            type="button"
            onClick={stop}
            variant="destructive"
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0 shadow-lg"
            title="Stop generating"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={!input.trim() || isOffline}
            size="icon"
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shrink-0 shadow-lg shadow-purple-950/50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  )
}
