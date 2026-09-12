"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/ui";
import { resendEmailCode, signUp, verifyEmailCode } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsEmailCode, setNeedsEmailCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await signUp({ name, email, password });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailVerification) {
      setNeedsEmailCode(true);
      return;
    }

    router.push("/dashboard");
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await verifyEmailCode({ email, code });

    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard");
  }

  async function handleResend() {
    setError(null);
    const result = await resendEmailCode({ email });
    if (result.error) setError(result.error);
  }

  if (needsEmailCode) {
    return (
      <AuthCard
        title="Verifica tu correo"
        subtitle={`Enviamos un código a ${email}.`}
        footer={
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            Reenviar código
          </button>
        }
      >
        <form onSubmit={handleVerify} className="flex flex-col gap-4" noValidate>
          <Field
            label="Código de verificación"
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />

          <FormError message={error} />

          <SubmitButton disabled={submitting}>
            {submitting ? "Verificando…" : "Verificar y continuar"}
          </SubmitButton>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Crear cuenta"
      subtitle="Empieza a detectar fraudes con Infosys."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-4" noValidate>
        <Field
          label="Nombre"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Tu nombre"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

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
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <FormError message={error} />

        <SubmitButton disabled={submitting}>
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
