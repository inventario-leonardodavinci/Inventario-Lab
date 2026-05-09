import { TrendingUp, TrendingDown, ArrowRightLeft, Activity, MoveRight } from 'lucide-react'
import type { TipoMovimiento } from '@/types'

export function iconoTipoMovimiento(tipo: TipoMovimiento) {
  switch (tipo) {
    case 'entrada': return TrendingUp
    case 'salida': return TrendingDown
    case 'traslado': return ArrowRightLeft
    case 'ajuste': return Activity
    default: return MoveRight
  }
}

export function colorTipoMovimiento(tipo: TipoMovimiento): string {
  switch (tipo) {
    case 'entrada': return 'bg-green-500/10 text-green-600 border-green-200 dark:bg-green-500/20 dark:border-green-800'
    case 'salida': return 'bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:border-red-800'
    case 'traslado': return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:border-blue-800'
    case 'ajuste': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:border-yellow-800'
    default: return 'bg-gray-500/10 text-gray-600 border-gray-200 dark:bg-gray-500/20 dark:border-gray-800'
  }
}
