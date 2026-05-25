/**
 * Botón para exportar el inventario completo como Excel agrupado por categoría.
 *
 * Llama al endpoint GET /articulos/exportar del backend (o usa frontend) que devuelve
 * un archivo Excel / PDF.
 */
import { Download, Loader2, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { getArticulos } from '@/services/inventarioApi'
import { useAuth } from '@/context/ContextoAutenticacion'
import { generarPDFInventario } from '@/utils/exportarPDF'
import { generarExcelInventario } from '@/utils/exportarExcel'
import { useState } from 'react'

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
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const fetchExportData = async () => {
    if (!user) throw new Error('No autenticado')
    const res = await getArticulos(user.authUserId, { per_page: 100000, ...filtros })
    return res.data ?? []
  }

  const handleExportarExcel = async () => {
    setIsExportingExcel(true)
    const toastId = toast.loading('Generando Excel...')
    try {
      const articulos = await fetchExportData()
      generarExcelInventario(articulos)
      toast.success('Excel generado correctamente', { id: toastId })
    } catch {
      toast.error('No se pudo exportar el Excel. Inténtalo de nuevo.', { id: toastId })
    } finally {
      setIsExportingExcel(false)
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

  const isPending = isExportingExcel || isExportingPdf

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
          <span className="sm:hidden">Exportar</span>
          <ChevronDown className="size-3 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportarPDF}>
          <FileText className="size-4 mr-2 text-red-500" />
          Exportar como PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportarExcel}>
          <FileSpreadsheet className="size-4 mr-2 text-green-600" />
          Exportar como Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
