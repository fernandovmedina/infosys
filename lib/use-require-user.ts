"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";

/**
 * Guard de sesión de las páginas privadas: devuelve el usuario o `null`
 * mientras se verifica. Sin sesión redirige a `/auth/login` con `next`
 * apuntando a la página actual para poder volver después.
 */
export function useRequireUser(): CurrentUser | null {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((current) => {
      if (cancelled) return;
      if (!current) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      setUser(current);
    });
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  return user;
}
