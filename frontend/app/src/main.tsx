import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import './index.css'
import App from './App.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { ProveedorAutenticacion } from './context/ContextoAutenticacion.tsx'
import { ProveedorTema } from './context/ContextoTema.tsx'
import { ApiError } from './services/clienteApi.ts'

document.title = 'Inventario Salud Ambiental'

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
      </QueryClientProvider>
    </ProveedorTema>
  </StrictMode>,
)
