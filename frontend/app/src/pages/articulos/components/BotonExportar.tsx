/**
 * Botón para exportar el inventario completo como CSV agrupado por categoría.
 */
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useExportarArticulos } from '@/hooks/queries'
import { descargarBlob } from '@/utils/descargas'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function BotonExportar() {
  const exportar = useExportarArticulos()

  const handleExportar = async () => {
    const toastId = toast.loading('Generando exportación...')
    try {
      const blob = await exportar.mutateAsync()
      const nombreArchivo = `inventario_${format(new Date(), 'yyyy-MM-dd')}.csv`
      descargarBlob(blob, nombreArchivo)
      toast.success(`Exportado como ${nombreArchivo}`, { id: toastId })
    } catch {
      toast.error('No se pudo exportar el inventario. Inténtalo de nuevo.', { id: toastId })
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportar}
            disabled={exportar.isPending}
            aria-label="Exportar inventario como CSV ordenado por categoría"
          >
            {exportar.isPending ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Download className="size-4 mr-2" />
            )}
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">CSV</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exportar inventario como CSV ordenado por categoría</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
