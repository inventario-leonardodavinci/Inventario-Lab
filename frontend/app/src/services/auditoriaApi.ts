/**
 * Servicio de auditoría (solo administrador).
 */
import { apiClient } from './clienteApi'
import type { RegistroAuditoria, Paginado, FiltrosAuditoria } from '@/types'
import { buildQueryString, unwrapPaginated } from './apiUtils'

export function getAuditoria(authUserId: string, filtros: FiltrosAuditoria = {}) {
  const qs = buildQueryString({
    entidad_tipo: filtros.entidad_tipo,
    tipo_evento: filtros.tipo_evento,
    desde: filtros.desde,
    hasta: filtros.hasta,
    page: filtros.pagina && filtros.pagina > 1 ? filtros.pagina : undefined,
  })
  return apiClient<Paginado<RegistroAuditoria>>(`/auditoria${qs}`, {}, { authUserId }).then(unwrapPaginated)
}
