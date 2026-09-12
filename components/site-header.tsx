import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-zinc-900"
        >
          Infosys
        </Link>

        <nav className="flex items-center gap-2">
          <Show when="signed-out">
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
          </Show>

          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Panel
            </Link>
            <UserButton />
          </Show>
        </nav>
      </div>
    </header>
  );
}
