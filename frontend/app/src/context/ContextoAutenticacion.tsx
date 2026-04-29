import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loginConInsforge,
  obtenerSesionActual,
  logoutDeInsforge,
  registrarUsuario,
  verificarEmail,
  reenviarCodigoVerificacion,
  enviarCodigoRecuperacion,
  verificarCodigoRecuperacion,
  restablecerContrasena,
  loginConOAuth,
  sincronizarPerfil,
  type ResultadoRegistro,
  type SesionUsuario,
} from "@/services/authApi";
import { enviarEventoLogin } from "@/services/notificacionesApi";

type ValorContextoAutenticacion = {
  user: SesionUsuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  registro: (email: string, password: string, displayName: string) => Promise<ResultadoRegistro>;
  verificarEmail: (email: string, otp: string) => Promise<void>;
  reenviarCodigo: (email: string) => Promise<void>;
  enviarCodigoRecuperacion: (email: string) => Promise<void>;
  verificarCodigoRecuperacion: (email: string, code: string) => Promise<string>;
  restablecerContrasena: (nuevaContrasena: string, token: string) => Promise<void>;
  loginConOAuth: (provider: string) => Promise<void>;
  logout: () => Promise<void>;
  actualizarUsuario: (cambios: Partial<SesionUsuario>) => void;
};

const ContextoAutenticacion = createContext<ValorContextoAutenticacion | undefined>(undefined);

export function ProveedorAutenticacion({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SesionUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerSesionActual()
      .then((sesion) => { if (sesion) setUser(sesion); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const value = useMemo<ValorContextoAutenticacion>(
    () => ({
      user,
      cargando,

      login: async (email, password) => {
        const sesion = await loginConInsforge({ email, password });
        setUser(sesion);
        try {
          await enviarEventoLogin(sesion.authUserId);
          await sincronizarPerfil(sesion.authUserId, sesion.displayName);
        } catch { /* opcional */ }
      },

      registro: async (email, password, displayName) => {
        const resultado = await registrarUsuario(email, password, displayName);
        if (resultado.tipo === "sesion_iniciada") {
          setUser(resultado.sesion);
          try {
            await enviarEventoLogin(resultado.sesion.authUserId);
            await sincronizarPerfil(resultado.sesion.authUserId, resultado.sesion.displayName);
          } catch { /* opcional */ }
        }
        return resultado;
      },

      verificarEmail: async (email, otp) => {
        const sesion = await verificarEmail(email, otp);
        setUser(sesion);
        try {
          await enviarEventoLogin(sesion.authUserId);
          await sincronizarPerfil(sesion.authUserId, sesion.displayName);
        } catch { /* opcional */ }
      },

      reenviarCodigo: reenviarCodigoVerificacion,
      enviarCodigoRecuperacion,
      verificarCodigoRecuperacion,
      restablecerContrasena,

      loginConOAuth: async (provider) => {
        await loginConOAuth(provider, `${window.location.origin}/`);
      },

      logout: async () => {
        await logoutDeInsforge();
        setUser(null);
      },

      actualizarUsuario: (cambios) => {
        setUser((prev) => prev ? { ...prev, ...cambios } : prev);
      },
    }),
    [user, cargando],
  );

  return (
    <ContextoAutenticacion.Provider value={value}>
      {children}
    </ContextoAutenticacion.Provider>
  );
}

export function useAuth() {
  const context = useContext(ContextoAutenticacion);
  if (!context) throw new Error("useAuth debe usarse dentro de ProveedorAutenticacion");
  return context;
}
