/**
 * Generador determinista de un "estate" (los libros de una empresa) para los
 * fixtures del mock. Produce filas con la forma de `lib/runs/schema.ts`.
 *
 * Los registros que sostienen hallazgos y leads se escriben a mano en cada
 * escenario; aquí solo se genera el ruido de fondo realista.
 */

import type { SourceTable } from "../types";

export type Row = Record<string, string | number | null>;
export type Tables = Record<SourceTable, Row[]>;

export interface Company {
  rfc: string;
  name: string;
  clabe: string;
}

export interface Estate {
  company: Company;
  period: { from: string; to: string };
  tables: Tables;
}

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

export function prng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** CLABE de 18 dígitos con dígito verificador válido (pesos 3, 7, 1). */
export function clabe(bank: string, plaza: string, account: string): string {
  const base = `${bank}${plaza}${account}`;
  if (base.length !== 17) throw new Error(`CLABE base inválida: ${base}`);
  const weights = [3, 7, 1];
  const sum = base
    .split("")
    .reduce((acc, digit, i) => acc + ((Number(digit) * weights[i % 3]) % 10), 0);
  return `${base}${(10 - (sum % 10)) % 10}`;
}

export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

/** Factura con IVA al 16 % a partir del subtotal. */
export function invoiceAmounts(subtotal: number) {
  const iva = round2(subtotal * 0.16);
  return { subtotal, iva, total: round2(subtotal + iva) };
}

// ---------------------------------------------------------------------
// Catálogos para el ruido de fondo
// ---------------------------------------------------------------------

const VENDOR_NAMES: [string, string, string][] = [
  ["ACE", "Aceros y Perfiles del Centro SA de CV", "Suministro de perfiles de acero"],
  ["TIN", "Tornillería Industrial del Norte SA de CV", "Tornillería y sujetadores"],
  ["LUB", "Lubricantes Especializados de Monterrey SA de CV", "Lubricantes industriales"],
  ["EMB", "Embalajes Corrugados Regiomontanos SA de CV", "Cajas de cartón corrugado"],
  ["SEG", "Seguridad Privada Centinela SA de CV", "Servicio de vigilancia"],
  ["LIM", "Limpieza Integral Garza SA de CV", "Servicio de limpieza de planta"],
  ["ELE", "Eléctrica y Automatización Anáhuac SA de CV", "Material eléctrico"],
  ["PAP", "Papelería Corporativa Linares SA de CV", "Papelería y consumibles"],
  ["TRA", "Transportes Carreteros Cadereyta SA de CV", "Fletes nacionales"],
  ["SOF", "Soluciones de Software Regio SA de CV", "Licencias y soporte de software"],
  ["MAN", "Mantenimiento Industrial Escobedo SA de CV", "Mantenimiento preventivo"],
  ["HER", "Herramientas y Equipos del Golfo SA de CV", "Herramienta de corte"],
  ["QUI", "Químicos Industriales Santa Catarina SA de CV", "Solventes y químicos"],
  ["UNI", "Uniformes y Equipo de Protección Mitras SA de CV", "Uniformes y EPP"],
  ["ALI", "Alimentos para Comedor Industrial Apodaca SA de CV", "Servicio de comedor"],
  ["TEL", "Telecomunicaciones Empresariales Sierra SA de CV", "Enlaces de internet"],
  ["REF", "Refacciones Hidráulicas San Nicolás SA de CV", "Refacciones hidráulicas"],
  ["PIN", "Pinturas y Recubrimientos Guadalupe SA de CV", "Pintura electrostática"],
  ["GAS", "Gases Industriales Obispado SA de CV", "Gas nitrógeno y oxígeno"],
  ["CON", "Consultoría Fiscal Valle Oriente SC", "Asesoría fiscal mensual"],
  ["MOV", "Montacargas y Movilidad Industrial SA de CV", "Renta de montacargas"],
  ["PLA", "Plásticos Técnicos Juárez SA de CV", "Piezas de plástico inyectado"],
  ["CAP", "Capacitación Técnica Industrial Norte SC", "Cursos de seguridad industrial"],
  ["MED", "Medición y Calibración Cumbres SA de CV", "Calibración de instrumentos"],
  ["AGU", "Agua Purificada Los Cristales SA de CV", "Garrafones de agua"],
  ["IMP", "Impresos y Etiquetas Contry SA de CV", "Etiquetas de producto"],
  ["ARR", "Arrendadora de Equipo Pesado Huinalá SA de CV", "Arrendamiento de equipo"],
  ["NEU", "Neumáticos y Servicio Automotriz Mitras SA de CV", "Llantas y servicio a flotilla"],
  ["MEN", "Mensajería Express Regiomontana SA de CV", "Paquetería local"],
  ["CLI", "Climatización Industrial del Noreste SA de CV", "Mantenimiento de aire acondicionado"],
];

const FIRST_NAMES = [
  "Ana Lucía", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Héctor", "Isabel",
  "Jorge", "Karla", "Leonardo", "Mariana", "Norberto", "Olga", "Pablo", "Rebeca",
  "Sergio", "Teresa", "Ulises", "Verónica", "Alejandro", "Beatriz", "César", "Diana",
];
const LAST_NAMES = [
  "Treviño", "Garza", "Villarreal", "Cantú", "Salazar", "Elizondo", "González", "Martínez",
  "Hernández", "Rodríguez", "Leal", "Zambrano", "Quiroga", "Montemayor", "Chapa", "Benavides",
];
const ROLES: [string, string][] = [
  ["Analista contable", "Contabilidad"],
  ["Auxiliar de almacén", "Almacén"],
  ["Supervisor de producción", "Producción"],
  ["Ingeniero de mantenimiento", "Mantenimiento"],
  ["Comprador", "Compras"],
  ["Tesorero", "Finanzas"],
  ["Coordinadora de recursos humanos", "Recursos Humanos"],
  ["Técnico de calidad", "Calidad"],
];
const BANKS = ["002", "012", "014", "021", "072", "030"];
const PLAZAS = ["580", "180", "320", "010"];
const PLANTS = ["Apodaca", "Saltillo", "Querétaro"];
const HOMOCLAVE = "ABCDEFGHJKLMNPRSTUVWXYZ123456789";

function homoclave(rand: () => number) {
  return Array.from({ length: 3 }, () => HOMOCLAVE[Math.floor(rand() * HOMOCLAVE.length)]).join("");
}

function yymmdd(rand: () => number, fromYear: number, toYear: number) {
  const year = fromYear + Math.floor(rand() * (toYear - fromYear + 1));
  const month = 1 + Math.floor(rand() * 12);
  const day = 1 + Math.floor(rand() * 28);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(year).slice(2)}${pad(month)}${pad(day)}`;
}

function account11(rand: () => number) {
  return Array.from({ length: 11 }, () => Math.floor(rand() * 10)).join("");
}

// ---------------------------------------------------------------------
// Especificación de proveedores con operación "normal"
// ---------------------------------------------------------------------

export interface VendorSpec {
  rfc: string;
  legal_name: string;
  concept: string;
  registered_at: string;
  bank_clabe: string;
  address: string;
  legal_rep: string;
  /** Órdenes de compra regulares (con factura y pago) a generar. */
  orders: number;
  /** Si tiene contrato vigente; se usa el id indicado o uno generado. */
  contract: string | boolean;
  /** Rango del subtotal de cada orden. */
  amountRange: [number, number];
}

export interface EstateOptions {
  seed: number;
  company: Company;
  period: { from: string; to: string };
  vendorCount: number;
  employeeCount: number;
  /** Proveedores de escenario que siguen el flujo normal (leads, decoys). */
  extraVendors?: VendorSpec[];
  /** Empleados fijos del escenario. */
  extraEmployees?: Row[];
  /** Filas escritas a mano (hallazgos, decoys puntuales). */
  extraRows?: Partial<Tables>;
  /** Filas de `efos_list` sin relación con la empresa. */
  unrelatedEfos?: number;
  /** Tablas que deben llegar vacías (p. ej. `contracts`). */
  emptyTables?: SourceTable[];
}

export function buildEstate(options: EstateOptions): Estate {
  const rand = prng(options.seed);
  const { company, period } = options;
  const tables: Tables = {
    invoices: [], bank_txns: [], ledger: [], purchase_orders: [],
    contracts: [], vendors: [], employees: [], efos_list: [],
  };

  let invoiceSeq = 1000;
  let txnSeq = 10000;
  let ledgerSeq = 1000;
  let poSeq = 1000;
  let contractSeq = 100;

  // Empleados -----------------------------------------------------------
  for (const employee of options.extraEmployees ?? []) tables.employees.push(employee);
  const usedIds = new Set(tables.employees.map((e) => e.employee_id));
  let employeeNumber = 1;
  while (tables.employees.length < options.employeeCount + (options.extraEmployees?.length ?? 0)) {
    const id = `EMP-${String(employeeNumber).padStart(4, "0")}`;
    employeeNumber += 1;
    if (usedIds.has(id)) continue;
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
    const last1 = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const last2 = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
    const [role, department] = ROLES[Math.floor(rand() * ROLES.length)];
    const initials = `${last1.slice(0, 2)}${last2[0]}${first[0]}`
      .normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
    tables.employees.push({
      employee_id: id,
      full_name: `${first} ${last1} ${last2}`,
      rfc: `${initials}${yymmdd(rand, 1972, 1998)}${homoclave(rand)}`,
      role,
      department,
      hire_date: `20${10 + Math.floor(rand() * 15)}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-15`,
      bank_clabe: clabe(BANKS[Math.floor(rand() * BANKS.length)], PLAZAS[Math.floor(rand() * PLAZAS.length)], account11(rand)),
    });
  }
  const approvers = tables.employees
    .filter((e) => String(e.department) === "Compras" || String(e.role).includes("Gerente"))
    .map((e) => String(e.employee_id));
  if (approvers.length === 0) approvers.push(String(tables.employees[0].employee_id));

  // Proveedores regulares ----------------------------------------------
  const specs: VendorSpec[] = [];
  for (let i = 0; i < options.vendorCount; i++) {
    const [prefix, name, concept] = VENDOR_NAMES[i % VENDOR_NAMES.length];
    const legalRep = `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]}`;
    specs.push({
      rfc: `${prefix}${yymmdd(rand, 1998, 2019)}${homoclave(rand)}`,
      legal_name: name,
      concept,
      registered_at: `20${16 + Math.floor(rand() * 8)}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
      bank_clabe: clabe(BANKS[Math.floor(rand() * BANKS.length)], PLAZAS[Math.floor(rand() * PLAZAS.length)], account11(rand)),
      address: `Av. ${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]} ${100 + Math.floor(rand() * 2400)}, Monterrey, N.L.`,
      legal_rep: legalRep,
      orders: 2 + Math.floor(rand() * 6),
      contract: rand() < 0.65,
      amountRange: [4000 + Math.floor(rand() * 10) * 1000, 30000 + Math.floor(rand() * 12) * 5000],
    });
  }
  specs.push(...(options.extraVendors ?? []));

  const periodDays = daysBetween(period.from, period.to);

  for (const [specIndex, spec] of specs.entries()) {
    // Los proveedores de escenario tienen historial limpio y predecible.
    const isScenarioVendor = specIndex >= options.vendorCount;
    tables.vendors.push({
      rfc: spec.rfc,
      legal_name: spec.legal_name,
      registered_at: spec.registered_at,
      bank_clabe: spec.bank_clabe,
      address: spec.address,
      legal_rep: spec.legal_rep,
      status: "activo",
    });

    if (spec.contract) {
      const contractId = typeof spec.contract === "string"
        ? spec.contract
        : `CT-2026-${String(contractSeq++).padStart(4, "0")}`;
      tables.contracts.push({
        contract_id: contractId,
        vendor_rfc: spec.rfc,
        start_date: addDays(period.from, -Math.floor(rand() * 200) - 10),
        end_date: addDays(period.to, 90 + Math.floor(rand() * 180)),
        value: Math.round((spec.amountRange[1] * spec.orders * 1.6) / 1000) * 1000,
        scope: spec.concept,
        status: "vigente",
      });
    }

    for (let order = 0; order < spec.orders; order++) {
      const poDate = addDays(period.from, Math.floor(rand() * (periodDays - 40)));
      const [min, max] = spec.amountRange;
      const subtotal = Math.round((min + rand() * (max - min)) / 100) * 100;
      const amounts = invoiceAmounts(subtotal);
      const poId = `OC-2026-${String(poSeq++)}`;
      const uuid = `INV-2026-${String(invoiceSeq++)}`;
      const issueDate = addDays(poDate, 2 + Math.floor(rand() * 8));
      const payDate = addDays(issueDate, 5 + Math.floor(rand() * 20));
      const cancelled = !isScenarioVendor && rand() < 0.04;
      const txnId = `TXN-26-${String(txnSeq++)}`;

      tables.purchase_orders.push({
        po_id: poId,
        po_date: poDate,
        vendor_rfc: spec.rfc,
        amount: amounts.total,
        description: spec.concept,
        plant: PLANTS[Math.floor(rand() * PLANTS.length)],
        approved_by: approvers[Math.floor(rand() * approvers.length)],
        status: "aprobada",
      });
      tables.invoices.push({
        uuid,
        issuer_rfc: spec.rfc,
        receiver_rfc: company.rfc,
        issue_date: issueDate,
        ...amounts,
        concepto_text: spec.concept,
        uso_cfdi: rand() < 0.7 ? "G03" : "G01",
        forma_pago: "03",
        metodo_pago: rand() < 0.8 ? "PUE" : "PPD",
        status: cancelled ? "cancelado" : "vigente",
      });
      tables.ledger.push({
        entry_id: `PL-2026-${String(ledgerSeq++)}`,
        entry_date: issueDate,
        account_code: "6100-01",
        account_name: "Gastos de operación",
        debit: amounts.subtotal,
        credit: null,
        counterparty_rfc: spec.rfc,
        description: `Provisión ${uuid} · ${spec.concept}`,
        source_ref: uuid,
      });
      if (cancelled) continue;
      tables.bank_txns.push({
        txn_id: txnId,
        txn_date: payDate,
        direction: "salida",
        amount: amounts.total,
        channel: rand() < 0.9 ? "SPEI" : "cheque",
        origin_clabe: company.clabe,
        beneficiary_clabe: spec.bank_clabe,
        counterparty_rfc: spec.rfc,
        reference: `PAGO ${uuid}`,
        status: "liquidada",
      });
      tables.ledger.push({
        entry_id: `PL-2026-${String(ledgerSeq++)}`,
        entry_date: payDate,
        account_code: "2100-01",
        account_name: "Proveedores",
        debit: amounts.total,
        credit: null,
        counterparty_rfc: spec.rfc,
        description: `Pago ${uuid} vía ${txnId}`,
        source_ref: txnId,
      });
    }
  }

  // Lista EFOS sin relación con la empresa ---------------------------------
  const efosStatuses = ["Definitivo", "Presunto", "Desvirtuado", "Definitivo", "Sentencia Favorable"];
  for (let i = 0; i < (options.unrelatedEfos ?? 18); i++) {
    const prefix = Array.from({ length: 3 }, () => "BCDFGHJKLMNPQRSTVWXZ"[Math.floor(rand() * 20)]).join("");
    tables.efos_list.push({
      rfc: `${prefix}${yymmdd(rand, 2005, 2021)}${homoclave(rand)}`,
      legal_name: `${["Servicios", "Comercializadora", "Grupo", "Consorcio"][i % 4]} ${LAST_NAMES[i % LAST_NAMES.length]} ${["SA de CV", "SC", "S de RL de CV"][i % 3]}`,
      efos_status: efosStatuses[i % efosStatuses.length],
      dof_date: `202${3 + (i % 3)}-${String(1 + (i % 12)).padStart(2, "0")}-${String(5 + (i % 20)).padStart(2, "0")}`,
    });
  }

  // Filas escritas a mano ------------------------------------------------
  for (const [table, rows] of Object.entries(options.extraRows ?? {}) as [SourceTable, Row[]][]) {
    tables[table].push(...rows);
  }

  for (const table of options.emptyTables ?? []) tables[table] = [];

  return { company, period, tables };
}
