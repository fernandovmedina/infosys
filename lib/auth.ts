/**
 * Capa de autenticacion independiente del proveedor.
 *
 * Las paginas de /auth solo hablan con estas funciones. Para conectar un
 * backend, reemplaza el cuerpo de cada una por la llamada real (fetch a tu
 * API, SDK, server action, etc.) y respeta el contrato `AuthResult`.
 */

export type AuthResult = { error: string | null };

export type SignUpResult = AuthResult & {
  /** true si el backend exige verificar el correo con un codigo. */
  needsEmailVerification: boolean;
};

export type SignInInput = { email: string; password: string };
export type SignUpInput = { name: string; email: string; password: string };

const NOT_CONFIGURED = "El backend de autenticación aún no está conectado.";

export async function signIn(input: SignInInput): Promise<AuthResult> {
  // TODO: POST /auth/login con { email, password }
  void input;
  return { error: NOT_CONFIGURED };
}

export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  // TODO: POST /auth/register con { name, email, password }
  void input;
  return { error: NOT_CONFIGURED, needsEmailVerification: false };
}

export async function verifyEmailCode(input: {
  email: string;
  code: string;
}): Promise<AuthResult> {
  // TODO: POST /auth/verify con { email, code }
  void input;
  return { error: NOT_CONFIGURED };
}

export async function resendEmailCode(input: {
  email: string;
}): Promise<AuthResult> {
  // TODO: POST /auth/verify/resend con { email }
  void input;
  return { error: NOT_CONFIGURED };
}
