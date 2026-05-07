/**
 * Servicio de alertas.
 */
import { apiClient } from './clienteApi'
import type { Alerta, Paginado, FiltrosAlerta } from '@/types'
import { buildQueryString, unwrapData, unwrapPaginated } from './apiUtils'

export function getAlertas(authUserId: string, filtros: FiltrosAlerta = {}) {
  const qs = buildQueryString({
    tipo: filtros.tipo,
    severidad: filtros.severidad,
    estado: filtros.estado,
  })
  return apiClient<Paginado<Alerta>>(`/alertas${qs}`, {}, { authUserId }).then(unwrapPaginated)
}

export function confirmarAlerta(authUserId: string, id: number) {
  return apiClient<{ data: Alerta }>(
    `/alertas/${id}/confirmar`,
    { method: 'POST' },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}

export function resolverAlerta(authUserId: string, id: number, notasResolucion?: string) {
  return apiClient<{ data: Alerta }>(
    `/alertas/${id}/resolver`,
    {
      method: 'POST',
      body: notasResolucion ? JSON.stringify({ notas_resolucion: notasResolucion }) : undefined,
    },
    { authUserId },
  ).then((res) => ({ data: unwrapData(res) }))
}
