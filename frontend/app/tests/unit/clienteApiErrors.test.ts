/**
 * Tests para ApiError y ApiValidationError de clienteApi.ts.
 *
 * clienteApi.ts lanza en tiempo de módulo si falta VITE_API_BASE_URL,
 * por eso usamos vi.stubEnv + vi.resetModules + dynamic import.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

type ApiErrorType = InstanceType<typeof import('@/services/clienteApi').ApiError>
type ApiValidationErrorType = InstanceType<typeof import('@/services/clienteApi').ApiValidationError>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ApiError: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ApiValidationError: any

beforeAll(async () => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')
  vi.resetModules()
  const mod = await import('@/services/clienteApi')
  ApiError = mod.ApiError
  ApiValidationError = mod.ApiValidationError
})

afterAll(() => {
  vi.unstubAllEnvs()
})

// ─── ApiError ─────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('es instancia de Error', () => {
    const err = new ApiError('Error de red', 503)
    expect(err).toBeInstanceOf(Error)
  })

  it('tiene nombre ApiError', () => {
    const err = new ApiError('Error de red', 503)
    expect(err.name).toBe('ApiError')
  })

  it('conserva el mensaje', () => {
    const err = new ApiError('No autorizado', 401)
    expect(err.message).toBe('No autorizado')
  })

  it('conserva el código de estado HTTP', () => {
    const err = new ApiError('No encontrado', 404)
    expect(err.status).toBe(404)
  })

  it('distingue entre distintos códigos de estado', () => {
    const err400 = new ApiError('Petición inválida', 400)
    const err500 = new ApiError('Error servidor', 500)
    expect(err400.status).toBe(400)
    expect(err500.status).toBe(500)
  })

  it('se puede capturar con catch como Error genérico', () => {
    const lanzar = () => { throw new ApiError('Fallo', 500) }
    expect(lanzar).toThrow(Error)
    expect(lanzar).toThrow('Fallo')
  })

  it('instanceof ApiError es true', () => {
    const err = new ApiError('Test', 200)
    expect(err).toBeInstanceOf(ApiError)
  })

  it('instanceof ApiError es false para Error genérico', () => {
    const err = new Error('genérico')
    expect(err).not.toBeInstanceOf(ApiError)
  })

  it('status 401 es típico de no autenticado', () => {
    const err: ApiErrorType = new ApiError('No autenticado', 401)
    expect(err.status).toBe(401)
    expect(err.message).toContain('autenticado')
  })

  it('status 403 es típico de no autorizado', () => {
    const err: ApiErrorType = new ApiError('Sin permisos', 403)
    expect(err.status).toBe(403)
  })

  it('status 422 indica error de validación semántica', () => {
    const err: ApiErrorType = new ApiError('Datos inválidos', 422)
    expect(err.status).toBe(422)
  })
})

// ─── ApiValidationError ───────────────────────────────────────────────────────

describe('ApiValidationError', () => {
  it('es instancia de Error', () => {
    const err = new ApiValidationError('Validación fallida', { nombre: ['requerido'] })
    expect(err).toBeInstanceOf(Error)
  })

  it('tiene nombre ApiValidationError', () => {
    const err = new ApiValidationError('Validación fallida', {})
    expect(err.name).toBe('ApiValidationError')
  })

  it('conserva el mensaje', () => {
    const err = new ApiValidationError('Los datos no son válidos', {})
    expect(err.message).toBe('Los datos no son válidos')
  })

  it('conserva el mapa de errores por campo', () => {
    const errores = {
      nombre: ['El nombre es obligatorio.'],
      categoria_id: ['La categoría es obligatoria.', 'La categoría debe existir.'],
    }
    const err: ApiValidationErrorType = new ApiValidationError('Fallo validación', errores)
    expect(err.errors).toEqual(errores)
  })

  it('accede a errores de un campo específico', () => {
    const err: ApiValidationErrorType = new ApiValidationError('Fallo', {
      email: ['El email no es válido'],
    })
    expect(err.errors['email']).toContain('El email no es válido')
  })

  it('errors vacío cuando no hay errores de campo', () => {
    const err: ApiValidationErrorType = new ApiValidationError('Sin errores específicos', {})
    expect(err.errors).toEqual({})
  })

  it('instanceof ApiValidationError es true', () => {
    const err = new ApiValidationError('Test', {})
    expect(err).toBeInstanceOf(ApiValidationError)
  })

  it('también es instanceof ApiError por herencia', () => {
    const err = new ApiValidationError('Test', {})
    expect(err).toBeInstanceOf(ApiError)
  })

  it('siempre tiene status 422', () => {
    const err: ApiValidationErrorType = new ApiValidationError('Campos inválidos', {})
    expect(err.status).toBe(422)
  })

  it('se puede capturar con catch', () => {
    const lanzar = () => { throw new ApiValidationError('Inválido', { campo: ['error'] }) }
    expect(lanzar).toThrow(Error)
    expect(lanzar).toThrow('Inválido')
  })

  it('admite múltiples errores por campo', () => {
    const err: ApiValidationErrorType = new ApiValidationError('Múltiples fallos', {
      password: ['Demasiado corta', 'Debe tener mayúsculas'],
    })
    expect(err.errors['password']).toHaveLength(2)
    expect(err.errors['password'][0]).toBe('Demasiado corta')
  })
})
