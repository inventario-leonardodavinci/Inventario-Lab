/**
 * Servicio de artículos del inventario.
 * Usa el endpoint /articulos con tipos en español.
 */
import { apiClient } from './clienteApi'
import type { Articulo, ArticuloDetalle, Paginado } from '@/types'

export type EntradaCrearArticulo = {
  codigo?: string
  nombre: string
  descripcion?: string
  categoria_id: number
  unidad?: string
  notas?: string
  stock_inicial?: number
  stock_minimo?: number
  ubicacion_id?: number
  serial_number?: string
  material_type?: string
  capacity_ml?: number
  expiration_date?: string
}

export type EntradaActualizarArticulo = Partial<EntradaCrearArticulo>

export function getArticulos(
  authUserId: string,
  filtros?: {
    search?: string
    pagina?: number
    per_page?: number
    activo?: boolean
    categoria_id?: number
    ubicacion_id?: number
    estado_stock?: 'critico' | 'ok'
    order_by?: 'nombre' | 'codigo' | 'stock_total' | 'categoria' | 'created_at'
    order_dir?: 'asc' | 'desc'
  },
) {
  const params = new URLSearchParams()
  if (filtros?.search) params.set('search', filtros.search)
  if (filtros?.pagina && filtros.pagina > 1) params.set('page', String(filtros.pagina))
  if (filtros?.per_page) params.set('per_page', String(filtros.per_page))
  if (filtros?.activo !== undefined) params.set('activo', String(filtros.activo))
  if (filtros?.categoria_id) params.set('categoria_id', String(filtros.categoria_id))
  if (filtros?.ubicacion_id) params.set('ubicacion_id', String(filtros.ubicacion_id))
  if (filtros?.estado_stock) params.set('estado_stock', filtros.estado_stock)
  if (filtros?.order_by) params.set('order_by', filtros.order_by)
  if (filtros?.order_dir) params.set('order_dir', filtros.order_dir)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiClient<Paginado<Articulo>>(`/articulos${qs}`, {}, { authUserId })
}

export function getArticulo(authUserId: string, id: number) {
  return apiClient<{ data: ArticuloDetalle }>(`/articulos/${id}`, {}, { authUserId })
}

export function crearArticulo(authUserId: string, entrada: EntradaCrearArticulo) {
  return apiClient<{ data: Articulo }>(
    '/articulos',
    { method: 'POST', body: JSON.stringify(entrada) },
    { authUserId },
  )
}

export function actualizarArticulo(
  authUserId: string,
  id: number,
  entrada: EntradaActualizarArticulo,
) {
  return apiClient<{ data: Articulo }>(
    `/articulos/${id}`,
    { method: 'PATCH', body: JSON.stringify(entrada) },
    { authUserId },
  )
}

export function desactivarArticulo(authUserId: string, id: number) {
  return apiClient<{ message: string }>(
    `/articulos/${id}`,
    { method: 'DELETE' },
    { authUserId },
  )
}

// ─── Compatibilidad con código anterior ──────────────────────────────────────

/** @deprecated Usar getArticulos en su lugar */
export function getInventario(authUserId: string, search = '') {
  return getArticulos(authUserId, { search })
}

/** @deprecated Usar crearArticulo en su lugar */
export function crearArticuloInventario(
  authUserId: string,
  entrada: {
    code?: string
    name: string
    category_id: number
    unit?: string
  },
) {
  return crearArticulo(authUserId, {
    codigo: entrada.code,
    nombre: entrada.name,
    categoria_id: entrada.category_id,
    unidad: entrada.unit,
  })
}
