/**
 * Escenario `fraud`: Industrias Norte SA de CV, enero–junio 2026.
 *
 * - Hallazgo #1 (proven, phantom_vendor): Consultores AMSA cobra $139,200 por
 *   asesoría inexistente y el dinero cae en la CLABE del gerente de compras.
 * - Hallazgo #2 (probable, round_tripping): $580,000 salen a Servicios
 *   Logísticos del Bajío y regresan $566,100 desde Consultores AMSA como
 *   "ventas". Ciclo real INO → SLB → CAM → INO.
 * - Ambos comparten RFC:CAM190305K41 (esquemas entrelazados).
 * - 5 leads cerrados por investigador, challenger y validator; uno sin
 *   `tool_calls_made`.
 */

import { formatClabe } from "../../format";
import { clearedEfosVendor, creditNoteMismatch, mergeRows, refundedAdvance, splitOrders } from "./decoys";
import { buildEstate, clabe, type Company, type Row, type VendorSpec } from "./estate";
import type { ScenarioDefinition } from "./types";

const COMPANY: Company = {
  rfc: "INO920101AB1",
  name: "Industrias Norte SA de CV",
  clabe: clabe("012", "580", "00112233445"),
};

const PERIOD = { from: "2026-01-01", to: "2026-06-30" };

// Entidades del esquema ---------------------------------------------------
const CAM = "CAM190305K41";
const SLB = "SLB190822QK7";
const CAM_CLABE = clabe("012", "180", "01556644334");
const SLB_CLABE = clabe("030", "580", "00918273645");
const SHARED_ADDRESS = "Av. Insurgentes Sur 1602, Int. 804, Col. Crédito Constructor, Benito Juárez, CDMX";
const SHARED_REP = "Rogelio Méndez Ávila";

// Decoys ------------------------------------------------------------------
const PEL: VendorSpec = {
  rfc: "PEL790312XY1",
  legal_name: "Peláez Logística SA de CV",
  concept: "Fletes y maniobras de carga",
  registered_at: "2021-04-19",
  bank_clabe: clabe("072", "580", "01122334455"),
  address: "Carretera a Laredo km 12.5, Escobedo, N.L.",
  legal_rep: "Arturo Peláez Olvera",
  orders: 14,
  contract: "CT-2026-0031",
  amountRange: [18000, 42000],
};

const GHM: VendorSpec = {
  rfc: "GHM150617RT9",
  legal_name: "Grupo Hidráulico Monterrey SA de CV",
  concept: "Bombas y refacciones hidráulicas",
  registered_at: "2019-09-02",
  bank_clabe: clabe("012", "180", "07788990011"),
  address: "Av. Ruiz Cortines 3100, Monterrey, N.L.",
  legal_rep: "Silvia Montemayor Leal",
  orders: 3,
  contract: "CT-2026-0044",
  amountRange: [12000, 26000],
};

const TEC: VendorSpec = {
  rfc: "TEC080229HB5",
  legal_name: "Tecnologías Cumbre SA de CV",
  concept: "Licencias y soporte de ERP",
  registered_at: "2018-01-22",
  bank_clabe: clabe("014", "580", "60012345678"),
  address: "Av. Lázaro Cárdenas 2400, San Pedro Garza García, N.L.",
  legal_rep: "Mauricio Cumbre Salas",
  orders: 2,
  contract: "CT-2026-0052",
  amountRange: [9000, 15000],
};

const ASE: VendorSpec = {
  rfc: "ASE111130LP2",
  legal_name: "Abastecedora del Sureste SA de CV",
  concept: "Tarimas y material de empaque",
  registered_at: "2020-07-08",
  bank_clabe: clabe("021", "180", "04040404040"),
  address: "Calle 60 No. 455, Mérida, Yuc.",
  legal_rep: "Rosa Chan Pech",
  orders: 3,
  contract: "CT-2026-0060",
  amountRange: [8000, 20000],
};

const EMPLOYEES: Row[] = [
  {
    employee_id: "EMP-0012",
    full_name: "Juan Pérez Salinas",
    rfc: "PESJ850214HX3",
    role: "Gerente de compras",
    department: "Compras",
    hire_date: "2019-03-11",
    bank_clabe: CAM_CLABE,
  },
  {
    employee_id: "EMP-0031",
    full_name: "María Fernanda Ruiz Toledo",
    rfc: "RUTM900718MQ5",
    role: "Analista de cuentas por pagar",
    department: "Finanzas",
    hire_date: "2022-06-01",
    bank_clabe: clabe("012", "180", "02468013579"),
  },
];

const pel = clearedEfosVendor({ spec: PEL, efos_status: "Sentencia Favorable", dof_date: "2025-08-21" });

const handRows = mergeRows(
  {
    vendors: [
      {
        rfc: CAM,
        legal_name: "Consultores AMSA SA de CV",
        registered_at: "2026-03-17",
        bank_clabe: CAM_CLABE,
        address: SHARED_ADDRESS,
        legal_rep: SHARED_REP,
        status: "activo",
      },
      {
        rfc: SLB,
        legal_name: "Servicios Logísticos del Bajío SA de CV",
        registered_at: "2024-02-10",
        bank_clabe: SLB_CLABE,
        address: SHARED_ADDRESS,
        legal_rep: SHARED_REP,
        status: "activo",
      },
    ],
    efos_list: [
      { rfc: CAM, legal_name: "Consultores AMSA SA de CV", efos_status: "Definitivo", dof_date: "2025-11-14" },
      pel.efos,
    ],
    invoices: [
      // Hallazgo #1
      {
        uuid: "INV-2026-0418", issuer_rfc: CAM, receiver_rfc: COMPANY.rfc, issue_date: "2026-03-29",
        subtotal: 80000, iva: 12800, total: 92800, concepto_text: "Asesoría estratégica",
        uso_cfdi: "G03", forma_pago: "03", metodo_pago: "PUE", status: "vigente",
      },
      {
        uuid: "INV-2026-0467", issuer_rfc: CAM, receiver_rfc: COMPANY.rfc, issue_date: "2026-04-10",
        subtotal: 40000, iva: 6400, total: 46400, concepto_text: "Asesoría estratégica fase 2",
        uso_cfdi: "G03", forma_pago: "03", metodo_pago: "PUE", status: "vigente",
      },
      // Hallazgo #2
      {
        uuid: "INV-2026-0512", issuer_rfc: SLB, receiver_rfc: COMPANY.rfc, issue_date: "2026-05-04",
        subtotal: 500000, iva: 80000, total: 580000, concepto_text: "Servicios de fletes y logística mayo",
        uso_cfdi: "G03", forma_pago: "03", metodo_pago: "PUE", status: "vigente",
      },
      {
        uuid: "INV-2026-V-0091", issuer_rfc: COMPANY.rfc, receiver_rfc: CAM, issue_date: "2026-05-11",
        subtotal: 293103.45, iva: 46896.55, total: 340000, concepto_text: "Venta de refacciones industriales",
        uso_cfdi: "G01", forma_pago: "03", metodo_pago: "PPD", status: "vigente",
      },
      {
        uuid: "INV-2026-V-0102", issuer_rfc: COMPANY.rfc, receiver_rfc: CAM, issue_date: "2026-05-18",
        subtotal: 196896.55, iva: 31503.45, total: 228400, concepto_text: "Venta de refacciones industriales, segunda entrega",
        uso_cfdi: "G01", forma_pago: "03", metodo_pago: "PPD", status: "vigente",
      },
    ],
    bank_txns: [
      {
        txn_id: "TXN-26-01873", txn_date: "2026-04-02", direction: "salida", amount: 92800, channel: "SPEI",
        origin_clabe: COMPANY.clabe, beneficiary_clabe: CAM_CLABE, counterparty_rfc: CAM,
        reference: "PAGO INV-2026-0418", status: "liquidada",
      },
      {
        txn_id: "TXN-26-02011", txn_date: "2026-04-16", direction: "salida", amount: 46400, channel: "SPEI",
        origin_clabe: COMPANY.clabe, beneficiary_clabe: CAM_CLABE, counterparty_rfc: CAM,
        reference: "PAGO INV-2026-0467", status: "liquidada",
      },
      {
        txn_id: "TXN-26-02690", txn_date: "2026-05-06", direction: "salida", amount: 580000, channel: "SPEI",
        origin_clabe: COMPANY.clabe, beneficiary_clabe: SLB_CLABE, counterparty_rfc: SLB,
        reference: "PAGO INV-2026-0512 FLETES", status: "liquidada",
      },
      {
        txn_id: "TXN-26-02755", txn_date: "2026-05-12", direction: "entrada", amount: 340000, channel: "SPEI",
        origin_clabe: CAM_CLABE, beneficiary_clabe: COMPANY.clabe, counterparty_rfc: CAM,
        reference: "COBRO INV-2026-V-0091", status: "liquidada",
      },
      {
        txn_id: "TXN-26-02981", txn_date: "2026-05-19", direction: "entrada", amount: 226100, channel: "SPEI",
        origin_clabe: CAM_CLABE, beneficiary_clabe: COMPANY.clabe, counterparty_rfc: CAM,
        reference: "COBRO INV-2026-V-0102", status: "liquidada",
      },
    ],
    ledger: [
      { entry_id: "PL-2026-0412", entry_date: "2026-03-29", account_code: "6100-01", account_name: "Gastos de operación", debit: 80000, credit: null, counterparty_rfc: CAM, description: "Provisión INV-2026-0418 · Asesoría estratégica", source_ref: "INV-2026-0418" },
      { entry_id: "PL-2026-0455", entry_date: "2026-04-02", account_code: "2100-01", account_name: "Proveedores", debit: 92800, credit: null, counterparty_rfc: CAM, description: "Pago INV-2026-0418 vía TXN-26-01873", source_ref: "TXN-26-01873" },
      { entry_id: "PL-2026-0470", entry_date: "2026-04-10", account_code: "6100-01", account_name: "Gastos de operación", debit: 40000, credit: null, counterparty_rfc: CAM, description: "Provisión INV-2026-0467 · Asesoría estratégica fase 2", source_ref: "INV-2026-0467" },
      { entry_id: "PL-2026-0496", entry_date: "2026-04-16", account_code: "2100-01", account_name: "Proveedores", debit: 46400, credit: null, counterparty_rfc: CAM, description: "Pago INV-2026-0467 vía TXN-26-02011", source_ref: "TXN-26-02011" },
      { entry_id: "PL-2026-0561", entry_date: "2026-05-04", account_code: "6100-04", account_name: "Fletes", debit: 500000, credit: null, counterparty_rfc: SLB, description: "Provisión INV-2026-0512 · Fletes mayo", source_ref: "INV-2026-0512" },
      { entry_id: "PL-2026-0570", entry_date: "2026-05-06", account_code: "2100-01", account_name: "Proveedores", debit: 580000, credit: null, counterparty_rfc: SLB, description: "Pago INV-2026-0512 vía TXN-26-02690", source_ref: "TXN-26-02690" },
      { entry_id: "PL-2026-0588", entry_date: "2026-05-11", account_code: "4100-01", account_name: "Ventas", debit: null, credit: 293103.45, counterparty_rfc: CAM, description: "Venta INV-2026-V-0091 · sin salida de almacén asociada", source_ref: "INV-2026-V-0091" },
      { entry_id: "PL-2026-0601", entry_date: "2026-05-12", account_code: "1020-01", account_name: "Bancos", debit: 340000, credit: null, counterparty_rfc: CAM, description: "Cobro INV-2026-V-0091 vía TXN-26-02755", source_ref: "TXN-26-02755" },
      { entry_id: "PL-2026-0634", entry_date: "2026-05-18", account_code: "4100-01", account_name: "Ventas", debit: null, credit: 196896.55, counterparty_rfc: CAM, description: "Venta INV-2026-V-0102 · sin salida de almacén asociada", source_ref: "INV-2026-V-0102" },
      { entry_id: "PL-2026-0640", entry_date: "2026-05-19", account_code: "1020-01", account_name: "Bancos", debit: 226100, credit: null, counterparty_rfc: CAM, description: "Cobro parcial INV-2026-V-0102 vía TXN-26-02981", source_ref: "TXN-26-02981" },
    ],
  },
  splitOrders({
    company: COMPANY,
    vendor: GHM,
    date: "2026-02-18",
    subtotal: 42672.41,
    concept: "Bomba centrífuga de 15 HP",
    payDays: 15,
    orders: [
      { po_id: "OC-2026-0207", uuid: "INV-2026-0221", txn_id: "TXN-26-00731", plant: "Apodaca", approved_by: "EMP-0004" },
      { po_id: "OC-2026-0208", uuid: "INV-2026-0222", txn_id: "TXN-26-00732", plant: "Saltillo", approved_by: "EMP-0009" },
      { po_id: "OC-2026-0209", uuid: "INV-2026-0223", txn_id: "TXN-26-00733", plant: "Querétaro", approved_by: "EMP-0015" },
    ],
  }),
  creditNoteMismatch({
    company: COMPANY,
    vendor: TEC,
    uuid: "INV-2026-0388",
    date: "2026-02-10",
    subtotal: 100000,
    concept: "Licencias de software ERP (20 usuarios)",
    credit_subtotal: 16000,
    credit_concept: "Nota de crédito: devolución de 4 licencias",
    txn_id: "TXN-26-00655",
  }),
  refundedAdvance({
    company: COMPANY,
    vendor: ASE,
    po_id: "OC-2026-0331",
    po_date: "2026-05-15",
    amount: 64000,
    concept: "Anticipo de tarimas de madera",
    out_txn: "TXN-26-02405",
    out_date: "2026-05-20",
    in_txn: "TXN-26-03120",
    in_date: "2026-06-03",
    approved_by: "EMP-0012",
  }),
);

const estate = buildEstate({
  seed: 7,
  company: COMPANY,
  period: PERIOD,
  vendorCount: 30,
  employeeCount: 22,
  extraVendors: [pel.vendor, GHM, TEC, ASE],
  extraEmployees: EMPLOYEES,
  extraRows: handRows,
  unrelatedEfos: 18,
});

const ID = {
  company: `RFC:${COMPANY.rfc}`,
  cam: `RFC:${CAM}`,
  slb: `RFC:${SLB}`,
  juan: "EMP:0012",
  pel: `RFC:${PEL.rfc}`,
  ghm: `RFC:${GHM.rfc}`,
  tec: `RFC:${TEC.rfc}`,
  maria: "EMP:0031",
  ase: `RFC:${ASE.rfc}`,
};

export const fraudScenario: ScenarioDefinition = {
  id: "fraud",
  label: "Fraude (2 hallazgos entrelazados)",
  description: "Proveedor fantasma comprobado + dinero en círculo probable, 5 leads cerrados.",
  filename: "industrias_norte_2026.zip",
  sha256: "9f2c4b7e1d0a8c3f5e6b2a9d7c1e4f8a0b3d6c9e2f5a8b1c4d7e0f3a6b9ca71b",
  company_name: COMPANY.name,
  estate,
  column_warnings: [],
  final_counters: { llm_calls: 42, mxn_cost: 3.1 },
  disconnect_after_seq: 12,
  events: [
    { at: 1, type: "step", role: "system", message: "Cargando estate", result: "8 tablas, {total_records} registros", result_status: "ok" },
    { at: 4, type: "detector_result", role: "detector", message: "Detector: proveedores en lista EFOS", result: "2 coincidencias", result_status: "warning", entities: [ID.cam, ID.pel] },
    { at: 6, type: "detector_result", role: "detector", message: "Detector: pagos que no cuadran con facturas", result: "1 caso", result_status: "warning", entities: [ID.tec] },
    { at: 8, type: "detector_result", role: "detector", message: "Detector: dinero que regresa en círculo", result: "2 posibles ciclos", result_status: "warning", entities: [ID.slb, ID.ase] },
    { at: 10, type: "detector_result", role: "detector", message: "Detector: órdenes justo debajo del límite de aprobación", result: "1 grupo", result_status: "warning", entities: [ID.ghm] },
    { at: 12, type: "detector_result", role: "detector", message: "Detector: CLABE compartida entre empleados y proveedores", result: "2 coincidencias", result_status: "warning", entities: [ID.juan, ID.maria] },
    { at: 16, type: "step", role: "investigator", message: `Investigador → siguiendo pagos a ${ID.cam}`, tool: "bank_txns_by_counterparty", result: "consultando bank_txns", result_status: "pending", entities: [ID.cam] },
    { at: 21, type: "step", role: "investigator", message: "Investigador → revisando la cuenta de destino", detail: `encontró 2 transferencias a CLABE ${formatClabe(CAM_CLABE)} (empleado ${ID.juan})`, tool: "clabe_lookup", result: "2 transferencias", result_status: "ok", entities: [ID.cam, ID.juan] },
    { at: 26, type: "lead_closed", role: "investigator", message: `Lead cerrado: ${ID.pel}`, entity: ID.pel, result: "Sentencia Favorable en 69-B", result_status: "ok", entities: [ID.pel] },
    { at: 30, type: "finding_draft", role: "investigator", message: "Borrador de hallazgo #1: proveedor fantasma", result: "$139,200.00", result_status: "warning", entities: [ID.cam, ID.juan] },
    { at: 34, type: "challenge", role: "challenger", message: "Challenger → intenta refutar hallazgo #1", detail: "¿Podría ser un proveedor real mal registrado?", result: "…", result_status: "pending" },
    { at: 38, type: "challenge", role: "challenger", message: "Challenger → el hallazgo #1 resistió", detail: "la CLABE coincide en el alta del proveedor y en el expediente del empleado", result: "resistió", result_status: "ok", entities: [ID.cam, ID.juan] },
    { at: 42, type: "validation", role: "validator", message: "Validator → reconciliación hallazgo #1", result: "diferencia 0.00 %", result_status: "ok" },
    { at: 45, type: "lead_closed", role: "challenger", message: `Lead cerrado: ${ID.ghm}`, entity: ID.ghm, result: "Tres plantas con presupuestos distintos", result_status: "ok", entities: [ID.ghm] },
    { at: 49, type: "step", role: "investigator", message: `Investigador → siguiendo el pago de $580,000 a ${ID.slb}`, tool: "bank_txns_by_counterparty", result: "1 transferencia", result_status: "ok", entities: [ID.slb] },
    { at: 53, type: "step", role: "investigator", message: "Investigador → comparando representantes legales", detail: `${ID.slb} y ${ID.cam} comparten representante y domicilio fiscal`, tool: "vendor_profile_compare", result: "coincidencia", result_status: "warning", entities: [ID.slb, ID.cam] },
    { at: 57, type: "step", role: "investigator", message: `Investigador → buscando depósitos de ${ID.cam}`, detail: "2 depósitos por $566,100 registrados como cobro de ventas", tool: "bank_txns_by_counterparty", result: "2 depósitos", result_status: "warning", entities: [ID.cam] },
    { at: 60, type: "finding_draft", role: "investigator", message: "Borrador de hallazgo #2: dinero en círculo", result: "$568,400.00", result_status: "warning", entities: [ID.slb, ID.cam] },
    { at: 63, type: "challenge", role: "challenger", message: "Challenger → intenta refutar hallazgo #2", detail: "el traspaso entre los dos proveedores no es visible en bank_txns", result: "degradado a probable", result_status: "warning", entities: [ID.slb, ID.cam] },
    { at: 67, type: "validation", role: "validator", message: "Validator → reconciliación hallazgo #2", result: "diferencia −0.40 %", result_status: "ok" },
    { at: 69, type: "lead_closed", role: "validator", message: `Lead cerrado: ${ID.tec}`, entity: ID.tec, result: "La nota de crédito explica la diferencia", result_status: "ok", entities: [ID.tec] },
    { at: 72, type: "lead_closed", role: "investigator", message: `Lead cerrado: ${ID.maria}`, entity: ID.maria, result: "Solo coincide banco y plaza", result_status: "ok", entities: [ID.maria] },
    { at: 75, type: "lead_closed", role: "challenger", message: `Lead cerrado: ${ID.ase}`, entity: ID.ase, result: "Devolución de anticipo documentada", result_status: "ok", entities: [ID.ase] },
    { at: 78, type: "step", role: "system", message: "Generando case file", result: "listo", result_status: "ok" },
    { at: 81, type: "completed", role: "system", message: "Investigación terminada", result: "2 hallazgos · 5 leads cerrados", result_status: "ok" },
  ],
  report: {
    company_rfc: ID.company,
    audit_period: PERIOD,
    verdict: "fraud_proven",
    headline:
      "Encontramos un proveedor fantasma que facturó $139,200 por asesoría nunca prestada y un circuito de $568,400 que salió de la empresa y regresó disfrazado de ventas; ambos pasan por Consultores AMSA. Revisamos otros 5 casos sospechosos y ninguno se sostuvo.",
    total_exposure: 707600,
    submission: {
      seed: 7,
      findings: [
        {
          scheme_type: "phantom_vendor",
          entities: [ID.cam, ID.juan],
          rule_broken: "SAT Artículo 69-B CFF: operaciones inexistentes con un contribuyente en la lista definitiva",
          narrative: `La empresa pagó dos facturas a Consultores AMSA por "asesoría estratégica" que suman $139,200 (EX-01, EX-02). El proveedor está en la lista definitiva 69-B del SAT (EX-04), se dio de alta 12 días antes de la primera factura (EX-03) y no tiene contrato ni orden de compra. Los dos pagos (EX-05, EX-06) fueron a la CLABE ${formatClabe(CAM_CLABE)}, que es la misma cuenta de nómina de Juan Pérez Salinas, el gerente de compras que aprobó ambos pagos (EX-07). No existe ningún entregable que respalde el servicio.`,
          peso_amount: 139200,
          confidence: "proven",
          money_trail: [
            { from: ID.company, to: ID.cam, amount: 92800, date: "2026-04-02", exhibit_id: "EX-05" },
            { from: ID.company, to: ID.cam, amount: 46400, date: "2026-04-16", exhibit_id: "EX-06" },
            { from: ID.cam, to: ID.juan, amount: 139200, date: "2026-04-16", exhibit_id: "EX-07" },
          ],
          exhibits: [
            { exhibit_id: "EX-01", source_table: "invoices", record_id: "INV-2026-0418", note: "Factura de $92,800 por \"asesoría estratégica\" sin orden de compra ni contrato." },
            { exhibit_id: "EX-02", source_table: "invoices", record_id: "INV-2026-0467", note: "Segunda factura de $46,400 con el mismo concepto genérico." },
            { exhibit_id: "EX-03", source_table: "vendors", record_id: CAM, note: "Proveedor dado de alta 12 días antes de la primera factura." },
            { exhibit_id: "EX-04", source_table: "efos_list", record_id: CAM, note: "Estatus \"Definitivo\" en la lista 69-B del SAT." },
            { exhibit_id: "EX-05", source_table: "bank_txns", record_id: "TXN-26-01873", note: "Pago de la primera factura." },
            { exhibit_id: "EX-06", source_table: "bank_txns", record_id: "TXN-26-02011", note: "Pago de la segunda factura a la misma CLABE." },
            { exhibit_id: "EX-07", source_table: "employees", record_id: "EMP-0012", note: "La CLABE de nómina del gerente que aprobó los pagos es la del proveedor." },
          ],
        },
        {
          scheme_type: "round_tripping",
          entities: [ID.slb, ID.cam],
          rule_broken: "Artículo 69-B CFF y Artículo 27 LISR: ingresos y deducciones sin materialidad (operaciones simuladas)",
          narrative: `El 6 de mayo la empresa transfirió $580,000 a Servicios Logísticos del Bajío por fletes sin orden de compra ni guías de embarque (EX-08, EX-09). Ese proveedor comparte representante legal y domicilio fiscal con Consultores AMSA (EX-10), el proveedor fantasma del hallazgo #1. Entre el 12 y el 19 de mayo, Consultores AMSA depositó $566,100 a la empresa como cobro de dos facturas de venta por $568,400 sin salida de almacén (EX-11 a EX-15). El dinero salió y regresó para simular ventas. Falta un eslabón: el traspaso entre los dos proveedores no aparece en bank_txns porque ocurre entre cuentas de terceros; por eso la confianza es probable.`,
          peso_amount: 568400,
          confidence: "probable",
          money_trail: [
            { from: ID.company, to: ID.slb, amount: 580000, date: "2026-05-06", exhibit_id: "EX-08" },
            { from: ID.slb, to: ID.cam, amount: 568400, date: "2026-05-08", exhibit_id: "EX-10" },
            { from: ID.cam, to: ID.company, amount: 340000, date: "2026-05-12", exhibit_id: "EX-11" },
            { from: ID.cam, to: ID.company, amount: 226100, date: "2026-05-19", exhibit_id: "EX-12" },
          ],
          exhibits: [
            { exhibit_id: "EX-08", source_table: "bank_txns", record_id: "TXN-26-02690", note: "Transferencia de $580,000 por \"fletes\" sin orden de compra ni contrato." },
            { exhibit_id: "EX-09", source_table: "invoices", record_id: "INV-2026-0512", note: "Factura de fletes por $580,000 sin guías de embarque." },
            { exhibit_id: "EX-10", source_table: "vendors", record_id: SLB, note: "Mismo representante legal y domicilio fiscal que Consultores AMSA; el traspaso entre ambos se infiere." },
            { exhibit_id: "EX-11", source_table: "bank_txns", record_id: "TXN-26-02755", note: "Depósito de $340,000 desde la cuenta de Consultores AMSA, registrado como cobro de venta." },
            { exhibit_id: "EX-12", source_table: "bank_txns", record_id: "TXN-26-02981", note: "Depósito de $226,100 desde la misma cuenta, siete días después." },
            { exhibit_id: "EX-13", source_table: "invoices", record_id: "INV-2026-V-0091", note: "Factura de venta por $340,000 a un cliente sin historial." },
            { exhibit_id: "EX-14", source_table: "invoices", record_id: "INV-2026-V-0102", note: "Factura de venta por $228,400 al mismo cliente." },
            { exhibit_id: "EX-15", source_table: "ledger", record_id: "PL-2026-0588", note: "Póliza de ingreso por ventas sin salida de almacén asociada." },
          ],
        },
      ],
      leads_not_pursued: [
        {
          entity: ID.pel,
          signal: "Detector de lista EFOS: el RFC aparece en la lista 69-B.",
          reason: "El proveedor tiene estatus \"Sentencia Favorable\": ganó en tribunales y ya no se presume que simule operaciones. Además, sus 14 facturas tienen orden de compra aprobada, contrato vigente (CT-2026-0031) y pagos a la CLABE registrada.",
          tool_calls_made: ["efos_lookup", "invoices_by_vendor", "po_match", "contract_lookup"],
          closed_by: "investigator",
        },
        {
          entity: ID.ghm,
          signal: "Detector de fraccionamiento: tres órdenes de compra de $49,500 el mismo día, justo debajo del límite de $50,000.",
          reason: "Las tres órdenes (OC-2026-0207, OC-2026-0208 y OC-2026-0209) son para tres plantas distintas (Apodaca, Saltillo y Querétaro), cada una con su propio presupuesto y un aprobador diferente. No es una compra partida: son tres compras independientes.",
          tool_calls_made: ["po_by_vendor", "approver_lookup", "budget_lookup"],
          closed_by: "challenger",
        },
        {
          entity: ID.tec,
          signal: "Detector de pagos que no cuadran con facturas: se pagaron $18,560 menos de lo facturado.",
          reason: "La diferencia corresponde a la nota de crédito INV-2026-0388-NC por $18,560 (devolución de 4 licencias). Con la nota aplicada el saldo cuadra al centavo, así que no hay monto que acusar.",
          tool_calls_made: ["invoice_payment_match", "credit_note_lookup"],
          closed_by: "validator",
        },
        {
          entity: ID.maria,
          signal: "Detector de CLABE compartida: la cuenta de nómina coincide en banco y plaza con la de un proveedor.",
          reason: "Solo coinciden los primeros 6 dígitos (banco BBVA y la misma plaza); el número de cuenta es distinto. Tener cuenta en el mismo banco no es una relación con el proveedor, y la empleada no aprobó ninguna orden de Grupo Hidráulico Monterrey.",
          tool_calls_made: ["clabe_lookup", "employee_lookup", "approvals_by_employee"],
          closed_by: "investigator",
        },
        {
          entity: ID.ase,
          signal: "Detector de dinero en círculo: depósito entrante de un proveedor.",
          reason: "El depósito de $64,000 del 3 de junio es la devolución del anticipo de la orden OC-2026-0331, cancelada por falta de inventario. El dinero regresó una sola vez y por el mismo monto; no hay ventas simuladas.",
          closed_by: "challenger",
        },
      ],
      run_metadata: {
        llm_calls: 42,
        mxn_cost: 3.1,
        wall_clock_seconds: 81,
        cost_by_role: { investigator: 2.2, challenger: 0.6, validator: 0.3 },
        deterministic: true,
      },
    },
    findings_extra: [
      {
        finding_index: 0,
        reconciliation: {
          table_used: "invoices",
          lines: [
            { exhibit_id: "EX-01", record_id: "INV-2026-0418", amount: 92800 },
            { exhibit_id: "EX-02", record_id: "INV-2026-0467", amount: 46400 },
          ],
          sum: 139200,
          claimed: 139200,
          diff: 0,
          diff_pct: 0,
          within_tolerance: true,
          other_tables: [{ table: "bank_txns", sum: 139200, exhibit_ids: ["EX-05", "EX-06"] }],
        },
        adversarial_review: {
          argument: "El proveedor podría ser real y solo estar mal registrado; la coincidencia de CLABE podría ser un error de captura.",
          rebuttal: "No hay contrato, orden de compra ni entregable. La CLABE aparece idéntica en el alta del proveedor (EX-03) y en el expediente del empleado (EX-07), y ambos pagos se liquidaron en esa cuenta (EX-05, EX-06).",
          outcome: "survived",
        },
        shared_entities: [{ entity: ID.cam, other_finding_index: 1 }],
        timeline_annotations: [
          { date: "2026-03-17", entity: ID.cam, label: "Alta del proveedor 12 días antes de la primera factura" },
          { date: "2026-04-16", entity: ID.juan, label: "Segundo pago cae en su propia CLABE" },
        ],
      },
      {
        finding_index: 1,
        reconciliation: {
          table_used: "bank_txns",
          lines: [
            { exhibit_id: "EX-11", record_id: "TXN-26-02755", amount: 340000 },
            { exhibit_id: "EX-12", record_id: "TXN-26-02981", amount: 226100 },
          ],
          sum: 566100,
          claimed: 568400,
          diff: -2300,
          diff_pct: -0.4,
          within_tolerance: true,
          other_tables: [{ table: "invoices", sum: 568400, exhibit_ids: ["EX-13", "EX-14"] }],
        },
        adversarial_review: {
          argument: "Los depósitos pueden ser ventas reales a un cliente nuevo y el pago a Servicios Logísticos del Bajío un flete legítimo.",
          rebuttal: "No hay salida de almacén ni guías de embarque, y ambos proveedores comparten representante y domicilio (EX-10). Aun así, el traspaso entre ellos no es visible en bank_txns, por lo que el hallazgo se degradó de comprobado a probable.",
          outcome: "downgraded",
        },
        shared_entities: [{ entity: ID.cam, other_finding_index: 0 }],
        timeline_annotations: [
          { date: "2026-05-08", entity: ID.slb, label: "Traspaso inferido a Consultores AMSA" },
          { date: "2026-05-12", entity: ID.cam, label: "Primer depósito de regreso a la empresa" },
        ],
      },
    ],
    entity_details: {
      [ID.company]: { signals: [], kind: "company", is_audited_company: true },
      [ID.cam]: { signals: ["efos_match", "no_po", "no_contract", "registered_before_invoice", "clabe_shared_with_employee", "round_trip"] },
      [ID.slb]: { signals: ["no_po", "shared_legal_rep", "round_trip"] },
      [ID.juan]: { signals: ["clabe_shared_with_vendor"] },
      [ID.pel]: { signals: ["efos_match"] },
      [ID.ghm]: { signals: ["threshold_splitting"] },
      [ID.tec]: { signals: ["payment_mismatch"] },
      [ID.maria]: { signals: ["clabe_partial_match"] },
      [ID.ase]: { signals: ["incoming_from_vendor"] },
    },
    highlights: {
      "EX-01": ["total", "concepto_text"],
      "EX-02": ["total", "concepto_text"],
      "EX-03": ["registered_at", "bank_clabe"],
      "EX-04": ["efos_status", "dof_date"],
      "EX-05": ["amount", "beneficiary_clabe"],
      "EX-06": ["amount", "beneficiary_clabe"],
      "EX-07": ["role", "bank_clabe"],
      "EX-08": ["amount", "reference"],
      "EX-09": ["total", "concepto_text"],
      "EX-10": ["address", "legal_rep"],
      "EX-11": ["amount", "origin_clabe"],
      "EX-12": ["amount", "origin_clabe"],
      "EX-13": ["total", "receiver_rfc"],
      "EX-14": ["total", "receiver_rfc"],
      "EX-15": ["credit", "description"],
    },
    method_and_limits: {
      architecture:
        "Detectores deterministas señalan candidatos a partir de reglas fiscales y contables. Un investigador sigue el dinero con herramientas de consulta sobre las 8 tablas. Un revisor adversarial intenta refutar cada hallazgo y puede degradarlo. Un validador verifica que cada exhibit exista y que el monto reconcilie dentro de 2 % antes de publicar.",
      out_of_scope: [
        "Movimientos entre cuentas de terceros: solo se ven las cuentas bancarias de la empresa.",
      ],
      cannot_detect: [
        "Pagos en efectivo sin registro contable.",
        "Movimientos entre terceros que no aparecen en bank_txns.",
        "Acuerdos verbales o sobornos que nunca pasan por los libros.",
        "Proveedores fantasma con contrato, orden de compra y entregables falsificados de forma consistente.",
      ],
      reproduce: {
        seed: 7,
        version: "0.1.0",
        dataset_sha256: "9f2c4b7e1d0a8c3f5e6b2a9d7c1e4f8a0b3d6c9e2f5a8b1c4d7e0f3a6b9ca71b",
        command: "uv run investigate --estate industrias_norte_2026.zip --seed 7",
      },
    },
    relations: [
      { from: ID.cam, to: ID.juan, label: "Misma CLABE" },
      { from: ID.slb, to: ID.cam, label: "Mismo representante y domicilio" },
      { from: ID.maria, to: ID.ghm, label: "Mismo banco y plaza" },
    ],
    lane_notes: [
      { entity: ID.ghm, lane: "purchase_orders", note: "límite de aprobación $50,000" },
    ],
    extra_annotations: [
      { date: "2026-02-18", entity: ID.ghm, label: "3 OC de $49,500 el mismo día, una por planta" },
      { date: "2026-06-03", entity: ID.ase, label: "Devolución del anticipo de la OC cancelada" },
    ],
  },
};
