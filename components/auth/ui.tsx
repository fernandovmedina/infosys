import type { ComponentProps, ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <p className="mt-6 text-center text-sm text-zinc-500">{footer}</p>
      </div>
    </main>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 disabled:opacity-60"
      />
    </label>
  );
}

export function SubmitButton({
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      type="submit"
      className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </p>
  );
}
