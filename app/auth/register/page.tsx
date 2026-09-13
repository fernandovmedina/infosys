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
      title="Create account"
      subtitle="Start detecting fraud with Infosys."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-zinc-900 underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Field
          label="Name"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <FormError message={error} />

        <SubmitButton disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
