/**
 * Tipos TypeScript centralizados para el sistema de inventario de Salud Ambiental.
 * Todos los tipos reflejan el esquema de la API en español (snake_case).
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TipoMovimiento = 'entrada' | 'salida' | 'traslado' | 'ajuste'
export type TipoAlerta = 'stock_bajo' | 'caducidad' | 'mantenimiento' | 'inactividad'
export type Severidad = 'baja' | 'media' | 'alta' | 'critica'
export type EstadoAlerta = 'abierta' | 'confirmada' | 'resuelta' | 'ignorada'
export type EstadoActivo = 'operativo' | 'mantenimiento_pendiente' | 'en_mantenimiento' | 'fuera_servicio' | 'retirado'
export type Rol = 'administrador' | 'profesor' | 'consultor'
export type TipoUbicacion = 'armario' | 'nevera' | 'estanteria' | 'cajon' | 'vitrina' | 'otro'

// ─── Paginación ───────────────────────────────────────────────────────────────

export type Meta = {
  current_page: number
  last_page: number
  total: number
}

export type Paginado<T> = {
  data: T[]
  meta: Meta
}

// ─── Recursos de la API ───────────────────────────────────────────────────────

export interface Articulo {
  id: number
  codigo: string | null
  nombre: string
  descripcion: string | null
  categoria_id: number
  categoria: string | null
  unidad: string | null
  notas: string | null
  activo: boolean
  stock_total: number
  estado_stock: 'critico' | 'ok'
  created_at: string
  updated_at: string
  // Campos opcionales que pueden existir en BD
  numero_serie?: string | null
  tipo_material?: string | null
  capacidad_ml?: number | null
  fecha_caducidad?: string | null
}

export interface NivelStock {
  id: number
  articulo_id: number
  ubicacion_id: number
  ubicacion: string | null
  cantidad: number
  cantidad_minima: number
}

export interface ArticuloDetalle extends Articulo {
  niveles_stock: NivelStock[]
}

export interface Ubicacion {
  id: number
  nombre: string
  descripcion: string | null
  tipo: TipoUbicacion
}

export interface Categoria {
  id: number
  nombre: string
  total_articulos: number
}

export interface LineaMovimiento {
  id: number
  articulo_id: number
  articulo: string | null
  cantidad: number
}

export interface Movimiento {
  id: number
  tipo: TipoMovimiento
  motivo: string | null
  ubicacion_origen_id: number | null
  ubicacion_destino_id: number | null
  usuario_id: number
  usuario: { id: number; nombre_visible: string | null } | null
  lineas: LineaMovimiento[]
  created_at: string
}

export interface Alerta {
  id: number
  tipo: TipoAlerta
  severidad: Severidad
  estado: EstadoAlerta
  articulo_id: number | null
  articulo: { id: number; nombre: string; categoria?: { id: number; nombre: string } | null } | null
  datos_json: Record<string, unknown> | null
  generada_en: string
  confirmada_por_id: number | null
  confirmada_en: string | null
  resuelta_por_id: number | null
  resuelta_en: string | null
  notas_resolucion: string | null
}

export interface RegistroAuditoria {
  id: number
  usuario_id: number | null
  usuario: { id: number; nombre_visible: string | null } | null
  tipo_evento: string
  entidad_tipo: string
  entidad_id: number | null
  antes_json: Record<string, unknown> | null
  despues_json: Record<string, unknown> | null
  created_at: string
}

export interface UsuarioApp {
  id: number
  auth_user_id: string
  nombre_visible: string | null
  activo: boolean
  roles: Array<{ id: number; name: string }>
  created_at: string
  updated_at: string
  // avatar_url viene de Insforge Auth (no se guarda en nuestra BD)
  avatar_url?: string | null
}

export interface ActivoMantenimiento {
  id: number
  articulo_id: number | null
  articulo: { id: number; nombre: string } | null
  codigo_activo: string
  numero_serie: string | null
  estado: EstadoActivo
  ubicacion_actual_id: number | null
  ubicacion_actual: { id: number; nombre: string } | null
  notas: string | null
  created_at: string
  updated_at: string
}

// ─── Filtros para queries ─────────────────────────────────────────────────────

export type OrdenarArticuloPor = 'nombre' | 'codigo' | 'stock_total' | 'categoria' | 'created_at'
export type DireccionOrden = 'asc' | 'desc'

export interface FiltrosArticulos {
  search?: string
  pagina?: number
  per_page?: number
  activo?: boolean
  categoria_id?: number
  ubicacion_id?: number
  estado_stock?: 'critico' | 'ok'
  order_by?: OrdenarArticuloPor
  order_dir?: DireccionOrden
}

export interface FiltrosMovimiento {
  tipo?: TipoMovimiento
  usuario_id?: number
  desde?: string
  hasta?: string
  per_page?: number
}

export interface FiltrosAlerta {
  tipo?: TipoAlerta
  severidad?: Severidad
  estado?: EstadoAlerta
}

export interface FiltrosAuditoria {
  entidad_tipo?: string
  tipo_evento?: string
  desde?: string
  hasta?: string
  pagina?: number
}
