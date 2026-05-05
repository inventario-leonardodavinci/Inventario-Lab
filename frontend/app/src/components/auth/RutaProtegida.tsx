import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/ContextoAutenticacion";

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  // Solo mostramos el spinner cuando no hay usuario en el store Y el SDK aún verifica.
  // Si hay usuario en el store (cargando=false desde el inicio), mostramos la app
  // inmediatamente — el SDK verifica en background sin bloquear la UI.
  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando sesión...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
