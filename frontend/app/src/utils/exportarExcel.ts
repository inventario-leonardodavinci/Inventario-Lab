import { format } from 'date-fns'
import * as XLSX from 'xlsx'
import type { Articulo } from '@/types'

const ETIQUETAS_MATERIAL: Record<string, string> = {
  plastico: 'Plástico',
  vidrio: 'Vidrio',
  metal: 'Metal',
  latex: 'Latex',
  papel: 'Papel',
  tela: 'Tela',
  ceramica: 'Cerámica',
  goma: 'Goma',
  silicona: 'Silicona',
  acero: 'Acero',
  cristal: 'Cristal',
  polietileno: 'Polietileno',
  polipropileno: 'Polipropileno',
  pvc: 'PVC',
  teflon: 'Teflón',
  otros: 'Otros',
}

export function generarExcelInventario(articulos: Articulo[]) {
  const data = articulos.map((a) => ({
    'Categoría': a.categoria ?? 'Sin categoría',
    'Código': a.codigo ?? '',
    'Nombre': a.nombre,
    'Descripción': a.descripcion ?? '',
    'Unidad': a.unidad ?? '',
    'Material': a.tipo_material ? (ETIQUETAS_MATERIAL[a.tipo_material] ?? a.tipo_material) : '',
    'Capacidad': a.capacidad_ml ? `${a.capacidad_ml} mL` : '',
    'Stock Total': a.stock_total ?? 0,
    'Stock Mínimo': a.stock_minimo ?? 0,
    'Estado': a.estado_stock === 'critico' ? 'Crítico' : 'OK',
    'Nº Serie': a.numero_serie ?? '',
    'Fecha Caducidad': a.fecha_caducidad ?? '',
    'Fecha Adquisición': a.fecha_adquisicion ?? '',
    'Precio (€)': a.precio_compra ?? '',
    'Proveedor': a.proveedor ?? '',
    'Factura': a.numero_factura ?? '',
    'Notas': a.notas ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)

  const wscols = [
    { wch: 22 },
    { wch: 16 },
    { wch: 32 },
    { wch: 40 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 32 },
  ]
  worksheet['!cols'] = wscols

  const range = XLSX.utils.decode_range(worksheet['!ref'] ?? 'A1:Q1')
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C })
    if (!worksheet[addr]) continue
    worksheet[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, size: 11 },
      fill: { fgColor: { rgb: '475569' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'thin', color: { rgb: '94A3B8' } },
        top: { style: 'thin', color: { rgb: '94A3B8' } },
        left: { style: 'thin', color: { rgb: '94A3B8' } },
        right: { style: 'thin', color: { rgb: '94A3B8' } },
      },
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario')

  const nombreArchivo = `Inventario_Salud_Ambiental_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`
  XLSX.writeFile(workbook, nombreArchivo)
}
