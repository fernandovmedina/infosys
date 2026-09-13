"use client";

import type { FindingExtra } from "@/lib/runs/types";
import { CaseEntityChip, ExhibitChip } from "./case-chips";
import { RichText } from "./rich-text";
import { Icon } from "./ui";

/** Revisión adversarial, colapsada por defecto (EXAMPLE §7.4). Sin revisión no se muestra nada. */
export function AdversarialReview({
  findingIndex,
  review,
}: {
  findingIndex: number;
  review: FindingExtra["adversarial_review"];
}) {
  if (!review) return null;
  const survived = review.outcome === "survived";
  const render = (text: string) => (
    <RichText
      text={text}
      renderEntity={(id) => <CaseEntityChip id={id} />}
      renderExhibit={(exhibitId) => <ExhibitChip findingIndex={findingIndex} exhibitId={exhibitId} />}
    />
  );

  return (
    <details className="group rounded-md border border-zinc-200 bg-white">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-900 marker:content-none sm:px-4">
        <span aria-hidden>⚔</span>
        {survived ? "Revisión adversarial: el hallazgo resistió" : "Revisión adversarial: el hallazgo se degradó a probable"}
        <Icon name="chevronDown" className="ml-auto h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" />
      </summary>
      <ol className="space-y-3 border-t border-zinc-200 px-3 py-3 text-sm sm:px-4">
        <li>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Argumento del revisor</p>
          <p className="mt-1 text-zinc-800">“{render(review.argument)}”</p>
        </li>
        <li>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {survived ? "Por qué sobrevivió" : "Respuesta"}
          </p>
          <p className="mt-1 text-zinc-800">“{render(review.rebuttal)}”</p>
        </li>
        <li className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium ${survived ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-800"}`}>
          <Icon name={survived ? "checkCircle" : "alert"} className="h-4 w-4" />
          {survived ? "Resultado: el hallazgo se mantiene" : "Resultado: se publica como probable"}
        </li>
      </ol>
    </details>
  );
}
