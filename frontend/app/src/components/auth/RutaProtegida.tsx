import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/ContextoAutenticacion";

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
