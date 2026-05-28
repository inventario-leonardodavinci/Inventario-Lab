import { apiClient } from "./clienteApi";

export function enviarEventoLogin(
  authUserId: string,
  tipoEvento: 'login' | 'oauth' | 'logout' | 'refresh' = 'login',
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
