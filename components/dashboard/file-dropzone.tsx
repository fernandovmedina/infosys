"use client";

import { useEffect, useRef, useState, type DragEvent, type ReactNode } from "react";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  onFilesChange,
  accept = ".zip,.csv",
  hint = "Solo se aceptan archivos .zip o .csv",
  fileDescription,
  disabled = false,
}: {
  onFilesChange?: (files: File[]) => void;
  /** Filtro del selector de archivos (atributo `accept` del input). */
  accept?: string;
  /** Texto de ayuda bajo el título. */
  hint?: string;
  /** Información compacta que se muestra debajo del nombre de cada archivo. */
  fileDescription?: (file: File) => ReactNode;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);

  // Copia de `files` para el listener de pegar, que se registra una sola vez.
  const filesRef = useRef<File[]>([]);

  // Notifica al padre fuera del updater de estado: llamarlo dentro de
  // `setFiles` actualizaría otro componente durante el render.
  function commitFiles(next: File[]) {
    filesRef.current = next;
    setFiles(next);
    onFilesChange?.(next);
  }

  function addFiles(incoming: FileList | File[] | null) {
    if (disabled || !incoming || incoming.length === 0) return;
    commitFiles([...filesRef.current, ...Array.from(incoming)]);
  }

  function removeFile(index: number) {
    commitFiles(filesRef.current.filter((_, i) => i !== index));
  }

  // Permite pegar archivos (Cmd/Ctrl+V) en cualquier parte de la página.
  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const pasted = event.clipboardData?.files;
      if (pasted && pasted.length > 0) {
        event.preventDefault();
        addFiles(pasted);
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full flex-col ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} items-center justify-center rounded-lg border-2 border-dashed px-6 py-16 text-center transition-colors outline-none focus-visible:border-zinc-900 ${
          dragging
            ? "border-zinc-900 bg-zinc-100"
            : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50"
        }`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-10 w-10 text-zinc-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="mt-4 text-sm font-medium text-zinc-900">
          Arrastra tu archivo aquí, pégalo o haz clic para subirlo
        </p>
        <p className="mt-1 text-xs text-zinc-500">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <span className="min-w-0 truncate text-zinc-900">
                <span className="block truncate">{file.name}</span>
                {fileDescription && <span className="mt-0.5 block truncate text-xs text-zinc-500">{fileDescription(file)}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-4">
                <span className="text-zinc-500">{formatSize(file.size)}</span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeFile(index)}
                  className="text-zinc-500 transition-colors hover:text-zinc-900"
                >
                  Quitar
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
