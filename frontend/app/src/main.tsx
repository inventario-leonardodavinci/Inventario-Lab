import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import * as Sentry from '@sentry/react'
import { toast } from 'sonner'
import './index.css'
import App from './App.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { ProveedorAutenticacion } from './context/ContextoAutenticacion.tsx'
import { ProveedorTema } from './context/ContextoTema.tsx'
import { ApiError } from './services/clienteApi.ts'

document.title = 'Inventario Salud Ambiental'

// ── Sentry ────────────────────────────────────────────────────────────────────
// Solo se inicializa si hay DSN configurado (producción/staging).
// En desarrollo local sin VITE_SENTRY_DSN, Sentry queda desactivado.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN as string,
    sendDefaultPii: true,
    tunnel: '/sentry-tunnel',
    environment: import.meta.env.MODE,
    // Capturar el 100% de errores, 10% de trazas de performance
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    // Replay de sesión solo en producción: 1% normal, 100% en sesiones con error
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // No capturar texto ni inputs (datos sensibles de inventario)
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],
    // No enviar errores de red o de ITP de iOS (son ruido, no bugs)
    beforeSend(event) {
      const msg = event.exception?.values?.[0]?.value ?? ''
      if (msg.includes('NetworkError') || msg.includes('Failed to fetch')) return null
      return event
    },
  })
}

function manejarErrorGlobal(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Sesión expirada — RutaProtegida redirige, no mostramos toast
      return
    }
    if (error.status === 403) {
      toast.error('No tienes permiso para realizar esta acción.')
      return
    }
    if (error.status === 0 || error.status === 408) {
      // Sin red o timeout — mensaje ya es en español desde clienteApi
      toast.error(error.message)
      return
    }
  }
  // Errores 422 los maneja cada componente individualmente
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [401, 403, 404, 422].includes(error.status)) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      onError: manejarErrorGlobal,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorTema>
      <QueryClientProvider client={queryClient}>
        <ProveedorAutenticacion>
          <App />
          <Toaster />
        </ProveedorAutenticacion>
        {/* Devtools solo en desarrollo — tree-shaken en producción */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ProveedorTema>
  </StrictMode>,
)
