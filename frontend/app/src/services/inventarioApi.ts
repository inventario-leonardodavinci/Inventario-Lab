/**
 * Servicio de artículos del inventario.
 * Usa el endpoint /articulos con tipos en español.
 */
import { apiClient } from './clienteApi'
import type { Articulo, ArticuloDetalle, Paginado } from '@/types'
import { buildQueryString, unwrapData, unwrapPaginated } from './apiUtils'

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
  sub_ubicacion_id?: number
  serial_number?: string
  material_type?: string
  capacity_ml?: number
  expiration_date?: string
  fecha_adquisicion?: string
  precio_compra?: number
  proveedor?: string
  numero_factura?: string
}

export type EntradaActualizarArticulo = Partial<EntradaCrearArticulo>

export function getArticulos(
  authUserId: string,
  filtros?: {
    search?: string
    pagina?: number
    per_page?: number
    categoria_id?: number
    ubicacion_id?: number
    estado_stock?: 'critico' | 'ok'
    order_by?: 'nombre' | 'codigo' | 'stock_total' | 'categoria' | 'created_at'
    order_dir?: 'asc' | 'desc'
  },
) {
  const qs = buildQueryString({
    search: filtros?.search,
    page: filtros?.pagina && filtros.pagina > 1 ? filtros.pagina : undefined,
    per_page: filtros?.per_page,
    categoria_id: filtros?.categoria_id,
    ubicacion_id: filtros?.ubicacion_id,
    estado_stock: filtros?.estado_stock,
    order_by: filtros?.order_by,
    order_dir: filtros?.order_dir,
  })
  return apiClient<Paginado<Articulo>>(`/articulos${qs}`, {}, { authUserId }).then(unwrapPaginated)
}

export function getArticulo(authUserId: string, id: number) {
  return apiClient<{ data: ArticuloDetalle }>(`/articulos/${id}`, {}, { authUserId }).then((res) => ({ data: unwrapData(res) }))
}

export function crearArticulo(authUserId: string, entrada: EntradaCrearArticulo) {
  return apiClient<{ data: Articulo }>(
    '/articulos',
    { method: 'POST', body: JSON.stringify(entrada) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
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
  ).then((res) => ({ data: unwrapData(res) }))
}

export function actualizarNivelStock(
  authUserId: string,
  articuloId: number,
  nivelId: number,
  cantidadMinima: number,
) {
  return apiClient<{ data: Articulo }>(
    `/articulos/${articuloId}/niveles-stock/${nivelId}`,
    { method: 'PATCH', body: JSON.stringify({ cantidad_minima: cantidadMinima }) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function eliminarNivelStock(
  authUserId: string,
  articuloId: number,
  nivelId: number,
) {
  return apiClient<{ data: Articulo }>(
    `/articulos/${articuloId}/niveles-stock/${nivelId}`,
    { method: 'DELETE' },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function eliminarArticulo(authUserId: string, id: number) {
  return apiClient<{ message?: string }>(
    `/articulos/${id}`,
    { method: 'DELETE' },
    { authUserId },
  )
}

/**
 * Descarga el inventario completo en formato CSV agrupado por categoría.
 * Devuelve un Blob listo para generar un enlace de descarga.
 */
export async function exportarArticulosCSV(authUserId: string): Promise<Blob> {
  // Necesitamos la respuesta raw (Blob), no JSON — usamos fetch directamente
  // con el mismo mecanismo de autenticación que apiClient.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
  const response = await fetch(`${API_BASE_URL}/articulos/exportar`, {
    method: 'GET',
    headers: {
      'X-Auth-User-Id': authUserId,
    },
  })

  if (!response.ok) {
    // Intentar leer el mensaje de error del cuerpo si es JSON
    let mensajeError = `Error al exportar: ${response.status} ${response.statusText}`
    try {
      const cuerpo = await response.json() as { message?: string }
      if (cuerpo.message) mensajeError = cuerpo.message
    } catch {
      // Ignorar si el cuerpo no es JSON
    }
    throw new Error(mensajeError)
  }

  return response.blob()
}
