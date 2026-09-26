import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Auto-update in the background and reload once, rather than getting
      // permanently stuck on a stale build — important since this app talks
      // to a live multiplayer server and an old client could desync.
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Catan',
        short_name: 'Catan',
        description: 'Play Catan online with friends or bots.',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#1c1208',
        theme_color: '#1c1208',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache only the app shell (JS/CSS/HTML) so first install is fast
        // and light on mobile data — never the backend's API/socket traffic,
        // which must always hit the live server.
        globPatterns: ['**/*.{js,css,html,ico}'],
        navigateFallbackDenylist: [/^\/games\//],
        // Large decorative art (card faces, season backgrounds) caches itself
        // opportunistically the first time it's actually used, instead of
        // being force-downloaded before the player has even opened the app.
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'catan-images',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setupTests.js',
  },
})