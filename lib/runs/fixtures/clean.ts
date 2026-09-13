/**
 * Escenario `clean`: Distribuidora Pacífico Norte, sin hallazgos ni leads.
 * La tabla `contracts` llega vacía, así que el reporte es un análisis
 * parcial, y la corrida no es determinista (badge gris).
 */

import { buildEstate, clabe, type Company } from "./estate";
import type { ScenarioDefinition } from "./types";

const COMPANY: Company = {
  rfc: "DPN110720KS2",
  name: "Distribuidora Pacífico Norte SA de CV",
  clabe: clabe("002", "010", "07654321098"),
};

const PERIOD = { from: "2026-01-01", to: "2026-03-31" };
const SHA = "c7d3a1f09e8b2c4d6a5f7e9b1c3d5a7f9e2b4c6d8a0f1e3b5c7d9a2f4e6b8c0d";

const estate = buildEstate({
  seed: 23,
  company: COMPANY,
  period: PERIOD,
  vendorCount: 18,
  employeeCount: 12,
  unrelatedEfos: 10,
  emptyTables: ["contracts"],
});

export const cleanScenario: ScenarioDefinition = {
  id: "clean",
  label: "Limpio (sin señales)",
  description: "Sin hallazgos ni leads; contratos vacíos y corrida no determinista.",
  filename: "pacifico_norte_q1_2026.zip",
  sha256: SHA,
  company_name: COMPANY.name,
  estate,
  table_overrides: {
    contracts: {
      status: "warning",
      warnings: ["Tabla vacía: no se puede verificar el alcance de los servicios contratados."],
    },
  },
  column_warnings: [],
  final_counters: { llm_calls: 6, mxn_cost: 0.35 },
  events: [
    { at: 1, type: "step", role: "system", message: "Cargando estate", result: "8 tablas, {total_records} registros", result_status: "ok" },
    { at: 2, type: "warning", role: "system", message: "La tabla contracts viene vacía: se omite la verificación de alcance contractual", result: "análisis parcial", result_status: "warning" },
    { at: 5, type: "detector_result", role: "detector", message: "Detector: proveedores en lista EFOS", result: "sin coincidencias", result_status: "ok" },
    { at: 8, type: "detector_result", role: "detector", message: "Detector: pagos que no cuadran con facturas", result: "sin casos", result_status: "ok" },
    { at: 11, type: "detector_result", role: "detector", message: "Detector: dinero que regresa en círculo", result: "sin ciclos", result_status: "ok" },
    { at: 14, type: "detector_result", role: "detector", message: "Detector: órdenes justo debajo del límite de aprobación", result: "sin grupos", result_status: "ok" },
    { at: 17, type: "detector_result", role: "detector", message: "Detector: CLABE compartida entre empleados y proveedores", result: "sin coincidencias", result_status: "ok" },
    { at: 20, type: "step", role: "system", message: "Generando case file", result: "listo", result_status: "ok" },
    { at: 23, type: "completed", role: "system", message: "Investigación terminada", result: "0 hallazgos · 0 leads", result_status: "ok" },
  ],
  report: {
    company_rfc: `RFC:${COMPANY.rfc}`,
    audit_period: PERIOD,
    verdict: "clean",
    headline:
      "Ningún detector encontró señales de fraude en los libros de enero a marzo de 2026. Como la tabla de contratos venía vacía, no se pudo verificar que los servicios pagados correspondan a lo contratado.",
    total_exposure: 0,
    submission: {
      seed: 23,
      findings: [],
      leads_not_pursued: [],
      run_metadata: { llm_calls: 6, mxn_cost: 0.35, wall_clock_seconds: 23, deterministic: false },
    },
    findings_extra: [],
    entity_details: { [`RFC:${COMPANY.rfc}`]: { signals: [], kind: "company", is_audited_company: true } },
    highlights: {},
    method_and_limits: {
      architecture:
        "Detectores deterministas señalan candidatos a partir de reglas fiscales y contables. Si un detector dispara, un investigador sigue el dinero, un revisor adversarial intenta refutar y un validador reconcilia antes de publicar. En esta corrida ningún detector disparó, así que no hubo investigación.",
      out_of_scope: [
        "La tabla contracts venía vacía: no se verificó el alcance contractual de los servicios.",
        "Movimientos entre cuentas de terceros: solo se ven las cuentas bancarias de la empresa.",
      ],
      cannot_detect: [
        "Proveedores fantasma con orden de compra y factura aparentemente normales, sin contrato contra el cual comparar.",
        "Pagos en efectivo sin registro contable.",
        "Movimientos entre terceros que no aparecen en bank_txns.",
      ],
      reproduce: {
        seed: 23,
        version: "0.1.0",
        dataset_sha256: SHA,
        command: "uv run investigate --estate pacifico_norte_q1_2026.zip --seed 23",
      },
    },
    relations: [],
  },
};
