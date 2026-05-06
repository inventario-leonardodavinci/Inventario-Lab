import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useResolverAlerta, useConfirmarAlerta } from '@/hooks/queries'
import * as alertasApi from '@/services/alertasApi'
import React from 'react'

// Mock de los servicios
vi.mock('@/services/alertasApi', () => ({
  resolverAlerta: vi.fn(),
  confirmarAlerta: vi.fn(),
}))

// Mock de useAuth
vi.mock('@/context/ContextoAutenticacion', () => ({
  useAuth: () => ({
    user: { authUserId: 'test-user-id' },
  }),
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('useResolverAlerta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resuelve alerta con notas correctamente', async () => {
    const mockAlerta = {
      id: 1,
      tipo: 'stock_bajo' as const,
      severidad: 'alta' as const,
      estado: 'resuelta' as const,
      articulo_id: 1,
      articulo: { id: 1, nombre: 'Test Artículo' },
      datos_json: null,
      generada_en: new Date().toISOString(),
      confirmada_por_id: null,
      confirmada_en: null,
      resuelta_por_id: 1,
      resuelta_en: new Date().toISOString(),
      notas_resolucion: 'Notas de prueba',
    }

    vi.mocked(alertasApi.resolverAlerta).mockResolvedValueOnce({ data: mockAlerta })

    const { result } = renderHook(() => useResolverAlerta(), { wrapper })

    await result.current.mutateAsync({ id: 1, notas: 'Notas de prueba' })

    expect(alertasApi.resolverAlerta).toHaveBeenCalledWith('test-user-id', 1, 'Notas de prueba')
  })

  it('resuelve alerta sin notas', async () => {
    const mockAlerta = {
      id: 1,
      tipo: 'stock_bajo' as const,
      severidad: 'alta' as const,
      estado: 'resuelta' as const,
      articulo_id: 1,
      articulo: { id: 1, nombre: 'Test Artículo' },
      datos_json: null,
      generada_en: new Date().toISOString(),
      confirmada_por_id: null,
      confirmada_en: null,
      resuelta_por_id: 1,
      resuelta_en: new Date().toISOString(),
      notas_resolucion: null,
    }

    vi.mocked(alertasApi.resolverAlerta).mockResolvedValueOnce({ data: mockAlerta })

    const { result } = renderHook(() => useResolverAlerta(), { wrapper })

    await result.current.mutateAsync({ id: 1 })

    expect(alertasApi.resolverAlerta).toHaveBeenCalledWith('test-user-id', 1, undefined)
  })
})

describe('useConfirmarAlerta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('confirma alerta correctamente', async () => {
    const mockAlerta = {
      id: 1,
      tipo: 'stock_bajo' as const,
      severidad: 'alta' as const,
      estado: 'confirmada' as const,
      articulo_id: 1,
      articulo: { id: 1, nombre: 'Test Artículo' },
      datos_json: null,
      generada_en: new Date().toISOString(),
      confirmada_por_id: 1,
      confirmada_en: new Date().toISOString(),
      resuelta_por_id: null,
      resuelta_en: null,
      notas_resolucion: null,
    }

    vi.mocked(alertasApi.confirmarAlerta).mockResolvedValueOnce({ data: mockAlerta })

    const { result } = renderHook(() => useConfirmarAlerta(), { wrapper })

    await result.current.mutateAsync(1)

    expect(alertasApi.confirmarAlerta).toHaveBeenCalledWith('test-user-id', 1)
  })
})
