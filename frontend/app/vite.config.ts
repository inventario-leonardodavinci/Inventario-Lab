import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { compression } from 'vite-plugin-compression2'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'

const isProduction = process.env.NODE_ENV === 'production'
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // ── Sentry ────────────────────────────────────────────────────────────────
    ...(isProduction && sentryAuthToken ? sentryVitePlugin({
      org: 'said-oudrhich',
      project: 'javascript-react',
      authToken: sentryAuthToken,
      telemetry: false,
      bundleSizeOptimizations: { excludeDebugStatements: true },
    }) : []),

    // ── Compresión Brotli + gzip ──────────────────────────────────────────────
    compression({ algorithms: ['brotliCompress'], exclude: [/\.(br)$/, /\.(gz)$/] }),
    compression({ algorithms: ['gzip'], exclude: [/\.(br)$/, /\.(gz)$/] }),

    // ── PWA ───────────────────────────────────────────────────────────────────
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      manifest: {
        name: 'Lab Leonardo',
        short_name: 'Lab Leonardo',
        description: 'Sistema de gestión de inventario del laboratorio Leonardo',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 5173,
    },
    proxy: isProduction
      ? {
          '/sentry-tunnel': {
            target: 'https://o4511061111144448.ingest.de.sentry.io',
            changeOrigin: true,
            rewrite: () => '/api/4511339315200080/envelope/',
            secure: true,
            configure: (proxy) => {
              proxy.on('error', (err) => console.error('[sentry-tunnel]', err))
            },
          },
        }
      : undefined,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Separar vendor chunks para mejor caché del navegador
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'react-vendor'
          }
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) {
            return 'query-vendor'
          }
          if (id.includes('@radix-ui')) {
            return 'ui-vendor'
          }
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'form-vendor'
          }
          if (id.includes('date-fns')) {
            return 'date-vendor'
          }
          if (id.includes('zustand') || id.includes('axios')) {
            return 'state-vendor'
          }
        },
      },
    },
  },
})
