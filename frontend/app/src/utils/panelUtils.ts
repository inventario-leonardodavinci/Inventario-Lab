/**
 * Funciones puras auxiliares para el PanelPrincipal.
 * Feature: panel-principal-datos-reales
 */

/**
 * Traduce el tipo de movimiento del inglés (valor de BD) al español (UI).
 * Para tipos desconocidos devuelve el valor original sin modificar.
 */
export function traducirTipoMovimiento(tipo: string): string {
  const mapa: Record<string, string> = {
    entry: "Entrada",
    exit: "Salida",
    transfer: "Transferencia",
    adjustment: "Ajuste",
  };
  return Object.hasOwn(mapa, tipo) ? mapa[tipo] : tipo;
}

/**
 * Formatea un valor KPI numérico para su presentación en pantalla.
 * - `null`  → "..."  (cargando)
 * - `-1`    → "—"   (error / no disponible)
 * - número  → representación como string
 */
export function formatearKpi(valor: number | null): string {
  if (valor === null) return "...";
  if (valor === -1) return "—";
  return String(valor);
}

export type FilaInventarioItem = {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
  status: "critical" | "ok";
};

export type MovimientoItem = {
  id: number;
  movement_type: string;
  user?: { display_name: string | null };
  created_at: string;
};

/**
 * Extrae artículos con stock crítico desde la respuesta de inventario.
 */
export function extraerCriticos(inventario: FilaInventarioItem[]): FilaInventarioItem[] {
  return inventario.filter((a) => a.status === "critical");
}

/**
 * Transforma artículos críticos en filas para la tabla de alertas.
 */
export function mapearAlertas(
  criticos: FilaInventarioItem[],
  limite: number = 6,
): Array<{ item: string; stock: string; min: string; status: string }> {
  return criticos.slice(0, limite).map((row) => ({
    item: row.name,
    stock: String(row.stock),
    min: String(row.min_stock),
    status: "Crítico",
  }));
}

/**
 * Transforma movimientos en resumen para el feed de actividad reciente.
 */
export function mapearMovimientosRecientes(
  movimientos: MovimientoItem[],
): Array<{ id: number; tipo: string; responsable: string; fechaHora: string }> {
  return movimientos.map((m) => ({
    id: m.id,
    tipo: traducirTipoMovimiento(m.movement_type),
    responsable: m.user?.display_name ?? "Sistema",
    fechaHora: m.created_at,
  }));
}

/**
 * Construye las tarjetas KPI a partir de valores numéricos.
 */
export function construirKpiCards(params: {
  inventoryCount: number | null;
  criticalCount: number | null;
  entradasHoy: number | null;
  salidasHoy: number | null;
  unreadNotifications: number;
}) {
  const { inventoryCount, criticalCount, entradasHoy, salidasHoy, unreadNotifications } = params;
  return [
    {
      title: "Articulos en inventario",
      value: formatearKpi(inventoryCount),
      delta: "Total registrados",
      badge: "Estable" as const,
      icon: "PackageCheck" as const,
    },
    {
      title: "Entradas hoy",
      value: formatearKpi(entradasHoy),
      delta: "Movimientos registrados hoy",
      badge: "Operativo" as const,
      icon: "ArrowDownToLine" as const,
    },
    {
      title: "Salidas hoy",
      value: formatearKpi(salidasHoy),
      delta: "Movimientos registrados hoy",
      badge: "Control" as const,
      icon: "ArrowUpFromLine" as const,
    },
    {
      title: "Stock crítico",
      value: formatearKpi(criticalCount),
      delta: `${unreadNotifications} notificaciones abiertas`,
      badge: "Urgente" as const,
      icon: "TriangleAlert" as const,
    },
  ];
}
