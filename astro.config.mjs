// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

const env = loadEnv('', process.cwd(), '');

export default defineConfig({
  output: 'static',
  site: env.PUBLIC_BASE_URL || 'http://localhost:4321',
  base: env.PUBLIC_BASE_ROUTE || '/',
  server: {
    port: Number(env.PORT) || 4321,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            leaflet: ['leaflet', 'react-leaflet'],
          },
        },
      },
    },
    esbuild: {
      target: 'es2020',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
      },
      include: ['leaflet', 'react-leaflet'],
    },
    ssr: {
      noExternal: ['leaflet', 'react-leaflet'],
    },
    worker: {
      format: 'es',
    },
  },

  integrations: [react()],
});
