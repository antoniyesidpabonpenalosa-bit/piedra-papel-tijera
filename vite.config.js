import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Base path: en GitHub Pages el sitio vive en /piedra-papel-tijera/.
// En desarrollo (npm run dev) usamos '/'.
const base = process.env.NODE_ENV === 'production' ? '/piedra-papel-tijera/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
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
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
