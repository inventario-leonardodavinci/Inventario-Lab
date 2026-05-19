import { describe, it, expect } from 'vitest'
import {
  formatearTipoMovimiento,
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

describe('formatearFechaRelativa', () => {
  it('formatea fechas recientes', () => {
    const ahora = new Date().toISOString()
    const resultado = formatearFechaRelativa(ahora)
    expect(['hace unos segundos', 'hace menos de un minuto']).toContain(resultado)
  })

  it('formatea hace minutos', () => {
    const hace5Min = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatearFechaRelativa(hace5Min)).toBe('hace 5 minutos')
  })

  it('formatea hace horas', () => {
    const hace2Horas = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const resultado = formatearFechaRelativa(hace2Horas)
    expect(resultado).toMatch(/hace (alrededor de )?2 horas/)
  })
})

describe('formatearFechaHora', () => {
  it('formatea fecha y hora', () => {
    const fecha = '2024-01-15T10:30:00.000Z'
    const resultado = formatearFechaHora(fecha)
    expect(resultado).toContain('2024')
    // La hora mostrada depende de la zona horaria local
    expect(resultado).toMatch(/\d\d:\d\d/)
  })
})
