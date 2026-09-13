"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut, type CurrentUser } from "@/lib/auth";

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Re-checks on every route change, since a client-side navigation right
    // after sign-in/out (router.push, no full reload) would otherwise leave
    // this stale until the next hard refresh.
    let cancelled = false;
    getCurrentUser().then((current) => {
      if (!cancelled) {
        setUser(current);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleSignOut() {
    await signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="text-base font-semibold tracking-tight text-zinc-900"
        >
          Infosys
        </Link>

        <nav className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <span className="px-3 py-1.5 text-sm text-zinc-500">
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
