// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  output: "static",
  // Configuración para GitHub Pages
  // Cambia 'your-username' y 'your-repo-name' por tus valores reales
  // Ejemplo: site: 'https://hzudev.github.io'
  // Ejemplo: base: '/graph-astro-elecciones'
  site: "https://your-username.github.io",
  base: "/your-repo-name",
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks: {
            leaflet: ["leaflet", "react-leaflet"],
          },
        },
      },
    },
    esbuild: {
      target: "es2020",
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2020",
      },
      include: ["leaflet", "react-leaflet"],
    },
    ssr: {
      noExternal: ["leaflet", "react-leaflet"],
    },
    worker: {
      format: "es",
    },
  },

  integrations: [react()],
});
