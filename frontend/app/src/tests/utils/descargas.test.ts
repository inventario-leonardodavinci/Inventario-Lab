import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { descargarBlob } from '@/utils/descargas'

describe('descargarBlob', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>
  let revokeObjectURLMock: ReturnType<typeof vi.fn>
  let appendChildMock: ReturnType<typeof vi.fn>
  let removeChildMock: ReturnType<typeof vi.fn>
  let clickMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/test-url')
    revokeObjectURLMock = vi.fn()
    clickMock = vi.fn()
    appendChildMock = vi.fn()
    removeChildMock = vi.fn()

    vi.stubGlobal('URL', {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    })

    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildMock)
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildMock)

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickMock } as unknown as HTMLAnchorElement
      }
      return document.createElement(tag)
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('crea una URL de objeto y dispara el click', () => {
    const blob = new Blob(['contenido'], { type: 'text/csv' })
    descargarBlob(blob, 'inventario.csv')

    expect(createObjectURLMock).toHaveBeenCalledWith(blob)
    expect(clickMock).toHaveBeenCalledOnce()
  })

  it('asigna el nombre de archivo correcto al enlace', () => {
    const blob = new Blob(['contenido'], { type: 'text/csv' })
    let enlaceCreado: { href: string; download: string; click: () => void } | null = null

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        enlaceCreado = { href: '', download: '', click: clickMock }
        return enlaceCreado as unknown as HTMLAnchorElement
      }
      return document.createElement(tag)
    })

    descargarBlob(blob, 'inventario_2024-01-01.csv')

    expect(enlaceCreado?.download).toBe('inventario_2024-01-01.csv')
    expect(enlaceCreado?.href).toBe('blob:http://localhost/test-url')
  })

  it('revoca la URL de objeto tras 1 segundo', () => {
    const blob = new Blob(['contenido'], { type: 'text/csv' })
    descargarBlob(blob, 'test.csv')

    expect(revokeObjectURLMock).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1_000)
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/test-url')
  })
})
