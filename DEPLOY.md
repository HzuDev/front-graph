# 📦 Guía de Deployment a GitHub Pages

## 🔧 Configuración Inicial

### 1. Configurar el repositorio

Edita `astro.config.mjs` y actualiza:

```javascript
site: "https://TU-USUARIO.github.io",
base: "/NOMBRE-DE-TU-REPO",
```

**Ejemplo:**
- Si tu usuario es `hzudev` y tu repo es `graph-astro-elecciones`:
- `site: "https://hzudev.github.io"`
- `base: "/graph-astro-elecciones"`

### 2. Variables de Entorno

Las variables de entorno con prefijo `PUBLIC_` se incluyen en el build y son accesibles en el cliente.

1. Copia `.env.example` a `.env`
2. Llena los valores con tu configuración de Appwrite
3. **NO** subas el archivo `.env` al repositorio (ya está en `.gitignore`)

### 3. Configurar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. En "Source", selecciona **GitHub Actions**

## 🚀 Deploy

### Deploy Automático

Cada vez que hagas push a la rama `main`, se desplegará automáticamente.

```bash
git add .
git commit -m "Update site"
git push origin main
```

### Deploy Manual

Desde GitHub:
1. Ve a la pestaña "Actions"
2. Selecciona "Deploy to GitHub Pages"
3. Haz clic en "Run workflow"

## 🧪 Probar localmente antes de deploy

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev

# Build de producción (simula GitHub Pages)
pnpm build

# Preview del build
pnpm preview
```

## ⚠️ Solución de Problemas

### Los assets no cargan
- Verifica que `base` en `astro.config.mjs` coincida con el nombre de tu repo
- Los links internos deben usar rutas relativas o usar `import.meta.env.BASE_URL`

### El sitio no se actualiza
- Espera 2-3 minutos después del deploy
- Limpia la caché del navegador (Ctrl+Shift+R)
- Verifica que el workflow se completó exitosamente en Actions

### Errores de build
- Revisa los logs en la pestaña Actions
- Asegúrate de que el build funciona localmente con `pnpm build`

## 📝 Checklist antes de Push

- [ ] Actualizado `site` y `base` en `astro.config.mjs`
- [ ] Variables de entorno configuradas (si es necesario)
- [ ] Build local funciona: `pnpm build`
- [ ] `.env` NO está en el commit
- [ ] Todos los cambios importantes commiteados

## 🔗 URLs útiles

- **Sitio en producción:** `https://TU-USUARIO.github.io/NOMBRE-REPO`
- **GitHub Actions:** `https://github.com/TU-USUARIO/NOMBRE-REPO/actions`
- **Configuración Pages:** `https://github.com/TU-USUARIO/NOMBRE-REPO/settings/pages`
