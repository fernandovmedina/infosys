export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";

/**
 * Se ejecuta en `<head>` antes del primer pintado: aplica la preferencia
 * guardada (o la del sistema) para evitar el destello del tema claro.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;
