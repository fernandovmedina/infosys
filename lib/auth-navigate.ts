/**
 * Navegacion posterior a `finalize()`. Clerk puede devolver una URL decorada
 * y absoluta (sincronizacion de sesion en desarrollo), que no se puede navegar
 * desde el router de Next.
 */
export function navigateAfterAuth(
  router: { push: (url: string) => void },
  destination: string,
) {
  return ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
    const url = decorateUrl(destination);

    if (url.startsWith("http")) {
      window.location.href = url;
      return;
    }

    router.push(url);
  };
}
