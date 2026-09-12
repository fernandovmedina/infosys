import { SignOutButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  await auth.protect();

  const user = await currentUser();
  const displayName =
    user?.firstName ?? user?.primaryEmailAddress?.emailAddress ?? "usuario";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Hola, {displayName}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Tu sesión está activa. Aquí irá la detección de fraudes.
      </p>

      <div className="mt-8">
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>
    </main>
  );
}
