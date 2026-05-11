import { describe, it, expect } from 'vitest'
import { vi } from 'vitest'

vi.mock('@/services/clienteApi', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public message: string, public readonly status: number) {
      super(message)
      this.name = 'ApiError'
    }
  },
}))

import { validarMovimiento, type EntradaCrearMovimiento } from '@/services/movimientosApi'

// ─── validarMovimiento ────────────────────────────────────────────────────────

describe('validarMovimiento — tipo entrada', () => {
  it('retorna null si entrada tiene ubicacion_destino_id y líneas válidas', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'entrada',
      ubicacion_destino_id: 1,
      lineas: [{ articulo_id: 10, cantidad: 5 }],
    }
    expect(validarMovimiento(datos)).toBeNull()
  })

  it('retorna error si entrada no tiene ubicacion_destino_id', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'entrada',
      lineas: [{ articulo_id: 10, cantidad: 5 }],
    }
    const error = validarMovimiento(datos)
    expect(error).toBeTypeOf('string')
    expect(error).toContain('destino')
  })
})

describe('validarMovimiento — tipo salida', () => {
  it('retorna null si salida tiene ubicacion_origen_id y líneas válidas', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'salida',
      ubicacion_origen_id: 2,
      lineas: [{ articulo_id: 10, cantidad: 3 }],
    }
    expect(validarMovimiento(datos)).toBeNull()
  })

  it('retorna error si salida no tiene ubicacion_origen_id', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'salida',
      lineas: [{ articulo_id: 10, cantidad: 3 }],
    }
    const error = validarMovimiento(datos)
    expect(error).toBeTypeOf('string')
    expect(error).toContain('origen')
  })
})

describe('validarMovimiento — tipo traslado', () => {
  it('retorna null si traslado tiene origen y destino', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'traslado',
      ubicacion_origen_id: 1,
      ubicacion_destino_id: 2,
      lineas: [{ articulo_id: 10, cantidad: 5 }],
    }
    expect(validarMovimiento(datos)).toBeNull()
  })

  it('retorna error si traslado no tiene ubicacion_origen_id', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'traslado',
      ubicacion_destino_id: 2,
      lineas: [{ articulo_id: 10, cantidad: 5 }],
    }
    expect(validarMovimiento(datos)).toBeTypeOf('string')
  })

  it('retorna error si traslado no tiene ubicacion_destino_id', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'traslado',
      ubicacion_origen_id: 1,
      lineas: [{ articulo_id: 10, cantidad: 5 }],
    }
    expect(validarMovimiento(datos)).toBeTypeOf('string')
  })

  it('retorna error si traslado no tiene ninguna ubicación', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'traslado',
      lineas: [{ articulo_id: 10, cantidad: 5 }],
    }
    expect(validarMovimiento(datos)).toBeTypeOf('string')
  })
})

describe('validarMovimiento — tipo ajuste', () => {
  it('retorna null si ajuste tiene ubicacion_destino_id y líneas válidas', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'ajuste',
      ubicacion_destino_id: 3,
      lineas: [{ articulo_id: 10, cantidad: 99 }],
    }
    expect(validarMovimiento(datos)).toBeNull()
  })

  it('retorna error si ajuste no tiene ubicacion_destino_id', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'ajuste',
      lineas: [{ articulo_id: 10, cantidad: 5 }],
    }
    const error = validarMovimiento(datos)
    expect(error).toBeTypeOf('string')
    expect(error).toContain('destino')
  })
})

describe('validarMovimiento — validación de líneas', () => {
  it('retorna error si lineas está vacío', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'entrada',
      ubicacion_destino_id: 1,
      lineas: [],
    }
    const error = validarMovimiento(datos)
    expect(error).toBeTypeOf('string')
    expect(error).toContain('línea')
  })

  it('retorna error si una línea tiene cantidad = 0', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'entrada',
      ubicacion_destino_id: 1,
      lineas: [{ articulo_id: 10, cantidad: 0 }],
    }
    const error = validarMovimiento(datos)
    expect(error).toBeTypeOf('string')
  })

  it('retorna error si una línea tiene cantidad negativa', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'entrada',
      ubicacion_destino_id: 1,
      lineas: [{ articulo_id: 10, cantidad: -5 }],
    }
    const error = validarMovimiento(datos)
    expect(error).toBeTypeOf('string')
  })

  it('retorna error si una línea no tiene articulo_id (0)', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'entrada',
      ubicacion_destino_id: 1,
      lineas: [{ articulo_id: 0, cantidad: 5 }],
    }
    expect(validarMovimiento(datos)).toBeTypeOf('string')
  })

  it('acepta múltiples líneas válidas', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'entrada',
      ubicacion_destino_id: 1,
      lineas: [
        { articulo_id: 10, cantidad: 5 },
        { articulo_id: 20, cantidad: 10 },
        { articulo_id: 30, cantidad: 1 },
      ],
    }
    expect(validarMovimiento(datos)).toBeNull()
  })

  it('retorna error si alguna línea de las múltiples es inválida', () => {
    const datos: EntradaCrearMovimiento = {
      tipo: 'entrada',
      ubicacion_destino_id: 1,
      lineas: [
        { articulo_id: 10, cantidad: 5 },
        { articulo_id: 20, cantidad: 0 }, // inválida
      ],
    }
    expect(validarMovimiento(datos)).toBeTypeOf('string')
  })
})
