"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { entityKindFromId } from "@/lib/runs/labels";
import { recordKey } from "@/lib/runs/schema";
import type { Entity, Report, SourceTable } from "@/lib/runs/types";

export type CaseSection = "findings" | "leads" | "entities" | "transactions" | "log" | "method";

export const SECTIONS: CaseSection[] = ["findings", "leads", "entities", "transactions", "log", "method"];

type Patch = Record<string, string | null>;

export interface CaseFileValue {
  runId: string;
  report: Report;
  section: CaseSection;
  /** Parámetros crudos de la URL (`finding` es 1-based). */
  params: URLSearchParams;
  navigate: (patch: Patch, options?: { replace?: boolean }) => void;
  hrefFor: (patch: Patch) => string;
  /** Entidad del reporte; si no viene, un stand-in con el id como nombre (EXAMPLE §11). */
  entity: (id: string) => Entity & { known: boolean };
  openFinding: (findingIndex: number) => void;
  openExhibit: (findingIndex: number, exhibitId: string) => void;
  openRecord: (table: SourceTable, recordId: string) => void;
  openEntity: (id: string) => void;
  openLead: (leadIndex: number) => void;
  closeDrawer: () => void;
}

const CaseFileContext = createContext<CaseFileValue | null>(null);

const DRAWER_KEYS = { exhibit: null, record: null, entity: null } satisfies Patch;

export function CaseFileProvider({
  runId,
  report,
  children,
}: {
  runId: string;
  report: Report;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefFor = useCallback(
    (patch: Patch) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, searchParams],
  );

  const navigate = useCallback(
    (patch: Patch, options?: { replace?: boolean }) => {
      const href = hrefFor(patch);
      if (options?.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [hrefFor, router],
  );

  const value = useMemo<CaseFileValue>(() => {
    const raw = searchParams.get("section");
    const section = SECTIONS.includes(raw as CaseSection) ? (raw as CaseSection) : "findings";

    return {
      runId,
      report,
      section,
      params: new URLSearchParams(searchParams.toString()),
      navigate,
      hrefFor,
      entity: (id) => {
        const known = report.entities[id];
        if (known) return { ...known, known: true };
        return {
          kind: entityKindFromId(id),
          name: id,
          status: "clear",
          signals: [],
          finding_indexes: [],
          lead_index: null,
          known: false,
        };
      },
      openFinding: (findingIndex) =>
        navigate({ section: "findings", finding: String(findingIndex + 1), lead: null, ...DRAWER_KEYS }),
      openExhibit: (findingIndex, exhibitId) =>
        navigate({ section: "findings", finding: String(findingIndex + 1), ...DRAWER_KEYS, exhibit: exhibitId }),
      openRecord: (table, recordId) => navigate({ ...DRAWER_KEYS, record: recordKey(table, recordId) }),
      openEntity: (id) => navigate({ ...DRAWER_KEYS, entity: id }),
      openLead: (leadIndex) =>
        navigate({ section: "leads", lead: String(leadIndex + 1), finding: null, ...DRAWER_KEYS }),
      closeDrawer: () => navigate(DRAWER_KEYS, { replace: true }),
    };
  }, [runId, report, searchParams, navigate, hrefFor]);

  return <CaseFileContext.Provider value={value}>{children}</CaseFileContext.Provider>;
}

export function useCaseFile(): CaseFileValue {
  const value = useContext(CaseFileContext);
  if (!value) throw new Error("useCaseFile debe usarse dentro de CaseFileProvider");
  return value;
}
