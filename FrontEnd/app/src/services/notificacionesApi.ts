import { apiClient } from "./clienteApi";

export type NotificacionItem = {
  id: number;
  title: string;
  body: string;
  status: "open" | "acknowledged" | "resolved" | "ignored";
  created_at: string;
};

export type RespuestaNotificaciones = {
  data: NotificacionItem[];
  unread_count: number;
};

export function getNotificaciones(authUserId: string) {
  return apiClient<RespuestaNotificaciones>("/notificaciones", {}, { authUserId });
}

export function enviarEventoLogin(authUserId: string) {
  return apiClient<{ message: string }>(
    "/notificaciones/evento-login",
    { method: "POST" },
    { authUserId },
  );
}
