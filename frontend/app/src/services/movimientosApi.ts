/**
 * Servicio de movimientos de stock.
 * Usa tipos en español coherentes con el esquema de la API.
 */
import { apiClient } from './clienteApi'
import type { Movimiento, Paginado, TipoMovimiento, FiltrosMovimiento } from '@/types'

export type EntradaCrearMovimiento = {
  tipo: TipoMovimiento
  motivo?: string
  ubicacion_origen_id?: number
  ubicacion_destino_id?: number
  lineas: Array<{ articulo_id: number; cantidad: number }>
}

export type ResumenHoy = {
  entradas_hoy: number
  salidas_hoy: number
  ajustes_hoy: number
  traslados_hoy: number
}

export function getMovimientos(
  authUserId: string,
  filtros: FiltrosMovimiento = {},
) {
  const params = new URLSearchParams()
  if (filtros.tipo) params.set('tipo', filtros.tipo)
  if (filtros.usuario_id) params.set('usuario_id', String(filtros.usuario_id))
  if (filtros.desde) params.set('desde', filtros.desde)
  if (filtros.hasta) params.set('hasta', filtros.hasta)
  if (filtros.per_page) params.set('per_page', String(filtros.per_page))
  const qs = params.toString() ? `?${params.toString()}` : ''
  return apiClient<Paginado<Movimiento>>(`/movimientos${qs}`, {}, { authUserId })
}

export function getResumenHoy(authUserId: string) {
  return apiClient<ResumenHoy>('/movimientos/resumen-hoy', {}, { authUserId })
}

export function crearMovimiento(authUserId: string, entrada: EntradaCrearMovimiento) {
  return apiClient<{ data: Movimiento }>(
    '/movimientos',
    { method: 'POST', body: JSON.stringify(entrada) },
    { authUserId },
  )
}
