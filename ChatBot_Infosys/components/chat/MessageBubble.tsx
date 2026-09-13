'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Bot, User, Copy, Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface MessageBubbleProps {
  role: "user" | "assistant" | "system"
  content: string
  id?: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)
  const isUser = role === "user"

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-3 max-w-[88%] mb-4 ${
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      {/* Avatar */}
      <Avatar
        className={`h-8 w-8 shrink-0 border ${
          isUser
            ? "border-purple-500/40 bg-purple-950/60 text-purple-300"
            : "border-cyan-500/40 bg-cyan-950/60 text-cyan-300"
        }`}
      >
        <AvatarFallback
          className={
            isUser ? "bg-purple-900/60 text-purple-200" : "bg-cyan-900/60 text-cyan-200"
          }
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Bubble Content */}
      <div
        className={`relative group rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-xs shadow-lg shadow-purple-950/30"
            : "glass-card text-slate-100 rounded-tl-xs border border-white/10"
        }`}
      >
        {/* Copy Button for Assistant Messages */}
        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 text-xs flex items-center gap-1"
            title="Copy response"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-400" />
                <span className="text-green-400 text-[10px]">Copied</span>
              </>
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}

        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-invert max-w-none text-slate-100 text-sm space-y-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "")
                  return !inline && match ? (
                    <div className="my-2 rounded-lg overflow-hidden border border-slate-700/60 shadow-md">
                      <div className="bg-slate-900/90 px-3 py-1 text-[11px] font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center">
                        <span>{match[1]}</span>
                      </div>
                      <SyntaxHighlighter
                        style={atomDark}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: "0.75rem 1rem",
                          fontSize: "0.825rem",
                          background: "#0d1117",
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code
                      className="bg-purple-950/60 text-purple-200 px-1.5 py-0.5 rounded font-mono text-xs border border-purple-800/40"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-2 border border-slate-800 rounded-lg">
                      <table className="min-w-full text-xs divide-y divide-slate-800">
                        {children}
                      </table>
                    </div>
                  )
                },
                th({ children }) {
                  return (
                    <th className="bg-slate-900/80 px-3 py-1.5 text-left font-medium text-cyan-300">
                      {children}
                    </th>
                  )
                },
                td({ children }) {
                  return (
                    <td className="px-3 py-1.5 border-t border-slate-800/60">
                      {children}
                    </td>
                  )
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline"
                    >
                      {children}
                    </a>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}
