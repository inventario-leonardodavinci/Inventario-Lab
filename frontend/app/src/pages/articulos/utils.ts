import { TrendingUp, TrendingDown, ArrowRightLeft, Activity, MoveRight, Bell, Clock, ClipboardList, AlertTriangle, CheckCircle, XCircle, PlayCircle } from 'lucide-react'
import type { TipoMovimiento, TipoAlerta, Severidad, EstadoAlerta } from '@/types'

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

export function iconoTipoAlerta(tipo: TipoAlerta) {
  switch (tipo) {
    case 'stock_bajo': return TrendingDown
    case 'caducidad': return Clock
    case 'mantenimiento': return ClipboardList
    case 'inactividad': return Activity
    default: return Bell
  }
}

export function colorSeveridad(sev: Severidad): string {
  switch (sev) {
    case 'baja': return 'bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:border-blue-800'
    case 'media': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:border-yellow-800'
    case 'alta': return 'bg-orange-500/10 text-orange-600 border-orange-200 dark:bg-orange-500/20 dark:border-orange-800'
    case 'critica': return 'bg-red-500/10 text-red-600 border-red-200 dark:bg-red-500/20 dark:border-red-800'
  }
}

export function estadoAlertaConfig(estado: EstadoAlerta) {
  switch (estado) {
    case 'abierta': return { icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', label: 'Abierta' }
    case 'confirmada': return { icon: PlayCircle, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', label: 'En progreso' }
    case 'resuelta': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', label: 'Resuelta' }
    case 'ignorada': return { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30', label: 'Ignorada' }
  }
}
