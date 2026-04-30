import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { traducirTipoMovimiento } from "../../src/utils/panelUtils";

// Feature: panel-principal-datos-reales
// Propiedad 4: Traducción de tipos de movimiento — Requisito 3.2

const TIPOS_CONOCIDOS: Record<string, string> = {
  entry: "Entrada",
  exit: "Salida",
  transfer: "Traslado",
  adjustment: "Ajuste",
};

describe("traducirTipoMovimiento", () => {
  it("traduce correctamente los tipos conocidos", () => {
    for (const [tipo, esperado] of Object.entries(TIPOS_CONOCIDOS)) {
      expect(traducirTipoMovimiento(tipo)).toBe(esperado);
    }
  });

  it("Propiedad 4: para cualquier tipo conocido devuelve el español correspondiente", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(TIPOS_CONOCIDOS)),
        (tipo) => {
          expect(traducirTipoMovimiento(tipo)).toBe(TIPOS_CONOCIDOS[tipo]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("Propiedad 4: para cualquier tipo desconocido devuelve el valor original", () => {
    const tiposConocidos = new Set(Object.keys(TIPOS_CONOCIDOS));

    fc.assert(
      fc.property(
        fc.string().filter((s) => !tiposConocidos.has(s)),
        (tipoDesconocido) => {
          expect(traducirTipoMovimiento(tipoDesconocido)).toBe(tipoDesconocido);
        },
      ),
      { numRuns: 100 },
    );
  });
});
