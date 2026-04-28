import { apiClient } from "./clienteApi";

export type RespuestaMovimientos = {
  data: Array<{
    id: number;
    movement_type: string;
    reason: string | null;
    user?: { display_name: string | null };
    created_at: string;
    lines: Array<{ item_id: number; quantity: string }>;
  }>;
};

export function getMovimientos(authUserId: string) {
  return apiClient<RespuestaMovimientos>("/movimientos", {}, { authUserId });
}

export function crearMovimiento(
  authUserId: string,
  entrada: {
    movement_type: "entry" | "exit" | "transfer" | "adjustment";
    reason?: string;
    source_location_id?: number;
    target_location_id?: number;
    lines: Array<{ item_id: number; quantity: number }>;
  },
) {
  return apiClient<{ data: { id: number } }>(
    "/movimientos",
    {
      method: "POST",
      body: JSON.stringify(entrada),
    },
    { authUserId },
  );
}
