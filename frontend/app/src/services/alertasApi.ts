/**
 * Servicio de alertas.
 */
import { apiClient } from './clienteApi'
import type { Alerta, Paginado, FiltrosAlerta } from '@/types'

export function getAlertas(authUserId: string, filtros: FiltrosAlerta = {}) {
  const params = new URLSearchParams()
  if (filtros.tipo) params.set('tipo', filtros.tipo)
  if (filtros.severidad) params.set('severidad', filtros.severidad)
  if (filtros.estado) params.set('estado', filtros.estado)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiClient<Paginado<Alerta>>(`/alertas${qs}`, {}, { authUserId })
}

export function confirmarAlerta(authUserId: string, id: number) {
  return apiClient<{ data: Alerta }>(
    `/alertas/${id}/confirmar`,
    { method: 'POST' },
    { authUserId },
  )
}

export function resolverAlerta(authUserId: string, id: number) {
  return apiClient<{ data: Alerta }>(
    `/alertas/${id}/resolver`,
    { method: 'POST' },
    { authUserId },
  )
}
