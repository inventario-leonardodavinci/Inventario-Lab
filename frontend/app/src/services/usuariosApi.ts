/**
 * Servicio de usuarios (solo administrador).
 */
import { apiClient } from './clienteApi'
import type { UsuarioApp, Rol, Paginado } from '@/types'
import { unwrapData, unwrapPaginated } from './apiUtils'

export function getUsuarios(authUserId: string) {
  return apiClient<Paginado<UsuarioApp>>('/usuarios', {}, { authUserId }).then(unwrapPaginated)
}

export function actualizarRolUsuario(
  authUserId: string,
  usuarioId: number,
  rol: Rol,
) {
  return apiClient<{ data: UsuarioApp }>(
    `/usuarios/${usuarioId}/rol`,
    { method: 'PATCH', body: JSON.stringify({ rol }) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function actualizarEstadoUsuario(
  authUserId: string,
  usuarioId: number,
  activo: boolean,
) {
  return apiClient<{ data: UsuarioApp }>(
    `/usuarios/${usuarioId}/estado`,
    { method: 'PATCH', body: JSON.stringify({ activo }) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function eliminarUsuario(authUserId: string, usuarioId: number) {
  return apiClient<void>(
    `/usuarios/${usuarioId}`,
    { method: 'DELETE' },
    { authUserId },
  )
}

export function getPerfil(authUserId: string) {
  return apiClient<{ data: UsuarioApp }>('/perfil', {}, { authUserId }).then((res) => ({ data: unwrapData(res) }))
}

export function actualizarPerfil(
  authUserId: string,
  datos: { nombre_visible?: string },
) {
  return apiClient<{ data: UsuarioApp }>(
    '/perfil',
    { method: 'PATCH', body: JSON.stringify(datos) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export type RegistroSesion = {
  id: number
  ip_address: string | null
  dispositivo: string | null
  navegador: string | null
  sistema_operativo: string | null
  pais: string | null
  ciudad: string | null
  tipo_evento: 'login' | 'logout' | 'refresh' | 'oauth'
  exitoso: boolean
  iniciada_en: string
  user_agent: string | null
}

export function getHistorialSesiones(authUserId: string) {
  return apiClient<{ data: RegistroSesion[] }>(
    '/perfil/historial-sesiones',
    {},
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function eliminarSesion(authUserId: string, sesionId: number) {
  return apiClient<{ message: string }>(
    `/perfil/sesiones/${sesionId}`,
    { method: 'DELETE' },
    { authUserId },
  )
}
