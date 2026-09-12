"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/ui";
import { navigateAfterAuth } from "@/lib/auth-navigate";
import { firstErrorMessage } from "@/lib/clerk-errors";

export default function LoginPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitting = fetchStatus === "fetching";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const { error } = await signIn.password({ identifier: email, password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: navigateAfterAuth(router, "/dashboard"),
      });
    }
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

        <FormError message={firstErrorMessage(errors)} />

        <SubmitButton disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
