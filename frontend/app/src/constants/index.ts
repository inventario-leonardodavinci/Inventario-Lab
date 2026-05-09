/**
 * Constantes de aplicación - Centralizar aquí evita magic numbers
 */

// ── Timing ────────────────────────────────────────────────────────────────
export const DEBOUNCE_DELAY_MS = 300
export const TOAST_DURATION_MS = 4_000 // 4 segundos

// ── React Query Cache ────────────────────────────────────────────────────
export const STALE_TIME_MS = 30_000 // 30 segundos
export const STALE_TIME_LONG_MS = 5 * 60 * 1000 // 5 minutos
export const GC_TIME_MS = 10 * 60 * 1000 // 10 minutos
export const RETRY_COUNT = 3
export const RETRY_DELAY_MAX_MS = 10_000 // 10 segundos max

// ── Paginación ───────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// ── API ────────────────────────────────────────────────────────────────────
export const API_RATE_LIMIT_PER_MINUTE = 60
export const WRITE_RATE_LIMIT_PER_MINUTE = 30
export const LOGIN_EVENT_RATE_LIMIT_PER_MINUTE = 10

// ── Movimientos ───────────────────────────────────────────────────────────
export const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'traslado', 'ajuste'] as const
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number]

// ── Filtros de Artículos ───────────────────────────────────────────────────
export const FILTROS_ARTICULO = ['todos', 'critico', 'inactivos'] as const
export type FiltroArticulo = (typeof FILTROS_ARTICULO)[number]

// ── UI ─────────────────────────────────────────────────────────────────────
export const MODOS_VISTA = ['grid', 'lista'] as const
export type ModoVista = (typeof MODOS_VISTA)[number]

// ── Validación ────────────────────────────────────────────────────────────
export const CANTIDAD_MINIMA_MOVIMIENTO = 0.01
export const CODIGO_MAX_LENGTH = 50
export const NOMBRE_MAX_LENGTH = 255
export const NOTAS_MAX_LENGTH = 1000
