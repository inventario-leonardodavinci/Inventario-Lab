/**
 * Funciones de formateo centralizadas para el sistema de inventario.
 * Todas las salidas están en español.
 * Feature: reestructuracion-inventario-salud-ambiental
 */

import type {
  TipoMovimiento,
  TipoAlerta,
  Severidad,
  EstadoAlerta,
  EstadoActivo,
  Rol,
  TipoUbicacion,
} from '@/types'

// ─── Fechas ───────────────────────────────────────────────────────────────────

const LOCALE = 'es-ES'

/**
 * Formatea una fecha ISO a formato corto: "12 ene 2026"
 */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  return fecha.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Formatea una fecha ISO a formato con hora: "12 ene 2026, 14:30"
 */
export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso)
  return fecha.toLocaleString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea una fecha ISO a tiempo relativo: "hace 2 horas", "hace 3 días"
 */
export function formatearFechaRelativa(iso: string): string {
  const ahora = Date.now()
  const fecha = new Date(iso).getTime()
  const diffMs = ahora - fecha
  const diffSeg = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSeg / 60)
  const diffHoras = Math.floor(diffMin / 60)
  const diffDias = Math.floor(diffHoras / 24)

  if (diffSeg < 60) return 'hace un momento'
  if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`
  if (diffHoras < 24) return `hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
  if (diffDias < 30) return `hace ${diffDias} ${diffDias === 1 ? 'día' : 'días'}`

  return formatearFecha(iso)
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
 * Formatea el tipo de alerta a etiqueta legible en español.
 * 'stock_bajo'→'Stock bajo', 'caducidad'→'Caducidad', 'mantenimiento'→'Mantenimiento', 'inactividad'→'Inactividad'
 */
export function formatearTipoAlerta(tipo: TipoAlerta): string {
  const mapa: Record<TipoAlerta, string> = {
    stock_bajo: 'Stock bajo',
    caducidad: 'Caducidad',
    mantenimiento: 'Mantenimiento',
    inactividad: 'Inactividad',
  }
  return mapa[tipo]
}

/**
 * Formatea la severidad a etiqueta legible en español.
 * 'baja'→'Baja', 'media'→'Media', 'alta'→'Alta', 'critica'→'Crítica'
 */
export function formatearSeveridad(sev: Severidad): string {
  const mapa: Record<Severidad, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    critica: 'Crítica',
  }
  return mapa[sev]
}

/**
 * Formatea el estado de alerta a etiqueta legible en español.
 * 'abierta'→'Abierta', 'confirmada'→'Confirmada', 'resuelta'→'Resuelta', 'ignorada'→'Ignorada'
 */
export function formatearEstadoAlerta(estado: EstadoAlerta): string {
  const mapa: Record<EstadoAlerta, string> = {
    abierta: 'Abierta',
    confirmada: 'Confirmada',
    resuelta: 'Resuelta',
    ignorada: 'Ignorada',
  }
  return mapa[estado]
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
 * 'administrador'→'Administrador', 'profesor'→'Profesor', 'consultor'→'Consultor'
 */
export function formatearRol(rol: Rol): string {
  const mapa: Record<Rol, string> = {
    administrador: 'Administrador',
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
