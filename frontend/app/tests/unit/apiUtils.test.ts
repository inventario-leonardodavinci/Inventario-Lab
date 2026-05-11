import { describe, it, expect } from 'vitest'
import { buildQueryString, unwrapData, unwrapPaginated } from '@/services/apiUtils'

// ─── buildQueryString ─────────────────────────────────────────────────────────

describe('buildQueryString', () => {
  it('devuelve cadena vacía si no hay parámetros', () => {
    expect(buildQueryString({})).toBe('')
  })

  it('devuelve cadena vacía si todos los valores son undefined', () => {
    expect(buildQueryString({ a: undefined, b: undefined })).toBe('')
  })

  it('devuelve cadena vacía si todos los valores son null', () => {
    expect(buildQueryString({ a: null, b: null })).toBe('')
  })

  it('devuelve cadena vacía si todos los valores son string vacío', () => {
    expect(buildQueryString({ search: '', page: '' })).toBe('')
  })

  it('construye query string con un solo parámetro', () => {
    expect(buildQueryString({ search: 'acetona' })).toBe('?search=acetona')
  })

  it('construye query string con múltiples parámetros', () => {
    const qs = buildQueryString({ page: 2, per_page: 10 })
    expect(qs).toContain('page=2')
    expect(qs).toContain('per_page=10')
    expect(qs).toMatch(/^\?/)
  })

  it('omite valores undefined mezclados con válidos', () => {
    const qs = buildQueryString({ search: 'test', activo: undefined, page: 1 })
    expect(qs).toContain('search=test')
    expect(qs).toContain('page=1')
    expect(qs).not.toContain('activo')
  })

  it('omite valores null mezclados con válidos', () => {
    const qs = buildQueryString({ search: 'test', categoria_id: null, page: 1 })
    expect(qs).not.toContain('categoria_id')
    expect(qs).toContain('search=test')
  })

  it('convierte números a string en el query string', () => {
    expect(buildQueryString({ per_page: 25 })).toBe('?per_page=25')
  })

  it('convierte booleanos a string en el query string', () => {
    const qs = buildQueryString({ activo: true })
    expect(qs).toContain('activo=true')
  })

  it('codifica caracteres especiales en los valores', () => {
    const qs = buildQueryString({ search: 'ácido sulfúrico' })
    expect(qs).toMatch(/search=/)
    expect(qs).toMatch(/^\?/)
  })
})

// ─── unwrapData ───────────────────────────────────────────────────────────────

describe('unwrapData', () => {
  it('desenvuelve envelope con clave data', () => {
    const resultado = unwrapData({ data: [1, 2, 3] })
    expect(resultado).toEqual([1, 2, 3])
  })

  it('retorna el valor directamente si no tiene clave data', () => {
    const valor = [{ id: 1, nombre: 'Reactivo' }]
    expect(unwrapData(valor)).toBe(valor)
  })

  it('retorna null si data es null', () => {
    expect(unwrapData(null)).toBeNull()
  })

  it('retorna string directamente si no es objeto', () => {
    expect(unwrapData('texto plano')).toBe('texto plano')
  })

  it('retorna número directamente si no es objeto', () => {
    expect(unwrapData(42)).toBe(42)
  })

  it('retorna el envelope si data es undefined', () => {
    const envelope = { other: 'field' }
    const resultado = unwrapData(envelope)
    expect(resultado).toBe(envelope)
  })

  it('desenvuelve objeto con clave data que es un objeto', () => {
    const inner = { id: 1, nombre: 'Categoría' }
    expect(unwrapData({ data: inner })).toEqual(inner)
  })
})

// ─── unwrapPaginated ──────────────────────────────────────────────────────────

describe('unwrapPaginated', () => {
  it('retorna el paginado si ya tiene estructura data + meta', () => {
    const paginado = {
      data: [{ id: 1 }],
      meta: { current_page: 1, last_page: 2, total: 10 },
    }
    expect(unwrapPaginated(paginado)).toBe(paginado)
  })

  it('desenvuelve envelope { data: paginado }', () => {
    const paginado = {
      data: [{ id: 1 }],
      meta: { current_page: 1, last_page: 1, total: 1 },
    }
    const resultado = unwrapPaginated({ data: paginado })
    expect(resultado).toEqual(paginado)
  })

  it('convierte array plano en paginado con meta por defecto', () => {
    const arr = [{ id: 1 }, { id: 2 }]
    const resultado = unwrapPaginated({ data: arr })
    expect(resultado.data).toEqual(arr)
    expect(resultado.meta.total).toBe(2)
    expect(resultado.meta.current_page).toBe(1)
    expect(resultado.meta.last_page).toBe(1)
  })

  it('retorna paginado vacío para valor no objeto', () => {
    const resultado = unwrapPaginated(null as any)
    expect(resultado.data).toEqual([])
    expect(resultado.meta.total).toBe(0)
  })

  it('retorna paginado vacío para undefined', () => {
    const resultado = unwrapPaginated(undefined as any)
    expect(resultado.data).toEqual([])
  })

  it('retorna paginado vacío para string', () => {
    const resultado = unwrapPaginated('not-valid' as any)
    expect(resultado.data).toEqual([])
  })

  it('preserva datos en paginado con data array y meta', () => {
    const paginado = {
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      meta: { current_page: 2, last_page: 5, total: 50 },
    }
    const resultado = unwrapPaginated(paginado)
    expect(resultado.meta.current_page).toBe(2)
    expect(resultado.meta.last_page).toBe(5)
    expect(resultado.meta.total).toBe(50)
    expect(resultado.data).toHaveLength(3)
  })
})
