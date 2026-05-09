/**
 * Hook de datos del panel principal.
 * Usa TanStack Query para lanzar las peticiones en paralelo con caché.
 * Implementación inline - antes dependía de panelUtils.ts
 */
import { useArticulos, useResumenHoy, useMovimientos } from '@/hooks/queries'
import { formatearTipoMovimiento } from '@/utils/formatters'
import type { Articulo, Movimiento } from '@/types'

export type PanelData = {
  inventoryCount: number | null
  criticalCount: number | null
  entradasHoy: number | null
  salidasHoy: number | null
  movimientosRecientes: Array<{
    id: number
    tipo: string
    responsable: string
    fechaHora: string
  }> | null
  errorMovimientos: boolean
  lowStockItems: Array<{ item: string; stock: string; min: string; status: string }>
  cargando: boolean
}

// Helpers inline (antes en panelUtils.ts)
const extraerCriticos = (articulos: Articulo[]): Articulo[] =>
  articulos.filter((a) => a.estado_stock === 'critico')

const mapearLowStock = (criticos: Articulo[]) =>
  criticos.slice(0, 6).map((a) => ({
    item: a.nombre,
    stock: String(a.stock_total),
    min: String(a.stock_minimo),
    status: 'Stock bajo',
  }))

const mapearMovimientosRecientes = (movimientos: Movimiento[]) =>
  movimientos.map((m) => ({
    id: m.id,
    tipo: formatearTipoMovimiento(m.tipo),
    responsable: m.usuario?.nombre_visible ?? 'Sistema',
    fechaHora: m.created_at,
  }))

export function usePanelData(): PanelData {
  const inv = useArticulos()
  const resumen = useResumenHoy()
  const movimientos = useMovimientos({ per_page: 5 })

  const cargando = inv.isLoading || resumen.isLoading || movimientos.isLoading

  // Inventario
  const inventoryCount = inv.data?.meta.total ?? (inv.isError ? -1 : null)
  const criticos = inv.data ? extraerCriticos(inv.data.data) : []
  const criticalCount = inv.data ? criticos.length : (inv.isError ? -1 : null)
  const lowStockItems = mapearLowStock(criticos)

  // Resumen hoy
  const entradasHoy = resumen.data?.entradas_hoy ?? (resumen.isError ? -1 : null)
  const salidasHoy = resumen.data?.salidas_hoy ?? (resumen.isError ? -1 : null)

  // Movimientos recientes
  const movimientosRecientes = movimientos.data
    ? mapearMovimientosRecientes(movimientos.data.data)
    : (movimientos.isError ? [] : null)

  return {
    inventoryCount,
    criticalCount,
    entradasHoy,
    salidasHoy,
    movimientosRecientes,
    errorMovimientos: movimientos.isError,
    lowStockItems,
    cargando,
  }
}
