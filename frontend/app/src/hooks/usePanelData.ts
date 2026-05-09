/**
 * Hook de datos del panel principal.
 * Usa TanStack Query para lanzar las 4 peticiones en paralelo con caché y
 * estados de carga/error por sección, sin reducer manual.
 */
import { useArticulos, useResumenHoy, useMovimientos } from '@/hooks/queries'
import { extraerCriticos, mapearAlertas, mapearMovimientosRecientes } from '@/utils/panelUtils'

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

export function usePanelData(): PanelData {
  // Los nuevos hooks obtienen authUserId del contexto internamente
  const inv = useArticulos()
  const resumen = useResumenHoy()
  const movimientos = useMovimientos({ per_page: 5 })
  const cargando =
    inv.isLoading || resumen.isLoading || movimientos.isLoading

  // Inventario
  const inventoryCount = inv.data?.meta.total ?? (inv.isError ? -1 : null)
  const criticos = inv.data ? extraerCriticos(inv.data.data) : []
  const criticalCount = inv.data ? criticos.length : (inv.isError ? -1 : null)
  const lowStockItems = mapearAlertas(criticos)

  // Resumen hoy
  const entradasHoy = resumen.data?.entradas_hoy ?? (resumen.isError ? -1 : null)
  const salidasHoy = resumen.data?.salidas_hoy ?? (resumen.isError ? -1 : null)

  // Movimientos recientes
  const movimientosRecientes = movimientos.data
    ? mapearMovimientosRecientes(movimientos.data.data)
    : (movimientos.isError ? [] : null)
  const errorMovimientos = movimientos.isError

  return {
    inventoryCount,
    criticalCount,
    entradasHoy,
    salidasHoy,
    movimientosRecientes,
    errorMovimientos,
    lowStockItems,
    cargando,
  }
}
