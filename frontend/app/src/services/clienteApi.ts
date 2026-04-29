export type ApiClientOptions = {
  authUserId?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
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

  const response = await fetch(`${API_BASE_URL}${ruta}`, {
    ...configuracion,
    headers,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(payload.message ?? "Error inesperado de API", response.status);
  }

  return payload as T;
}
