/**
 * Servicio de ubicaciones.
 */
import { apiClient } from './clienteApi'
import type { Ubicacion, TipoUbicacion } from '@/types'
import { unwrapData } from './apiUtils'

export type EntradaCrearUbicacion = {
  nombre: string
  descripcion?: string
  tipo: TipoUbicacion
}

export type EntradaActualizarUbicacion = Partial<EntradaCrearUbicacion>

export function getUbicaciones(authUserId: string) {
  return apiClient<{ data: Ubicacion[] }>('/ubicaciones', {}, { authUserId }).then((res) => ({ data: unwrapData(res) }))
}

export function getUbicacion(authUserId: string, id: number) {
  return apiClient<{ data: Ubicacion }>(`/ubicaciones/${id}`, {}, { authUserId }).then((res) => ({ data: unwrapData(res) }))
}

export function crearUbicacion(authUserId: string, entrada: EntradaCrearUbicacion) {
  return apiClient<{ data: Ubicacion }>(
    '/ubicaciones',
    { method: 'POST', body: JSON.stringify(entrada) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function actualizarUbicacion(
  authUserId: string,
  id: number,
  entrada: EntradaActualizarUbicacion,
) {
  return apiClient<{ data: Ubicacion }>(
    `/ubicaciones/${id}`,
    { method: 'PATCH', body: JSON.stringify(entrada) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}
