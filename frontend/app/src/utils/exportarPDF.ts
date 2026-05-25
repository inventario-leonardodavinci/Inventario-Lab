import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { Articulo } from '@/types'

export function generarPDFInventario(articulos: Articulo[]) {
  // Crear documento PDF en formato apaisado (landscape) para que quepan las columnas
  const doc = new jsPDF('landscape')

  // Título
  doc.setFontSize(16)
  doc.text('Inventario - Salud Ambiental', 14, 15)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Fecha de exportación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22)
  doc.text(`Total de artículos: ${articulos.length}`, 14, 27)

  // Preparar datos para la tabla
  const columnas = [
    'Categoría',
    'Código',
    'Nombre',
    'Stock',
    'Mínimo',
    'Estado',
    'Ubicaciones'
  ]

  const filas = articulos.map((art) => [
    art.categoria ?? 'Sin categoría',
    art.codigo ?? '-',
    art.nombre,
    `${art.stock_total ?? 0} ${art.unidad ?? ''}`,
    `${art.stock_minimo ?? 0} ${art.unidad ?? ''}`,
    art.estado_stock === 'critico' ? 'Crítico' : 'OK',
    // Si tuviéramos las ubicaciones en el resumen, las pondríamos. Por ahora un texto fijo o guión
    '-'
  ])

  // Generar tabla
  autoTable(doc, {
    startY: 35,
    head: [columnas],
    body: filas,
    theme: 'striped',
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Categoría
      1: { cellWidth: 25 }, // Código
      2: { cellWidth: 'auto' }, // Nombre
      3: { cellWidth: 20 }, // Stock
      4: { cellWidth: 20 }, // Mínimo
      5: { cellWidth: 20 }, // Estado
      6: { cellWidth: 25 }, // Ubicaciones
    },
    didDrawPage: (data) => {
      // Pie de página
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

  // Descargar archivo
  const nombreArchivo = `inventario_${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(nombreArchivo)
}
