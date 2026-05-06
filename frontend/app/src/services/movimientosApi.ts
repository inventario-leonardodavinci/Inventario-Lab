/**
 * Servicio de movimientos de stock.
 * Usa tipos en español coherentes con el esquema de la API.
 */
import { apiClient } from './clienteApi'
import type { Movimiento, Paginado, TipoMovimiento, FiltrosMovimiento } from '@/types'

// Tipo base para crear movimiento
export type EntradaCrearMovimiento = {
  tipo: TipoMovimiento
  motivo?: string
  ubicacion_origen_id?: number
  ubicacion_destino_id?: number
  lineas: Array<{ articulo_id: number; cantidad: number }>
}

// Validación helper para verificar que los datos cumplen las reglas del backend
export function validarMovimiento(datos: EntradaCrearMovimiento): string | null {
  switch (datos.tipo) {
    case 'entrada':
      if (!datos.ubicacion_destino_id) {
        return 'Se requiere ubicación destino para una entrada'
      }
      break
    case 'salida':
      if (!datos.ubicacion_origen_id) {
        return 'Se requiere ubicación origen para una salida'
      }
      break
    case 'traslado':
      if (!datos.ubicacion_origen_id || !datos.ubicacion_destino_id) {
        return 'Se requieren ubicación origen y destino para un traslado'
      }
      break
    case 'ajuste':
      if (!datos.ubicacion_destino_id) {
        return 'Se requiere ubicación destino para un ajuste'
      }
      break
  }
  
  if (!datos.lineas || datos.lineas.length === 0) {
    return 'Debe incluir al menos una línea de movimiento'
  }
  
  for (const linea of datos.lineas) {
    if (!linea.articulo_id || linea.cantidad <= 0) {
      return 'Cada línea debe tener artículo y cantidad mayor que cero'
    }
  }
  
  return null
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
