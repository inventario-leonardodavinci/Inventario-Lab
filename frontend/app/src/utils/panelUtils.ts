/**
 * Funciones puras auxiliares para el PanelPrincipal.
 * Feature: panel-principal-datos-reales
 */

import { formatearTipoMovimiento } from '@/utils/formatters'
import type { TipoMovimiento } from '@/types'

/**
 * Traduce el tipo de movimiento al español (UI).
 * Delega en formatearTipoMovimiento para los valores del nuevo esquema en español.
 * Mantiene compatibilidad con los valores en inglés del esquema anterior.
 */
export function traducirTipoMovimiento(tipo: string): string {
  // Valores del nuevo esquema en español
  const valoresEspanol: TipoMovimiento[] = ['entrada', 'salida', 'traslado', 'ajuste']
  if (valoresEspanol.includes(tipo as TipoMovimiento)) {
    return formatearTipoMovimiento(tipo as TipoMovimiento)
  }

  // Compatibilidad con valores en inglés del esquema anterior
  const mapaLegado: Record<string, string> = {
    entry: 'Entrada',
    exit: 'Salida',
    transfer: 'Traslado',
    adjustment: 'Ajuste',
  }
  return Object.hasOwn(mapaLegado, tipo) ? mapaLegado[tipo] : tipo
}

/**
 * Formatea un valor KPI numérico para su presentación en pantalla.
 * - `null`  → "..."  (cargando)
 * - `-1`    → "—"   (error / no disponible)
 * - número  → representación como string
 */
export function formatearKpi(valor: number | null): string {
  if (valor === null) return '...'
  if (valor === -1) return '—'
  return String(valor)
}

// Tipos actualizados al nuevo esquema en español
export type FilaInventarioItem = {
  id: number
  nombre: string
  stock_total: number
  estado_stock: 'critico' | 'ok'
  // Compatibilidad con el esquema anterior
  name?: string
  stock?: number
  min_stock?: number
  status?: 'critical' | 'ok'
}

export type MovimientoItem = {
  id: number
  tipo: TipoMovimiento
  usuario?: { nombre_visible: string | null } | null
  created_at: string
  // Compatibilidad con el esquema anterior
  movement_type?: string
  user?: { display_name: string | null }
}

/**
 * Extrae artículos con stock crítico desde la respuesta de inventario.
 * Compatible con el nuevo esquema en español y el anterior en inglés.
 */
export function extraerCriticos(inventario: FilaInventarioItem[]): FilaInventarioItem[] {
  return inventario.filter((a) => {
    // Nuevo esquema en español
    if (a.estado_stock !== undefined) return a.estado_stock === 'critico'
    // Esquema anterior en inglés
    if (a.status !== undefined) return a.status === 'critical'
    return false
  })
}

/**
 * Transforma artículos críticos en filas para la tabla de alertas.
 */
export function mapearAlertas(
  criticos: FilaInventarioItem[],
  limite: number = 6,
): Array<{ item: string; stock: string; min: string; status: string }> {
  return criticos.slice(0, limite).map((row) => ({
    item: row.nombre ?? row.name ?? '',
    stock: String(row.stock_total ?? row.stock ?? 0),
    min: String(row.min_stock ?? 0),
    status: 'Crítico',
  }))
}

/**
 * Transforma movimientos en resumen para el feed de actividad reciente.
 * Compatible con el nuevo esquema en español y el anterior en inglés.
 */
export function mapearMovimientosRecientes(
  movimientos: MovimientoItem[],
): Array<{ id: number; tipo: string; responsable: string; fechaHora: string }> {
  return movimientos.map((m) => {
    // Nuevo esquema en español
    const tipoStr = m.tipo ?? (m.movement_type as TipoMovimiento | undefined)
    const tipo = tipoStr ? traducirTipoMovimiento(tipoStr) : 'Movimiento'

    // Compatibilidad con ambos esquemas
    const responsable =
      m.usuario?.nombre_visible ??
      m.user?.display_name ??
      'Sistema'

    return {
      id: m.id,
      tipo,
      responsable,
      fechaHora: m.created_at,
    }
  })
}

/**
 * Construye las tarjetas KPI a partir de valores numéricos.
 */
export function construirKpiCards(params: {
  inventoryCount: number | null
  criticalCount: number | null
  entradasHoy: number | null
  salidasHoy: number | null
}) {
  const { inventoryCount, criticalCount, entradasHoy, salidasHoy } = params
  return [
    {
      title: 'Articulos en inventario',
      value: formatearKpi(inventoryCount),
      delta: 'Total registrados',
      badge: 'Estable' as const,
      icon: 'PackageCheck' as const,
    },
    {
      title: 'Entradas hoy',
      value: formatearKpi(entradasHoy),
      delta: 'Movimientos registrados hoy',
      badge: 'Operativo' as const,
      icon: 'ArrowDownToLine' as const,
    },
    {
      title: 'Salidas hoy',
      value: formatearKpi(salidasHoy),
      delta: 'Movimientos registrados hoy',
      badge: 'Control' as const,
      icon: 'ArrowUpFromLine' as const,
    },
    {
      title: 'Stock crítico',
      value: formatearKpi(criticalCount),
      delta: 'Artículos con stock por debajo del mínimo',
      badge: 'Urgente' as const,
      icon: 'TriangleAlert' as const,
    },
  ]
}
