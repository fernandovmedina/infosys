"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileDropzone } from "@/components/dashboard/file-dropzone";
import { formatFileSize } from "@/lib/format";
import { ApiError, errorMessage, isNotAuthenticated } from "@/lib/runs/errors";
import { createRun } from "@/lib/runs/api";
import { Button, Notice, Spinner } from "./ui";

const ACCEPTED = [".zip", ".csv", ".xlsx", ".db", ".sqlite", ".sql"];
const MAX_BYTES = 200 * 1024 * 1024;

/** El frontend solo valida extensión y tamaño; el contenido lo diagnostica el backend (EXAMPLE §4.1). */
function validateFiles(files: File[]): string | null {
  if (files.length === 0) return null;
  const unsupported = files.find((file) => !ACCEPTED.some((ext) => file.name.toLowerCase().endsWith(ext)));
  if (unsupported) {
    return `${unsupported.name} no tiene un formato soportado. Usa ${ACCEPTED.join(", ")}.`;
  }
  if (files.length > 1 && files.some((file) => !file.name.toLowerCase().endsWith(".csv"))) {
    return "Solo se pueden subir varios archivos a la vez si todos son .csv (uno por tabla). Para otros formatos sube un solo archivo.";
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_BYTES) {
    return `El dataset pesa ${formatFileSize(total)}; el máximo es ${formatFileSize(MAX_BYTES)}.`;
  }
  return null;
}

export function DatasetUpload() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ code?: string; message: string } | null>(null);

  const clientError = validateFiles(files);

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
        message: errorMessage(error),
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
        accept={ACCEPTED.join(",")}
        hint={`Libros de la empresa: ${ACCEPTED.join(" · ")} (máx. ${formatFileSize(MAX_BYTES)})`}
        disabled={submitting}
      />

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
