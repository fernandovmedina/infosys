'use client'

import { useRef, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./MessageBubble"
import { TypingIndicator } from "./TypingIndicator"
import { WelcomeScreen } from "./WelcomeScreen"
import type { Message } from "ai"

interface ChatAreaProps {
  messages: Message[]
  isLoading: boolean
  onSelectPrompt: (prompt: string) => void
}

export function ChatArea({
  messages,
  isLoading,
  onSelectPrompt,
}: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  if (messages.length === 0) {
    return <WelcomeScreen onSelectPrompt={onSelectPrompt} />
  }

  return (
    <ScrollArea className="h-full px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              id={msg.id}
              role={msg.role as "user" | "assistant"}
              content={msg.content}
            />
          ))}
        </AnimatePresence>

        {isLoading && (
          <AnimatePresence>
            <TypingIndicator />
          </AnimatePresence>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
