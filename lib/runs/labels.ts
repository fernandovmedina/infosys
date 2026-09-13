/** Textos de la UI de corridas (EXAMPLE §7 y §12). */

import type {
  AgentRole,
  ClosedBy,
  Confidence,
  EntityKind,
  Entity,
  EntityStatus,
  RunStatus,
  SchemeType,
  Verdict,
} from "./types";

export const SCHEME_LABELS: Record<SchemeType, { label: string; tooltip: string }> = {
  phantom_vendor: {
    label: "Phantom vendor",
    tooltip: "A vendor that bills for work or goods that were never delivered.",
  },
  kickback: {
    label: "Kickback / bribe",
    tooltip:
      "An inflated payment to a vendor that sends part of the money back to someone inside the company, usually through a shell company.",
  },
  round_tripping: {
    label: "Round-tripping",
    tooltip: "Money leaves the company, passes through third parties, and comes back to simulate transactions.",
  },
  threshold_splitting: {
    label: "Threshold splitting",
    tooltip: "A large purchase split into several small ones to stay under the approval limit.",
  },
  revenue_inflation: {
    label: "Revenue inflation",
    tooltip: "Recorded sales that never happened, to make revenue look higher.",
  },
};

export const CONFIDENCE_LABELS: Record<Confidence, { label: string; tooltip: string }> = {
  proven: {
    label: "Proven",
    tooltip: "The evidence demonstrates the scheme and the amount reconciles with the records.",
  },
  probable: {
    label: "Probable",
    tooltip:
      "The evidence strongly points to the scheme, but a link is missing (for example, a bank transaction from a third party that isn't visible).",
  },
};

export const CLOSED_BY_LABELS: Record<ClosedBy, { icon: string; label: string }> = {
  investigator: { icon: "🕵️", label: "Investigator" },
  challenger: { icon: "⚔️", label: "Adversarial reviewer" },
  validator: { icon: "✅", label: "Validator (the evidence didn't reconcile)" },
};

export const ROLE_LABELS: Record<AgentRole, { icon: string; label: string }> = {
  system: { icon: "●", label: "System" },
  detector: { icon: "🔎", label: "Detector" },
  investigator: { icon: "🕵️", label: "Investigator" },
  challenger: { icon: "⚔️", label: "Challenger" },
  validator: { icon: "✅", label: "Validator" },
};

export const STATUS_LABELS: Record<EntityStatus, { label: string; description: string }> = {
  accused: { label: "Accused", description: "Appears in at least one finding: there is proof." },
  declined: { label: "Dismissed", description: "It was investigated and didn't hold up." },
  clear: { label: "No signals", description: "No detector flagged it." },
};

export const KIND_LABELS: Record<EntityKind, { icon: string; label: string }> = {
  company: { icon: "🏢", label: "Audited company" },
  vendor: { icon: "🏭", label: "Vendor" },
  employee: { icon: "👤", label: "Employee" },
  account: { icon: "🏦", label: "Bank account" },
  unknown: { icon: "❔", label: "Unknown third party" },
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  validating: "Validating",
  ready: "Ready to start",
  running: "Investigating",
  completed: "Completed",
  failed: "Failed",
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  fraud_proven: "Fraud proven",
  fraud_probable: "Signs of fraud",
  clean_with_leads: "No fraud (leads dismissed)",
  clean: "No signs of fraud",
};

/** Señales de detectores (`Entity.signals`). Si llega una desconocida se muestra la clave. */
export const SIGNAL_LABELS: Record<string, string> = {
  EFOS_DIRECT_MATCH: "Vendor confirmed as a definitive EFOS",
  EFOS_PRESUNTO_MATCH: "Vendor under investigation as a possible EFOS",
  EFOS_POST_DATED: "Invoice predates the EFOS publication",
  VENDOR_SHORT_LIFECYCLE: "Vendor invoiced shortly after registration",
  INVOICE_NO_PO_NO_CONTRACT: "Invoice with no purchase order or contract",
  SHARED_CLABE_MULTI_RFC: "Several vendors share the same CLABE",
  OUTBOUND_TO_SUSPECT_ENTITY: "Payment to an EFOS or a shared CLABE",
  PAYMENT_TO_EMPLOYEE_ACCOUNT: "Direct payment to an employee's account",
  APPROVER_VENDOR_CONCENTRATION: "Approver concentrated on one vendor",
  NO_SEGREGATION_OF_DUTIES: "The same person requested and approved the purchase",
  PRICE_OUTLIER_BY_CATEGORY: "Unusual price for the vendor's category",
  BANK_CYCLE_2NODE: "Money came back from a second account",
  BANK_CYCLE_NNODE: "Money came back after passing through several accounts",
  CYCLE_LEAKAGE_RATE: "Repeated cycles with a small fee",
  INVOICE_BIDIRECTIONAL: "Companies with similar reciprocal invoices",
  BANK_TXN_NOT_IN_LEDGER: "Bank transaction with no ledger entry",
  PO_NEAR_THRESHOLD: "Purchase order just below the limit",
  PO_WINDOW_SUM_SPLIT: "Nearby orders that together exceed the limit",
  BANK_TXN_WINDOW_SPLIT: "Nearby payments split to evade the limit",
  SAME_APPROVER_SPLIT: "An approver split orders to the same vendor",
  CONTRACT_SPLIT_INTO_POS: "Contract split into several purchase orders",
  BENFORD_DEVIATION_TOTAL: "Invoice totals deviate from Benford's law",
  BENFORD_DEVIATION_BANK: "Bank amounts deviate from Benford's law",
  INVOICE_NO_COLLECTION: "Sales invoice never collected",
  AR_AGING_EXCESSIVE: "Overdue receivable never collected",
  PERIOD_END_SPIKE: "Invoicing spike at period end",
  RECEIVER_NO_PAYMENT_HISTORY: "Receiver with no payment history",
  INFLATE_AND_CANCEL: "Canceled invoice with no accounting reversal",
  RECEIVER_IN_EFOS: "Invoice receiver appears on the EFOS list",
  LEDGER_UNBALANCED_ENTRY: "Journal entry with unbalanced debits and credits",
  ORPHAN_INVOICE_UUID: "Journal entry linked to a nonexistent invoice",
  MALFORMED_RFC: "RFC with an invalid format",
  CLABE_INVALID_LENGTH: "CLABE that isn't 18 digits long",
};

/** Claves de una lista de señales separada por comas (`LeadNotPursued.signal`). */
export function splitSignals(signal: string): string[] {
  return signal.split(",").map((key) => key.trim()).filter(Boolean);
}

/** Glosario del header (EXAMPLE §12). */
export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "SAT", definition: "Servicio de Administración Tributaria: Mexico's tax authority." },
  { term: "69-B", definition: "Article of the Federal Tax Code about companies that invoice transactions that don't exist." },
  { term: "EFOS", definition: "Empresas que Facturan Operaciones Simuladas (companies that invoice simulated transactions). Being on the list doesn't always mean guilt: Desvirtuado and Sentencia Favorable mean they have cleared their status." },
  { term: "CFDI", definition: "Comprobante Fiscal Digital por Internet: the electronic invoice." },
  { term: "RFC", definition: "Registro Federal de Contribuyentes: the tax ID of a person or company." },
  { term: "CLABE", definition: "Clave Bancaria Estandarizada: an 18-digit code that identifies a bank account." },
  { term: "SPEI", definition: "Sistema de Pagos Electrónicos Interbancarios: transfers between banks." },
  { term: "PUE / PPD", definition: "An invoice's payment method: single payment (PUE) or installments (PPD)." },
  { term: "IVA", definition: "Impuesto al Valor Agregado: value added tax, usually 16%." },
  { term: "Kickback", definition: "Part of a payment secretly returned to someone inside the company." },
  { term: "Exhibit", definition: "A record cited as evidence (EX-01, EX-02…)." },
  { term: "Money trail", definition: "Where the money came from, where it passed through, and where it ended up." },
];

export function entityKindFromId(id: string): EntityKind {
  if (id.startsWith("EMP:")) return "employee";
  if (id.startsWith("CLABE:")) return "account";
  if (id.startsWith("RFC:")) return "vendor";
  return "unknown";
}

/** Partes de un endpoint oficial que agrupa dueños de una misma cuenta. */
export function splitEntityEndpoint(endpoint: string): string[] {
  return endpoint.split(" / ").filter(Boolean);
}

/**
 * Resuelve un endpoint del money trail sin alterar su string oficial.
 * La primera entidad conocida gobierna estado, tipo y navegación; el nombre
 * conserva a todos los dueños en el mismo orden.
 */
export function resolveEntityEndpoint(
  endpoint: string,
  entities: Record<string, Entity>,
): { entityId: string | null; name: string } {
  const constituents = splitEntityEndpoint(endpoint);
  return {
    entityId: constituents.find((id) => Boolean(entities[id])) ?? null,
    name: constituents.map((id) => entities[id]?.name ?? id).join(" / "),
  };
}
