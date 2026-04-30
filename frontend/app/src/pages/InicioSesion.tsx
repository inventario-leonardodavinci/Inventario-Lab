import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { obtenerConfigAuth, type ConfiguracionAuth } from "@/services/authApi";
import { useAuth } from "@/context/ContextoAutenticacion";
import {
  AuthLayout,
  VistaLogin,
  VistaRegistro,
  VistaVerificarEmail,
  VistaRecuperar,
  VistaRestablecer,
} from "@/components/auth/FormsAuth";

export default function InicioSesion() {
  const navigate = useNavigate();
  const { user, cargando } = useAuth();
  const [searchParams] = useSearchParams();
  const [config, setConfig] = useState<ConfiguracionAuth | null>(null);

  // Si ya hay sesión activa, redirigir al panel (cubre el retorno de OAuth)
  useEffect(() => {
    if (!cargando && user) {
      navigate("/", { replace: true });
    }
  }, [user, cargando, navigate]);

  useEffect(() => {
    obtenerConfigAuth().then(setConfig).catch(() => {});
  }, []);

  // Mostrar nada mientras se comprueba la sesión
  if (cargando) return null;
  if (user) return null;

  const oAuthProviders = config?.oAuthProviders ?? [];
  const emailParam = searchParams.get("email") ?? "";
  const pathname = window.location.pathname;

  if (pathname === "/login/registro") {
    return <AuthLayout><VistaRegistro onNavegar={(r) => navigate(r)} oAuthProviders={oAuthProviders} /></AuthLayout>;
  }

  if (pathname === "/login/verificar") {
    if (!emailParam) { navigate("/login", { replace: true }); return null; }
    return <AuthLayout><VistaVerificarEmail email={emailParam} onNavegar={(r) => navigate(r)} /></AuthLayout>;
  }

  if (pathname === "/login/recuperar") {
    return <AuthLayout><VistaRecuperar onNavegar={(r) => navigate(r)} /></AuthLayout>;
  }

  if (pathname === "/login/restablecer") {
    if (!emailParam) { navigate("/login", { replace: true }); return null; }
    return <AuthLayout><VistaRestablecer email={emailParam} onNavegar={(r) => navigate(r)} /></AuthLayout>;
  }

  return <AuthLayout><VistaLogin onNavegar={(r) => navigate(r)} oAuthProviders={oAuthProviders} /></AuthLayout>;
}
