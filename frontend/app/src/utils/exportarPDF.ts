import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
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

export function generarPDFInventario(articulos: Articulo[]) {
  const doc = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.width
  const margin = 12

  const colorHeader = [15, 23, 42] as [number, number, number]
  const colorSubHeader = [71, 85, 105] as [number, number, number]
  const colorCritical = [220, 38, 38] as [number, number, number]
  const colorOk = [22, 163, 74] as [number, number, number]

  doc.setFillColor(...colorHeader)
  doc.rect(0, 0, pageWidth, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Inventario - Salud Ambiental', margin, 18)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const fechaStr = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm")
  doc.text(`Exportado: ${fechaStr}  |  Total: ${articulos.length} artículos`, margin, 24)

  const columnas = [
    'Categoría',
    'Código',
    'Nombre',
    'Material',
    'Stock',
    'Mín',
    'Estado',
    'Caducidad',
    'N.º Serie',
    'Proveedor',
    'Notas',
  ]

  const filas = articulos.map((art) => [
    art.categoria ?? '-',
    art.codigo ?? '-',
    art.nombre,
    art.tipo_material ? (ETIQUETAS_MATERIAL[art.tipo_material] ?? art.tipo_material) : '-',
    `${art.stock_total ?? 0}`,
    `${art.stock_minimo ?? 0}`,
    art.estado_stock === 'critico' ? 'Crítico' : 'OK',
    art.fecha_caducidad ?? '-',
    art.numero_serie ?? '-',
    art.proveedor ?? '-',
    art.notas ?? '-',
  ])

  autoTable(doc, {
    startY: 34,
    head: [columnas],
    body: filas,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      font: 'helvetica',
      textColor: [50, 50, 50],
      lineColor: [210, 210, 210],
      lineWidth: 0.1,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: colorSubHeader,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 20 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 18 },
      4: { cellWidth: 16, halign: 'right' },
      5: { cellWidth: 14, halign: 'right' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 24 },
      9: { cellWidth: 24 },
      10: { cellWidth: 35 },
    },
    didParseCell(data) {
      if (data.section === 'body') {
        if (data.column.index === 6) {
          if (data.cell.raw === 'Crítico') {
            data.cell.styles.textColor = colorCritical
            data.cell.styles.fontStyle = 'bold'
          } else {
            data.cell.styles.textColor = colorOk
          }
        }
      }
    },
    didDrawPage() {
      const str = `Página ${doc.internal.pages.length - 1}`
      doc.setFontSize(7)
      doc.setTextColor(160)
      doc.text(str, margin, doc.internal.pageSize.height - 8)
      doc.text(`Generado el ${fechaStr}`, pageWidth - margin, doc.internal.pageSize.height - 8, { align: 'right' })
    },
    margin: { top: 34, bottom: 16, left: margin, right: margin },
  })

  const nombreArchivo = `Inventario_Salud_Ambiental_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`
  doc.save(nombreArchivo)
}
