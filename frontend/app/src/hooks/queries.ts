/**
 * Query keys y hooks de TanStack Query para todos los recursos de la API.
 * Centralizar aquí evita duplicar strings de clave y facilita invalidaciones.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getInventario } from "@/services/inventarioApi";
import { getMovimientos, getResumenHoy, crearMovimiento } from "@/services/movimientosApi";
import { getNotificaciones } from "@/services/notificacionesApi";
import { apiClient } from "@/services/clienteApi";
import type { ActivoMantenimiento } from "@/pages/Mantenimiento";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  inventario: (authUserId: string, search?: string) =>
    ["inventario", authUserId, search ?? ""] as const,
  movimientos: (authUserId: string, perPage?: number) =>
    ["movimientos", authUserId, perPage ?? 20] as const,
  resumenHoy: (authUserId: string) =>
    ["resumen-hoy", authUserId] as const,
  notificaciones: (authUserId: string) =>
    ["notificaciones", authUserId] as const,
  mantenimiento: (authUserId: string) =>
    ["mantenimiento", authUserId] as const,
};

// ─── Inventario ───────────────────────────────────────────────────────────────

export function useInventario(authUserId: string | undefined, search = "") {
  return useQuery({
    queryKey: queryKeys.inventario(authUserId ?? "", search),
    queryFn: () => getInventario(authUserId!, search),
    enabled: !!authUserId,
  });
}

// ─── Movimientos ──────────────────────────────────────────────────────────────

export function useMovimientos(authUserId: string | undefined, perPage = 20) {
  return useQuery({
    queryKey: queryKeys.movimientos(authUserId ?? "", perPage),
    queryFn: () => getMovimientos(authUserId!, { per_page: perPage }),
    enabled: !!authUserId,
  });
}

export function useCrearMovimiento(authUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: Parameters<typeof crearMovimiento>[1]) =>
      crearMovimiento(authUserId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["movimientos", authUserId] });
      void queryClient.invalidateQueries({ queryKey: ["resumen-hoy", authUserId] });
    },
  });
}

// ─── Resumen hoy ──────────────────────────────────────────────────────────────

export function useResumenHoy(authUserId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.resumenHoy(authUserId ?? ""),
    queryFn: () => getResumenHoy(authUserId!),
    enabled: !!authUserId,
  });
}

// ─── Notificaciones ───────────────────────────────────────────────────────────

export function useNotificaciones(authUserId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notificaciones(authUserId ?? ""),
    queryFn: () => getNotificaciones(authUserId!),
    enabled: !!authUserId,
  });
}

// ─── Mantenimiento ────────────────────────────────────────────────────────────

export function useMantenimiento(authUserId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mantenimiento(authUserId ?? ""),
    queryFn: () =>
      apiClient<{ data: ActivoMantenimiento[] }>(
        "/mantenimiento/activos",
        {},
        { authUserId: authUserId! },
      ),
    enabled: !!authUserId,
  });
}

export function useCrearActivo(authUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (datos: { asset_code: string; status: string }) =>
      apiClient("/mantenimiento/activos", {
        method: "POST",
        body: JSON.stringify(datos),
      }, { authUserId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["mantenimiento", authUserId] });
    },
  });
}
