import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import type { Articulo } from '@/types'

export function generarExcelInventario(articulos: Articulo[]) {
  // Map articles to a flat structure suitable for Excel
  const data = articulos.map((a) => ({
    'Categoría': a.categoria ?? 'Sin categoría',
    'Código': a.codigo ?? '',
    'Nombre': a.nombre,
    'Descripción': a.descripcion ?? '',
    'Unidad': a.unidad ?? '',
    'Stock Total': a.stock_total ?? 0,
    'Stock Mínimo': a.stock_minimo ?? 0,
    'Estado': a.estado_stock === 'critico' ? 'Crítico' : 'OK',
    'Nº Serie': a.numero_serie ?? '',
    'Material': a.tipo_material ?? '',
    'Capacidad (ml)': a.capacidad_ml ?? '',
    'Fecha Caducidad': a.fecha_caducidad ?? '',
    'Fecha Adquisición': a.fecha_adquisicion ?? '',
    'Precio': a.precio_compra ?? '',
    'Proveedor': a.proveedor ?? '',
    'Factura': a.numero_factura ?? '',
    'Notas': a.notas ?? ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Customise column widths
  const wscols = [
    { wch: 20 }, // Categoría
    { wch: 15 }, // Código
    { wch: 30 }, // Nombre
    { wch: 40 }, // Descripción
    { wch: 10 }, // Unidad
    { wch: 12 }, // Stock Total
    { wch: 12 }, // Stock Mínimo
    { wch: 10 }, // Estado
    { wch: 15 }, // Nº Serie
    { wch: 15 }, // Material
    { wch: 15 }, // Capacidad
    { wch: 15 }, // Caducidad
    { wch: 15 }, // Adquisición
    { wch: 10 }, // Precio
    { wch: 20 }, // Proveedor
    { wch: 15 }, // Factura
    { wch: 30 }  // Notas
  ]
  worksheet['!cols'] = wscols

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')

  const nombreArchivo = `Inventario_Salud_Ambiental_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`
  XLSX.writeFile(workbook, nombreArchivo)
}
