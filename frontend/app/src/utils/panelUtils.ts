/**
 * Utilidades para el panel principal.
 */

/**
 * Formatea un valor KPI para mostrar en el panel.
 * null → '...' (cargando)
 * -1   → '—' (error / no disponible)
 * n    → String(n)
 */
export function formatearKpi(valor: number | null): string {
  if (valor === null) return '...'
  if (valor === -1) return '—'
  return String(valor)
}

/**
 * Traduce los tipos de movimiento del inglés al español.
 * Clave legacy de la antigua API en inglés.
 */
export function traducirTipoMovimiento(tipo: string): string {
  const mapa: Record<string, string> = {
    entry: 'Entrada',
    exit: 'Salida',
    transfer: 'Traslado',
    adjustment: 'Ajuste',
  }
  return mapa[tipo] ?? tipo
}
