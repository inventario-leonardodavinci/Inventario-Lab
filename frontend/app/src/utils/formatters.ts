/**
 * Funciones de formateo centralizadas para el sistema de inventario.
 * Todas las salidas están en español.
 * Feature: reestructuracion-inventario-salud-ambiental
 */

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import type {
  TipoMovimiento,
  EstadoActivo,
  Rol,
  TipoUbicacion,
} from '@/types'

// ─── Fechas ───────────────────────────────────────────────────────────────────

const LOCALE = 'es-ES'

function parseFecha(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const fecha = parseISO(iso)
  return isValid(fecha) ? fecha : null
}

/**
 * Formatea una fecha ISO a formato corto: "12 ene 2026"
 */
export function formatearFecha(iso: string | null | undefined): string {
  const fecha = parseFecha(iso)
  if (!fecha) return '—'
  return format(fecha, 'd MMM yyyy', { locale: es })
}

/**
 * Formatea una fecha ISO a formato con hora: "12 ene 2026, 14:30"
 */
export function formatearFechaHora(iso: string | null | undefined): string {
  const fecha = parseFecha(iso)
  if (!fecha) return '—'
  return format(fecha, "d MMM yyyy, HH:mm", { locale: es })
}

/**
 * Formatea una fecha ISO a tiempo relativo: "hace 2 horas", "hace 3 días"
 */
export function formatearFechaRelativa(iso: string | null | undefined): string {
  const fecha = parseFecha(iso)
  if (!fecha) return '—'
  return formatDistanceToNow(fecha, { locale: es, addSuffix: true })
}

// ─── Enums → etiquetas en español ─────────────────────────────────────────────

/**
 * Formatea el tipo de movimiento a etiqueta legible en español.
 * 'entrada'→'Entrada', 'salida'→'Salida', 'traslado'→'Traslado', 'ajuste'→'Ajuste'
 */
export function formatearTipoMovimiento(tipo: TipoMovimiento): string {
  const mapa: Record<TipoMovimiento, string> = {
    entrada: 'Entrada',
    salida: 'Salida',
    traslado: 'Traslado',
    ajuste: 'Ajuste',
  }
  return mapa[tipo]
}

/**
 * Formatea el estado de activo de mantenimiento a etiqueta legible en español.
 */
export function formatearEstadoActivo(estado: EstadoActivo): string {
  const mapa: Record<EstadoActivo, string> = {
    operativo: 'Operativo',
    mantenimiento_pendiente: 'Mantenimiento pendiente',
    en_mantenimiento: 'En mantenimiento',
    fuera_servicio: 'Fuera de servicio',
    retirado: 'Retirado',
  }
  return mapa[estado]
}

/**
 * Formatea el rol de usuario a etiqueta legible en español.
 * 'profesor'→'Profesor', 'consultor'→'Consultor'
 */
export function formatearRol(rol: Rol): string {
  const mapa: Record<Rol, string> = {
    profesor: 'Profesor',
    consultor: 'Consultor',
  }
  return mapa[rol]
}

/**
 * Formatea el tipo de ubicación a etiqueta legible en español.
 * 'armario'→'Armario', 'nevera'→'Nevera', 'estanteria'→'Estantería',
 * 'cajon'→'Cajón', 'vitrina'→'Vitrina', 'otro'→'Otro'
 */
export function formatearTipoUbicacion(tipo: TipoUbicacion): string {
  const mapa: Record<TipoUbicacion, string> = {
    armario: 'Armario',
    nevera: 'Nevera',
    estanteria: 'Estantería',
    cajon: 'Cajón',
    vitrina: 'Vitrina',
    otro: 'Otro',
  }
  return mapa[tipo]
}

// ─── Números ──────────────────────────────────────────────────────────────────

/**
 * Formatea una cantidad numérica con unidad opcional.
 * formatearCantidad(12.5, 'uds') → "12,5 uds"
 * formatearCantidad(12.5) → "12,5"
 */
export function formatearCantidad(n: number, unidad?: string): string {
  const numero = n.toLocaleString(LOCALE)
  return unidad ? `${numero} ${unidad}` : numero
}
