/**
 * Registros de "decoys": entidades que parecen sospechosas pero tienen
 * explicación documentada. Sirven para los leads no perseguidos.
 */

import { addDays, invoiceAmounts, type Company, type Row, type VendorSpec } from "./estate";

/** Proveedor en la lista 69-B con estatus que ya lo limpia. */
export function clearedEfosVendor(input: {
  spec: VendorSpec;
  efos_status: "Sentencia Favorable" | "Desvirtuado";
  dof_date: string;
}): { vendor: VendorSpec; efos: Row } {
  return {
    vendor: input.spec,
    efos: {
      rfc: input.spec.rfc,
      legal_name: input.spec.legal_name,
      efos_status: input.efos_status,
      dof_date: input.dof_date,
    },
  };
}

/** Tres órdenes justo debajo del límite, el mismo día, para plantas distintas. */
export function splitOrders(input: {
  company: Company;
  vendor: VendorSpec;
  date: string;
  subtotal: number;
  concept: string;
  orders: { po_id: string; uuid: string; txn_id: string; plant: string; approved_by: string }[];
  payDays: number;
}): Partial<Record<"purchase_orders" | "invoices" | "bank_txns", Row[]>> {
  const amounts = invoiceAmounts(input.subtotal);
  const purchase_orders: Row[] = [];
  const invoices: Row[] = [];
  const bank_txns: Row[] = [];
  for (const order of input.orders) {
    purchase_orders.push({
      po_id: order.po_id,
      po_date: input.date,
      vendor_rfc: input.vendor.rfc,
      amount: amounts.total,
      description: `${input.concept} · planta ${order.plant}`,
      plant: order.plant,
      approved_by: order.approved_by,
      status: "aprobada",
    });
    invoices.push({
      uuid: order.uuid,
      issuer_rfc: input.vendor.rfc,
      receiver_rfc: input.company.rfc,
      issue_date: addDays(input.date, 3),
      ...amounts,
      concepto_text: `${input.concept} · planta ${order.plant}`,
      uso_cfdi: "I08",
      forma_pago: "03",
      metodo_pago: "PUE",
      status: "vigente",
    });
    bank_txns.push({
      txn_id: order.txn_id,
      txn_date: addDays(input.date, input.payDays),
      direction: "salida",
      amount: amounts.total,
      channel: "SPEI",
      origin_clabe: input.company.clabe,
      beneficiary_clabe: input.vendor.bank_clabe,
      counterparty_rfc: input.vendor.rfc,
      reference: `PAGO ${order.uuid}`,
      status: "liquidada",
    });
  }
  return { purchase_orders, invoices, bank_txns };
}

/** Factura pagada de menos porque existe una nota de crédito. */
export function creditNoteMismatch(input: {
  company: Company;
  vendor: VendorSpec;
  uuid: string;
  date: string;
  subtotal: number;
  concept: string;
  credit_subtotal: number;
  credit_concept: string;
  txn_id: string;
}): Partial<Record<"invoices" | "bank_txns", Row[]>> {
  const original = invoiceAmounts(input.subtotal);
  const credit = invoiceAmounts(-input.credit_subtotal);
  const paid = Math.round((original.total + credit.total) * 100) / 100;
  return {
    invoices: [
      {
        uuid: input.uuid,
        issuer_rfc: input.vendor.rfc,
        receiver_rfc: input.company.rfc,
        issue_date: input.date,
        ...original,
        concepto_text: input.concept,
        uso_cfdi: "I04",
        forma_pago: "03",
        metodo_pago: "PPD",
        status: "vigente",
      },
      {
        uuid: `${input.uuid}-NC`,
        issuer_rfc: input.vendor.rfc,
        receiver_rfc: input.company.rfc,
        issue_date: addDays(input.date, 14),
        ...credit,
        concepto_text: input.credit_concept,
        uso_cfdi: "G02",
        forma_pago: "03",
        metodo_pago: "PUE",
        status: "vigente",
      },
    ],
    bank_txns: [
      {
        txn_id: input.txn_id,
        txn_date: addDays(input.date, 20),
        direction: "salida",
        amount: paid,
        channel: "SPEI",
        origin_clabe: input.company.clabe,
        beneficiary_clabe: input.vendor.bank_clabe,
        counterparty_rfc: input.vendor.rfc,
        reference: `PAGO ${input.uuid} APLICA ${input.uuid}-NC`,
        status: "liquidada",
      },
    ],
  };
}

/** Anticipo pagado por una orden que luego se canceló y se devolvió. */
export function refundedAdvance(input: {
  company: Company;
  vendor: VendorSpec;
  po_id: string;
  po_date: string;
  amount: number;
  concept: string;
  out_txn: string;
  out_date: string;
  in_txn: string;
  in_date: string;
  approved_by: string;
}): Partial<Record<"purchase_orders" | "bank_txns", Row[]>> {
  return {
    purchase_orders: [
      {
        po_id: input.po_id,
        po_date: input.po_date,
        vendor_rfc: input.vendor.rfc,
        amount: input.amount,
        description: input.concept,
        plant: "Apodaca",
        approved_by: input.approved_by,
        status: "cancelada",
      },
    ],
    bank_txns: [
      {
        txn_id: input.out_txn,
        txn_date: input.out_date,
        direction: "salida",
        amount: input.amount,
        channel: "SPEI",
        origin_clabe: input.company.clabe,
        beneficiary_clabe: input.vendor.bank_clabe,
        counterparty_rfc: input.vendor.rfc,
        reference: `ANTICIPO ${input.po_id}`,
        status: "liquidada",
      },
      {
        txn_id: input.in_txn,
        txn_date: input.in_date,
        direction: "entrada",
        amount: input.amount,
        channel: "SPEI",
        origin_clabe: input.vendor.bank_clabe,
        beneficiary_clabe: input.company.clabe,
        counterparty_rfc: input.vendor.rfc,
        reference: `DEVOLUCION ANTICIPO ${input.po_id}`,
        status: "liquidada",
      },
    ],
  };
}

export function mergeRows(...parts: Partial<Record<string, Row[]>>[]): Record<string, Row[]> {
  const merged: Record<string, Row[]> = {};
  for (const part of parts) {
    for (const [table, rows] of Object.entries(part)) {
      if (!rows) continue;
      (merged[table] ??= []).push(...rows);
    }
  }
  return merged;
}
