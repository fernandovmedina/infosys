"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard, Field, FormError, SubmitButton } from "@/components/auth/ui";
import { signUp } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    router.push("/dashboard");
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
