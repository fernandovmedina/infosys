/**
 * Metadatos del schema crudo del estate (tablas, columnas y catálogos SAT).
 *
 * Los nombres técnicos se muestran tal cual en tablas y drawers porque los
 * jueces los leen; la traducción va en tooltip (EXAMPLE §12).
 */

import type { SourceTable } from "./types";

export interface TableMeta {
  /** Nombre en singular para chips y drawers: "Factura". */
  label: string;
  /** Nombre en plural para selectores: "Facturas". */
  plural: string;
  /** Traducción del nombre técnico. */
  description: string;
  idField: string;
  dateField: string;
  /** Columna con monto, si la tabla tiene uno (EXAMPLE §7.6). */
  amountField: string | null;
  columns: string[];
}

export const TABLES: Record<SourceTable, TableMeta> = {
  invoices: {
    label: "Invoice",
    plural: "Invoices",
    description: "Electronic invoices (CFDI) issued and received.",
    idField: "uuid",
    dateField: "issue_date",
    amountField: "total",
    columns: [
      "uuid",
      "issuer_rfc",
      "receiver_rfc",
      "issue_date",
      "subtotal",
      "iva",
      "total",
      "concepto_text",
      "uso_cfdi",
      "forma_pago",
      "metodo_pago",
      "status",
    ],
  },
  bank_txns: {
    label: "Transfer",
    plural: "Payments",
    description: "Bank transactions from the company's accounts.",
    idField: "txn_id",
    dateField: "date",
    amountField: "amount",
    columns: [
      "txn_id",
      "date",
      "from_clabe",
      "to_clabe",
      "amount",
      "reference",
      "channel",
    ],
  },
  ledger: {
    label: "Journal entry",
    plural: "Journal entries",
    description: "General ledger journal entries (accounting).",
    idField: "entry_id",
    dateField: "date",
    amountField: null,
    columns: [
      "entry_id",
      "date",
      "account_code",
      "account_name",
      "debit",
      "credit",
      "description",
      "invoice_uuid",
      "cost_center",
      "approver",
    ],
  },
  purchase_orders: {
    label: "Purchase order",
    plural: "Purchase orders",
    description: "Purchase orders issued to vendors.",
    idField: "po_id",
    dateField: "date",
    amountField: "amount",
    columns: [
      "po_id",
      "vendor_rfc",
      "date",
      "amount",
      "requester",
      "approver",
      "description",
    ],
  },
  contracts: {
    label: "Contract",
    plural: "Contracts",
    description: "Contracts signed with vendors.",
    idField: "contract_id",
    dateField: "start_date",
    amountField: "value",
    columns: ["contract_id", "vendor_rfc", "start_date", "value", "scope_text"],
  },
  vendors: {
    label: "Vendor",
    plural: "Vendors",
    description: "Catalog of registered vendors.",
    idField: "rfc",
    dateField: "registered_date",
    amountField: null,
    columns: [
      "rfc",
      "legal_name",
      "registered_date",
      "address",
      "bank_clabe",
      "category",
      "contact_email",
    ],
  },
  employees: {
    label: "Employee",
    plural: "Employees",
    description: "Employee roster and their payroll accounts.",
    idField: "emp_id",
    dateField: "hire_date",
    amountField: null,
    columns: ["emp_id", "name", "role", "bank_clabe", "hire_date"],
  },
  efos_list: {
    label: "SAT 69-B list",
    plural: "EFOS",
    description:
      "SAT list of taxpayers that invoice simulated transactions (Art. 69-B CFF).",
    idField: "rfc",
    dateField: "publication_date",
    amountField: null,
    columns: ["rfc", "legal_name", "status", "publication_date"],
  },
};

export const TABLE_ORDER: SourceTable[] = [
  "invoices",
  "bank_txns",
  "ledger",
  "purchase_orders",
  "contracts",
  "vendors",
  "employees",
  "efos_list",
];

/** Traducción de cada columna cruda (tooltip). */
export const COLUMN_LABELS: Record<string, string> = {
  uuid: "Invoice tax folio (UUID)",
  issuer_rfc: "RFC of the invoice issuer",
  receiver_rfc: "RFC of the invoice receiver",
  issue_date: "Issue date",
  subtotal: "Subtotal before taxes",
  iva: "Value Added Tax (16%)",
  total: "Invoice total",
  concepto_text: "Invoiced item",
  uso_cfdi: "How the receiver uses the invoice (SAT catalog)",
  forma_pago: "Payment form (SAT catalog)",
  metodo_pago: "Payment method: single payment or installments",
  status: "Invoice status or standing on the 69-B list",
  txn_id: "Bank transaction ID",
  date: "Record date",
  from_clabe: "CLABE of the sending account",
  to_clabe: "CLABE of the receiving account",
  amount: "Amount",
  reference: "Bank reference or memo",
  channel: "Channel: SPEI, check, or cash",
  entry_id: "Journal entry number",
  account_code: "Ledger account",
  account_name: "Ledger account name",
  debit: "Debit",
  credit: "Credit",
  description: "Description",
  invoice_uuid: "Tax folio (UUID) of the related invoice",
  cost_center: "Cost center",
  approver: "Person who approved the record",
  po_id: "Purchase order number",
  vendor_rfc: "Vendor RFC",
  requester: "Person who requested the purchase",
  contract_id: "Contract number",
  start_date: "Effective start date",
  value: "Contract value",
  scope_text: "Scope of contracted services",
  rfc: "Federal Taxpayer Registry (RFC)",
  legal_name: "Legal name",
  registered_date: "Vendor registration date",
  address: "Tax address",
  bank_clabe: "Registered CLABE",
  category: "Vendor category",
  contact_email: "Contact email",
  emp_id: "Employee number",
  name: "Employee name",
  role: "Job title",
  hire_date: "Hire date",
  publication_date: "Publication date in the Official Gazette (DOF)",
};

/** Columnas con montos en pesos. */
export const MONEY_COLUMNS = new Set([
  "subtotal",
  "iva",
  "total",
  "amount",
  "debit",
  "credit",
  "value",
]);

/** Columnas cuyo valor es un RFC, una CLABE o un número de empleado. */
export const RFC_COLUMNS = new Set([
  "issuer_rfc",
  "receiver_rfc",
  "vendor_rfc",
  "rfc",
]);
export const CLABE_COLUMNS = new Set([
  "from_clabe",
  "to_clabe",
  "bank_clabe",
]);
export const EMPLOYEE_COLUMNS = new Set(["emp_id"]);

/** Catálogos SAT y de negocio para tooltips de códigos (EXAMPLE §7.6). */
export const CODE_LABELS: Record<string, Record<string, string>> = {
  uso_cfdi: {
    G01: "Purchase of goods",
    G02: "Returns, discounts, or rebates",
    G03: "General expenses",
    I04: "Computer equipment and accessories",
    I08: "Other machinery and equipment",
    S01: "No tax effects",
    CP01: "Payments",
  },
  forma_pago: {
    "01": "Cash",
    "02": "Nominative check",
    "03": "Electronic funds transfer",
    "04": "Credit card",
    "28": "Debit card",
    "99": "To be defined",
  },
  metodo_pago: {
    PUE: "Single payment",
    PPD: "Installment or deferred payment",
  },
  status: {
    vigente: "The invoice is valid with the SAT",
    cancelado: "The invoice was canceled with the SAT",
    definitivo: "The SAT confirmed it invoices nonexistent transactions",
    presunto:
      "The SAT presumes it invoices simulated transactions; the taxpayer can contest it",
    desvirtuado:
      "The taxpayer proved its transactions are real and cleared its status",
    "sentencia favorable":
      "A court ruled in the taxpayer's favor; it is no longer presumed to simulate transactions",
  },
  channel: {
    SPEI: "Interbank electronic transfer",
    cheque: "Check payment",
    efectivo: "Cash payment",
  },
};

export function codeLabel(
  column: string,
  value: string | number | null,
): string | null {
  if (value === null) return null;
  return CODE_LABELS[column]?.[String(value)] ?? null;
}

/** Llave de `Report.records`: `"invoices:<uuid>"`. */
export function recordKey(table: SourceTable, recordId: string): string {
  return `${table}:${recordId}`;
}

export function parseRecordKey(
  key: string,
): { table: SourceTable; recordId: string } | null {
  const index = key.indexOf(":");
  if (index <= 0) return null;
  const table = key.slice(0, index) as SourceTable;
  if (!(table in TABLES)) return null;
  return { table, recordId: key.slice(index + 1) };
}

/** Id de entidad a partir del valor crudo de una columna. */
export function entityIdFromValue(column: string, value: string): string | null {
  if (RFC_COLUMNS.has(column)) return `RFC:${value}`;
  if (EMPLOYEE_COLUMNS.has(column)) {
    return value.startsWith("EMP:") ? value : `EMP:${value}`;
  }
  if (CLABE_COLUMNS.has(column)) return `CLABE:${value}`;
  return null;
}
