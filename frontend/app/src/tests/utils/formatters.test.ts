import { describe, it, expect } from 'vitest'
import {
  formatearTipoMovimiento,
  formatearTipoAlerta,
  formatearSeveridad,
  formatearEstadoAlerta,
  formatearFechaRelativa,
  formatearFechaHora,
} from '@/utils/formatters'
import type { TipoMovimiento } from '@/types'

describe('formatearTipoMovimiento', () => {
  it('formatea tipos correctamente', () => {
    expect(formatearTipoMovimiento('entrada')).toBe('Entrada')
    expect(formatearTipoMovimiento('salida')).toBe('Salida')
    expect(formatearTipoMovimiento('traslado')).toBe('Traslado')
    expect(formatearTipoMovimiento('ajuste')).toBe('Ajuste')
  })

  it('maneja valores desconocidos', () => {
    expect(formatearTipoMovimiento('desconocido' as TipoMovimiento)).toBe('desconocido')
  })
})

describe('formatearTipoAlerta', () => {
  it('formatea tipos correctamente', () => {
    expect(formatearTipoAlerta('stock_bajo')).toBe('Stock bajo')
    expect(formatearTipoAlerta('caducidad')).toBe('Caducidad')
    expect(formatearTipoAlerta('mantenimiento')).toBe('Mantenimiento')
    expect(formatearTipoAlerta('inactividad')).toBe('Inactividad')
  })
})

describe('formatearSeveridad', () => {
  it('formatea severidades correctamente', () => {
    expect(formatearSeveridad('baja')).toBe('Baja')
    expect(formatearSeveridad('media')).toBe('Media')
    expect(formatearSeveridad('alta')).toBe('Alta')
    expect(formatearSeveridad('critica')).toBe('Crítica')
  })
})

describe('formatearEstadoAlerta', () => {
  it('formatea estados correctamente', () => {
    expect(formatearEstadoAlerta('abierta')).toBe('Abierta')
    expect(formatearEstadoAlerta('confirmada')).toBe('Confirmada')
    expect(formatearEstadoAlerta('resuelta')).toBe('Resuelta')
    expect(formatearEstadoAlerta('ignorada')).toBe('Ignorada')
  })
})

describe('formatearFechaRelativa', () => {
  it('formatea fechas recientes', () => {
    const ahora = new Date().toISOString()
    expect(formatearFechaRelativa(ahora)).toBe('hace unos segundos')
  })

  it('formatea hace minutos', () => {
    const hace5Min = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatearFechaRelativa(hace5Min)).toBe('hace 5 minutos')
  })

  it('formatea hace horas', () => {
    const hace2Horas = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(formatearFechaRelativa(hace2Horas)).toBe('hace 2 horas')
  })

  it('formatea ayer', () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const resultado = formatearFechaRelativa(ayer)
    expect(resultado === 'hace 24 horas' || resultado === 'hace 1 día').toBe(true)
  })
})

describe('formatearFechaHora', () => {
  it('formatea fecha y hora', () => {
    const fecha = '2024-01-15T10:30:00.000Z'
    const resultado = formatearFechaHora(fecha)
    expect(resultado).toContain('2024')
    expect(resultado).toContain('10:30')
  })
})
