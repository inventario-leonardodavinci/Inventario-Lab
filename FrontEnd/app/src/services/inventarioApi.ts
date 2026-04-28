import { apiClient } from "./clienteApi";

export type FilaInventario = {
  id: number;
  code: string | null;
  name: string;
  category: string | null;
  stock: number;
  min_stock: number;
  status: "critical" | "ok";
};

export type RespuestaInventario = {
  data: FilaInventario[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

export function getInventario(authUserId: string, search = "") {
  const consulta = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiClient<RespuestaInventario>(`/inventario${consulta}`, {}, { authUserId });
}

export function crearArticuloInventario(
  authUserId: string,
  entrada: {
    code?: string;
    name: string;
    category_id: number;
    unit?: string;
  },
) {
  return apiClient<{ data: { id: number; name: string } }>(
    "/inventario",
    {
      method: "POST",
      body: JSON.stringify(entrada),
    },
    { authUserId },
  );
}
