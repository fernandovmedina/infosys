import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Infosys
        </h1>
        <p className="mt-3 text-base text-zinc-600">
          SAT fraud detection.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/auth/register"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Create account
          </Link>
          <Link
            href="/auth/login"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
