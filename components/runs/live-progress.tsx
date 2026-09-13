"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { formatClock, formatCost, formatNumber } from "@/lib/format";
import { errorMessage } from "@/lib/runs/errors";
import { getLog, subscribeToRunEvents } from "@/lib/runs/api";
import type { RunCounters, RunEvent } from "@/lib/runs/types";
import { EventRow } from "./event-list";
import { Icon, LoadingBlock, Notice, Spinner } from "./ui";

const isTerminal = (event: RunEvent) => event.type === "completed" || event.type === "failed";

/** Investigación en vivo (EXAMPLE §5): log por SSE con contadores y autoscroll. */
export function LiveProgress({
  runId,
  filename,
  initialCounters,
  onFinished,
}: {
  runId: string;
  filename: string;
  initialCounters?: RunCounters;
  onFinished: (event: RunEvent) => void;
}) {
  const [events, setEvents] = useState<RunEvent[] | null>(null);
  const [connection, setConnection] = useState<"open" | "reconnecting">("open");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sinceLast, setSinceLast] = useState(0);
  const [paused, setPaused] = useState(false);
  const receivedAt = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  const finish = useEffectEvent(onFinished);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};

    const append = (event: RunEvent) => {
      receivedAt.current = Date.now();
      setSinceLast(0);
      setEvents((previous) => {
        const list = previous ?? [];
        return list.some((item) => item.seq === event.seq) ? list : [...list, event];
      });
      if (isTerminal(event)) finish(event);
    };

    getLog(runId)
      .then((initial) => {
        if (cancelled) return;
        receivedAt.current = Date.now();
        setEvents(initial);
        const last = initial.at(-1);
        if (last && isTerminal(last)) {
          finish(last);
          return;
        }
        // Reanuda desde el último `seq` recibido (EXAMPLE §5.3).
        unsubscribe = subscribeToRunEvents(runId, last?.seq ?? 0, {
          onEvent: append,
          onConnectionChange: setConnection,
        });
      })
      .catch((error) => {
        if (!cancelled) setLoadError(errorMessage(error));
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [runId]);

  // El cronómetro avanza entre eventos.
  useEffect(() => {
    const timer = setInterval(() => {
      if (receivedAt.current) setSinceLast(Math.floor((Date.now() - receivedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Autoscroll, en pausa si el usuario subió a leer.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list && !paused) list.scrollTop = list.scrollHeight;
  }, [events, paused]);

  const last = events?.at(-1);
  const counters = last?.counters ?? initialCounters ?? { llm_calls: 0, mxn_cost: 0, elapsed_seconds: 0 };
  const finished = last ? isTerminal(last) : false;

  return (
    <section aria-labelledby="live-title">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="min-w-0">
          <h1 id="live-title" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900">
            {!finished && <Spinner className="h-5 w-5 text-zinc-400" />}
            {finished ? "Investigation complete" : "Investigating…"}
          </h1>
          <p className="mt-1 truncate text-sm text-zinc-500">{filename}</p>
        </div>
        <p className="flex flex-wrap items-center gap-x-2 text-sm tabular-nums text-zinc-600" aria-live="off">
          <span className="font-medium text-zinc-900">{formatClock(counters.elapsed_seconds + (finished ? 0 : sinceLast))}</span>
          <span aria-hidden>·</span>
          <span>{formatNumber(counters.llm_calls)} LLM calls</span>
          <span aria-hidden>·</span>
          <span>{formatCost(counters.mxn_cost)}</span>
        </p>
      </div>

      {connection === "reconnecting" && (
        <p role="status" className="mt-3 inline-flex items-center gap-2 rounded-md bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
          <Spinner className="h-3 w-3" /> Reconnecting… will resume from the last event received.
        </p>
      )}

      {loadError && (
        <Notice tone="error" title="Could not load progress" className="mt-4">
          {loadError}
        </Notice>
      )}

      <div className="relative mt-4">
        <div
          ref={listRef}
          onScroll={(event) => {
            const element = event.currentTarget;
            setPaused(element.scrollHeight - element.scrollTop - element.clientHeight > 32);
          }}
          className="max-h-[60vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white"
        >
          {events === null ? (
            <div className="p-4">
              <LoadingBlock label="Connecting to the investigation…" />
            </div>
          ) : events.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">Waiting for the first event…</p>
          ) : (
            <ol aria-live="polite" aria-relevant="additions" className="divide-y divide-zinc-100">
              {events.map((event, index) => (
                <EventRow key={event.seq} event={event} pendingResolved={index < events.length - 1} />
              ))}
            </ol>
          )}
        </div>
        {paused && !finished && (
          <button
            type="button"
            onClick={() => setPaused(false)}
            className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-md"
          >
            <Icon name="arrowDown" className="h-3.5 w-3.5" /> Jump to latest event
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        You can close this tab: the investigation keeps running on the server, and when you come back to this link you’ll see the progress or the result.
      </p>
    </section>
  );
}
