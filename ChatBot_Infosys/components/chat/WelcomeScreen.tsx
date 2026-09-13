'use client'

import { motion } from "framer-motion"
import { Bot, Zap, Code, BookOpen, Globe } from "lucide-react"

const suggestions = [
  {
    icon: Code,
    title: "Write Python Code",
    prompt: "Write a Python FastAPI endpoint that processes streaming text with SSE.",
  },
  {
    icon: Zap,
    title: "Explain Architecture",
    prompt: "How does LangChain LCEL chain connect with Qwen2.5:7b via Ollama?",
  },
  {
    icon: BookOpen,
    title: "ChromaDB RAG",
    prompt: "Explain how vector similarity search with embeddings works in ChromaDB.",
  },
  {
    icon: Globe,
    title: "Web Tech Stack",
    prompt: "What are the advantages of combining Next.js App Router with Vercel AI SDK?",
  },
]

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void
}

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-2xl mx-auto">
      {/* Glow Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 blur-xl opacity-50 animate-pulse" />
        <div className="relative glass-card p-5 rounded-2xl border border-white/20 flex items-center justify-center">
          <Bot className="h-12 w-12 text-cyan-400" />
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-300 via-white to-cyan-300 bg-clip-text text-transparent mb-2"
      >
        ChatBot Infosys
      </motion.h1>

      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-slate-400 text-sm mb-8 max-w-md"
      >
        Powered by <span className="text-cyan-400 font-mono font-medium">Qwen2.5:7b</span> running locally via Ollama. 100% private, no cloud key required.
      </motion.p>

      {/* Suggestion Chips */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full"
      >
        {suggestions.map((s, idx) => {
          const Icon = s.icon
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(s.prompt)}
              className="glass-panel p-4 rounded-xl text-left border border-white/10 hover:border-purple-500/50 hover:bg-purple-950/20 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-200">
                  {s.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-300 line-clamp-2">
                {s.prompt}
              </p>
            </button>
          )
        })}
      </motion.div>
    </div>
  )
}
