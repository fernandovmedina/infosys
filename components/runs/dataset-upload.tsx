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
  // Los CSV sin nombre reconocible se identifican por columnas en el backend y aún podrían cubrirlas.
  const unrecognizedCount = files.filter((file) => tableForFilename(file.name) === null).length;
  const missingRequired = REQUIRED_TABLES.filter((table) => !selectedTables.has(table));
  const requiredError = csvSelection && !clientError && missingRequired.length > unrecognizedCount;

  async function handleSubmit() {
    if (files.length === 0 || clientError || requiredError || submitting) return;
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
        hint={`Company books: ${ACCEPTED_EXTENSIONS.join(" · ")} (max. ${formatFileSize(MAX_UPLOAD_BYTES)})`}
        fileDescription={(file) => {
          if (!isCsv(file)) return "Tables are read from inside the ZIP; private/ folders are ignored.";
          const table = tableForFilename(file.name);
          return table ? <TableName table={table} /> : "will be identified by its columns";
        }}
        disabled={submitting}
      />

      {csvSelection && (
        <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
          <p>
            {files.length === 1 ? "1 CSV file" : `${files.length} CSV files`} will be sent. Tables without a recognizable name will be identified by their columns.
          </p>
          <p className="mt-2">
            Not in the selection: {missingTables.length > 0 ? missingTables.map((table, index) => (
              <span key={table}>
                {index > 0 && ", "}
                <TableName table={table} className="text-xs" />
              </span>
            )) : "none"}.
            <span className="ml-1">
              The <TableName table={REQUIRED_TABLES[0]} className="text-xs" /> and <TableName table={REQUIRED_TABLES[1]} className="text-xs" /> tables are required.
            </span>
          </p>
        </div>
      )}

      {clientError && (
        <Notice tone="error" className="mt-4">
          {clientError}
        </Notice>
      )}
      {requiredError && (
        <Notice tone="error" className="mt-4">
          {missingRequired.length === 1 ? "Missing table" : "Missing tables"}{" "}
          {missingRequired.map((table, index) => (
            <span key={table}>
              {index > 0 && " and "}
              <TableName table={table} className="text-xs" />
            </span>
          ))}
          . The investigation can’t start without {missingRequired.length === 1 ? "it" : "them"}; add {missingRequired.length === 1 ? "it" : "them"} to the selection.
        </Notice>
      )}
      {submitError && (
        <Notice tone="error" title="Could not upload the dataset" className="mt-4">
          <p>{submitError.message}</p>
          {submitError.code && (
            <p className="mt-1 text-xs">
              Code: <code className="font-mono">{submitError.code}</code>
            </p>
          )}
        </Notice>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="primary" onClick={handleSubmit} disabled={files.length === 0 || Boolean(clientError) || requiredError || submitting}>
          {submitting && <Spinner className="h-3.5 w-3.5" />}
          {submitting ? "Uploading…" : "Upload and validate"}
        </Button>
      </div>
    </div>
  );
}
