import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'
import { jwtDecode } from 'jwt-decode'
import { insforge } from './insforgeClient'

export type ApiClientOptions = {
  authUserId?: string;
  authUserName?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Falta la variable de entorno VITE_API_BASE_URL");
}

// ─── Tipos de error ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiValidationError extends ApiError {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>,
  ) {
    super(message, 422);
    this.name = 'ApiValidationError';
  }
}

// ─── Helpers JWT ──────────────────────────────────────────────────────────────

/**
 * Comprueba si un JWT ha expirado (con 30s de margen).
 * Devuelve true si el token es inválido o ha expirado.
 */
function tokenExpirado(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token)
    if (!exp) return false
    // 30 segundos de margen para evitar race conditions
    return Date.now() / 1000 > exp - 30
  } catch {
    return true
  }
}

/**
 * Obtiene el access token actual del SDK de Insforge.
 * Devuelve null si no hay sesión activa.
 */
function obtenerTokenActual(): string | null {
  try {
    // El SDK expone el token via tokenManager interno
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const token = (insforge as any).http?.tokenManager?.getAccessToken?.() as string | null
    return token ?? null
  } catch {
    return null
  }
}

// ─── Instancia axios ───────────────────────────────────────────────────────────

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Interceptor de REQUEST: detectar token expirado antes de enviar ───────────
// Si el token ha expirado, intenta un refresh silencioso antes de continuar.
// Esto evita peticiones que van a fallar con 401 y mejora la UX en iOS.
httpClient.interceptors.request.use(
  async (config) => {
    const token = obtenerTokenActual()
    if (token && tokenExpirado(token)) {
      try {
        await insforge.auth.refreshSession()
      } catch {
        // Si el refresh falla, la petición continuará y recibirá 401
        // que el interceptor de response manejará
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Interceptor de RESPONSE: normalizar errores ───────────────────────────────
httpClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (!isAxiosError(error)) {
      return Promise.reject(new ApiError('Error inesperado.', 0))
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
      return Promise.reject(
        new ApiError('La petición tardó demasiado. Comprueba tu conexión.', 408),
      )
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError('No se pudo conectar con el servidor. Comprueba tu conexión.', 0),
      )
    }

    const { status, data } = error.response as { status: number; data: Record<string, unknown> }

    if (status === 422) {
      return Promise.reject(
        new ApiValidationError(
          (data?.message as string) ?? 'Error de validación',
          (data?.errors as Record<string, string[]>) ?? {},
        ),
      )
    }

    return Promise.reject(
      new ApiError(
        (data?.message as string) ?? `Error ${status}`,
        status,
      ),
    )
  },
)

// ─── Función pública (misma firma que antes) ───────────────────────────────────

export async function apiClient<T>(
  ruta: string,
  configuracion: RequestInit = {},
  opciones: ApiClientOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (opciones.authUserId) headers['X-Auth-User-Id'] = opciones.authUserId
  if (opciones.authUserName) headers['X-Auth-User-Name'] = opciones.authUserName

  const axiosConfig: AxiosRequestConfig = {
    method: (configuracion.method as string | undefined) ?? 'GET',
    headers,
    data: configuracion.body,
  }

  const { data } = await httpClient.request<T>({
    url: ruta,
    ...axiosConfig,
  })

  return data
}
