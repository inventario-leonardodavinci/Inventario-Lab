import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/ContextoAutenticacion";

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Cargando sesión...</p>
    </main>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
