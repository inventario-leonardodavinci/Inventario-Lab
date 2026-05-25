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
import { useExportarArticulos } from '@/hooks/queries'
import { descargarBlob } from '@/utils/descargas'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { getArticulos } from '@/services/inventarioApi'
import { useAuth } from '@/context/ContextoAutenticacion'
import { generarPDFInventario } from '@/utils/exportarPDF'
import { useState } from 'react'

export function BotonExportar() {
  const exportarCsv = useExportarArticulos()
  const { user } = useAuth()
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const handleExportarCSV = async () => {
    const toastId = toast.loading('Generando CSV...')
    try {
      const blob = await exportarCsv.mutateAsync()
      const nombreArchivo = `inventario_${format(new Date(), 'yyyy-MM-dd')}.csv`
      descargarBlob(blob, nombreArchivo)
      toast.success(`Exportado como ${nombreArchivo}`, { id: toastId })
    } catch {
      toast.error('No se pudo exportar el CSV. Inténtalo de nuevo.', { id: toastId })
    }
  }

  const handleExportarPDF = async () => {
    if (!user) return
    setIsExportingPdf(true)
    const toastId = toast.loading('Generando PDF...')
    try {
      // Obtenemos todos los artículos (sin paginar limitando a un max alto)
      const res = await getArticulos(user.authUserId, { per_page: 10000 })
      const articulos = res.data ?? []
      generarPDFInventario(articulos)
      toast.success('PDF generado correctamente', { id: toastId })
    } catch {
      toast.error('Error al generar el PDF.', { id: toastId })
    } finally {
      setIsExportingPdf(false)
    }
  }

  const isPending = exportarCsv.isPending || isExportingPdf

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
