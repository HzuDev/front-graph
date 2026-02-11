# Graph Astro Elecciones

Aplicación web para visualizar y explorar datos de elecciones en Uruguay, desarrollada con Astro, React y TypeScript.

## 🚀 Características

- **Búsqueda avanzada**: Busca candidatos, partidos y listas con filtros por departamento y tipo
- **Mapa interactivo**: Visualización geográfica de datos electorales
- **Página 404 personalizada**: Manejo elegante de rutas no encontradas
- **Diseño responsive**: Optimizado para dispositivos móviles y desktop
- **Modo oscuro**: Soporte para tema claro y oscuro
- **Rendimiento optimizado**: Generación estática para carga rápida

## 📦 Tecnologías

- **[Astro](https://astro.build/)**: Framework web estático
- **[React](https://react.dev/)**: Biblioteca UI
- **[TypeScript](https://www.typescriptlang.org/)**: Tipado estático
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework CSS
- **[Leaflet](https://leafletjs.com/)**: Mapas interactivos
- **[Radix UI](https://www.radix-ui.com/)**: Componentes accesibles

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/hzudev/front-graph.git
cd front-graph

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus valores
# PUBLIC_API_URL=tu_api_url_aqui
```

## 🏃‍♂️ Desarrollo

```bash
# Iniciar servidor de desarrollo
pnpm dev

# El sitio estará disponible en http://localhost:4321
```

## 🏗️ Build

```bash
# Generar build de producción
pnpm build

# Preview del build
pnpm preview
```

## 🌐 Despliegue

El proyecto está configurado para desplegarse automáticamente en GitHub Pages mediante GitHub Actions.

### Despliegue automático:

1. Push a la rama `main`
2. GitHub Actions ejecuta el workflow de deploy
3. El sitio se publica en: https://hzudev.github.io/front-graph/

Para más detalles, consulta [DEPLOY.md](./DEPLOY.md)

## 📄 Página 404

El proyecto incluye una página 404 personalizada que funciona correctamente en GitHub Pages:

- **Diseño moderno**: Interfaz amigable con gradientes y animaciones
- **Navegación útil**: Botones para volver al inicio, buscar o regresar
- **Redirección automática**: Fallback en `public/404.html` que redirige a la página Astro
- **Responsive**: Se adapta a todos los tamaños de pantalla

### Archivos relacionados:
- `src/pages/404.astro` - Página 404 principal con diseño completo
- `public/404.html` - Fallback para GitHub Pages con redirección automática

## 📁 Estructura del proyecto

```
graph-astro-elecciones/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow de GitHub Actions
├── public/
│   ├── 404.html                # Fallback 404 para GitHub Pages
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── dashboard/          # Componentes del dashboard
│   │   ├── search/             # Componentes de búsqueda
│   │   └── ui/                 # Componentes UI reutilizables
│   ├── layouts/
│   │   └── Layout.astro        # Layout principal
│   ├── lib/
│   │   ├── queries/            # Funciones de API
│   │   └── utils/              # Utilidades
│   ├── pages/
│   │   ├── 404.astro           # Página 404 personalizada
│   │   ├── index.astro         # Página de inicio
│   │   ├── search.astro        # Página de búsqueda
│   │   └── mapa.astro          # Mapa interactivo
│   └── styles/
│       └── global.css          # Estilos globales
├── .env.example                # Plantilla de variables de entorno
├── astro.config.mjs            # Configuración de Astro
├── tailwind.config.js          # Configuración de Tailwind
├── DEPLOY.md                   # Guía de despliegue
└── package.json
```

## 🔧 Configuración

### Variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```env
PUBLIC_API_URL=https://tu-api.com/api
```

### GitHub Pages

El proyecto usa las siguientes configuraciones en `astro.config.mjs`:

```javascript
export default defineConfig({
  output: "static",
  site: "https://hzudev.github.io",
  base: "/front-graph",
});
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🔗 Enlaces

- **Sitio web**: https://hzudev.github.io/front-graph/
- **Repositorio**: https://github.com/hzudev/front-graph
- **Issues**: https://github.com/hzudev/front-graph/issues

## 👥 Autores

- **hzudev** - [GitHub](https://github.com/hzudev)


---

Hecho con ❤️ en Uruguay
