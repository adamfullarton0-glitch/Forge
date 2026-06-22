import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

/**
 * Content Security Policy. Locks the app to its own bundle + the two food
 * APIs + the YouTube tutorial frame, and blocks inline/eval scripts — the
 * single biggest defence against XSS exfiltrating on-device user data.
 * Injected only into the production build so the Vite dev server (which needs
 * inline scripts + HMR websockets) keeps working.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://i.ytimg.com https://www.themealdb.com https://themealdb.com",
  "font-src 'self'",
  "connect-src 'self' https://world.openfoodfacts.org https://www.themealdb.com",
  'frame-src https://www.youtube-nocookie.com',
  "worker-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "form-action 'self'",
  // frame-ancestors is header-only (ignored in <meta>); set via public/_headers
  // and X-Frame-Options there instead.
  'upgrade-insecure-requests',
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'forge-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

// https://vitejs.dev/config/
// `BASE_PATH` lets a sub-path host (e.g. GitHub Pages project site at
// /Forge/) build correctly; defaults to '/' for root hosting + local dev.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the SW ourselves in main.tsx; don't inject an inline script.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'FORGE',
        short_name: 'FORGE',
        description: 'Train. Eat. Sleep. Forge yourself.',
        theme_color: '#0A0E14',
        background_color: '#0A0E14',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell must open with no network — precache everything built.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            // Real-recipe photos (TheMealDB CDN): immutable, so cache-first and
            // kept offline once a recipe has been viewed.
            urlPattern: /^https:\/\/www\.themealdb\.com\/images\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'forge-recipe-photos',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // External APIs: network-first with a short timeout, cached fallback.
            urlPattern: /^https:\/\/(world\.openfoodfacts\.org|www\.themealdb\.com)\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'forge-api-cache',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  // Native modulepreload is supported by our target browsers; skipping the
  // polyfill avoids an inline <script>, keeping script-src 'self' strict.
  build: {
    modulePreload: { polyfill: false },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
