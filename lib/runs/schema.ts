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
    label: "Factura",
    plural: "Facturas",
    description: "Facturas electrónicas (CFDI) emitidas y recibidas.",
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
    label: "Transferencia",
    plural: "Pagos",
    description: "Movimientos bancarios de las cuentas de la empresa.",
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
    label: "Póliza contable",
    plural: "Pólizas",
    description: "Pólizas del libro mayor (contabilidad).",
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
    label: "Orden de compra",
    plural: "Órdenes de compra",
    description: "Órdenes de compra emitidas a proveedores.",
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
    label: "Contrato",
    plural: "Contratos",
    description: "Contratos firmados con proveedores.",
    idField: "contract_id",
    dateField: "start_date",
    amountField: "value",
    columns: ["contract_id", "vendor_rfc", "start_date", "value", "scope_text"],
  },
  vendors: {
    label: "Proveedor",
    plural: "Proveedores",
    description: "Catálogo de proveedores dados de alta.",
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
    label: "Empleado",
    plural: "Empleados",
    description: "Plantilla de empleados y sus cuentas de nómina.",
    idField: "emp_id",
    dateField: "hire_date",
    amountField: null,
    columns: ["emp_id", "name", "role", "bank_clabe", "hire_date"],
  },
  efos_list: {
    label: "Lista SAT 69-B",
    plural: "EFOS",
    description:
      "Lista del SAT de contribuyentes que facturan operaciones simuladas (Art. 69-B CFF).",
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
  uuid: "Folio fiscal de la factura",
  issuer_rfc: "RFC de quien emite la factura",
  receiver_rfc: "RFC de quien recibe la factura",
  issue_date: "Fecha de emisión",
  subtotal: "Subtotal antes de impuestos",
  iva: "Impuesto al Valor Agregado (16 %)",
  total: "Total de la factura",
  concepto_text: "Concepto facturado",
  uso_cfdi: "Uso que el receptor da a la factura (catálogo SAT)",
  forma_pago: "Forma de pago (catálogo SAT)",
  metodo_pago: "Método de pago: en una exhibición o en parcialidades",
  status: "Estatus de la factura o situación en la lista 69-B",
  txn_id: "Identificador del movimiento bancario",
  date: "Fecha del registro",
  from_clabe: "CLABE de la cuenta que envía",
  to_clabe: "CLABE de la cuenta que recibe",
  amount: "Monto",
  reference: "Referencia o concepto bancario",
  channel: "Medio: SPEI, cheque o efectivo",
  entry_id: "Número de póliza",
  account_code: "Cuenta contable",
  account_name: "Nombre de la cuenta contable",
  debit: "Cargo",
  credit: "Abono",
  description: "Descripción",
  invoice_uuid: "Folio fiscal de la factura relacionada",
  cost_center: "Centro de costos",
  approver: "Persona que aprobó el registro",
  po_id: "Número de orden de compra",
  vendor_rfc: "RFC del proveedor",
  requester: "Persona que solicitó la compra",
  contract_id: "Número de contrato",
  start_date: "Inicio de vigencia",
  value: "Valor del contrato",
  scope_text: "Alcance de los servicios contratados",
  rfc: "Registro Federal de Contribuyentes",
  legal_name: "Razón social",
  registered_date: "Fecha de alta como proveedor",
  address: "Domicilio fiscal",
  bank_clabe: "CLABE registrada",
  category: "Categoría del proveedor",
  contact_email: "Correo de contacto",
  emp_id: "Número de empleado",
  name: "Nombre del empleado",
  role: "Puesto",
  hire_date: "Fecha de ingreso",
  publication_date: "Fecha de publicación en el Diario Oficial",
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
    G01: "Adquisición de mercancías",
    G02: "Devoluciones, descuentos o bonificaciones",
    G03: "Gastos en general",
    I04: "Equipo de cómputo y accesorios",
    I08: "Otra maquinaria y equipo",
    S01: "Sin efectos fiscales",
    CP01: "Pagos",
  },
  forma_pago: {
    "01": "Efectivo",
    "02": "Cheque nominativo",
    "03": "Transferencia electrónica de fondos",
    "04": "Tarjeta de crédito",
    "28": "Tarjeta de débito",
    "99": "Por definir",
  },
  metodo_pago: {
    PUE: "Pago en una sola exhibición",
    PPD: "Pago en parcialidades o diferido",
  },
  status: {
    vigente: "La factura es válida ante el SAT",
    cancelado: "La factura fue cancelada ante el SAT",
    definitivo: "El SAT confirmó que factura operaciones inexistentes",
    presunto:
      "El SAT presume que factura operaciones simuladas; el contribuyente puede aclarar",
    desvirtuado:
      "El contribuyente demostró que sus operaciones son reales y aclaró su situación",
    "sentencia favorable":
      "Un tribunal dio la razón al contribuyente; ya no se presume que simule operaciones",
  },
  channel: {
    SPEI: "Transferencia electrónica interbancaria",
    cheque: "Pago con cheque",
    efectivo: "Pago en efectivo",
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
