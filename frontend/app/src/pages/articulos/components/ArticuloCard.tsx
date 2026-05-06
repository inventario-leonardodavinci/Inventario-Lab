import { Plus, Minus, ArrowRightLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Articulo } from '@/types'

interface ArticuloCardProps {
  articulo: Articulo
  onEntrada: (articulo: Articulo) => void
  onSalida: (articulo: Articulo) => void
  onTraslado: (articulo: Articulo) => void
  onVerDetalle: (articulo: Articulo) => void
  onEditar: (articulo: Articulo) => void
}

export function ArticuloCard({ articulo, onEntrada, onSalida, onTraslado, onVerDetalle, onEditar }: ArticuloCardProps) {
  const esInactivo = !articulo.activo

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl border bg-card transition-all duration-200",
        "hover:shadow-md hover:border-primary/20 cursor-pointer",
        esInactivo && "opacity-60 border-muted"
      )}
      onClick={() => onVerDetalle(articulo)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate hover:text-primary transition-colors">
            {articulo.nombre}
          </h3>
          
          {articulo.codigo && (
            <p className="text-xs text-muted-foreground font-mono">
              {articulo.codigo}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-1">
            {articulo.categoria && (
              <span className="text-xs text-muted-foreground">
                {articulo.categoria}
              </span>
            )}
            {articulo.unidad && (
              <span className="text-xs text-muted-foreground">
                · {articulo.unidad}
              </span>
            )}
          </div>
        </div>
        
        {/* Badge de estado */}
        {esInactivo && (
          <Badge variant="outline" className="h-5 text-[10px]">
            Inactivo
          </Badge>
        )}
      </div>
      
      {/* Info de stock */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums">
          {articulo.stock_total}
        </span>
        <span className="text-sm text-muted-foreground">
          {articulo.unidad || 'unidades'}
        </span>
      </div>
      
      {/* Acciones rápidas */}
      <div className="flex flex-col gap-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
        {/* Fila 1: Movimientos */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950 text-green-700 dark:text-green-400"
            onClick={() => onEntrada(articulo)}
            disabled={esInactivo}
          >
            <Plus className="size-3.5" />
            Entrada
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950 text-amber-700 dark:text-amber-400"
            onClick={() => onSalida(articulo)}
            disabled={esInactivo || articulo.stock_total === 0}
          >
            <Minus className="size-3.5" />
            Salida
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-400"
            onClick={() => onTraslado(articulo)}
            disabled={esInactivo || articulo.stock_total === 0}
          >
            <ArrowRightLeft className="size-3.5" />
            Traslado
          </Button>
        </div>

        {/* Fila 2: Ver y Editar */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onVerDetalle(articulo)}
          >
            Ver detalle
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onEditar(articulo)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
