import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { ProveedorAutenticacion } from './context/ContextoAutenticacion.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorAutenticacion>
      <App />
      <Toaster />
    </ProveedorAutenticacion>
  </StrictMode>,
)
