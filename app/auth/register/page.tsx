"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/ui";
import { navigateAfterAuth } from "@/lib/auth-navigate";
import { firstErrorMessage } from "@/lib/clerk-errors";

/** Clerk guarda nombre y apellido por separado; aqui pedimos un solo campo. */
function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || undefined };
}

export default function RegisterPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const submitting = fetchStatus === "fetching";

  // Clerk ya creo el registro y solo falta verificar el correo.
  const needsEmailCode =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const { error } = await signUp.password({
      ...splitName(name),
      emailAddress: email,
      password,
    });
    if (error) return;

    await signUp.verifications.sendEmailCode();
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return;

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: navigateAfterAuth(router, "/dashboard"),
      });
    }
  }

  if (needsEmailCode) {
    return (
      <AuthCard
        title="Verifica tu correo"
        subtitle={`Enviamos un código a ${signUp.emailAddress ?? email}.`}
        footer={
          <button
            type="button"
            onClick={() => signUp.verifications.sendEmailCode()}
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

          <FormError message={firstErrorMessage(errors)} />

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

        <FormError message={firstErrorMessage(errors)} />

        {/* Clerk monta aqui el CAPTCHA del flujo personalizado de registro */}
        <div id="clerk-captcha" className="empty:hidden" />

        <SubmitButton disabled={submitting}>
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
