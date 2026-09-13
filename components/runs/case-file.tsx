"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { formatMoneyMXN, formatNumber } from "@/lib/format";
import { errorMessage, isNotAuthenticated } from "@/lib/runs/errors";
import { getReport } from "@/lib/runs/api";
import type { Report } from "@/lib/runs/types";
import { CaseFileProvider, useCaseFile, type CaseSection } from "./case-file-context";
import { ExecutiveSummary, verdictText } from "./executive-summary";
import { FindingsSection } from "./findings-section";
import { LeadsSection } from "./leads-section";
import { MethodAndLimits } from "./method-and-limits";
import { EntitiesSection } from "./entities-section";
import { EntityDrawer } from "./entity-drawer";
import { InvestigationLog } from "./investigation-log";
import { RecordDrawer } from "./record-drawer";
import { SearchPalette } from "./search-palette";
import { TransactionsExplorer } from "./transactions-explorer";
import { RunHeader } from "./run-header";
import { ExplainabilityChat } from "./explainability-chat";
import { VERDICT_STYLES } from "./run-history";
import { Button, Icon, LoadingBlock, Notice, type IconName } from "./ui";

const SECTION_META: Record<CaseSection, { label: string; icon: IconName; iconClass: string; description: string }> = {
  findings: { label: "Findings", icon: "xCircle", iconClass: "text-red-600", description: "What happened and how we know" },
  leads: { label: "Dismissed", icon: "minusCircle", iconClass: "text-amber-600", description: "Why each entity wasn't accused" },
  entities: { label: "Entities", icon: "shield", iconClass: "text-zinc-500", description: "How everything is connected" },
  transactions: { label: "Transactions", icon: "copy", iconClass: "text-zinc-500", description: "Every record in the dataset" },
  log: { label: "Log", icon: "refresh", iconClass: "text-zinc-500", description: "What the agent did, step by step" },
  method: { label: "Method and limits", icon: "info", iconClass: "text-zinc-500", description: "What it can't detect and how to reproduce it" },
};

const ORDER: CaseSection[] = ["findings", "leads", "entities", "transactions", "log", "method"];

function SectionNav() {
  const { report, section, navigate } = useCaseFile();
  const counts: Partial<Record<CaseSection, number>> = {
    findings: report.submission.findings.length,
    leads: report.submission.leads_not_pursued.length,
  };
  const spotlightLeads = counts.findings === 0 && (counts.leads ?? 0) > 0;

  return (
    <nav aria-label="Case file sections" className="-mx-4 relative overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ORDER.map((key) => {
          const meta = SECTION_META[key];
          const active = section === key;
          return (
            <li key={key} className="shrink-0">
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => navigate({ section: key, finding: null, lead: null, exhibit: null, record: null, entity: null })}
                className={`flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 ${
                  active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
                } ${spotlightLeads && key === "leads" && !active ? "ring-2 ring-amber-300" : ""}`}
              >
                <Icon name={meta.icon} className={`h-4 w-4 ${active ? "text-white" : meta.iconClass}`} />
                <span className="flex-1">{meta.label}</span>
                {counts[key] !== undefined && (
                  <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/20" : "bg-zinc-100 text-zinc-600"}`}>{counts[key]}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barra de una línea que aparece al hacer scroll (EXAMPLE §6.1). */
function CompactBar({ visible, onOpenSearch }: { visible: boolean; onOpenSearch: () => void }) {
  const { report, navigate } = useCaseFile();
  const style = VERDICT_STYLES[report.summary.verdict];
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm">
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}>
          <Icon name={style.icon} className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{verdictText(report)}</span>
          <span className="sm:hidden">{report.summary.findings_count} findings</span>
        </span>
        <span className="hidden min-w-0 truncate font-medium text-zinc-900 md:inline">{report.case_header.company_name}</span>
        <span className="ml-auto hidden items-center gap-3 text-xs tabular-nums text-zinc-600 lg:flex">
          <button type="button" onClick={() => navigate({ section: "findings" })} className="hover:underline">
            {formatNumber(report.summary.findings_count)} findings
          </button>
          <span>{formatMoneyMXN(report.summary.total_exposure)}</span>
          <button type="button" onClick={() => navigate({ section: "leads" })} className="hover:underline">
            {formatNumber(report.summary.leads_closed_count)} dismissed
          </button>
        </span>
        <Button className="ml-auto !py-1 lg:ml-0" onClick={onOpenSearch} aria-label="Search (⌘K)">
          <Icon name="search" className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function CaseFileLayout({ justFinished }: { justFinished: boolean }) {
  const { report, section, params, navigate } = useCaseFile();
  const [compact, setCompact] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showFinished, setShowFinished] = useState(justFinished);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = summaryRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setCompact(!entry.isIntersecting), { threshold: 0 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // ⌘K / Ctrl+K abre el buscador global.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Lleva a la vista el hallazgo o lead indicado en la URL.
  const finding = params.get("finding");
  const lead = params.get("lead");
  const scrollTarget = section === "findings" && finding ? `finding-${finding}` : section === "leads" && lead ? `lead-${lead}` : null;
  useEffect(() => {
    if (!scrollTarget) return;
    const timer = setTimeout(() => document.getElementById(scrollTarget)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    return () => clearTimeout(timer);
  }, [scrollTarget]);

  const sections: Record<CaseSection, ReactNode> = {
    findings: <FindingsSection />,
    leads: <LeadsSection />,
    entities: <EntitiesSection />,
    transactions: <TransactionsExplorer />,
    log: <InvestigationLog />,
    method: <MethodAndLimits />,
  };

  return (
    <div>
      <CompactBar visible={compact} onOpenSearch={() => setSearchOpen(true)} />

      {showFinished && (
        <div role="status" className="mb-6 flex flex-col gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 sm:flex-row sm:items-center">
          <Icon name="checkCircle" className="h-4 w-4 text-emerald-600" />
          <span className="flex-1">The investigation is complete. This is the case file; the full reasoning is in the log.</span>
          <span className="flex gap-2">
            <Button onClick={() => navigate({ section: "log" })}>View full log</Button>
            <Button variant="ghost" onClick={() => setShowFinished(false)} aria-label="Dismiss notice">
              <Icon name="close" className="h-4 w-4" />
            </Button>
          </span>
        </div>
      )}

      <RunHeader report={report} onOpenSearch={() => setSearchOpen(true)} />
      <div ref={summaryRef} className="mt-6">
        <ExecutiveSummary report={report} />
      </div>
      <ExplainabilityChat />
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-16 lg:self-start">
          <SectionNav />
        </aside>
        <section aria-labelledby="section-title" className="min-w-0">
          <div className="mb-4">
            <h2 id="section-title" className="text-xl font-semibold tracking-tight text-zinc-900">{SECTION_META[section].label}</h2>
            <p className="text-sm text-zinc-500">{SECTION_META[section].description}</p>
          </div>
          {sections[section]}
        </section>
      </div>

      <RecordDrawer />
      <EntityDrawer />
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

/** Case file interactivo (EXAMPLE §6). */
export function CaseFile({ runId, justFinished }: { runId: string; justFinished: boolean }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const onLoadError = useEffectEvent((cause: unknown) => {
    if (isNotAuthenticated(cause)) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/runs/${runId}`)}`);
      return;
    }
    setError(errorMessage(cause));
  });

  useEffect(() => {
    let cancelled = false;
    getReport(runId)
      .then((result) => {
        if (!cancelled) setReport(result);
      })
      .catch((cause) => {
        if (!cancelled) onLoadError(cause);
      });
    return () => {
      cancelled = true;
    };
  }, [runId, attempt]);

  if (error) {
    return (
      <Notice tone="error" title="Could not load the case file">
        <p>{error}</p>
        <Button
          className="mt-3"
          onClick={() => {
            setError(null);
            setAttempt((value) => value + 1);
          }}
        >
          Retry
        </Button>
      </Notice>
    );
  }
  if (!report) return <LoadingBlock label="Loading case file…" />;

  return (
    <CaseFileProvider runId={runId} report={report}>
      <CaseFileLayout justFinished={justFinished} />
    </CaseFileProvider>
  );
}
