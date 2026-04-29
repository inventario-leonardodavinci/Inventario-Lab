/**
 * Tests de componente para PanelPrincipal
 * Feature: panel-principal-datos-reales
 * Propiedades 2, 3, 5, 7 — Requisitos 2.1–2.3, 3.1–3.5, 4.1–4.5, 5.1–5.4
 *
 * @vitest-environment jsdom
 */
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as fc from "fast-check";
import React from "react";

// Mocks de servicios — rutas relativas para que Vitest las resuelva correctamente
vi.mock("../../src/services/inventarioApi", () => ({ getInventario: vi.fn() }));
vi.mock("../../src/services/movimientosApi", () => ({ getResumenHoy: vi.fn(), getMovimientos: vi.fn() }));
vi.mock("../../src/services/notificacionesApi", () => ({ getNotificaciones: vi.fn() }));
vi.mock("../../src/context/ContextoAutenticacion", () => ({
  useAuth: () => ({
    user: { authUserId: "test-user-id", displayName: "Tester", role: "admin" },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Imports después de los mocks
import PanelPrincipal from "../../src/pages/PanelPrincipal";
import * as inventarioApi from "../../src/services/inventarioApi";
import * as movimientosApi from "../../src/services/movimientosApi";
import * as notificacionesApi from "../../src/services/notificacionesApi";

const mockGetInventario = vi.mocked(inventarioApi.getInventario);
const mockGetResumenHoy = vi.mocked(movimientosApi.getResumenHoy);
const mockGetMovimientos = vi.mocked(movimientosApi.getMovimientos);
const mockGetNotificaciones = vi.mocked(notificacionesApi.getNotificaciones);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inventarioOk(total = 42, numCriticos = 0) {
  const data = Array.from({ length: numCriticos }, (_, i) => ({
    id: i, name: `Item ${i}`, code: null, category: null,
    stock: 0, min_stock: 5, status: "critical" as const,
  }));
  return Promise.resolve({ data, meta: { current_page: 1, last_page: 1, total } });
}

function resumenOk(entradas = 3, salidas = 1) {
  return Promise.resolve({ entradas_hoy: entradas, salidas_hoy: salidas });
}

function movimientosOk(items: Array<{ id: number; movement_type: string; user?: { display_name: string | null }; created_at: string }> = []) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Promise.resolve({ data: items.map(m => ({ ...m, reason: null, lines: [] })) }) as any;
}

function notificacionesOk(unread = 2) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Promise.resolve({ data: [], unread_count: unread }) as any;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

// Cada test necesita su propio QueryClient para evitar contaminación de caché
function renderConQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetInventario.mockReturnValue(inventarioOk());
  mockGetResumenHoy.mockReturnValue(resumenOk());
  mockGetMovimientos.mockReturnValue(movimientosOk());
  mockGetNotificaciones.mockReturnValue(notificacionesOk());
});

// ─── Tests de ejemplo ────────────────────────────────────────────────────────

describe("PanelPrincipal — estado de carga", () => {
  it("9.5 muestra indicador de carga mientras las peticiones están pendientes", () => {
    mockGetInventario.mockReturnValue(new Promise(() => {}));
    renderConQuery(<PanelPrincipal />);
    expect(screen.getByText(/cargando datos/i)).toBeInTheDocument();
  });

  it("9.5 oculta el indicador de carga cuando todas las peticiones completan", async () => {
    renderConQuery(<PanelPrincipal />);
    await waitFor(() => {
      expect(screen.queryByText(/cargando datos/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe("PanelPrincipal — feed de actividad", () => {
  it("9.6 muestra 'Sin actividad reciente' cuando no hay movimientos", async () => {
    mockGetMovimientos.mockReturnValue(movimientosOk([]));
    renderConQuery(<PanelPrincipal />);
    await waitFor(() => {
      expect(screen.getByText(/sin actividad reciente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("muestra mensaje de error no bloqueante cuando falla el feed", async () => {
    mockGetMovimientos.mockReturnValue(Promise.reject(new Error("red")));
    renderConQuery(<PanelPrincipal />);
    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar la actividad reciente/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

// ─── Tests de propiedad ───────────────────────────────────────────────────────

describe("PanelPrincipal — Propiedad 2: KPIs muestran valores exactos del backend", () => {
  it("entradas_hoy y salidas_hoy se muestran exactamente como string", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 99 }),
        fc.integer({ min: 1, max: 99 }),
        async (entradas, salidas) => {
          vi.clearAllMocks();
          mockGetInventario.mockReturnValue(inventarioOk());
          mockGetResumenHoy.mockReturnValue(resumenOk(entradas, salidas));
          mockGetMovimientos.mockReturnValue(movimientosOk());
          mockGetNotificaciones.mockReturnValue(notificacionesOk(0));

          const { unmount } = renderConQuery(<PanelPrincipal />);
          await waitFor(() => {
            expect(screen.queryByText(/cargando datos/i)).not.toBeInTheDocument();
          }, { timeout: 3000 });

          expect(screen.getAllByText(String(entradas)).length).toBeGreaterThanOrEqual(1);
          expect(screen.getAllByText(String(salidas)).length).toBeGreaterThanOrEqual(1);
          unmount();
        },
      ),
      { numRuns: 10 },
    );
  });
});

describe("PanelPrincipal — Propiedad 3: conteo de stock crítico es correcto", () => {
  it("muestra exactamente el número de artículos con status critical", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 15 }),
        fc.integer({ min: 0, max: 10 }),
        async (criticos, normales) => {
          vi.clearAllMocks();
          const total = criticos + normales;
          const data = [
            ...Array.from({ length: criticos }, (_, i) => ({
              id: i, name: `C${i}`, code: null, category: null,
              stock: 0, min_stock: 5, status: "critical" as const,
            })),
            ...Array.from({ length: normales }, (_, i) => ({
              id: criticos + i, name: `N${i}`, code: null, category: null,
              stock: 10, min_stock: 5, status: "ok" as const,
            })),
          ];
          mockGetInventario.mockReturnValue(
            Promise.resolve({ data, meta: { current_page: 1, last_page: 1, total } })
          );
          mockGetResumenHoy.mockReturnValue(resumenOk(0, 0));
          mockGetMovimientos.mockReturnValue(movimientosOk());
          mockGetNotificaciones.mockReturnValue(notificacionesOk(0));

          const { unmount } = renderConQuery(<PanelPrincipal />);
          await waitFor(() => {
            expect(screen.queryByText(/cargando datos/i)).not.toBeInTheDocument();
          }, { timeout: 3000 });

          // El KPI "Stock crítico" debe mostrar el número exacto de críticos
          const elementos = screen.getAllByText(String(criticos));
          expect(elementos.length).toBeGreaterThanOrEqual(1);
          unmount();
        },
      ),
      { numRuns: 10 },
    );
  });
});

describe("PanelPrincipal — Propiedad 5: resiliencia ante fallos individuales", () => {
  it("fallo de resumen-hoy muestra '—' en esos KPIs pero el resto funciona", async () => {
    mockGetResumenHoy.mockReturnValue(Promise.reject(new Error("timeout")));
    renderConQuery(<PanelPrincipal />);

    await waitFor(() => {
      expect(screen.queryByText(/cargando datos/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // KPI de inventario sigue visible (42 del mock por defecto)
    expect(screen.getByText("42")).toBeInTheDocument();
    // KPIs de entradas/salidas muestran "—"
    const guiones = screen.getAllByText("—");
    expect(guiones.length).toBeGreaterThanOrEqual(2);
  });

  it("fallo de inventario muestra '—' en esos KPIs pero entradas/salidas funcionan", async () => {
    mockGetInventario.mockReturnValue(Promise.reject(new Error("500")));
    renderConQuery(<PanelPrincipal />);

    await waitFor(() => {
      expect(screen.queryByText(/cargando datos/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Entradas y salidas siguen visibles (3 y 1 del mock por defecto)
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("PanelPrincipal — Propiedad 7: feed renderiza datos reales", () => {
  it("9.4 muestra los movimientos recibidos con tipo traducido y responsable", async () => {
    mockGetMovimientos.mockReturnValue(movimientosOk([
      { id: 1, movement_type: "entry", user: { display_name: "Ana" }, created_at: "2026-04-29T10:00:00Z" },
      { id: 2, movement_type: "exit", user: undefined, created_at: "2026-04-29T09:00:00Z" },
    ]));

    renderConQuery(<PanelPrincipal />);

    await waitFor(() => {
      expect(screen.getByText("Entrada")).toBeInTheDocument();
      expect(screen.getByText("Salida")).toBeInTheDocument();
      expect(screen.getByText(/Ana/)).toBeInTheDocument();
      expect(screen.getByText(/Sistema/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
