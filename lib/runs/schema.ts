/**
 * Metadatos del schema del estate (tablas, columnas y catálogos SAT).
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
      "uuid", "issuer_rfc", "receiver_rfc", "issue_date", "subtotal", "iva", "total",
      "concepto_text", "uso_cfdi", "forma_pago", "metodo_pago", "status",
    ],
  },
  bank_txns: {
    label: "Transferencia",
    plural: "Pagos",
    description: "Movimientos bancarios de las cuentas de la empresa.",
    idField: "txn_id",
    dateField: "txn_date",
    amountField: "amount",
    columns: [
      "txn_id", "txn_date", "direction", "amount", "channel", "origin_clabe",
      "beneficiary_clabe", "counterparty_rfc", "reference", "status",
    ],
  },
  ledger: {
    label: "Póliza contable",
    plural: "Pólizas",
    description: "Pólizas del libro mayor (contabilidad).",
    idField: "entry_id",
    dateField: "entry_date",
    amountField: null,
    columns: [
      "entry_id", "entry_date", "account_code", "account_name", "debit", "credit",
      "counterparty_rfc", "description", "source_ref",
    ],
  },
  purchase_orders: {
    label: "Orden de compra",
    plural: "Órdenes de compra",
    description: "Órdenes de compra aprobadas o canceladas.",
    idField: "po_id",
    dateField: "po_date",
    amountField: "amount",
    columns: ["po_id", "po_date", "vendor_rfc", "amount", "description", "plant", "approved_by", "status"],
  },
  contracts: {
    label: "Contrato",
    plural: "Contratos",
    description: "Contratos firmados con proveedores.",
    idField: "contract_id",
    dateField: "start_date",
    amountField: "value",
    columns: ["contract_id", "vendor_rfc", "start_date", "end_date", "value", "scope", "status"],
  },
  vendors: {
    label: "Proveedor",
    plural: "Proveedores",
    description: "Catálogo de proveedores dados de alta.",
    idField: "rfc",
    dateField: "registered_at",
    amountField: null,
    columns: ["rfc", "legal_name", "registered_at", "bank_clabe", "address", "legal_rep", "status"],
  },
  employees: {
    label: "Empleado",
    plural: "Empleados",
    description: "Plantilla de empleados y sus cuentas de nómina.",
    idField: "employee_id",
    dateField: "hire_date",
    amountField: null,
    columns: ["employee_id", "full_name", "rfc", "role", "department", "hire_date", "bank_clabe"],
  },
  efos_list: {
    label: "Lista SAT 69-B",
    plural: "EFOS",
    description: "Lista del SAT de contribuyentes que facturan operaciones simuladas (Art. 69-B CFF).",
    idField: "rfc",
    dateField: "dof_date",
    amountField: null,
    columns: ["rfc", "legal_name", "efos_status", "dof_date"],
  },
};

export const TABLE_ORDER: SourceTable[] = [
  "invoices", "bank_txns", "ledger", "purchase_orders", "contracts", "vendors", "employees", "efos_list",
];

/** Traducción de cada columna (tooltip). */
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
  status: "Estatus del registro",
  txn_id: "Identificador del movimiento bancario",
  txn_date: "Fecha del movimiento",
  direction: "Salida o entrada de dinero",
  amount: "Monto",
  channel: "Medio: SPEI, cheque o efectivo",
  origin_clabe: "CLABE de la cuenta que envía",
  beneficiary_clabe: "CLABE de la cuenta que recibe",
  counterparty_rfc: "RFC de la contraparte",
  reference: "Referencia o concepto bancario",
  entry_id: "Número de póliza",
  entry_date: "Fecha de la póliza",
  account_code: "Cuenta contable",
  account_name: "Nombre de la cuenta contable",
  debit: "Cargo",
  credit: "Abono",
  description: "Descripción",
  source_ref: "Documento que origina el registro",
  po_id: "Número de orden de compra",
  po_date: "Fecha de la orden",
  vendor_rfc: "RFC del proveedor",
  plant: "Planta o centro de costos",
  approved_by: "Empleado que aprobó",
  contract_id: "Número de contrato",
  start_date: "Inicio de vigencia",
  end_date: "Fin de vigencia",
  value: "Valor del contrato",
  scope: "Alcance de los servicios contratados",
  rfc: "Registro Federal de Contribuyentes",
  legal_name: "Razón social",
  registered_at: "Fecha de alta como proveedor",
  bank_clabe: "CLABE registrada",
  address: "Domicilio fiscal",
  legal_rep: "Representante legal",
  employee_id: "Número de empleado",
  full_name: "Nombre completo",
  role: "Puesto",
  department: "Área",
  hire_date: "Fecha de ingreso",
  efos_status: "Situación en la lista 69-B",
  dof_date: "Fecha de publicación en el Diario Oficial",
};

/** Columnas con montos en pesos. */
export const MONEY_COLUMNS = new Set(["subtotal", "iva", "total", "amount", "debit", "credit", "value"]);

/** Columnas cuyo valor es un RFC, una CLABE o un número de empleado. */
export const RFC_COLUMNS = new Set(["issuer_rfc", "receiver_rfc", "counterparty_rfc", "vendor_rfc", "rfc"]);
export const CLABE_COLUMNS = new Set(["origin_clabe", "beneficiary_clabe", "bank_clabe"]);
export const EMPLOYEE_COLUMNS = new Set(["employee_id", "approved_by"]);

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
    liquidada: "El movimiento se completó",
    aprobada: "Orden aprobada",
    cancelada: "Orden cancelada",
    activo: "Proveedor activo",
    vigente_contrato: "Contrato vigente",
  },
  efos_status: {
    Presunto: "El SAT presume que factura operaciones simuladas; el contribuyente puede aclarar.",
    Desvirtuado: "El contribuyente demostró que sus operaciones son reales. Ya limpió su situación.",
    Definitivo: "El SAT confirmó que factura operaciones inexistentes.",
    "Sentencia Favorable": "Un tribunal le dio la razón al contribuyente. Ya no se presume que simule operaciones.",
  },
  channel: {
    SPEI: "Transferencia electrónica interbancaria",
    cheque: "Pago con cheque",
    efectivo: "Pago en efectivo",
  },
  direction: {
    salida: "Dinero que sale de la empresa",
    entrada: "Dinero que entra a la empresa",
  },
};

export function codeLabel(column: string, value: string | number | null): string | null {
  if (value === null) return null;
  return CODE_LABELS[column]?.[String(value)] ?? null;
}

/** Llave de `Report.records`: `"invoices:INV-00001"`. */
export function recordKey(table: SourceTable, recordId: string): string {
  return `${table}:${recordId}`;
}

export function parseRecordKey(key: string): { table: SourceTable; recordId: string } | null {
  const index = key.indexOf(":");
  if (index <= 0) return null;
  const table = key.slice(0, index) as SourceTable;
  if (!(table in TABLES)) return null;
  return { table, recordId: key.slice(index + 1) };
}

/** Id de entidad a partir del valor crudo de una columna. */
export function entityIdFromValue(column: string, value: string): string | null {
  if (RFC_COLUMNS.has(column)) return `RFC:${value}`;
  if (EMPLOYEE_COLUMNS.has(column)) return `EMP:${value.replace(/^EMP-/, "")}`;
  if (CLABE_COLUMNS.has(column)) return `CLABE:${value}`;
  return null;
}
