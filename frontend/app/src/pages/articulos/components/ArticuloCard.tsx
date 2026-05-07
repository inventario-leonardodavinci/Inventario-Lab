import { Plus, Minus, ArrowRightLeft, Pencil, AlertTriangle, FlaskConical, Barcode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Articulo } from '@/types'

const ETIQUETAS_MATERIAL: Record<string, string> = {
  plastico: 'Plástico', vidrio: 'Vidrio', metal: 'Metal', latex: 'Látex',
  nitrilo: 'Nitrilo', vinilo: 'Vinilo', tela: 'Tela / Tejido', papel: 'Papel / Cartón',
  polipropileno: 'PP', polietileno: 'PE',
  acero_inox: 'Acero inox.', aluminio: 'Aluminio', otro: 'Otro',
}

function diasParaCaducar(fecha: string): number {
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000)
}

interface ArticuloCardProps {
  articulo: Articulo
  onEntrada: (articulo: Articulo) => void
  onSalida: (articulo: Articulo) => void
  onTraslado: (articulo: Articulo) => void
  onVerDetalle: (articulo: Articulo) => void
  onEditar?: (articulo: Articulo) => void
}

export function ArticuloCard({ articulo, onEntrada, onSalida, onTraslado, onVerDetalle, onEditar }: ArticuloCardProps) {
  const esInactivo = !articulo.activo
  const esCritico = articulo.estado_stock === 'critico' && articulo.activo
  const diasCad = articulo.fecha_caducidad ? diasParaCaducar(articulo.fecha_caducidad) : null
  const caducidadUrgente = diasCad !== null && diasCad <= 30

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl border bg-card transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 cursor-pointer",
        esInactivo && "opacity-60 border-muted",
        esCritico && "border-destructive/30",
        caducidadUrgente && !esCritico && "border-amber-400/40 dark:border-amber-500/30"
      )}
      onClick={() => onVerDetalle(articulo)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate hover:text-primary transition-colors">
            {articulo.nombre}
          </h3>

          {/* Código + nº serie */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {articulo.codigo && (
              <span className="text-xs text-muted-foreground font-mono">{articulo.codigo}</span>
            )}
            {articulo.numero_serie && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-0.5">
                <Barcode className="size-2.5" />{articulo.numero_serie}
              </span>
            )}
          </div>

          {/* Categoría + unidad */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {articulo.categoria && (
              <span className="text-xs text-muted-foreground">{articulo.categoria}</span>
            )}
            {articulo.unidad && (
              <span className="text-xs text-muted-foreground">· {articulo.unidad}</span>
            )}
          </div>

          {/* Material + capacidad */}
          {(articulo.tipo_material || articulo.capacidad_ml != null) && (
            <div className="flex items-center gap-1 mt-1.5">
              <FlaskConical className="size-3 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                {[
                  articulo.tipo_material && (ETIQUETAS_MATERIAL[articulo.tipo_material] ?? articulo.tipo_material),
                  articulo.capacidad_ml != null && `${articulo.capacidad_ml} ${articulo.unidad ?? 'mL'}`,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {/* Badges estado */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {esInactivo && (
            <Badge variant="outline" className="h-5 text-[10px]">Inactivo</Badge>
          )}
          {esCritico && (
            <Badge variant="destructive" className="h-5 text-[10px]">Crítico</Badge>
          )}
          {caducidadUrgente && (
            <Badge
              variant="outline"
              className={cn(
                "h-5 text-[10px] gap-0.5 border-amber-400 text-amber-700 dark:text-amber-400",
                diasCad! < 0 && "border-destructive text-destructive"
              )}
            >
              <AlertTriangle className="size-2.5" />
              {diasCad! < 0 ? 'Caducado' : `${diasCad}d`}
            </Badge>
          )}
        </div>
      </div>

      {/* Info de stock */}
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-2xl font-semibold tabular-nums",
          esCritico ? "text-destructive" : "text-foreground"
        )}>
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
          {onEditar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => onEditar(articulo)}
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
