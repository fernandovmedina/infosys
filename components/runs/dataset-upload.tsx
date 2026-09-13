"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileDropzone } from "@/components/dashboard/file-dropzone";
import { formatFileSize } from "@/lib/format";
import { ApiError, isNotAuthenticated } from "@/lib/runs/errors";
import { createRun } from "@/lib/runs/api";
import {
  ACCEPTED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  tableForFilename,
  uploadErrorMessage,
  UPLOAD_TABLES,
  validateSelection,
} from "@/lib/runs/upload";
import type { SourceTable } from "@/lib/runs/types";
import { Button, Notice, Spinner, TableName } from "./ui";

const REQUIRED_TABLES: SourceTable[] = ["invoices", "bank_txns"];

function isCsv(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv");
}

export function DatasetUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ code?: string; message: string } | null>(null);

  const clientError = validateSelection(files);
  const csvSelection = files.length > 0 && files.every(isCsv);
  const selectedTables = new Set(
    files
      .map((file) => tableForFilename(file.name))
      .filter((table): table is SourceTable => table !== null),
  );
  const missingTables = UPLOAD_TABLES.filter((table) => !selectedTables.has(table));

  async function handleSubmit() {
    if (files.length === 0 || clientError || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { run_id } = await createRun(files);
      router.push(`/runs/${encodeURIComponent(run_id)}`);
    } catch (error) {
      if (isNotAuthenticated(error)) {
        router.replace("/auth/login?next=/dashboard");
        return;
      }
      setSubmitError({
        code: error instanceof ApiError ? error.code : undefined,
        message: uploadErrorMessage(error),
      });
      setSubmitting(false);
    }
  }

  return (
    <div>
      <FileDropzone
        onFilesChange={(next) => {
          setFiles(next);
          setSubmitError(null);
        }}
        accept={ACCEPTED_EXTENSIONS.join(",")}
        hint={`Libros de la empresa: ${ACCEPTED_EXTENSIONS.join(" · ")} (máx. ${formatFileSize(MAX_UPLOAD_BYTES)})`}
        fileDescription={(file) => {
          if (!isCsv(file)) return "Las tablas se leen desde dentro del ZIP; las carpetas private/ se ignoran.";
          const table = tableForFilename(file.name);
          return table ? <TableName table={table} /> : "se identificará por columnas";
        }}
        disabled={submitting}
      />

      {csvSelection && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
          <p>
            Se enviarán {files.length === 1 ? "1 archivo CSV" : `${files.length} archivos CSV`}. Las tablas sin nombre reconocible se identificarán por sus columnas.
          </p>
          <p className="mt-2">
            No están en la selección: {missingTables.length > 0 ? missingTables.map((table, index) => (
              <span key={table}>
                {index > 0 && ", "}
                <TableName table={table} className="text-xs" />
              </span>
            )) : "ninguna"}.
            <span className="ml-1">
              Las tablas <TableName table={REQUIRED_TABLES[0]} className="text-xs" /> y <TableName table={REQUIRED_TABLES[1]} className="text-xs" /> son obligatorias.
            </span>
          </p>
        </div>
      )}

      {clientError && (
        <Notice tone="error" className="mt-4">
          {clientError}
        </Notice>
      )}
      {submitError && (
        <Notice tone="error" title="No se pudo subir el dataset" className="mt-4">
          <p>{submitError.message}</p>
          {submitError.code && (
            <p className="mt-1 text-xs">
              Código: <code className="font-mono">{submitError.code}</code>
            </p>
          )}
        </Notice>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={handleSubmit} disabled={files.length === 0 || Boolean(clientError) || submitting}>
          {submitting && <Spinner className="h-3.5 w-3.5" />}
          {submitting ? "Subiendo…" : "Subir y validar"}
        </Button>
      </div>
    </div>
  );
}
