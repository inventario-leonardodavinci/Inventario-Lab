/**
 * Re-exporta las funciones de inventarioApi.ts con los nombres canónicos.
 * Este archivo es el punto de entrada preferido para operaciones de artículos.
 */
export {
  getArticulos,
  getArticulo,
  crearArticulo,
  actualizarArticulo,
  desactivarArticulo,
  type EntradaCrearArticulo,
  type EntradaActualizarArticulo,
} from './inventarioApi'
