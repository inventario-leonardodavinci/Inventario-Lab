import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { ContenedorAplicacion } from './components/layout/ContenedorAplicacion'
import { RutaProtegida } from './components/auth/RutaProtegida'
import { SkeletonTabla } from './components/ui/PageSkeleton'

// Wrapper para manejar errores de carga de chunks tras un nuevo despliegue en producción (Vercel)
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    )
    try {
      const component = await componentImport()
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false')
      return component
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true')
        window.location.reload()
        return new Promise(() => {}) // Promesa pendiente para suspender mientras se recarga
      }
      throw error
    }
  })

const PanelPrincipal = lazyWithRetry(() => import('./pages/PanelPrincipal'))
const Articulos = lazyWithRetry(() => import('./pages/Articulos'))
const InicioSesion = lazyWithRetry(() => import('./pages/InicioSesion'))
const Mantenimiento = lazyWithRetry(() => import('./pages/Mantenimiento'))
const Perfil = lazyWithRetry(() => import('./pages/Perfil'))
const Auditoria = lazyWithRetry(() => import('./pages/Auditoria'))
const Usuarios = lazyWithRetry(() => import('./pages/Usuarios'))
const ListaUbicaciones = lazyWithRetry(() => import('./pages/ListaUbicaciones'))
const ListaCategorias = lazyWithRetry(() => import('./pages/ListaCategorias'))

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<SkeletonTabla cols={['w-20', 'flex-1', 'w-24', 'w-20', 'w-20']} />}>
        <Routes>
          <Route path="/login" element={<InicioSesion />} />
          <Route path="/login/registro" element={<InicioSesion />} />
          <Route path="/login/verificar" element={<InicioSesion />} />
          <Route path="/login/recuperar" element={<InicioSesion />} />
          <Route path="/login/restablecer" element={<InicioSesion />} />
          <Route
            path="*"
            element={
              <RutaProtegida>
                <ContenedorAplicacion>
                  <Routes>
                    <Route path="/" element={<PanelPrincipal />} />
                    <Route path="/inventario" element={<Navigate to="/articulos" replace />} />
                    <Route path="/articulos" element={<Articulos />} />
                    <Route path="/movimientos" element={<Navigate to="/articulos" replace />} />
                    <Route path="/informes" element={<Navigate to="/auditoria" replace />} />
                    <Route path="/mantenimiento" element={<Mantenimiento />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/auditoria" element={<Auditoria />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/ubicaciones" element={<ListaUbicaciones />} />
                    <Route path="/categorias" element={<ListaCategorias />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ContenedorAplicacion>
              </RutaProtegida>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
