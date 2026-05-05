import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/ContextoAutenticacion";

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { user, cargando, procesandoOAuth } = useAuth();
  const location = useLocation();

  // Spinner mientras el SDK verifica la sesión (primera visita / sin store)
  // o mientras se procesa un callback OAuth (Apple/Google redirect).
  if (cargando || procesandoOAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {procesandoOAuth ? "Completando inicio de sesión..." : "Cargando sesión..."}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
