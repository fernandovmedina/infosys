/**
 * Escenario `partial`: el diagnóstico encuentra tablas con advertencia
 * (`contracts` vacía, columnas opcionales faltantes) y una tabla con error
 * (`efos_list` no encontrada), así que no se puede iniciar la investigación.
 */

import { buildEstate, clabe, type Company } from "./estate";
import type { ScenarioDefinition } from "./types";

const COMPANY: Company = {
  rfc: "MRB140301UV5",
  name: "Maquiladora Río Bravo SA de CV",
  clabe: clabe("072", "010", "05566778899"),
};

const estate = buildEstate({
  seed: 31,
  company: COMPANY,
  period: { from: "2026-01-01", to: "2026-06-30" },
  vendorCount: 20,
  employeeCount: 14,
  unrelatedEfos: 0,
  emptyTables: ["contracts", "efos_list"],
});

export const partialScenario: ScenarioDefinition = {
  id: "partial",
  label: "Parcial (advertencias y error)",
  description: "contracts vacía, columnas faltantes y efos_list no encontrada: no se puede iniciar.",
  filename: "rio_bravo_2026.csv",
  sha256: "0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b",
  company_name: COMPANY.name,
  estate,
  table_overrides: {
    purchase_orders: {
      status: "warning",
      warnings: ["Falta la columna opcional approved_by: no se puede verificar quién aprobó cada orden."],
    },
    contracts: {
      status: "warning",
      warnings: ["Tabla vacía: sin contratos no se puede verificar el alcance de los servicios."],
    },
    efos_list: {
      status: "error",
      warnings: ["No encontrada: sin la lista EFOS no corre el detector de proveedores 69-B."],
    },
  },
  column_warnings: [
    { table: "invoices", column: "metodo_pago", message: "Falta la columna; se esperaba PUE | PPD." },
    { table: "purchase_orders", column: "approved_by", message: "Falta la columna; se esperaba un número de empleado (EMP-0001)." },
  ],
  final_counters: { llm_calls: 0, mxn_cost: 0 },
  events: [],
  report: null,
};
