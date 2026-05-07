import { apiClient } from "./clienteApi";

export type NotificacionItem = {
  id: number;
  title: string;
  body: string;
  status: "abierta" | "confirmada" | "resuelta" | "ignorada";
  created_at: string;
};

export type RespuestaNotificaciones = {
  data: NotificacionItem[];
  unread_count: number;
};

type NotificacionesApiRaw =
  | RespuestaNotificaciones
  | {
      data?: RespuestaNotificaciones | NotificacionItem[];
      unread_count?: number;
    };

function esNotificacionItemArray(value: unknown): value is NotificacionItem[] {
  return Array.isArray(value);
}

function normalizarRespuestaNotificaciones(raw: NotificacionesApiRaw): RespuestaNotificaciones {
  // Compatibilidad con payload directo y payload envuelto por ApiResponse::success.
  const payload = raw && typeof raw === "object" && "data" in raw ? raw.data : raw;

  if (payload && typeof payload === "object") {
    const data = "data" in payload && esNotificacionItemArray(payload.data) ? payload.data : [];
    const unread = "unread_count" in payload && typeof payload.unread_count === "number" ? payload.unread_count : 0;
    return { data, unread_count: unread };
  }

  if (esNotificacionItemArray(payload)) {
    return { data: payload, unread_count: 0 };
  }

  return { data: [], unread_count: 0 };
}

export async function getNotificaciones(authUserId: string): Promise<RespuestaNotificaciones> {
  const response = await apiClient<NotificacionesApiRaw>("/notificaciones", {}, { authUserId });
  return normalizarRespuestaNotificaciones(response);
}

export function enviarEventoLogin(
  authUserId: string,
  tipoEvento: 'login' | 'oauth' = 'login',
) {
  return apiClient<{ message: string }>(
    "/notificaciones/evento-login",
    {
      method: "POST",
      body: JSON.stringify({ tipo_evento: tipoEvento }),
    },
    { authUserId },
  );
}
