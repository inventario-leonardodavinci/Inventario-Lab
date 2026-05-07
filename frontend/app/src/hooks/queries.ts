/**
 * Query keys y hooks de TanStack Query para todos los recursos de la API.
 * Centralizar aquí evita duplicar strings de clave y facilita invalidaciones.
 *
 * IMPORTANTE: Los hooks obtienen el authUserId del contexto de autenticación
 * internamente — los componentes no necesitan pasarlo como parámetro.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/ContextoAutenticacion'
import { useSesionStore } from '@/stores/useSesionStore'
import {
  obtenerRolDesdeBackend,
} from '@/services/authApi'
import {
  getArticulos,
  getArticulo,
  crearArticulo,
  actualizarArticulo,
  desactivarArticulo,
} from '@/services/inventarioApi'
import { getMovimientos, getResumenHoy, crearMovimiento } from '@/services/movimientosApi'
import { getUbicaciones, crearUbicacion, actualizarUbicacion } from '@/services/ubicacionesApi'
import { getCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from '@/services/categoriasApi'
import { getUsuarios, actualizarRolUsuario, actualizarEstadoUsuario, eliminarUsuario, getPerfil, actualizarPerfil, getHistorialSesiones, eliminarSesion } from '@/services/usuariosApi'
import { getAuditoria } from '@/services/auditoriaApi'
import { getAlertas, resolverAlerta, confirmarAlerta } from '@/services/alertasApi'
import { getNotificaciones } from '@/services/notificacionesApi'
import { apiClient } from '@/services/clienteApi'
import { insforge } from '@/services/insforgeClient'
import { unwrapPaginated } from '@/services/apiUtils'
import {
  STALE_TIME_MS,
  STALE_TIME_LONG_MS,
  GC_TIME_MS,
  RETRY_COUNT,
  RETRY_DELAY_MAX_MS,
} from '@/constants'

import type {
  FiltrosArticulos,
  FiltrosMovimiento,
  FiltrosAuditoria,
  FiltrosAlerta,
  ActivoMantenimiento,
  Rol,
} from '@/types'
import type { EntradaCrearArticulo, EntradaActualizarArticulo } from '@/services/inventarioApi'
import type { EntradaCrearMovimiento } from '@/services/movimientosApi'
import type { EntradaCrearUbicacion, EntradaActualizarUbicacion } from '@/services/ubicacionesApi'
import type { EntradaCrearCategoria, EntradaActualizarCategoria } from '@/services/categoriasApi'

const PERFIL_AUTH_CACHE_TTL_MS = 5 * 60 * 1000
const perfilAuthCache = new Map<
  string,
  {
    updatedAt: number
    data: {
      email: string | null
      emailVerified: boolean
      providers: string[]
      avatar_url: string | null
    }
  }
>()

async function getProfileEnriquecido(authUserId: string): Promise<{
  email: string | null
  emailVerified: boolean
  providers: string[]
  avatar_url: string | null
}> {
  const cached = perfilAuthCache.get(authUserId)
  if (cached && Date.now() - cached.updatedAt < PERFIL_AUTH_CACHE_TTL_MS) {
    return cached.data
  }

  const { data: perfil } = await insforge.auth.getProfile(authUserId)
  const p = perfil as Record<string, unknown> | null
  const profileData = {
    email: (p?.email as string | null) ?? null,
    emailVerified: (p?.emailVerified as boolean | undefined) ?? false,
    providers: (p?.providers as string[] | undefined) ?? [],
    avatar_url:
      (p?.avatar_url as string | null) ??
      ((p?.profile as Record<string, unknown> | undefined)?.avatar_url as string | null) ??
      null,
  }

  perfilAuthCache.set(authUserId, {
    updatedAt: Date.now(),
    data: profileData,
  })

  return profileData
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  articulos: (
    search?: string,
    pagina?: number,
    activo?: boolean,
    categoria_id?: number,
    ubicacion_id?: number,
    estado_stock?: 'critico' | 'ok',
    order_by?: string,
    order_dir?: string,
  ) =>
    ['articulos', search ?? '', pagina ?? 1, activo, categoria_id, ubicacion_id, estado_stock, order_by, order_dir] as const,
  articulo: (id: number) =>
    ['articulos', id] as const,
  perfil: (authUserId?: string) =>
    ['perfil', authUserId ?? ''] as const,
  userRole: (authUserId?: string) =>
    ['userRole', authUserId ?? ''] as const,
  ubicaciones: () =>
    ['ubicaciones'] as const,
  categorias: () =>
    ['categorias'] as const,
  movimientos: (filtros?: FiltrosMovimiento) =>
    ['movimientos', filtros] as const,
  auditoria: (filtros?: FiltrosAuditoria) =>
    ['auditoria', filtros?.entidad_tipo, filtros?.tipo_evento, filtros?.desde, filtros?.hasta, filtros?.pagina] as const,
  usuarios: (authUserId?: string) =>
    ['usuarios', authUserId ?? ''] as const,
  mantenimiento: () =>
    ['mantenimiento'] as const,
  resumenHoy: () =>
    ['resumen-hoy'] as const,
  alertas: (filtros?: FiltrosAlerta) =>
    ['alertas', filtros] as const,
  notificaciones: (authUserId?: string) =>
    ['notificaciones', authUserId ?? ''] as const,
  historialSesiones: (authUserId?: string) =>
    ['historial-sesiones', authUserId ?? ''] as const,
}

// ─── Artículos ────────────────────────────────────────────────────────────────

export function useArticulos(filtros?: FiltrosArticulos) {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.articulos(
      filtros?.search,
      filtros?.pagina,
      filtros?.activo,
      filtros?.categoria_id,
      filtros?.ubicacion_id,
      filtros?.estado_stock,
      filtros?.order_by,
      filtros?.order_dir,
    ),
    queryFn: () => getArticulos(user!.authUserId, filtros),
    enabled: !!user,
    placeholderData: (previousData) => previousData, // Mantener datos anteriores mientras carga
    staleTime: STALE_TIME_MS,
  })
}

export function useArticulo(id: number) {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.articulo(id),
    queryFn: () => getArticulo(user!.authUserId, id),
    enabled: !!user && id > 0,
  })
}

export function useCrearArticulo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: EntradaCrearArticulo) =>
      crearArticulo(user!.authUserId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articulos'] })
    },
  })
}

export function useActualizarArticulo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: EntradaActualizarArticulo }) =>
      actualizarArticulo(user!.authUserId, id, datos),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['articulos'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.articulo(id) })
    },
  })
}

export function useDesactivarArticulo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => desactivarArticulo(user!.authUserId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['articulos'] })
    },
  })
}

// ─── Ubicaciones ──────────────────────────────────────────────────────────────

export function useUbicaciones() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.ubicaciones(),
    queryFn: () => getUbicaciones(user!.authUserId),
    enabled: !!user,
  })
}

export function useCrearUbicacion() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: EntradaCrearUbicacion) =>
      crearUbicacion(user!.authUserId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ubicaciones() })
    },
  })
}

export function useActualizarUbicacion() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: EntradaActualizarUbicacion }) =>
      actualizarUbicacion(user!.authUserId, id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ubicaciones() })
    },
  })
}

// ─── Categorías ───────────────────────────────────────────────────────────────

export function useCategorias() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.categorias(),
    queryFn: () => getCategorias(user!.authUserId),
    enabled: !!user,
  })
}

export function useCrearCategoria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: EntradaCrearCategoria) =>
      crearCategoria(user!.authUserId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categorias() })
    },
  })
}

export function useActualizarCategoria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: EntradaActualizarCategoria }) =>
      actualizarCategoria(user!.authUserId, id, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categorias() })
    },
  })
}

export function useEliminarCategoria() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => eliminarCategoria(user!.authUserId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categorias() })
      void queryClient.invalidateQueries({ queryKey: ['articulos'] })
    },
  })
}

// ─── Movimientos ──────────────────────────────────────────────────────────────

export function useMovimientos(filtros?: FiltrosMovimiento) {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.movimientos(filtros),
    queryFn: () => getMovimientos(user!.authUserId, filtros),
    enabled: !!user,
  })
}

export function useCrearMovimiento() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: EntradaCrearMovimiento) =>
      crearMovimiento(user!.authUserId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.resumenHoy() })
      void queryClient.invalidateQueries({ queryKey: ['articulos'] })
    },
  })
}

// ─── Resumen hoy ──────────────────────────────────────────────────────────────

export function useResumenHoy() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.resumenHoy(),
    queryFn: () => getResumenHoy(user!.authUserId),
    enabled: !!user,
  })
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

export function useAuditoria(filtros?: FiltrosAuditoria) {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.auditoria(filtros),
    queryFn: () => getAuditoria(user!.authUserId, filtros),
    enabled: !!user,
  })
}

// ─── Usuarios ─────────────────────────────────────────────────────────────────

export function useUsuarios() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.usuarios(user?.authUserId),
    queryFn: async () => {
      const res = await getUsuarios(user!.authUserId)
      const usuarios = res.data ?? []
      const enriquecidos = await Promise.all(
        usuarios.map(async (u) => {
          const perfil = await getProfileEnriquecido(u.auth_user_id)
          return {
            ...u,
            email: perfil.email,
            emailVerified: perfil.emailVerified,
            providers: perfil.providers,
            avatar_url: perfil.avatar_url ?? u.avatar_url ?? null,
          }
        })
      )
      return { ...res, data: enriquecidos }
    },
    enabled: !!user,
  })
}

export function useActualizarRolUsuario() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ usuarioId, rol }: { usuarioId: number; rol: Rol }) =>
      actualizarRolUsuario(user!.authUserId, usuarioId, rol),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.usuarios(user?.authUserId) })
    },
  })
}

export function useActualizarEstadoUsuario() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ usuarioId, activo }: { usuarioId: number; activo: boolean }) =>
      actualizarEstadoUsuario(user!.authUserId, usuarioId, activo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.usuarios(user?.authUserId) })
    },
  })
}

export function useEliminarUsuario() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (usuarioId: number) =>
      eliminarUsuario(user!.authUserId, usuarioId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.usuarios(user?.authUserId) })
    },
  })
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

export function usePerfil() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.perfil(user?.authUserId),
    queryFn: () => getPerfil(user!.authUserId),
    enabled: !!user,
    staleTime: STALE_TIME_LONG_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: false,
  })
}

export function useActualizarPerfil() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: { nombre_visible?: string }) =>
      actualizarPerfil(user!.authUserId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.perfil(user?.authUserId) })
    },
  })
}

// ─── Rol de Usuario (con caché y retry) ──────────────────────────────────────

export function useUserRole() {
  const { user } = useAuth()
  const rolStore = useSesionStore((state) => state.rol)
  // rolStore tiene prioridad sobre user.role: fue verificado por el backend,
  // mientras que user.role puede ser el valor por defecto de insforge ('consultor')
  // incluso cuando el usuario ya fue promovido en BD.
  const rolInicial = rolStore ?? user?.role

  return useQuery({
    queryKey: queryKeys.userRole(user?.authUserId),
    queryFn: async () => {
      const rol = await obtenerRolDesdeBackend(user!.authUserId, user!.role, user!.email)
      // Si el backend no devuelve rol (error/null), usar el rol persistido para no sobreescribir
      return rol ?? rolStore ?? null
    },
    enabled: !!user,
    // placeholderData muestra el rol cacheado mientras carga, pero siempre lanza la petición
    placeholderData: rolInicial ?? undefined,
    staleTime: STALE_TIME_LONG_MS,
    gcTime: GC_TIME_MS,
    retry: 1,
    retryDelay: 2000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

// ─── Mantenimiento ────────────────────────────────────────────────────────────

export function useMantenimiento() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.mantenimiento(),
    queryFn: () =>
      apiClient<{ data: ActivoMantenimiento[]; meta: { current_page: number; last_page: number; total: number } }>(
        '/mantenimiento/activos',
        {},
        { authUserId: user!.authUserId },
      ).then(unwrapPaginated),
    enabled: !!user,
  })
}

export function useCrearActivo() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: { codigo_activo: string; estado?: string }) =>
      apiClient('/mantenimiento/activos', {
        method: 'POST',
        body: JSON.stringify(datos),
      }, { authUserId: user!.authUserId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.mantenimiento() })
    },
  })
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export function useNotificaciones() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.notificaciones(user?.authUserId),
    queryFn: () => getNotificaciones(user!.authUserId),
    enabled: !!user,
  })
}

// ─── Historial de sesiones ────────────────────────────────────────────────────

export function useHistorialSesiones() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.historialSesiones(user?.authUserId),
    queryFn: () => getHistorialSesiones(user!.authUserId),
    enabled: !!user,
  })
}

export function useEliminarSesion() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sesionId: number) => eliminarSesion(user!.authUserId, sesionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.historialSesiones(user?.authUserId) })
    },
    onError: () => {
      // El componente puede mostrar su propio toast si lo necesita
    },
  })
}

// ─── Compatibilidad con código anterior ──────────────────────────────────────

/**
 * @deprecated Usar useArticulos() en su lugar.
 * Mantenido para no romper usePanelData.ts y otros consumidores existentes.
 * Acepta authUserId opcional para compatibilidad; si se omite, usa el contexto.
 */
export function useInventario(authUserId?: string | undefined, search = '') {
  const { user } = useAuth()
  const uid = authUserId ?? user?.authUserId
  return useQuery({
    queryKey: ['inventario', uid ?? '', search],
    queryFn: () => getArticulos(uid!, { search }),
    enabled: !!uid,
  })
}

// ─── Alertas ──────────────────────────────────────────────────────────────────

export function useAlertas(filtros?: FiltrosAlerta) {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.alertas(filtros),
    queryFn: () => getAlertas(user!.authUserId, filtros),
    enabled: !!user,
  })
}

export function useResolverAlerta() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notas }: { id: number; notas?: string }) =>
      resolverAlerta(user!.authUserId, id, notas),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas'] }),
  })
}

export function useConfirmarAlerta() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => confirmarAlerta(user!.authUserId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertas'] }),
  })
}
