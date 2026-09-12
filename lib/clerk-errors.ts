type ClerkErrorLike = {
  message: string;
  longMessage?: string;
};

/**
 * Los hooks de Clerk exponen los errores por campo y a nivel global.
 * Para la UI minimalista mostramos solo el primero que aparezca.
 */
export function firstErrorMessage(errors: {
  fields: object;
  global: ClerkErrorLike[] | null;
}): string | null {
  const field = Object.values(errors.fields).find(Boolean) as
    | ClerkErrorLike
    | undefined;

  const first = field ?? errors.global?.[0];

  return first ? (first.longMessage ?? first.message) : null;
}
