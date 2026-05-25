/**
 * Botón para exportar el inventario completo como CSV agrupado por categoría.
 *
 * Llama al endpoint GET /articulos/exportar del backend, que devuelve
 * un archivo CSV con BOM UTF-8, separador punto y coma, y artículos
 * ordenados alfabéticamente por categoría y nombre.
 *
 * El archivo se descarga automáticamente con el nombre
 * `inventario_YYYY-MM-DD.csv`.
 */
import { Download, Loader2, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { descargarBlob } from '@/utils/descargas'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { getArticulos } from '@/services/inventarioApi'
import { useAuth } from '@/context/ContextoAutenticacion'
import { generarPDFInventario } from '@/utils/exportarPDF'
import { useState } from 'react'
import type { Articulo } from '@/types'

function generarCSVInventario(articulos: Articulo[]) {
  const cabeceras = [
    'Categoría', 'Código', 'Nombre', 'Descripción', 'Unidad', 
    'Stock Total', 'Stock Mínimo', 'Estado Stock', 'Número de Serie', 
    'Tipo de Material', 'Capacidad (ml)', 'Fecha Caducidad', 
    'Fecha Adquisición', 'Precio Compra', 'Proveedor', 
    'Número Factura', 'Notas'
  ]
  const escapeCsv = (str: string | number | null | undefined) => {
    if (str === null || str === undefined) return '""'
    return `"${String(str).replace(/"/g, '""')}"`
  }
  
  const filas = articulos.map(a => [
    a.categoria ?? 'Sin categoría',
    a.codigo ?? '',
    a.nombre,
    a.descripcion ?? '',
    a.unidad ?? '',
    a.stock_total ?? 0,
    a.stock_minimo ?? 0,
    a.estado_stock === 'critico' ? 'Crítico' : 'OK',
    a.serial_number ?? '',
    a.material_type ?? '',
    a.capacity_ml ?? '',
    a.expiration_date ?? '',
    a.fecha_adquisicion ?? '',
    a.precio_compra ?? '',
    a.proveedor ?? '',
    a.numero_factura ?? '',
    a.notas ?? ''
  ])
  
  const contenido = [ cabeceras, ...filas ].map(row => row.map(escapeCsv).join(';')).join('\r\n')
  const bom = "\uFEFF"
  return new Blob([bom + contenido], { type: 'text/csv;charset=utf-8;' })
}

export interface BotonExportarProps {
  filtros?: {
    search?: string
    categoria_id?: number
    ubicacion_id?: number
    estado_stock?: 'critico' | 'ok'
  }
}

export function BotonExportar({ filtros = {} }: BotonExportarProps) {
  const { user } = useAuth()
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const fetchExportData = async () => {
    if (!user) throw new Error('No autenticado')
    const res = await getArticulos(user.authUserId, { per_page: 100000, ...filtros })
    return res.data ?? []
  }

  const handleExportarCSV = async () => {
    setIsExportingCsv(true)
    const toastId = toast.loading('Generando CSV...')
    try {
      const articulos = await fetchExportData()
      const blob = generarCSVInventario(articulos)
      const nombreArchivo = `inventario_${format(new Date(), 'yyyy-MM-dd')}.csv`
      descargarBlob(blob, nombreArchivo)
      toast.success(`Exportado como ${nombreArchivo}`, { id: toastId })
    } catch {
      toast.error('No se pudo exportar el CSV. Inténtalo de nuevo.', { id: toastId })
    } finally {
      setIsExportingCsv(false)
    }
  }

  const handleExportarPDF = async () => {
    setIsExportingPdf(true)
    const toastId = toast.loading('Generando PDF...')
    try {
      const articulos = await fetchExportData()
      generarPDFInventario(articulos)
      toast.success('PDF generado correctamente', { id: toastId })
    } catch {
      toast.error('Error al generar el PDF.', { id: toastId })
    } finally {
      setIsExportingPdf(false)
    }
  }

  const isPending = isExportingCsv || isExportingPdf

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          aria-label="Opciones de exportación"
          aria-busy={isPending}
        >
          {isPending ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Download className="size-4 mr-2" />
          )}
          <span className="hidden sm:inline">Exportar</span>
          <span className="sm:hidden">CSV/PDF</span>
          <ChevronDown className="size-3 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportarPDF}>
          <FileText className="size-4 mr-2 text-red-500" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportarCSV}>
          <FileSpreadsheet className="size-4 mr-2 text-green-600" />
          Exportar como CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
