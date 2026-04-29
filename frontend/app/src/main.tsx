import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { ProveedorAutenticacion } from './context/ContextoAutenticacion.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // datos frescos 30s
      retry: 1,                // 1 reintento en error
      refetchOnWindowFocus: true,
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
