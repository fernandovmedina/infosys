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
    label: "Proveedor fantasma",
    tooltip: "Un proveedor que cobra por trabajos o productos que nunca se entregaron.",
  },
  kickback: {
    label: "Moche / soborno",
    tooltip:
      "Un pago inflado a un proveedor, que regresa parte del dinero a alguien de la empresa, normalmente por una empresa fachada.",
  },
  round_tripping: {
    label: "Dinero en círculo",
    tooltip: "El dinero sale de la empresa, pasa por terceros y regresa, para simular operaciones.",
  },
  threshold_splitting: {
    label: "Fraccionamiento",
    tooltip: "Una compra grande partida en varias pequeñas para no pasar el límite de aprobación.",
  },
  revenue_inflation: {
    label: "Ventas infladas",
    tooltip: "Ventas registradas que no ocurrieron, para aparentar más ingresos.",
  },
};

export const CONFIDENCE_LABELS: Record<Confidence, { label: string; tooltip: string }> = {
  proven: {
    label: "Comprobado",
    tooltip: "La evidencia demuestra el esquema y el monto cuadra con los registros.",
  },
  probable: {
    label: "Probable",
    tooltip:
      "La evidencia apunta con fuerza al esquema, pero falta un eslabón (por ejemplo, un movimiento bancario de un tercero no visible).",
  },
};

export const CLOSED_BY_LABELS: Record<ClosedBy, { icon: string; label: string }> = {
  investigator: { icon: "🕵️", label: "Investigador" },
  challenger: { icon: "⚔️", label: "Revisor adversarial" },
  validator: { icon: "✅", label: "Validador (la evidencia no cuadró)" },
};

export const ROLE_LABELS: Record<AgentRole, { icon: string; label: string }> = {
  system: { icon: "●", label: "Sistema" },
  detector: { icon: "🔎", label: "Detector" },
  investigator: { icon: "🕵️", label: "Investigador" },
  challenger: { icon: "⚔️", label: "Challenger" },
  validator: { icon: "✅", label: "Validator" },
};

export const STATUS_LABELS: Record<EntityStatus, { label: string; description: string }> = {
  accused: { label: "Acusado", description: "Aparece en al menos un hallazgo: hay prueba." },
  declined: { label: "Descartado", description: "Se investigó y no se sostuvo." },
  clear: { label: "Sin señales", description: "Ningún detector la señaló." },
};

export const KIND_LABELS: Record<EntityKind, { icon: string; label: string }> = {
  company: { icon: "🏢", label: "Empresa auditada" },
  vendor: { icon: "🏭", label: "Proveedor" },
  employee: { icon: "👤", label: "Empleado" },
  account: { icon: "🏦", label: "Cuenta bancaria" },
  unknown: { icon: "❔", label: "Tercero desconocido" },
};

export const RUN_STATUS_LABELS: Record<RunStatus, string> = {
  validating: "Validando",
  ready: "Lista para iniciar",
  running: "Investigando",
  completed: "Terminada",
  failed: "Falló",
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  fraud_proven: "Fraude comprobado",
  fraud_probable: "Indicios de fraude",
  clean_with_leads: "Sin fraude (casos descartados)",
  clean: "Sin señales de fraude",
};

/** Señales de detectores (`Entity.signals`). Si llega una desconocida se muestra la clave. */
export const SIGNAL_LABELS: Record<string, string> = {
  EFOS_DIRECT_MATCH: "Proveedor confirmado como EFOS definitivo",
  EFOS_PRESUNTO_MATCH: "Proveedor investigado como posible EFOS",
  EFOS_POST_DATED: "Factura anterior a la publicación del EFOS",
  VENDOR_SHORT_LIFECYCLE: "Proveedor facturó poco después de su alta",
  INVOICE_NO_PO_NO_CONTRACT: "Factura sin orden de compra ni contrato",
  SHARED_CLABE_MULTI_RFC: "Varios proveedores comparten la misma CLABE",
  OUTBOUND_TO_SUSPECT_ENTITY: "Pago a un EFOS o una CLABE compartida",
  PAYMENT_TO_EMPLOYEE_ACCOUNT: "Pago directo a la cuenta de un empleado",
  APPROVER_VENDOR_CONCENTRATION: "Aprobador concentrado en un proveedor",
  NO_SEGREGATION_OF_DUTIES: "La misma persona solicitó y aprobó la compra",
  PRICE_OUTLIER_BY_CATEGORY: "Precio atípico para la categoría del proveedor",
  BANK_CYCLE_2NODE: "El dinero regresó desde una segunda cuenta",
  BANK_CYCLE_NNODE: "El dinero regresó tras pasar por varias cuentas",
  CYCLE_LEAKAGE_RATE: "Ciclos repetidos con una comisión pequeña",
  INVOICE_BIDIRECTIONAL: "Empresas con facturas recíprocas similares",
  BANK_TXN_NOT_IN_LEDGER: "Movimiento bancario sin asiento contable",
  PO_NEAR_THRESHOLD: "Orden de compra justo debajo del límite",
  PO_WINDOW_SUM_SPLIT: "Órdenes cercanas que juntas superan el límite",
  BANK_TXN_WINDOW_SPLIT: "Pagos cercanos fraccionados para evadir el límite",
  SAME_APPROVER_SPLIT: "Un aprobador fraccionó órdenes al mismo proveedor",
  CONTRACT_SPLIT_INTO_POS: "Contrato dividido en varias órdenes de compra",
  BENFORD_DEVIATION_TOTAL: "Totales de facturas se desvían de la ley de Benford",
  BENFORD_DEVIATION_BANK: "Montos bancarios se desvían de la ley de Benford",
  INVOICE_NO_COLLECTION: "Factura de venta sin cobro",
  AR_AGING_EXCESSIVE: "Cuenta por cobrar vencida sin cobro",
  PERIOD_END_SPIKE: "Pico de facturación al cierre del periodo",
  RECEIVER_NO_PAYMENT_HISTORY: "Receptor sin historial de pagos",
  INFLATE_AND_CANCEL: "Factura cancelada sin reversión contable",
  RECEIVER_IN_EFOS: "Receptor de la factura aparece en la lista EFOS",
  LEDGER_UNBALANCED_ENTRY: "Póliza con cargos y abonos descuadrados",
  ORPHAN_INVOICE_UUID: "Póliza vinculada a una factura inexistente",
  MALFORMED_RFC: "RFC con formato inválido",
  CLABE_INVALID_LENGTH: "CLABE que no tiene 18 dígitos",
};

/** Claves de una lista de señales separada por comas (`LeadNotPursued.signal`). */
export function splitSignals(signal: string): string[] {
  return signal.split(",").map((key) => key.trim()).filter(Boolean);
}

/** Glosario del header (EXAMPLE §12). */
export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "SAT", definition: "Servicio de Administración Tributaria: la autoridad fiscal de México." },
  { term: "69-B", definition: "Artículo del Código Fiscal de la Federación sobre empresas que facturan operaciones que no existen." },
  { term: "EFOS", definition: "Empresas que Facturan Operaciones Simuladas. Estar en la lista no siempre es culpa: Desvirtuado y Sentencia Favorable significan que ya limpiaron su situación." },
  { term: "CFDI", definition: "Comprobante Fiscal Digital por Internet: la factura electrónica." },
  { term: "RFC", definition: "Registro Federal de Contribuyentes: la clave fiscal de una persona o empresa." },
  { term: "CLABE", definition: "Clave Bancaria Estandarizada de 18 dígitos que identifica una cuenta." },
  { term: "SPEI", definition: "Sistema de Pagos Electrónicos Interbancarios: transferencias entre bancos." },
  { term: "PUE / PPD", definition: "Método de pago de una factura: en una sola exhibición (PUE) o en parcialidades (PPD)." },
  { term: "IVA", definition: "Impuesto al Valor Agregado, normalmente 16 %." },
  { term: "Moche", definition: "Parte de un pago que regresa en secreto a alguien de la empresa." },
  { term: "Exhibit", definition: "Registro citado como evidencia (EX-01, EX-02…)." },
  { term: "Money trail", definition: "Rastro del dinero: de dónde salió, por dónde pasó y a dónde llegó." },
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
