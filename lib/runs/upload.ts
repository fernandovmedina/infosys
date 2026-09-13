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
  return `Los archivos ${fileNames(files)} parecen corresponder a la tabla «${table}». Selecciona solo un CSV por tabla.`;
}

/** Valida las reglas de formato, combinación, tamaño y tablas reconocibles. */
export function validateSelection(files: File[]): string | null {
  if (files.length === 0) return null;

  const unsupported = files.find((file) => !ACCEPTED_EXTENSIONS.includes(extension(file.name) as ".zip" | ".csv"));
  if (unsupported) {
    return `El archivo «${unsupported.name}» no tiene un formato soportado. Usa únicamente .zip o .csv.`;
  }

  const archives = files.filter(isZip);
  const csvFiles = files.filter(isCsv);
  if (archives.length > 1) {
    return `Seleccionaste más de un ZIP (${fileNames(archives)}). Sube exactamente un ZIP o uno o más CSV.`;
  }
  if (archives.length === 1 && csvFiles.length > 0) {
    return `No puedes mezclar el ZIP ${fileNames(archives)} con archivos CSV (${fileNames(csvFiles)}). Sube exactamente un ZIP o uno o más CSV.`;
  }

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_UPLOAD_BYTES) {
    return `El dataset pesa ${formatFileSize(total)}; el máximo es ${formatFileSize(MAX_UPLOAD_BYTES)}.`;
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
  return files.length > 0 ? files.map((file) => `«${file}»`).join(", ") : "los archivos seleccionados";
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
  return ignored.length > 0 ? ` Archivos ignorados: ${ignored.join(", ")}.` : "";
}

/** Traduce los errores de carga del backend a mensajes accionables para la UI. */
export function uploadErrorMessage(error: unknown): string {
  const { code, details } = errorData(error);
  const filename = detailFilename(details);
  const filenames = detailFilenames(details);
  const reason = typeof details?.reason === "string" ? details.reason : null;

  switch (code) {
    case "not_authenticated":
      return "Tu sesión expiró. Inicia sesión de nuevo para subir el dataset.";
    case "no_files":
      return "Selecciona al menos un archivo CSV o un ZIP.";
    case "unsupported_format":
      return `El archivo ${filename ? `«${filename}»` : "seleccionado"} no tiene un formato soportado. Usa únicamente .zip o .csv.`;
    case "mixed_formats":
      return `No puedes mezclar ZIP y CSV en una misma carga (${quotedDetails(filenames)}).`;
    case "multiple_archives":
      return `Seleccionaste más de un ZIP (${quotedDetails(filenames)}). Sube exactamente un ZIP o uno o más CSV.`;
    case "invalid_archive":
      return `No se pudo leer el ZIP ${filename ? `«${filename}»` : "seleccionado"}. Verifica que no esté dañado, anidado o comprimido de forma insegura.`;
    case "invalid_csv":
      return `No se pudo leer el CSV ${filename ? `«${filename}»` : "seleccionado"}${reason ? `: ${reason}` : ". Verifica que tenga encabezados y esté guardado como texto UTF-8."}`;
    case "no_tables_found":
      return `No se encontraron tablas CSV reconocibles en la carga.${ignoredFiles(details)}`;
    case "duplicate_table":
      return `La tabla «${typeof details?.table === "string" ? details.table : "seleccionada"}» aparece más de una vez (${quotedDetails(filenames)}). Sube solo un archivo por tabla.`;
    case "file_too_large":
      return `La carga supera el límite permitido${typeof details?.max_bytes === "number" ? ` de ${Math.round(details.max_bytes / (1024 * 1024))} MB` : " de 200 MB"}. Selecciona archivos más pequeños.`;
    default:
      return errorMessage(error);
  }
}
