/**
 * Helper para construir rutas que funcionen tanto en desarrollo como en GitHub Pages
 * Usa import.meta.env.BASE_URL automáticamente configurado por Astro
 */

/**
 * Construye una ruta absoluta considerando el base path de la aplicación
 * @param path - Ruta relativa (debe empezar con /)
 * @returns Ruta completa con el base path
 * 
 * @example
 * // En desarrollo: /search?q=test
 * // En GitHub Pages: /repo-name/search?q=test
 * buildPath('/search?q=test')
 */
export function buildPath(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const cleanBase = base === "/" ? "" : base.replace(/\/+$/, "");
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
}
