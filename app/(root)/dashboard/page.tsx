"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((current) => {
      if (cancelled) return;
      if (!current) {
        router.replace("/auth/login");
        return;
      }
      setUser(current);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking || !user) {
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
      <p className="mt-2 text-sm text-zinc-600">
        Aquí irá la detección de fraudes cuando conectemos el backend.
      </p>
    </main>
  );
}
