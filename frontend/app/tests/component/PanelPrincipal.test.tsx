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
import { MemoryRouter } from "react-router-dom";
import React from "react";

// Mocks de servicios — rutas relativas para que Vitest las resuelva correctamente
vi.mock("../../src/services/inventarioApi", () => ({
  getArticulos: vi.fn(),
}));
vi.mock("../../src/services/movimientosApi", () => ({ getMovimientos: vi.fn() }));
vi.mock("../../src/services/categoriasApi", () => ({ getCategorias: vi.fn() }));
vi.mock("../../src/services/ubicacionesApi", () => ({ getUbicaciones: vi.fn() }));
vi.mock("../../src/services/notificacionesApi", () => ({}));
vi.mock("../../src/context/ContextoAutenticacion", () => ({
  useAuth: () => ({
    user: { authUserId: "test-user-id", displayName: "Tester", role: "profesor" },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Imports después de los mocks
import PanelPrincipal from "../../src/pages/PanelPrincipal";
import * as inventarioApi from "../../src/services/inventarioApi";
import * as movimientosApi from "../../src/services/movimientosApi";
import * as categoriasApi from "../../src/services/categoriasApi";
import * as ubicacionesApi from "../../src/services/ubicacionesApi";
import type { Movimiento, TipoMovimiento } from "../../src/types";
const mockGetArticulos = vi.mocked(inventarioApi.getArticulos);
const mockGetMovimientos = vi.mocked(movimientosApi.getMovimientos);
const mockGetCategorias = vi.mocked(categoriasApi.getCategorias);
const mockGetUbicaciones = vi.mocked(ubicacionesApi.getUbicaciones);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function articuloBase(id: number, esCritico: boolean) {
  return {
    id,
    nombre: `Artículo ${id}`,
    codigo: null,
    descripcion: null,
    categoria_id: 1,
    categoria: null,
    unidad: null,
    notas: null,
    activo: true,
    stock_total: esCritico ? 0 : 10,
    stock_minimo: 5,
    estado_stock: (esCritico ? 'critico' : 'ok') as 'critico' | 'ok',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };
}

function inventarioOk(total = 42, numCriticos = 0) {
  const data = Array.from({ length: numCriticos }, (_, i) => articuloBase(i, true));
  return Promise.resolve({ data, meta: { current_page: 1, last_page: 1, total } });
}

function movimientosOk(items: Array<{ id: number; tipo: TipoMovimiento; created_at: string }> = []) {
  const data: Movimiento[] = items.map((movimiento) => ({
    ...movimiento,
    motivo: null,
    usuario: null,
    ubicacion_origen_id: null,
    ubicacion_destino_id: null,
    usuario_id: 1,
    lineas: [],
  }))

  return Promise.resolve({
    data,
    meta: {
      current_page: 1,
      last_page: 1,
      total: data.length,
    },
  });
}

function categoriasOk() {
  return Promise.resolve({ data: [] });
}

function ubicacionesOk() {
  return Promise.resolve({ data: [] });
}

// ─── Setup ───────────────────────────────────────────────────────────────────

// Cada test necesita su propio QueryClient para evitar contaminación de caché
function renderConQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetArticulos.mockReturnValue(inventarioOk());
  mockGetMovimientos.mockReturnValue(movimientosOk());
  mockGetCategorias.mockReturnValue(categoriasOk());
  mockGetUbicaciones.mockReturnValue(ubicacionesOk());
});

describe("PanelPrincipal — Propiedad 7: feed renderiza datos reales", () => {
  it("9.4 muestra los movimientos recibidos con tipo traducido", async () => {
    mockGetMovimientos.mockReturnValue(movimientosOk([
      { id: 1, tipo: "entrada", created_at: new Date().toISOString() },
      { id: 2, tipo: "salida", created_at: new Date().toISOString() },
    ]));

    renderConQuery(<PanelPrincipal />);

    await waitFor(() => {
      expect(screen.getByText("Entrada de stock")).toBeInTheDocument();
      expect(screen.getByText("Salida de stock")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
