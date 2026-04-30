/**
 * Servicio de ubicaciones.
 */
import { apiClient } from './clienteApi'
import type { Ubicacion, TipoUbicacion } from '@/types'

export type EntradaCrearUbicacion = {
  nombre: string
  descripcion?: string
  tipo: TipoUbicacion
}

export type EntradaActualizarUbicacion = Partial<EntradaCrearUbicacion>

export function getUbicaciones(authUserId: string) {
  return apiClient<{ data: Ubicacion[] }>('/ubicaciones', {}, { authUserId })
}

export function getUbicacion(authUserId: string, id: number) {
  return apiClient<{ data: Ubicacion }>(`/ubicaciones/${id}`, {}, { authUserId })
}

export function crearUbicacion(authUserId: string, entrada: EntradaCrearUbicacion) {
  return apiClient<{ data: Ubicacion }>(
    '/ubicaciones',
    { method: 'POST', body: JSON.stringify(entrada) },
    { authUserId },
  )
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
  )
}
