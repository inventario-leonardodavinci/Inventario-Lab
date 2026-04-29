import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { ContenedorAplicacion } from "./components/layout/ContenedorAplicacion";
import { RutaProtegida } from "./components/auth/RutaProtegida";

const PanelPrincipal = lazy(() => import("./pages/PanelPrincipal"));
const Inventario = lazy(() => import("./pages/Inventario"));
const InicioSesion = lazy(() => import("./pages/InicioSesion"));
const Mantenimiento = lazy(() => import("./pages/Mantenimiento"));
const Movimientos = lazy(() => import("./pages/Movimientos"));
const Informes = lazy(() => import("./pages/Informes"));
const Perfil = lazy(() => import("./pages/Perfil"));

function App() {
  return (
    <Router>
      <Suspense fallback={<main className="p-6 text-sm text-muted-foreground">Cargando...</main>}>
        <Routes>
          <Route path="/login" element={<InicioSesion />} />
          <Route
            path="*"
            element={
              <RutaProtegida>
                <ContenedorAplicacion>
                  <Routes>
                    <Route path="/" element={<PanelPrincipal />} />
                    <Route path="/inventario" element={<Inventario />} />
                    <Route path="/movimientos" element={<Movimientos />} />
                    <Route path="/informes" element={<Informes />} />
                    <Route path="/mantenimiento" element={<Mantenimiento />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </ContenedorAplicacion>
              </RutaProtegida>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
