# Guía de Despliegue

Este documento contiene las instrucciones para desplegar el proyecto en GitHub Pages.

## 📋 Requisitos previos

- Cuenta de GitHub
- Repositorio creado en GitHub
- Node.js 20+ instalado
- pnpm instalado (`npm install -g pnpm`)

## 🚀 Despliegue en GitHub Pages

### 1. Configuración inicial

El proyecto ya está configurado para GitHub Pages. Verifica que `astro.config.mjs` tenga:

```javascript
export default defineConfig({
  output: "static",
  site: "https://hzudev.github.io",
  base: "/front-graph",
  // ... resto de la configuración
});
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (copia `.env.example`):

```bash
cp .env.example .env
```

Completa las variables necesarias:

```env
PUBLIC_API_URL=tu_api_url_aqui
# Agrega otras variables según sea necesario
```

**⚠️ IMPORTANTE:** El archivo `.env` NO debe subirse al repositorio (ya está en `.gitignore`).

### 3. Habilitar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. En "Source", selecciona **GitHub Actions**
4. El workflow se ejecutará automáticamente en cada push a `main`

### 4. Desplegar

```bash
# 1. Asegúrate de estar en la rama main
git checkout main

# 2. Añade todos los cambios
git add .

# 3. Haz commit
git commit -m "Deploy to GitHub Pages"

# 4. Push al repositorio
git push origin main
```

El workflow automáticamente:
- Instalará dependencias
- Ejecutará el build
- Desplegará a GitHub Pages

### 5. Verificar el despliegue

1. Ve a la pestaña **Actions** en tu repositorio
2. Verifica que el workflow "Deploy to GitHub Pages" se ejecute correctamente
3. Una vez completado, visita: `https://hzudev.github.io/front-graph/`

## 🔧 Comandos útiles

```bash
# Desarrollo local
pnpm dev

# Build de producción
pnpm build

# Preview del build
pnpm preview

# Limpiar caché
rm -rf .astro dist node_modules/.vite
```

## 📄 Página 404 personalizada

El proyecto incluye una página 404 personalizada que funciona en GitHub Pages:

### Archivos de la página 404:

**`src/pages/404.astro`**: Página 404 personalizada con diseño completo
- Diseño moderno y responsive con gradientes
- Botones de navegación (Inicio, Buscar, Volver)
- Enlaces a secciones principales del sitio
- Ilustración SVG animada
- Compatible con modo oscuro

### Cómo funciona:

1. Astro genera automáticamente `/404.html` en la raíz del build desde `src/pages/404.astro`
2. GitHub Pages sirve automáticamente este archivo cuando encuentra una ruta inexistente
3. El usuario ve directamente la página 404 con el diseño completo del sitio
4. Desde la página 404, el usuario puede navegar al inicio, buscar o volver atrás

### Probar la página 404 localmente:

```bash
# Build del proyecto
pnpm build

# Servir el build
pnpm preview

# Acceder a una ruta inexistente
# http://localhost:4321/front-graph/ruta-inexistente
```

## 🌐 Otros servicios de hosting

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**Nota:** Para Vercel/Netlify, ajusta `base: "/"` en `astro.config.mjs`

## 🐛 Solución de problemas

### El sitio no carga correctamente

- Verifica que `site` y `base` en `astro.config.mjs` sean correctos
- Asegúrate de usar `buildPath()` para todos los enlaces internos
- Revisa los logs del workflow en GitHub Actions

### Assets no se cargan (CSS, JS, imágenes)

- Verifica que uses rutas relativas o `buildPath()`
- No uses rutas absolutas que empiecen con `/` sin el base path

### La página 404 no funciona

- Verifica que exista `src/pages/404.astro`
- Verifica que el build generó `/404.html` en la carpeta `dist`
- Asegúrate de que las rutas en 404.astro usen `buildPath()` correctamente
- No debe existir `public/404.html` (Astro genera el suyo propio)

### Variables de entorno no funcionan

- Solo las variables con prefijo `PUBLIC_` son accesibles en el cliente
- Verifica que `.env` no esté en el repositorio
- En GitHub Actions, configura los secrets si es necesario

## 📚 Recursos

- [Documentación de Astro](https://docs.astro.build/)
- [GitHub Pages](https://pages.github.com/)
- [Guía de GitHub Actions](https://docs.github.com/en/actions)

## ✅ Checklist de despliegue

- [ ] Variables de entorno configuradas
- [ ] `astro.config.mjs` con `site` y `base` correctos
- [ ] `.env` en `.gitignore`
- [ ] GitHub Pages habilitado con "GitHub Actions"
- [ ] Build local exitoso (`pnpm build`)
- [ ] Código pusheado a `main`
- [ ] Workflow ejecutado exitosamente
- [ ] Sitio accesible en la URL de GitHub Pages
- [ ] Página 404 funciona correctamente
- [ ] Búsqueda funciona con query params
- [ ] Todos los enlaces funcionan correctamente

## 🎯 URLs importantes

- **Producción:** https://hzudev.github.io/front-graph/
- **Repositorio:** https://github.com/hzudev/front-graph
- **Actions:** https://github.com/hzudev/front-graph/actions
- **Settings:** https://github.com/hzudev/front-graph/settings/pages