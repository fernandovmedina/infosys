/**
 * Escenario `clean_with_leads`: Grupo Alimentario Sierra Madre, sin hallazgos
 * y con 4 leads cerrados con explicación documentada.
 */

import { clearedEfosVendor, creditNoteMismatch, mergeRows, splitOrders } from "./decoys";
import { buildEstate, clabe, type Company, type Row, type VendorSpec } from "./estate";
import type { ScenarioDefinition } from "./types";

const COMPANY: Company = {
  rfc: "GAS050815TN4",
  name: "Grupo Alimentario Sierra Madre SA de CV",
  clabe: clabe("072", "580", "00987654321"),
};

const PERIOD = { from: "2026-01-01", to: "2026-06-30" };

const EFN: VendorSpec = {
  rfc: "EFN120904RA3",
  legal_name: "Empaques Flexibles del Norte SA de CV",
  concept: "Película plástica para empaque",
  registered_at: "2020-10-05",
  bank_clabe: clabe("002", "580", "03344556677"),
  address: "Parque Industrial Stiva, Apodaca, N.L.",
  legal_rep: "Graciela Olvera Nava",
  orders: 9,
  contract: "CT-2026-0012",
  amountRange: [22000, 48000],
};

const TRL: VendorSpec = {
  rfc: "TRL160228PJ6",
  legal_name: "Transportes Refrigerados Lagunero SA de CV",
  concept: "Fletes refrigerados",
  registered_at: "2021-02-14",
  bank_clabe: clabe("014", "320", "08877665544"),
  address: "Blvd. Revolución 1500, Torreón, Coah.",
  legal_rep: "Ramón Lagunero Ibarra",
  orders: 4,
  contract: "CT-2026-0019",
  amountRange: [15000, 30000],
};

const DAV: VendorSpec = {
  rfc: "DAV090513GE8",
  legal_name: "Distribuidora Agroquímica del Valle SA de CV",
  concept: "Insumos de sanitización",
  registered_at: "2017-06-30",
  bank_clabe: clabe("021", "580", "01928374650"),
  address: "Carretera Nacional km 265, Linares, N.L.",
  legal_rep: "Octavio Valle Rangel",
  orders: 3,
  contract: "CT-2026-0023",
  amountRange: [9000, 19000],
};

const EMPLOYEES: Row[] = [
  {
    employee_id: "EMP-0007",
    full_name: "Luis Alberto Garza Treviño",
    rfc: "GATL870922HN1",
    role: "Supervisor de almacén",
    department: "Almacén",
    hire_date: "2016-08-01",
    bank_clabe: clabe("014", "320", "01357924680"),
  },
];

const efn = clearedEfosVendor({ spec: EFN, efos_status: "Desvirtuado", dof_date: "2025-05-09" });

const handRows = mergeRows(
  { efos_list: [efn.efos] },
  splitOrders({
    company: COMPANY,
    vendor: TRL,
    date: "2026-03-09",
    subtotal: 43000,
    concept: "Flete refrigerado Monterrey–CDMX",
    payDays: 12,
    orders: [
      { po_id: "OC-2026-0144", uuid: "INV-2026-0150", txn_id: "TXN-26-00512", plant: "Apodaca", approved_by: "EMP-0003" },
      { po_id: "OC-2026-0145", uuid: "INV-2026-0151", txn_id: "TXN-26-00513", plant: "Saltillo", approved_by: "EMP-0005" },
      { po_id: "OC-2026-0146", uuid: "INV-2026-0152", txn_id: "TXN-26-00514", plant: "Querétaro", approved_by: "EMP-0010" },
    ],
  }),
  creditNoteMismatch({
    company: COMPANY,
    vendor: DAV,
    uuid: "INV-2026-0233",
    date: "2026-04-06",
    subtotal: 64000,
    concept: "Sanitizante grado alimenticio (200 L)",
    credit_subtotal: 8000,
    credit_concept: "Nota de crédito: bonificación por lote fuera de especificación",
    txn_id: "TXN-26-01144",
  }),
);

const estate = buildEstate({
  seed: 11,
  company: COMPANY,
  period: PERIOD,
  vendorCount: 26,
  employeeCount: 18,
  extraVendors: [efn.vendor, TRL, DAV],
  extraEmployees: EMPLOYEES,
  extraRows: handRows,
  unrelatedEfos: 14,
});

const ID = {
  company: `RFC:${COMPANY.rfc}`,
  efn: `RFC:${EFN.rfc}`,
  trl: `RFC:${TRL.rfc}`,
  dav: `RFC:${DAV.rfc}`,
  luis: "EMP:0007",
};

const SHA = "4be1c09f3a7d2e58b6f0a4c1d9e3b7a2f5c8e1d4b7a0c3f6e9d2b5a8c1f4e7d0";

export const cleanWithLeadsScenario: ScenarioDefinition = {
  id: "clean_with_leads",
  label: "Limpio con leads (4 descartados)",
  description: "Sin hallazgos; 4 casos sospechosos investigados y descartados.",
  filename: "sierra_madre_2026.zip",
  sha256: SHA,
  company_name: COMPANY.name,
  estate,
  column_warnings: [],
  final_counters: { llm_calls: 27, mxn_cost: 1.85 },
  events: [
    { at: 1, type: "step", role: "system", message: "Cargando estate", result: "8 tablas, {total_records} registros", result_status: "ok" },
    { at: 3, type: "detector_result", role: "detector", message: "Detector: proveedores en lista EFOS", result: "1 coincidencia", result_status: "warning", entities: [ID.efn] },
    { at: 5, type: "detector_result", role: "detector", message: "Detector: órdenes justo debajo del límite de aprobación", result: "1 grupo", result_status: "warning", entities: [ID.trl] },
    { at: 7, type: "detector_result", role: "detector", message: "Detector: pagos que no cuadran con facturas", result: "1 caso", result_status: "warning", entities: [ID.dav] },
    { at: 9, type: "detector_result", role: "detector", message: "Detector: CLABE compartida entre empleados y proveedores", result: "1 coincidencia parcial", result_status: "warning", entities: [ID.luis] },
    { at: 11, type: "detector_result", role: "detector", message: "Detector: dinero que regresa en círculo", result: "sin ciclos", result_status: "ok" },
    { at: 15, type: "step", role: "investigator", message: `Investigador → consultando estatus 69-B de ${ID.efn}`, tool: "efos_lookup", result: "Desvirtuado", result_status: "ok", entities: [ID.efn] },
    { at: 20, type: "lead_closed", role: "investigator", message: `Lead cerrado: ${ID.efn}`, entity: ID.efn, result: "Desvirtuado en 69-B", result_status: "ok", entities: [ID.efn] },
    { at: 26, type: "step", role: "investigator", message: `Investigador → revisando órdenes de ${ID.trl}`, tool: "po_by_vendor", detail: "3 órdenes el 9 de marzo para 3 plantas", result: "3 órdenes", result_status: "warning", entities: [ID.trl] },
    { at: 31, type: "lead_closed", role: "challenger", message: `Lead cerrado: ${ID.trl}`, entity: ID.trl, result: "Rutas y plantas distintas", result_status: "ok", entities: [ID.trl] },
    { at: 38, type: "step", role: "investigator", message: `Investigador → cruzando facturas y pagos de ${ID.dav}`, tool: "invoice_payment_match", result: "diferencia $9,280.00", result_status: "warning", entities: [ID.dav] },
    { at: 42, type: "lead_closed", role: "validator", message: `Lead cerrado: ${ID.dav}`, entity: ID.dav, result: "Nota de crédito explica la diferencia", result_status: "ok", entities: [ID.dav] },
    { at: 48, type: "lead_closed", role: "investigator", message: `Lead cerrado: ${ID.luis}`, entity: ID.luis, result: "Solo coincide banco y plaza", result_status: "ok", entities: [ID.luis] },
    { at: 51, type: "step", role: "system", message: "Generando case file", result: "listo", result_status: "ok" },
    { at: 54, type: "completed", role: "system", message: "Investigación terminada", result: "0 hallazgos · 4 leads cerrados", result_status: "ok" },
  ],
  report: {
    company_rfc: ID.company,
    audit_period: PERIOD,
    verdict: "clean_with_leads",
    headline:
      "No encontramos fraude comprobable. Revisamos 4 casos sospechosos (un proveedor en la lista 69-B, compras aparentemente fraccionadas, un pago que no cuadraba y una cuenta bancaria parecida a la de un proveedor) y todos tienen explicación documentada.",
    total_exposure: 0,
    submission: {
      seed: 11,
      findings: [],
      leads_not_pursued: [
        {
          entity: ID.efn,
          signal: "Detector de lista EFOS: el RFC aparece en la lista 69-B.",
          reason: "El estatus es \"Desvirtuado\": el proveedor demostró ante el SAT que sus operaciones son reales. Sus 9 facturas tienen orden de compra, contrato vigente (CT-2026-0012) y entradas de almacén.",
          tool_calls_made: ["efos_lookup", "invoices_by_vendor", "po_match", "contract_lookup"],
          closed_by: "investigator",
        },
        {
          entity: ID.trl,
          signal: "Detector de fraccionamiento: tres órdenes de $49,880 el mismo día, justo debajo del límite de $50,000.",
          reason: "Son tres fletes refrigerados con destinos y plantas de origen distintos, cada uno aprobado por el jefe de su planta. Las cartas porte confirman tres viajes independientes.",
          tool_calls_made: ["po_by_vendor", "approver_lookup", "delivery_lookup"],
          closed_by: "challenger",
        },
        {
          entity: ID.dav,
          signal: "Detector de pagos que no cuadran con facturas: se pagaron $9,280 menos de lo facturado.",
          reason: "La diferencia es la nota de crédito INV-2026-0233-NC por $9,280, emitida por un lote fuera de especificación. Con la nota aplicada, el pago cuadra exactamente.",
          tool_calls_made: ["invoice_payment_match", "credit_note_lookup"],
          closed_by: "validator",
        },
        {
          entity: ID.luis,
          signal: "Detector de CLABE compartida: la cuenta de nómina coincide en banco y plaza con la de un proveedor.",
          reason: "Solo coinciden banco (Santander) y plaza; el número de cuenta es distinto. El empleado no aprueba compras ni tiene relación con Transportes Refrigerados Lagunero.",
          tool_calls_made: ["clabe_lookup", "employee_lookup"],
          closed_by: "investigator",
        },
      ],
      run_metadata: {
        llm_calls: 27,
        mxn_cost: 1.85,
        wall_clock_seconds: 54,
        cost_by_role: { investigator: 1.2, challenger: 0.4, validator: 0.25 },
        deterministic: true,
      },
    },
    findings_extra: [],
    entity_details: {
      [ID.company]: { signals: [], kind: "company", is_audited_company: true },
      [ID.efn]: { signals: ["efos_match"] },
      [ID.trl]: { signals: ["threshold_splitting"] },
      [ID.dav]: { signals: ["payment_mismatch"] },
      [ID.luis]: { signals: ["clabe_partial_match"] },
    },
    highlights: {},
    method_and_limits: {
      architecture:
        "Detectores deterministas señalan candidatos a partir de reglas fiscales y contables. Un investigador sigue el dinero con herramientas de consulta sobre las 8 tablas. Un revisor adversarial intenta refutar cada hallazgo. Un validador verifica que la evidencia exista y que el monto reconcilie antes de publicar.",
      out_of_scope: ["Movimientos entre cuentas de terceros: solo se ven las cuentas bancarias de la empresa."],
      cannot_detect: [
        "Pagos en efectivo sin registro contable.",
        "Movimientos entre terceros que no aparecen en bank_txns.",
        "Acuerdos verbales o sobornos que nunca pasan por los libros.",
      ],
      reproduce: {
        seed: 11,
        version: "0.1.0",
        dataset_sha256: SHA,
        command: "uv run investigate --estate sierra_madre_2026.zip --seed 11",
      },
    },
    relations: [{ from: ID.luis, to: ID.trl, label: "Mismo banco y plaza" }],
    lane_notes: [{ entity: ID.trl, lane: "purchase_orders", note: "límite de aprobación $50,000" }],
    extra_annotations: [{ date: "2026-03-09", entity: ID.trl, label: "3 fletes el mismo día, uno por planta" }],
  },
};
