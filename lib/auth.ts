/**
 * Capa de autenticacion independiente del proveedor.
 *
 * Habla con el backend FastAPI (app/api/v1/auth.py). El backend guarda la
 * sesion en una cookie httpOnly, por eso todas las llamadas usan
 * `credentials: "include"` y no hay tokens que manejar aqui.
 *
 * No hay verificacion de correo: registrarse inicia sesion de inmediato,
 * igual que iniciar sesion.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type AuthResult = { error: string | null };

export type SignInInput = { email: string; password: string };
export type SignUpInput = { name: string; email: string; password: string };

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
};

const GENERIC_ERROR = "Algo salió mal. Intenta de nuevo.";

type ErrorEnvelope = { error?: { message?: string } };

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorEnvelope;
    return body.error?.message ?? GENERIC_ERROR;
  } catch {
    return GENERIC_ERROR;
  }
}

async function postJson(path: string, body: unknown): Promise<AuthResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { error: "No se pudo conectar con el servidor." };
  }

  if (!response.ok) {
    return { error: await parseErrorMessage(response) };
  }

  return { error: null };
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  return postJson("/auth/login", input);
}

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  return postJson("/auth/register", input);
}

export async function signOut(): Promise<AuthResult> {
  return postJson("/auth/logout", {});
}

/** The signed-in user, or null when there is no valid session. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: "include",
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  return (await response.json()) as CurrentUser;
}
