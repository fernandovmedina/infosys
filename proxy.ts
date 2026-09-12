import { clerkMiddleware } from "@clerk/nextjs/server";

// Solo mantiene la sesion de Clerk disponible en cada request.
// La proteccion de rutas vive en cada pagina (ver app/dashboard/page.tsx).
export default clerkMiddleware();

export const config = {
  matcher: [
    // Omite archivos internos de Next y estaticos, salvo que aparezcan en query params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Siempre corre en rutas de API y en el proxy de Clerk
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
