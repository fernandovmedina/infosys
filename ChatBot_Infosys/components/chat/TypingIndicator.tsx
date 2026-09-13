'use client'

import { motion } from "framer-motion"
import { Bot } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 max-w-[85%] items-end mb-4"
    >
      <Avatar className="h-8 w-8 border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shrink-0">
        <AvatarFallback className="bg-cyan-950/60 text-cyan-400">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 border border-cyan-500/20">
        <span className="text-xs font-mono text-cyan-300 mr-2">Qwen is thinking</span>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyan-400"
            animate={{
              y: [0, -6, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
