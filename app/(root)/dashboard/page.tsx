"use client";

import { DatasetUpload } from "@/components/runs/dataset-upload";
import { RunHistory } from "@/components/runs/run-history";
import { useRequireUser } from "@/lib/use-require-user";

export default function DashboardPage() {
  const user = useRequireUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <p className="text-sm text-zinc-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Hola, {user.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Sube los libros de una empresa para investigar si hay fraude.
      </p>
      <div className="mt-8 space-y-4">
        <DatasetUpload />
      </div>
      <div className="mt-12">
        <RunHistory />
      </div>
    </main>
  );
}
