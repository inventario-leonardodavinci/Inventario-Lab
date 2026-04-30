import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { ProveedorAutenticacion } from './context/ContextoAutenticacion.tsx'
import { ApiError } from './services/clienteApi.ts'

document.title = 'Inventario Salud Ambiental'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // No reintentar en errores 401, 403, 404, 422
        if (error instanceof ApiError && [401, 403, 404, 422].includes(error.status)) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      onError: (error) => {
        // Los errores 422 los manejan los componentes individualmente
        // Los errores 401/403 se muestran con toast global
        if (error instanceof ApiError && error.status === 401) {
          // El componente RutaProtegida maneja la redirección
        }
      },
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProveedorAutenticacion>
        <App />
        <Toaster />
      </ProveedorAutenticacion>
    </QueryClientProvider>
  </StrictMode>,
)
