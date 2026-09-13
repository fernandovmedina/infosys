"use client";

import { DatasetUpload } from "@/components/runs/dataset-upload";
import { RunHistory } from "@/components/runs/run-history";
import { useRequireUser } from "@/lib/use-require-user";

export default function DashboardPage() {
  const user = useRequireUser();

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Hello, {user.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Upload a company’s books to investigate whether there is fraud.
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
