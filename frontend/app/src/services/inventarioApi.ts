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
}

export type EntradaActualizarArticulo = Partial<EntradaCrearArticulo>

export function getArticulos(
  authUserId: string,
  search = '',
  pagina = 1,
) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (pagina > 1) params.set('page', String(pagina))
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
  return getArticulos(authUserId, search)
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
