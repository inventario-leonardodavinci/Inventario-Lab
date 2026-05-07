import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from '@tanstack/react-query'
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
import { UserRoleSync } from "@/components/auth/UserRoleSync";

// Variable global para evitar múltiples verificaciones por StrictMode
let verificacionGlobalEnProgreso = false
let verificacionGlobalCompletada = false

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

async function verificarSesionConReintento(
  tieneSesionPersistida: boolean,
): Promise<Awaited<ReturnType<typeof verificarSesionActual>>> {
  const primerResultado = await verificarSesionActual();

  // En móviles (sobre todo iOS), tras recargar puede haber una ventana corta
  // donde el SDK reporta "sin sesión" aunque el token aún sea válido.
  if (!tieneSesionPersistida || primerResultado.tipo !== "sin_sesion") {
    return primerResultado;
  }

  await new Promise((resolve) => setTimeout(resolve, 700));
  const segundoResultado = await verificarSesionActual();

  return segundoResultado;
}

export function ProveedorAutenticacion({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { usuario: usuarioPersistido, rol: rolPersistido, setUsuario, limpiar } = useSesionStore();

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
  const verificandoSesion = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sincronizar zustand store cuando cambia el usuario del contexto
  useEffect(() => {
    setUsuario(user);
  }, [user, setUsuario]);

  // Sincronizar rol persistido con el usuario solo si no hay rol en sesión actual.
  useEffect(() => {
    if (user && rolPersistido && !user.role) {
      setUser((prev) => prev ? { ...prev, role: rolPersistido as SesionUsuario['role'] } : prev);
    }
  }, [user, rolPersistido]);

  // Verificación de sesión al montar — UNA SOLA VEZ con control de concurrencia global
  useEffect(() => {
    // Control global para StrictMode - evita múltiples verificaciones
    if (verificacionGlobalCompletada) {
      console.log('[Auth] Verificación global ya completada, ignorando...');
      setCargando(false);
      return;
    }

    if (verificacionGlobalEnProgreso) {
      console.log('[Auth] Verificación global en progreso, esperando...');
      return;
    }

    // Evitar múltiples ejecuciones simultáneas
    if (verificandoSesion.current) {
      console.log('[Auth] Verificación ya en progreso (local), ignorando...');
      return;
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    logoutPendiente.current = false;
    verificandoSesion.current = true;
    verificacionGlobalEnProgreso = true;
    console.log('[Auth] Iniciando verificación de sesión...');

    const verificar = async () => {
      try {
        const resultado = await verificarSesionConReintento(!!usuarioPersistido);
        
        if (logoutPendiente.current || abortControllerRef.current?.signal.aborted) {
          console.log('[Auth] Verificación cancelada');
          return;
        }

        if (resultado.tipo === 'sesion_activa') {
          console.log('[Auth] Sesión activa detectada');
          setUser(resultado.sesion);
          setProcesandoOAuth(false);

          // NOTA: El rol se obtiene via UserRoleSync component (una sola vez)
          // No llamar obtenerRolDesdeBackend aquí para evitar duplicados

          // Sincronizar perfil (solo nombre/avatar, no volver a pedir rol)
          const eraOAuth = procesandoOAuth;
          if (eraOAuth) {
            enviarEventoLogin(resultado.sesion.authUserId, 'oauth').catch((err) => {
              console.warn("[historial] evento-login falló (oauth):", err);
            });
          }
          try {
            const sincronizar = eraOAuth
              ? sincronizarPerfilOAuth(resultado.sesion.authUserId, resultado.sesion)
              : sincronizarPerfil(resultado.sesion.authUserId, resultado.sesion.displayName).then(() => resultado.sesion);

            const sesionFinal = await sincronizar;
            if (!logoutPendiente.current && !abortControllerRef.current?.signal.aborted) {
              if (sesionFinal.displayName !== resultado.sesion.displayName) {
                setUser((prev) => prev ? { ...prev, displayName: sesionFinal.displayName, avatarUrl: sesionFinal.avatarUrl } : prev);
              }
            }
          } catch (err) {
            console.error('[Auth] Error sincronizando perfil:', err);
          }

        } else if (resultado.tipo === 'error_red') {
          console.log('[Auth] Error de red, manteniendo sesión cacheada');
          setProcesandoOAuth(false);
        } else {
          console.log('[Auth] Sin sesión activa');
          setProcesandoOAuth(false);
          if (usuarioPersistido) {
            setUser(null);
            limpiar();
          }
        }
      } catch (err) {
        console.error('[Auth] Error en verificación:', err);
      } finally {
        if (!logoutPendiente.current) {
          setCargando(false);
        }
        verificandoSesion.current = false;
        verificacionGlobalEnProgreso = false;
        verificacionGlobalCompletada = true;
        abortControllerRef.current = null;
      }
    };

    verificar();

    // Cleanup: cancelar peticiones al desmontar (StrictMode)
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const sesion = await loginConInsforge({ email, password });
    // Limpiar el rol cacheado del usuario anterior ANTES de montar UserRoleSync
    queryClient.removeQueries({ queryKey: ['userRole'] });
    useSesionStore.getState().setRol(null);
    setUser(sesion);
    await queryClient.invalidateQueries({ queryKey: ['perfil'] });
    await queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    await queryClient.invalidateQueries({ queryKey: ['historial-sesiones'] });
    enviarEventoLogin(sesion.authUserId).catch((err) => {
      console.warn("[historial] evento-login falló:", err);
    });
    
    // Sincronizar perfil y obtener rol UNA sola vez
    try {
      await sincronizarPerfil(sesion.authUserId, sesion.displayName, sesion.email, sesion.role);
      const rol = await obtenerRolDesdeBackend(sesion.authUserId, sesion.role, sesion.email);
      if (rol) {
        console.log('[Auth] Login - Rol obtenido:', rol);
        useSesionStore.getState().setRol(rol);
        queryClient.setQueryData(['userRole', sesion.authUserId], rol);
        // Actualizar usuario con rol
        setUser((prev) => prev ? { ...prev, role: rol } : prev);
      }
    } catch (err) {
      console.error('[Auth] Error en login sincronizando perfil:', err);
    }
  }, [queryClient]);

  const registro = useCallback(async (email: string, password: string, displayName: string): Promise<ResultadoRegistro> => {
    const resultado = await registrarUsuario(email, password, displayName);
    if (resultado.tipo === "sesion_iniciada") {
      setUser(resultado.sesion);
      await queryClient.invalidateQueries({ queryKey: ['perfil'] });
      await queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
      await queryClient.invalidateQueries({ queryKey: ['historial-sesiones'] });
      enviarEventoLogin(resultado.sesion.authUserId).catch((err) => {
        console.warn("[historial] evento-login falló (registro):", err);
      });
      
      // Sincronizar perfil y obtener rol UNA sola vez
      try {
        await sincronizarPerfil(resultado.sesion.authUserId, resultado.sesion.displayName, resultado.sesion.email, resultado.sesion.role);
        const rol = await obtenerRolDesdeBackend(resultado.sesion.authUserId, resultado.sesion.role, resultado.sesion.email);
        if (rol) {
          console.log('[Auth] Registro - Rol obtenido:', rol);
          useSesionStore.getState().setRol(rol);
          queryClient.setQueryData(['userRole', resultado.sesion.authUserId], rol);
          setUser((prev) => prev ? { ...prev, role: rol } : prev);
        }
      } catch (err) {
        console.error('[Auth] Error en registro sincronizando perfil:', err);
      }
    }
    return resultado;
  }, [queryClient]);

  const verificarEmailFn = useCallback(async (email: string, otp: string) => {
    const sesion = await verificarEmail(email, otp);
    setUser(sesion);
    await queryClient.invalidateQueries({ queryKey: ['perfil'] });
    await queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    await queryClient.invalidateQueries({ queryKey: ['historial-sesiones'] });
    enviarEventoLogin(sesion.authUserId).catch((err) => {
      console.warn("[historial] evento-login falló (verificarEmail):", err);
    });
    
    // Sincronizar perfil y obtener rol UNA sola vez
    try {
      await sincronizarPerfil(sesion.authUserId, sesion.displayName, sesion.email, sesion.role);
      const rol = await obtenerRolDesdeBackend(sesion.authUserId, sesion.role, sesion.email);
      if (rol) {
        console.log('[Auth] VerificarEmail - Rol obtenido:', rol);
        useSesionStore.getState().setRol(rol);
        queryClient.setQueryData(['userRole', sesion.authUserId], rol);
        setUser((prev) => prev ? { ...prev, role: rol } : prev);
      }
    } catch (err) {
      console.error('[Auth] Error en verificarEmail sincronizando perfil:', err);
    }
  }, []);

  const loginConOAuthFn = useCallback(async (provider: string) => {
    await loginConOAuth(provider, `${window.location.origin}/login`);
  }, []);

  const logout = useCallback(async () => {
    logoutPendiente.current = true;
    await logoutDeInsforge();
    queryClient.clear();
    setUser(null);
    limpiar();
    setCargando(false);
    // Resetear flags para que el próximo login verifique la sesión correctamente
    verificacionGlobalCompletada = false;
    verificacionGlobalEnProgreso = false;
  }, [limpiar, queryClient]);

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
      {/* UserRoleSync se monta una sola vez aquí, fuera de las rutas */}
      {user && <UserRoleSync />}
      {children}
    </ContextoAutenticacion.Provider>
  );
}

export function useAuth() {
  const context = useContext(ContextoAutenticacion);
  if (!context) throw new Error("useAuth debe usarse dentro de ProveedorAutenticacion");
  return context;
}
