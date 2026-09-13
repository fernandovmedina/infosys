/**
 * Escenario `failed`: la corrida arranca bien y falla a mitad del progreso
 * cuando el investigador excede su tiempo máximo.
 */

import { buildEstate, clabe, type Company } from "./estate";
import type { ScenarioDefinition } from "./types";

const COMPANY: Company = {
  rfc: "CAL070415HM2",
  name: "Constructora Altiplano SA de CV",
  clabe: clabe("014", "180", "03030303030"),
};

const estate = buildEstate({
  seed: 43,
  company: COMPANY,
  period: { from: "2026-01-01", to: "2026-06-30" },
  vendorCount: 24,
  employeeCount: 16,
  unrelatedEfos: 12,
});

export const failedScenario: ScenarioDefinition = {
  id: "failed",
  label: "Falla a mitad de la corrida",
  description: "El investigador excede el tiempo máximo y la corrida se detiene.",
  filename: "altiplano_2026.sql",
  sha256: "e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
  company_name: COMPANY.name,
  estate,
  column_warnings: [],
  final_counters: { llm_calls: 19, mxn_cost: 1.4 },
  events: [
    { at: 1, type: "step", role: "system", message: "Cargando estate", result: "8 tablas, {total_records} registros", result_status: "ok" },
    { at: 4, type: "detector_result", role: "detector", message: "Detector: proveedores en lista EFOS", result: "sin coincidencias", result_status: "ok" },
    { at: 7, type: "detector_result", role: "detector", message: "Detector: pagos que no cuadran con facturas", result: "3 casos", result_status: "warning" },
    { at: 10, type: "detector_result", role: "detector", message: "Detector: dinero que regresa en círculo", result: "sin ciclos", result_status: "ok" },
    { at: 15, type: "step", role: "investigator", message: "Investigador → cruzando facturas y pagos del primer caso", tool: "invoice_payment_match", result: "consultando bank_txns", result_status: "pending" },
    { at: 28, type: "warning", role: "system", message: "La consulta a bank_txns tardó más de 60 s; reintentando", result: "reintento 1 de 2", result_status: "warning" },
    { at: 41, type: "warning", role: "system", message: "La consulta a bank_txns volvió a exceder el tiempo", result: "reintento 2 de 2", result_status: "warning" },
    {
      at: 44,
      type: "failed",
      role: "system",
      message: "La investigación se detuvo",
      result: "error",
      result_status: "error",
      error: {
        code: "investigator_timeout",
        message:
          "El investigador excedió el tiempo máximo de 120 s consultando bank_txns. La corrida se detuvo y los resultados parciales no se publican.",
        details: { tool: "invoice_payment_match", attempts: 2 },
      },
    },
  ],
  report: null,
  failure: {
    code: "investigator_timeout",
    message:
      "El investigador excedió el tiempo máximo de 120 s consultando bank_txns. La corrida se detuvo y los resultados parciales no se publican.",
    details: { tool: "invoice_payment_match", attempts: 2 },
  },
};
