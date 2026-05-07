import type { Meta, Paginado } from '@/types'

type ApiEnvelope<T> = {
  data?: T
  meta?: Meta
}

function esObjeto(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    searchParams.set(key, String(value))
  }

  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

export function unwrapData<T>(raw: T | ApiEnvelope<T>): T {
  if (!esObjeto(raw)) return raw as T
  if (!('data' in raw)) return raw as T
  const data = (raw as ApiEnvelope<T>).data
  return (data ?? raw) as T
}

export function unwrapPaginated<T>(
  raw: Paginado<T> | ApiEnvelope<Paginado<T>> | ApiEnvelope<T[]>,
): Paginado<T> {
  if (!esObjeto(raw)) return { data: [], meta: { current_page: 1, last_page: 1, total: 0 } }

  if ('data' in raw && Array.isArray((raw as Paginado<T>).data) && 'meta' in raw) {
    return raw as Paginado<T>
  }

  const data = (raw as ApiEnvelope<Paginado<T> | T[]>).data

  if (esObjeto(data) && 'data' in data && Array.isArray((data as Paginado<T>).data)) {
    return data as Paginado<T>
  }

  if (Array.isArray(data)) {
    return {
      data,
      meta: {
        current_page: 1,
        last_page: 1,
        total: data.length,
      },
    }
  }

  return {
    data: [],
    meta: {
      current_page: 1,
      last_page: 1,
      total: 0,
    },
  }
}
