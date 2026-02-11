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
  const base = import.meta.env.BASE_URL || '/';
  // Eliminar trailing slash del base si existe
  const cleanBase = base.endsWith('/') && base.length > 1 ? base.slice(0, -1) : base;
  // Asegurar que path empiece con /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBase}${cleanPath}`;
}

/**
 * Construye una URL completa con el site configurado
 * @param path - Ruta relativa
 * @returns URL completa
 */
export function buildFullUrl(path: string): string {
  const site = import.meta.env.SITE || '';
  return `${site}${buildPath(path)}`;
}
