/** Textos de la UI de corridas (EXAMPLE §7 y §12). */

import type {
  AgentRole,
  ClosedBy,
  Confidence,
  EntityKind,
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
  efos_match: "RFC en la lista 69-B del SAT",
  no_po: "Facturas sin orden de compra",
  no_contract: "Sin contrato",
  registered_before_invoice: "Alta muy cerca de la primera factura",
  clabe_shared_with_employee: "CLABE igual a la de un empleado",
  clabe_shared_with_vendor: "CLABE igual a la de un proveedor",
  clabe_partial_match: "CLABE parecida a la de un proveedor",
  shared_legal_rep: "Mismo representante legal o domicilio que otro proveedor",
  round_trip: "Parte de un ciclo de dinero",
  incoming_from_vendor: "Depósito entrante de un proveedor",
  threshold_splitting: "Órdenes justo debajo del límite de aprobación",
  payment_mismatch: "Pagos que no cuadran con facturas",
};

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
