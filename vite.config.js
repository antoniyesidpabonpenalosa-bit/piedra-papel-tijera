import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base path: por defecto '/', correcto para Vercel/Netlify y para 'npm run dev'.
// El workflow de GitHub Pages exporta VITE_BASE_PATH=/piedra-papel-tijera/
// porque ahí el sitio vive en esa subcarpeta.
const base = process.env.VITE_BASE_PATH || '/';

export default defineConfig({
  base,
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Piedra Papel Tijera',
        short_name: 'PPT',
        description: 'Juego de Piedra Papel Tijera con torneo, multijugador y modo offline',
        theme_color: '#302b63',
        background_color: '#0f0c29',
        display: 'standalone',
        orientation: 'portrait',
        scope: base,
        start_url: base,
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
