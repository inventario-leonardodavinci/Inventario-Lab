import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { ContenedorAplicacion } from './components/layout/ContenedorAplicacion'
import { RutaProtegida } from './components/auth/RutaProtegida'
import { SkeletonTabla } from './components/ui/PageSkeleton'

const PanelPrincipal = lazy(() => import('./pages/PanelPrincipal'))
const Articulos = lazy(() => import('./pages/Articulos'))
const InicioSesion = lazy(() => import('./pages/InicioSesion'))
const Mantenimiento = lazy(() => import('./pages/Mantenimiento'))
const Movimientos = lazy(() => import('./pages/Movimientos'))
const Informes = lazy(() => import('./pages/Informes'))
const Perfil = lazy(() => import('./pages/Perfil'))
const Alertas = lazy(() => import('./pages/Alertas'))
const Auditoria = lazy(() => import('./pages/Auditoria'))
const Usuarios = lazy(() => import('./pages/Usuarios'))
const ListaUbicaciones = lazy(() => import('./pages/Ubicaciones/ListaUbicaciones'))
const ListaCategorias = lazy(() => import('./pages/Categorias/ListaCategorias'))

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
                    <Route path="/movimientos" element={<Movimientos />} />
                    <Route path="/informes" element={<Informes />} />
                    <Route path="/mantenimiento" element={<Mantenimiento />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/alertas" element={<Alertas />} />
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
