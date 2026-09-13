import { formatFileSize } from "@/lib/format";
import { ApiError, errorMessage } from "./errors";
import type { SourceTable } from "./types";

export const ACCEPTED_EXTENSIONS = [".zip", ".csv"] as const;
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

/** Orden de las tablas que el backend intenta identificar en un dataset. */
export const UPLOAD_TABLES: SourceTable[] = [
  "vendors",
  "invoices",
  "ledger",
  "bank_txns",
  "purchase_orders",
  "contracts",
  "employees",
  "efos_list",
];

// Mismos alias que `app/runs/estate.py` en el backend.
const TABLE_ALIASES: Record<string, SourceTable> = {
  vendor: "vendors", proveedores: "vendors", suppliers: "vendors",
  invoice: "invoices", facturas: "invoices", cfdi: "invoices", cfdis: "invoices",
  general_ledger: "ledger", gl: "ledger", journal: "ledger", polizas: "ledger",
  bank_txn: "bank_txns", bank_transactions: "bank_txns", bank_transaction: "bank_txns",
  transactions: "bank_txns", banco: "bank_txns", movimientos: "bank_txns",
  purchase_order: "purchase_orders", pos: "purchase_orders", po: "purchase_orders",
  ordenes_compra: "purchase_orders", ordenes_de_compra: "purchase_orders",
  contract: "contracts", contratos: "contracts",
  employee: "employees", empleados: "employees", staff: "employees",
  efos: "efos_list", lista_efos: "efos_list", sat_69b: "efos_list", "69b": "efos_list",
  blacklist: "efos_list", black_list: "efos_list",
};

function basename(name: string): string {
  return name.split(/[\\/]/).pop() ?? name;
}

function extension(name: string): string {
  const fileName = basename(name);
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot).toLowerCase() : "";
}

function normalizedStem(name: string): string {
  const fileName = basename(name);
  const dot = fileName.lastIndexOf(".");
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  return stem
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s\-.]+/g, "_")
    .replace(/_+/g, "_");
}

/** Identifica una tabla a partir del stem del archivo, sin leer su contenido. */
export function tableForFilename(name: string): SourceTable | null {
  const stem = normalizedStem(name);
  const table = TABLE_ALIASES[stem] ?? stem;
  return UPLOAD_TABLES.includes(table as SourceTable) ? (table as SourceTable) : null;
}

function isZip(file: File): boolean {
  return extension(file.name) === ".zip";
}

function isCsv(file: File): boolean {
  return extension(file.name) === ".csv";
}

function fileNames(files: File[]): string {
  return files.map((file) => `«${file.name}»`).join(", ");
}

function duplicateSelectionMessage(table: SourceTable, files: File[]): string {
  return `The files ${fileNames(files)} appear to belong to the «${table}» table. Select only one CSV per table.`;
}

/** Valida las reglas de formato, combinación, tamaño y tablas reconocibles. */
export function validateSelection(files: File[]): string | null {
  if (files.length === 0) return null;

  const unsupported = files.find((file) => !ACCEPTED_EXTENSIONS.includes(extension(file.name) as ".zip" | ".csv"));
  if (unsupported) {
    return `The file «${unsupported.name}» is not a supported format. Use only .zip or .csv.`;
  }

  const archives = files.filter(isZip);
  const csvFiles = files.filter(isCsv);
  if (archives.length > 1) {
    return `You selected more than one ZIP (${fileNames(archives)}). Upload exactly one ZIP or one or more CSVs.`;
  }
  if (archives.length === 1 && csvFiles.length > 0) {
    return `You can't mix the ZIP ${fileNames(archives)} with CSV files (${fileNames(csvFiles)}). Upload exactly one ZIP or one or more CSVs.`;
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_UPLOAD_BYTES) {
    return `The dataset is ${formatFileSize(total)}; the maximum is ${formatFileSize(MAX_UPLOAD_BYTES)}.`;
  }

  const filesByTable = new Map<SourceTable, File[]>();
  for (const file of csvFiles) {
    const table = tableForFilename(file.name);
    if (!table) continue;
    filesByTable.set(table, [...(filesByTable.get(table) ?? []), file]);
  }
  for (const [table, matchingFiles] of filesByTable) {
    if (matchingFiles.length > 1) return duplicateSelectionMessage(table, matchingFiles);
  }

  return null;
}

type ErrorDetails = Record<string, unknown>;

function asRecord(value: unknown): ErrorDetails | null {
  return typeof value === "object" && value !== null ? (value as ErrorDetails) : null;
}

function errorData(error: unknown): { code: string | null; details: ErrorDetails | null } {
  if (error instanceof ApiError) return { code: error.code, details: asRecord(error.details) };
  const outer = asRecord(error);
  const nested = asRecord(outer?.error);
  const source = nested ?? outer;
  return {
    code: typeof source?.code === "string" ? source.code : null,
    details: asRecord(source?.details),
  };
}

function detailFilename(details: ErrorDetails | null): string | null {
  return typeof details?.filename === "string" ? details.filename : null;
}

function detailFilenames(details: ErrorDetails | null): string[] {
  return Array.isArray(details?.filenames)
    ? details.filenames.filter((filename): filename is string => typeof filename === "string")
    : [];
}

function quotedDetails(files: string[]): string {
  return files.length > 0 ? files.map((file) => `«${file}»`).join(", ") : "the selected files";
}

function ignoredFiles(details: ErrorDetails | null): string {
  if (!Array.isArray(details?.ignored_files)) return "";
  const ignored = details.ignored_files
    .map((item) => {
      const record = asRecord(item);
      if (typeof record?.filename !== "string") return null;
      return typeof record.reason === "string" ? `«${record.filename}» (${record.reason})` : `«${record.filename}»`;
    })
    .filter((item): item is string => item !== null);
  return ignored.length > 0 ? ` Ignored files: ${ignored.join(", ")}.` : "";
}

/** Traduce los errores de carga del backend a mensajes accionables para la UI. */
export function uploadErrorMessage(error: unknown): string {
  const { code, details } = errorData(error);
  const filename = detailFilename(details);
  const filenames = detailFilenames(details);
  const reason = typeof details?.reason === "string" ? details.reason : null;

  switch (code) {
    case "not_authenticated":
      return "Your session expired. Sign in again to upload the dataset.";
    case "no_files":
      return "Select at least one CSV file or a ZIP.";
    case "unsupported_format":
      return `The ${filename ? `file «${filename}»` : "selected file"} is not a supported format. Use only .zip or .csv.`;
    case "mixed_formats":
      return `You can't mix ZIP and CSV files in the same upload (${quotedDetails(filenames)}).`;
    case "multiple_archives":
      return `You selected more than one ZIP (${quotedDetails(filenames)}). Upload exactly one ZIP or one or more CSVs.`;
    case "invalid_archive":
      return `Could not read the ${filename ? `ZIP «${filename}»` : "selected ZIP"}. Make sure it isn't corrupted, nested, or unsafely compressed.`;
    case "invalid_csv":
      return `Could not read the ${filename ? `CSV «${filename}»` : "selected CSV"}${reason ? `: ${reason}` : ". Make sure it has headers and is saved as UTF-8 text."}`;
    case "no_tables_found":
      return `No recognizable CSV tables were found in the upload.${ignoredFiles(details)}`;
    case "duplicate_table":
      return `The ${typeof details?.table === "string" ? `«${details.table}» table` : "selected table"} appears more than once (${quotedDetails(filenames)}). Upload only one file per table.`;
    case "file_too_large":
      return `The upload exceeds the ${typeof details?.max_bytes === "number" ? `${Math.round(details.max_bytes / (1024 * 1024))} MB` : "200 MB"} limit. Select smaller files.`;
    default:
      return errorMessage(error);
  }
}
