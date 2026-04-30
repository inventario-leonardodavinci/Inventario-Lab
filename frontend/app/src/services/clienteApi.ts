export type ApiClientOptions = {
  authUserId?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Falta la variable de entorno VITE_API_BASE_URL");
}

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

export async function apiClient<T>(
  ruta: string,
  configuracion: RequestInit = {},
  opciones: ApiClientOptions = {},
): Promise<T> {
  const headers = new Headers(configuracion.headers);
  headers.set("Content-Type", "application/json");

  if (opciones.authUserId) {
    headers.set("X-Auth-User-Id", opciones.authUserId);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(`${API_BASE_URL}${ruta}`, {
    ...configuracion,
    headers,
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  let payload: Record<string, unknown> = {};
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError(`Error ${response.status}: ${response.statusText}`, response.status);
    }
  }
  if (!response.ok) {
    if (response.status === 422) {
      throw new ApiValidationError(
        (payload.message as string) ?? 'Error de validación',
        (payload.errors as Record<string, string[]>) ?? {},
      );
    }
    throw new ApiError((payload.message as string) ?? `Error ${response.status}: ${response.statusText}`, response.status);
  }

  return payload as T;
}
