/**
 * Servicio de categorías.
 */
import { apiClient } from './clienteApi'
import type { Categoria } from '@/types'
import { unwrapData } from './apiUtils'

export type EntradaCrearCategoria = {
  nombre: string
}

export type EntradaActualizarCategoria = Partial<EntradaCrearCategoria>

export function getCategorias(authUserId: string) {
  return apiClient<{ data: Categoria[] }>('/categorias', {}, { authUserId }).then((res) => ({ data: unwrapData(res) }))
}

export function getCategoria(authUserId: string, id: number) {
  return apiClient<{ data: Categoria }>(`/categorias/${id}`, {}, { authUserId }).then((res) => ({ data: unwrapData(res) }))
}

export function crearCategoria(authUserId: string, entrada: EntradaCrearCategoria) {
  return apiClient<{ data: Categoria }>(
    '/categorias',
    { method: 'POST', body: JSON.stringify(entrada) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function actualizarCategoria(
  authUserId: string,
  id: number,
  entrada: EntradaActualizarCategoria,
) {
  return apiClient<{ data: Categoria }>(
    `/categorias/${id}`,
    { method: 'PATCH', body: JSON.stringify(entrada) },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function eliminarCategoria(authUserId: string, id: number) {
  return apiClient<void>(`/categorias/${id}`, { method: 'DELETE' }, { authUserId })
}
