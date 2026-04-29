import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatearKpi } from "../../src/utils/panelUtils";

// Feature: panel-principal-datos-reales
// Propiedad 2: Los KPIs muestran exactamente los valores recibidos del backend
// Valida: Requisitos 2.1, 4.1, 4.5

describe("formatearKpi", () => {
  it("null devuelve '...' (estado de carga)", () => {
    expect(formatearKpi(null)).toBe("...");
  });

  it("-1 devuelve '—' (estado de error)", () => {
    expect(formatearKpi(-1)).toBe("—");
  });

  it("0 devuelve '0'", () => {
    expect(formatearKpi(0)).toBe("0");
  });

  it("Propiedad 2: cualquier entero >= 0 devuelve su representación como string", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        (valor) => {
          expect(formatearKpi(valor)).toBe(String(valor));
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Propiedad 2: null siempre devuelve '...'", () => {
    // null es un único valor, verificamos que la función es pura
    for (let i = 0; i < 100; i++) {
      expect(formatearKpi(null)).toBe("...");
    }
  });

  it("Propiedad 2: -1 siempre devuelve '—'", () => {
    for (let i = 0; i < 100; i++) {
      expect(formatearKpi(-1)).toBe("—");
    }
  });
});
