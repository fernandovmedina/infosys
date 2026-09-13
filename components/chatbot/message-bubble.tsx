"use client";

import { useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Icon } from "@/components/runs/ui";

// Compact Markdown styling for a narrow panel (no typography plugin in this project).
const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  h1: ({ children }) => <p className="mb-1 mt-3 font-semibold first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mb-1 mt-3 font-semibold first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mb-1 mt-3 font-semibold first:mt-0">{children}</p>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
      {children}
    </a>
  ),
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-zinc-300 pl-3 text-zinc-600">{children}</blockquote>,
  hr: () => <hr className="my-3 border-zinc-200" />,
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md border border-zinc-200 bg-white p-3 font-mono text-xs leading-relaxed [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  code: ({ className, children }) => (
    <code className={`rounded bg-zinc-200/70 px-1 py-0.5 font-mono text-[0.8125em] ${className ?? ""}`}>{children}</code>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-zinc-300 px-2 py-1 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-b border-zinc-200 px-2 py-1 align-top">{children}</td>,
};

export function MessageBubble({ role, content }: { role: string; content: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-zinc-900 px-3 py-2 text-sm text-white">
          {content}
        </p>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-start gap-1">
      <div className="max-w-[92%] break-words rounded-2xl rounded-bl-sm bg-zinc-100 px-3 py-2 text-sm leading-relaxed text-zinc-900">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
          {content}
        </ReactMarkdown>
      </div>
      <CopyMessageButton content={content} />
    </div>
  );
}

function CopyMessageButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(content);
          setCopied(true);
        } catch {
          // Clipboard may be blocked; nothing to do.
        }
      }}
      className="flex items-center gap-1 rounded px-1 py-0.5 text-xs text-zinc-500 outline-none transition-opacity hover:text-zinc-900 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-zinc-900 sm:opacity-0 sm:group-hover:opacity-100"
    >
      <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
