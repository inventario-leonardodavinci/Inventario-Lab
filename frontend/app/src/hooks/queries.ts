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
import { resolverAlerta, confirmarAlerta } from '@/services/alertasApi'
import { getNotificaciones } from '@/services/notificacionesApi'
import { apiClient } from '@/services/clienteApi'
import { insforge } from '@/services/insforgeClient'
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
  ActivoMantenimiento,
  Rol,
} from '@/types'
import type { EntradaCrearArticulo, EntradaActualizarArticulo } from '@/services/inventarioApi'
import type { EntradaCrearMovimiento } from '@/services/movimientosApi'
import type { EntradaCrearUbicacion, EntradaActualizarUbicacion } from '@/services/ubicacionesApi'
import type { EntradaCrearCategoria, EntradaActualizarCategoria } from '@/services/categoriasApi'

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
  perfil: () =>
    ['perfil'] as const,
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
  usuarios: () =>
    ['usuarios'] as const,
  mantenimiento: () =>
    ['mantenimiento'] as const,
  resumenHoy: () =>
    ['resumen-hoy'] as const,
  notificaciones: () =>
    ['notificaciones'] as const,
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
    queryKey: queryKeys.usuarios(),
    queryFn: async () => {
      const res = await getUsuarios(user!.authUserId)
      const usuarios = res.data ?? []
      const enriquecidos = await Promise.all(
        usuarios.map(async (u) => {
          const { data: perfil } = await insforge.auth.getProfile(u.auth_user_id)
          const p = perfil as Record<string, unknown> | null
          return {
            ...u,
            email: (p?.email as string | null) ?? null,
            emailVerified: (p?.emailVerified as boolean | undefined) ?? false,
            providers: (p?.providers as string[] | undefined) ?? [],
            avatar_url: (p?.avatar_url as string | null) ?? ((p?.profile as Record<string, unknown> | undefined)?.avatar_url as string | null) ?? u.avatar_url ?? null,
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.usuarios() })
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.usuarios() })
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.usuarios() })
    },
  })
}

// ─── Perfil ───────────────────────────────────────────────────────────────────

export function usePerfil() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.perfil(),
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.perfil() })
    },
  })
}

// ─── Rol de Usuario (con caché y retry) ──────────────────────────────────────

export function useUserRole() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Precargar el rol desde el store de Zustand para evitar flash de "sin rol"
  const rolInicial = useSesionStore((state) => state.rol)

  // Verificar si ya hay datos en caché
  const datosEnCache = queryClient.getQueryData<string>(queryKeys.userRole(user?.authUserId))

  // Si hay datos en caché o en el store, no hacer petición inicial
  const shouldFetch = !!user && !datosEnCache && !rolInicial

  return useQuery({
    queryKey: queryKeys.userRole(user?.authUserId),
    queryFn: async () => {
      console.log('[useUserRole] Fetching rol desde backend...')
      const rol = await obtenerRolDesdeBackend(user!.authUserId)
      return rol
    },
    enabled: shouldFetch,
    // Usar el rol del store como datos iniciales (evita petición si ya tenemos el rol)
    initialData: rolInicial || datosEnCache || undefined,
    staleTime: STALE_TIME_LONG_MS,
    gcTime: GC_TIME_MS,
    retry: RETRY_COUNT,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, RETRY_DELAY_MAX_MS),
    // Solo refetch en background, no en foco (evita peticiones al cambiar tabs)
    refetchOnWindowFocus: false,
    // Refetch al reconectar (útil si cambió el rol mientras estaba offline)
    refetchOnReconnect: true,
  })
}

// ─── Mantenimiento ────────────────────────────────────────────────────────────

export function useMantenimiento() {
  const { user } = useAuth()
  return useQuery({
    queryKey: queryKeys.mantenimiento(),
    queryFn: () =>
      apiClient<{ data: ActivoMantenimiento[] }>(
        '/mantenimiento/activos',
        {},
        { authUserId: user!.authUserId },
      ),
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
    queryKey: queryKeys.notificaciones(),
    queryFn: () => getNotificaciones(user!.authUserId),
    enabled: !!user,
  })
}

// ─── Historial de sesiones ────────────────────────────────────────────────────

export function useHistorialSesiones() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['historial-sesiones'],
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
      void queryClient.invalidateQueries({ queryKey: ['historial-sesiones'] })
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
