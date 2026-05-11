/**
 * Servicio de sub-ubicaciones (baldas, estantes)
 */
import { apiClient } from './clienteApi'
import type { SubUbicacion } from '@/types/subUbicaciones'
import type { EntradaCrearSubUbicacion, EntradaActualizarSubUbicacion } from '@/types/subUbicaciones'
import { unwrapData } from './apiUtils'

/**
 * Obtener todas las sub-ubicaciones (opcionalmente filtradas por ubicación)
 */
export function getSubUbicaciones(
  authUserId: string,
  params?: { ubicacion_id?: number; incluir_inactivas?: boolean }
) {
  const queryParams = new URLSearchParams()
  if (params?.ubicacion_id) queryParams.append('ubicacion_id', String(params.ubicacion_id))
  if (params?.incluir_inactivas) queryParams.append('incluir_inactivas', '1')

  const query = queryParams.toString()
  const url = query ? `/sub-ubicaciones?${query}` : '/sub-ubicaciones'

  return apiClient<{ data: SubUbicacion[] }>(url, {}, { authUserId }).then((res) => ({
    data: unwrapData(res),
  }))
}

/**
 * Obtener sub-ubicaciones de una ubicación específica
 */
export function getSubUbicacionesPorUbicacion(authUserId: string, ubicacionId: number) {
  return apiClient<{ data: SubUbicacion[] }>(
    `/ubicaciones/${ubicacionId}/sub-ubicaciones`,
    {},
    { authUserId }
  ).then((res) => ({ data: unwrapData(res) }))
}

/**
 * Obtener detalle de una sub-ubicación
 */
export function getSubUbicacion(authUserId: string, id: number) {
  return apiClient<{ data: SubUbicacion }>(`/sub-ubicaciones/${id}`, {}, { authUserId }).then(
    (res) => ({ data: unwrapData(res) })
  )
}

/**
 * Crear nueva sub-ubicación
 */
export function crearSubUbicacion(
  authUserId: string,
  entrada: EntradaCrearSubUbicacion
) {
  return apiClient<{ data: SubUbicacion }>(
    '/sub-ubicaciones',
    { method: 'POST', body: JSON.stringify(entrada) },
    { authUserId }
  ).then((res) => ({ data: unwrapData(res) }))
}

/**
 * Actualizar sub-ubicación
 */
export function actualizarSubUbicacion(
  authUserId: string,
  id: number,
  entrada: EntradaActualizarSubUbicacion
) {
  return apiClient<{ data: SubUbicacion }>(
    `/sub-ubicaciones/${id}`,
    { method: 'PATCH', body: JSON.stringify(entrada) },
    { authUserId }
  ).then((res) => ({ data: unwrapData(res) }))
}

/**
 * Eliminar sub-ubicación
 */
export function eliminarSubUbicacion(authUserId: string, id: number) {
  return apiClient<{ data: { message: string } }>(
    `/sub-ubicaciones/${id}`,
    { method: 'DELETE' },
    { authUserId }
  ).then((res) => unwrapData(res))
}
