import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { Articulo } from '@/types'

export function generarPDFInventario(articulos: Articulo[]) {
  const doc = new jsPDF('landscape', 'mm', 'a4')

  // Colores corporativos (ajustar según tu frontend, ej. azul oscuro y gris claro)
  const colorPrimario: [number, number, number] = [15, 23, 42] // slate-900
  const colorSecundario: [number, number, number] = [71, 85, 105] // slate-600

  // Header
  doc.setFillColor(...colorPrimario)
  doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Inventario - Salud Ambiental', 14, 20)

  // Subtítulo
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const fechaStr = format(new Date(), 'dd/MM/yyyy HH:mm')
  doc.text(`Fecha de exportación: ${fechaStr}`, 14, 40)
  doc.text(`Total de artículos: ${articulos.length}`, 14, 46)

  // Columnas principales y detalladas
  const columnas = [
    'Categoría',
    'Código',
    'Nombre',
    'Capacidad',
    'Stock',
    'Mínimo',
    'Estado',
    'Caducidad',
    'Notas'
  ]

  const filas = articulos.map((art) => [
    art.categoria ?? '-',
    art.codigo ?? '-',
    art.nombre,
    art.capacidad_ml ? `${art.capacidad_ml} ml` : '-',
    `${art.stock_total ?? 0} ${art.unidad ?? ''}`,
    `${art.stock_minimo ?? 0} ${art.unidad ?? ''}`,
    art.estado_stock === 'critico' ? 'Crítico' : 'OK',
    art.fecha_caducidad ?? '-',
    art.notas ? (art.notas.length > 20 ? art.notas.substring(0, 20) + '...' : art.notas) : '-'
  ])

  autoTable(doc, {
    startY: 55,
    head: [columnas],
    body: filas,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
      textColor: [50, 50, 50],
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: colorSecundario,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Categoría
      1: { cellWidth: 25 }, // Código
      2: { cellWidth: 'auto' }, // Nombre
      3: { cellWidth: 20, halign: 'center' }, // Capacidad
      4: { cellWidth: 20, halign: 'right' }, // Stock
      5: { cellWidth: 20, halign: 'right' }, // Mínimo
      6: { cellWidth: 20, halign: 'center' }, // Estado
      7: { cellWidth: 25, halign: 'center' }, // Caducidad
      8: { cellWidth: 35 }, // Notas
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 6) { // Columna Estado
        if (data.cell.raw === 'Crítico') {
          data.cell.styles.textColor = [220, 38, 38] // red-600
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [22, 163, 74] // green-600
        }
      }
    },
    didDrawPage: (data) => {
      // Footer
      const str = `Página ${doc.internal.pages.length - 1}`
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        str,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      )
    },
  })

  const nombreArchivo = `Inventario_Salud_Ambiental_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`
  doc.save(nombreArchivo)
}
