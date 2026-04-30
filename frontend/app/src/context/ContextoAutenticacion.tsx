import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  obtenerRolDesdeBackend,
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
      .then((sesion) => {
        if (sesion) {
          setUser(sesion);
          // Actualizar rol desde el backend Laravel
          obtenerRolDesdeBackend(sesion.authUserId).then((rol) => {
            if (rol) setUser((prev) => prev ? { ...prev, role: rol } : prev);
          }).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const sesion = await loginConInsforge({ email, password });
    setUser(sesion);
    enviarEventoLogin(sesion.authUserId).catch(() => {});
    sincronizarPerfil(sesion.authUserId, sesion.displayName).catch(() => {});
    // Actualizar rol desde el backend Laravel (fuente de verdad)
    obtenerRolDesdeBackend(sesion.authUserId).then((rol) => {
      if (rol) setUser((prev) => prev ? { ...prev, role: rol } : prev);
    }).catch(() => {});
  }, []);

  const registro = useCallback(async (email: string, password: string, displayName: string): Promise<ResultadoRegistro> => {
    const resultado = await registrarUsuario(email, password, displayName);
    if (resultado.tipo === "sesion_iniciada") {
      setUser(resultado.sesion);
      enviarEventoLogin(resultado.sesion.authUserId).catch(() => {});
      sincronizarPerfil(resultado.sesion.authUserId, resultado.sesion.displayName).catch(() => {});
      obtenerRolDesdeBackend(resultado.sesion.authUserId).then((rol) => {
        if (rol) setUser((prev) => prev ? { ...prev, role: rol } : prev);
      }).catch(() => {});
    }
    return resultado;
  }, []);

  const verificarEmailFn = useCallback(async (email: string, otp: string) => {
    const sesion = await verificarEmail(email, otp);
    setUser(sesion);
    enviarEventoLogin(sesion.authUserId).catch(() => {});
    sincronizarPerfil(sesion.authUserId, sesion.displayName).catch(() => {});
    obtenerRolDesdeBackend(sesion.authUserId).then((rol) => {
      if (rol) setUser((prev) => prev ? { ...prev, role: rol } : prev);
    }).catch(() => {});
  }, []);

  const loginConOAuthFn = useCallback(async (provider: string) => {
    // Redirigir a /login para que el retorno OAuth se maneje correctamente
    await loginConOAuth(provider, `${window.location.origin}/login`);
  }, []);

  const logout = useCallback(async () => {
    await logoutDeInsforge();
    setUser(null);
  }, []);

  const actualizarUsuario = useCallback((cambios: Partial<SesionUsuario>) => {
    setUser((prev) => prev ? { ...prev, ...cambios } : prev);
  }, []);

  const value = useMemo<ValorContextoAutenticacion>(
    () => ({
      user,
      cargando,
      login,
      registro,
      verificarEmail: verificarEmailFn,
      reenviarCodigo: reenviarCodigoVerificacion,
      enviarCodigoRecuperacion,
      verificarCodigoRecuperacion,
      restablecerContrasena,
      loginConOAuth: loginConOAuthFn,
      logout,
      actualizarUsuario,
    }),
    // Solo user y cargando cambian — las funciones son estables
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
