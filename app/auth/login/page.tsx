"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/ui";
import { signIn } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await signIn({ email, password });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <AuthCard
      title="Iniciar sesión"
      subtitle="Accede a tu panel de Infosys."
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link
            href="/auth/register"
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Field
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <FormError message={error} />

        <SubmitButton disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
