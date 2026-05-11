/**
 * Tipos para Sub-Ubicaciones (Baldas, Estantes dentro de Ubicaciones)
 */

export interface SubUbicacion {
  id: number
  ubicacion_id: number
  nombre: string
  descripcion: string | null
  orden: number
  activo: boolean
  created_at: string
  updated_at: string
  ubicacion?: {
    id: number
    nombre: string
  }
}

export interface SubUbicacionConArticulos extends SubUbicacion {
  articulos: Array<{
    id: number
    nombre: string
    cantidad: number
  }>
}

export type EntradaCrearSubUbicacion = {
  ubicacion_id: number
  nombre: string
  descripcion?: string
  orden?: number
  activo?: boolean
}

export type EntradaActualizarSubUbicacion = Partial<EntradaCrearSubUbicacion>
