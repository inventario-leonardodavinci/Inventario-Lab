/**
 * Servicio de auditoría (solo administrador).
 */
import { apiClient } from './clienteApi'
import type { RegistroAuditoria, Paginado, FiltrosAuditoria } from '@/types'

export function getAuditoria(authUserId: string, filtros: FiltrosAuditoria = {}) {
  const params = new URLSearchParams()
  if (filtros.entidad_tipo) params.set('entidad_tipo', filtros.entidad_tipo)
  if (filtros.tipo_evento) params.set('tipo_evento', filtros.tipo_evento)
  if (filtros.desde) params.set('desde', filtros.desde)
  if (filtros.hasta) params.set('hasta', filtros.hasta)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiClient<Paginado<RegistroAuditoria>>(`/auditoria${qs}`, {}, { authUserId })
}
