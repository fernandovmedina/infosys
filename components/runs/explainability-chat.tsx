"use client";

import { useState, type FormEvent } from "react";
import { explainCaseFile } from "@/lib/runs/api";
import type { ExplainAnswer } from "@/lib/runs/types";
import { useCaseFile } from "./case-file-context";
import { Button, LoadingBlock, Notice } from "./ui";

/** Local, grounded Q&A. The assistant never receives the complete uploaded estate. */
export function ExplainabilityChat() {
  const { runId } = useCaseFile();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ExplainAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      setAnswer(await explainCaseFile(runId, question));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not get an explanation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4" aria-labelledby="ask-case-title">
      <h2 id="ask-case-title" className="text-base font-semibold text-zinc-900">Ask about this case</h2>
      <p className="mt-1 text-sm text-zinc-600">
        A local model explains the evidence-backed result. It receives only a redacted case brief, not the full upload or private reasoning.
      </p>
      <form className="mt-3 flex gap-2" onSubmit={ask}>
        <label className="sr-only" htmlFor="case-question">Question about this investigation</label>
        <input
          id="case-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={1000}
          placeholder="Why was this supplier flagged?"
          className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900"
        />
        <Button type="submit" disabled={!question.trim() || loading}>{loading ? "Explaining…" : "Ask"}</Button>
      </form>
      {loading && <div className="mt-3"><LoadingBlock label="Checking the cited evidence…" /></div>}
      {error && <Notice tone="error" title="Explanation unavailable" className="mt-3">{error}</Notice>}
      {answer && !loading && (
        <div className="mt-3 rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
          <p className="whitespace-pre-wrap leading-6">{answer.answer}</p>
          {answer.grounded_in.length > 0 && <p className="mt-2 text-xs text-zinc-500">Grounded in {answer.grounded_in.length} cited record(s) · {answer.model}</p>}
        </div>
      )}
    </section>
  );
}
