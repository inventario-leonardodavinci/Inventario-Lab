import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  loginConInsforge,
  verificarSesionActual,
  logoutDeInsforge,
  registrarUsuario,
  verificarEmail,
  reenviarCodigoVerificacion,
  enviarCodigoRecuperacion,
  verificarCodigoRecuperacion,
  restablecerContrasena,
  loginConOAuth,
  sincronizarPerfil,
  sincronizarPerfilOAuth,
  obtenerRolDesdeBackend,
  type ResultadoRegistro,
  type SesionUsuario,
} from "@/services/authApi";
import { enviarEventoLogin } from "@/services/notificacionesApi";
import { useSesionStore } from "@/stores/useSesionStore";

type ValorContextoAutenticacion = {
  user: SesionUsuario | null;
  cargando: boolean;
  procesandoOAuth: boolean;
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
  const { usuario: usuarioPersistido, setUsuario, limpiar } = useSesionStore();

  // Arrancar con el usuario del store (persiste en localStorage).
  // Esto evita el flash de login en iOS al recargar: el usuario ya está disponible
  // mientras el SDK verifica la sesión en background con el servidor de Insforge.
  const [user, setUser] = useState<SesionUsuario | null>(usuarioPersistido);

  // cargando = true solo si NO hay usuario persistido (primera visita o tras logout).
  // Con usuario en el store, mostramos la app inmediatamente y verificamos en background.
  const [cargando, setCargando] = useState(!usuarioPersistido);

  // Indica que el SDK está procesando un callback OAuth (Apple/Google redirect).
  // Mientras sea true, RutaProtegida no redirige al login aunque user sea null.
  const [procesandoOAuth, setProcesandoOAuth] = useState(() => {
    // Detectar si la URL contiene parámetros de callback OAuth
    const hash = window.location.hash;
    const search = window.location.search;
    return (
      hash.includes('access_token') ||
      hash.includes('code=') ||
      search.includes('code=') ||
      search.includes('access_token')
    );
  });

  // Evitar que la verificación en background sobreescriba un logout explícito del usuario
  const logoutPendiente = useRef(false);

  // Sincronizar zustand store cuando cambia el usuario del contexto
  useEffect(() => {
    setUsuario(user);
  }, [user, setUsuario]);

  // Verificación de sesión al montar — distingue expirada de error de red
  useEffect(() => {
    logoutPendiente.current = false;

    verificarSesionActual().then(async (resultado) => {
      if (logoutPendiente.current) return;

      if (resultado.tipo === 'sesion_activa') {
        // SDK confirmó la sesión — actualizar con datos frescos del servidor
        setUser(resultado.sesion);
        setProcesandoOAuth(false);

        // Si venimos de un callback OAuth, el proveedor puede no haber propagado
        // el nombre todavía. Usar sincronizarPerfilOAuth que reintenta con backoff.
        const eraOAuth = procesandoOAuth;
        const sincronizar = eraOAuth
          ? sincronizarPerfilOAuth(resultado.sesion.authUserId, resultado.sesion)
          : sincronizarPerfil(resultado.sesion.authUserId, resultado.sesion.displayName).then(() => resultado.sesion);

        sincronizar.then((sesionFinal) => {
          if (logoutPendiente.current) return;
          // Actualizar el nombre si cambió durante el reintento OAuth
          if (sesionFinal.displayName !== resultado.sesion.displayName) {
            setUser((prev) => prev ? { ...prev, displayName: sesionFinal.displayName, avatarUrl: sesionFinal.avatarUrl } : prev);
          }
        }).catch(() => {});

        obtenerRolDesdeBackend(resultado.sesion.authUserId).then((rol) => {
          if (logoutPendiente.current) return;
          if (rol) setUser((prev) => prev ? { ...prev, role: rol } : prev);
        }).catch(() => {});

      } else if (resultado.tipo === 'error_red') {
        // Fallo de red o ITP de iOS — mantener el usuario del store si existe.
        // No deslogueamos: el usuario puede seguir con datos cacheados.
        // Las queries de TanStack Query reintentarán cuando haya conexión.
        // Si no había usuario en el store, simplemente no hay sesión.
        setProcesandoOAuth(false);

      } else {
        // 'sin_sesion' — sesión realmente expirada o nunca hubo
        setProcesandoOAuth(false);
        if (usuarioPersistido) {
          setUser(null);
          limpiar();
        }
      }
    }).finally(() => {
      if (!logoutPendiente.current) {
        setCargando(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const sesion = await loginConInsforge({ email, password });
    setUser(sesion);
    enviarEventoLogin(sesion.authUserId).catch((err) => {
      console.warn("[historial] evento-login falló:", err);
    });
    // Sincronizar primero para que el usuario exista en BD antes de pedir el rol
    await sincronizarPerfil(sesion.authUserId, sesion.displayName, sesion.email).catch(() => {});
    obtenerRolDesdeBackend(sesion.authUserId).then((rol) => {
      if (rol) setUser((prev) => prev ? { ...prev, role: rol } : prev);
    }).catch(() => {});
  }, []);

  const registro = useCallback(async (email: string, password: string, displayName: string): Promise<ResultadoRegistro> => {
    const resultado = await registrarUsuario(email, password, displayName);
    if (resultado.tipo === "sesion_iniciada") {
      setUser(resultado.sesion);
      enviarEventoLogin(resultado.sesion.authUserId).catch((err) => {
        console.warn("[historial] evento-login falló (registro):", err);
      });
      await sincronizarPerfil(resultado.sesion.authUserId, resultado.sesion.displayName, resultado.sesion.email).catch(() => {});
      obtenerRolDesdeBackend(resultado.sesion.authUserId).then((rol) => {
        if (rol) setUser((prev) => prev ? { ...prev, role: rol } : prev);
      }).catch(() => {});
    }
    return resultado;
  }, []);

  const verificarEmailFn = useCallback(async (email: string, otp: string) => {
    const sesion = await verificarEmail(email, otp);
    setUser(sesion);
    enviarEventoLogin(sesion.authUserId).catch((err) => {
      console.warn("[historial] evento-login falló (verificar email):", err);
    });
    await sincronizarPerfil(sesion.authUserId, sesion.displayName, sesion.email).catch(() => {});
    obtenerRolDesdeBackend(sesion.authUserId).then((rol) => {
      if (rol) setUser((prev) => prev ? { ...prev, role: rol } : prev);
    }).catch(() => {});
  }, []);

  const loginConOAuthFn = useCallback(async (provider: string) => {
    await loginConOAuth(provider, `${window.location.origin}/login`);
  }, []);

  const logout = useCallback(async () => {
    logoutPendiente.current = true;
    await logoutDeInsforge();
    setUser(null);
    limpiar();
    setCargando(false);
  }, [limpiar]);

  const actualizarUsuario = useCallback((cambios: Partial<SesionUsuario>) => {
    setUser((prev) => prev ? { ...prev, ...cambios } : prev);
  }, []);

  const value = useMemo<ValorContextoAutenticacion>(
    () => ({
      user,
      cargando,
      procesandoOAuth,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, cargando, procesandoOAuth],
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
