/**
 * Esquemas Zod para validación de formularios.
 * Fuente única de reglas de validación — compartidos entre formularios y tests.
 */
import { z } from 'zod'

// ─── Movimientos ──────────────────────────────────────────────────────────────

export const esquemaMovimiento = z.object({
  tipo: z.enum(['entrada', 'salida', 'traslado', 'ajuste']),
  articulo_id: z.string().min(1, 'Selecciona un artículo'),
  cantidad: z
    .number({ error: 'Introduce una cantidad válida' })
    .positive('La cantidad debe ser mayor que cero')
    .int('La cantidad debe ser un número entero'),
  motivo: z.string().max(500, 'Máximo 500 caracteres').optional(),
  ubicacion_origen_id: z.string().optional(),
  ubicacion_destino_id: z.string().optional(),
})

export type EntradaMovimientoForm = z.infer<typeof esquemaMovimiento>

// ─── Artículos ────────────────────────────────────────────────────────────────

export const esquemaArticulo = z.object({
  nombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  codigo: z.string().max(50, 'Máximo 50 caracteres').optional(),
  descripcion: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
  categoria_id: z.string().optional(),
  unidad_medida: z.string().max(30, 'Máximo 30 caracteres').optional(),
  stock_minimo: z
    .number({ error: 'Stock mínimo inválido' })
    .min(0, 'No puede ser negativo')
    .optional(),
})

export type EntradaArticuloForm = z.infer<typeof esquemaArticulo>

// ─── Perfil ───────────────────────────────────────────────────────────────────

export const esquemaPerfil = z.object({
  nombre_visible: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
})

export type EntradaPerfilForm = z.infer<typeof esquemaPerfil>
