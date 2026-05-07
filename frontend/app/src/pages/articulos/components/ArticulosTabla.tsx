import { Plus, Minus, ArrowRightLeft, Pencil, Eye, TrendingDown, CheckCircle2, XCircle, FlaskConical, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Articulo } from '@/types'

function diasParaCaducar(fecha: string): number {
  return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000)
}

interface ArticulosTablaProps {
  articulos: Articulo[]
  onEntrada: (articulo: Articulo) => void
  onSalida: (articulo: Articulo) => void
  onTraslado: (articulo: Articulo) => void
  onVerDetalle: (articulo: Articulo) => void
  onEditar?: (articulo: Articulo) => void
}

export function ArticulosTabla({
  articulos,
  onEntrada,
  onSalida,
  onTraslado,
  onVerDetalle,
  onEditar,
}: ArticulosTablaProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[260px] pl-4">Artículo</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Material / Cap.</TableHead>
            <TableHead>Caducidad</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right pr-4">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articulos.map((articulo) => {
            const esInactivo = !articulo.activo
            const esCritico = articulo.estado_stock === 'critico'

            return (
              <TableRow
                key={articulo.id}
                className={cn(
                  "stagger-row cursor-pointer",
                  esInactivo && "opacity-50",
                  esCritico && !esInactivo && "bg-destructive/5 hover:bg-destructive/10 border-l-2 border-l-destructive"
                )}
                onClick={() => onVerDetalle(articulo)}
              >
                {/* Nombre + nº serie */}
                <TableCell className="pl-4 py-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-medium text-sm truncate max-w-[260px]">
                      {articulo.nombre}
                    </span>
                    {articulo.numero_serie && (
                      <span className="text-xs text-muted-foreground font-mono">
                        S/N {articulo.numero_serie}
                      </span>
                    )}
                    {articulo.descripcion && (
                      <span className="text-xs text-muted-foreground truncate max-w-[260px]">
                        {articulo.descripcion}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Categoría */}
                <TableCell className="py-3">
                  {articulo.categoria ? (
                    <Badge variant="outline" className="text-xs font-normal">
                      {articulo.categoria}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>

                {/* Código */}
                <TableCell>
                  {articulo.codigo ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {articulo.codigo}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>

                {/* Material + capacidad */}
                <TableCell>
                  {(articulo.tipo_material || articulo.capacidad_ml != null) ? (
                    <div className="flex items-center gap-1">
                      <FlaskConical className="size-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {[articulo.tipo_material, articulo.capacidad_ml != null && `${articulo.capacidad_ml} mL`]
                          .filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>

                {/* Caducidad */}
                <TableCell>
                  {articulo.fecha_caducidad ? (() => {
                    const dias = diasParaCaducar(articulo.fecha_caducidad!)
                    const urgente = dias <= 30
                    return (
                      <div className={cn(
                        "flex items-center gap-1 text-xs",
                        dias < 0 ? "text-destructive font-medium"
                          : urgente ? "text-amber-600 dark:text-amber-400 font-medium"
                          : "text-muted-foreground"
                      )}>
                        {urgente && <AlertTriangle className="size-3 shrink-0" />}
                        {dias < 0
                          ? `Caducado hace ${Math.abs(dias)}d`
                          : dias === 0 ? 'Caduca hoy'
                          : urgente ? `${dias}d`
                          : new Date(articulo.fecha_caducidad!).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                    )
                  })() : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>

                {/* Stock */}
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      esCritico && "text-destructive"
                    )}
                  >
                    {articulo.stock_total}
                  </span>
                </TableCell>

                {/* Unidad */}
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {articulo.unidad ?? '—'}
                  </span>
                </TableCell>

                {/* Estado */}
                <TableCell>
                  {esInactivo ? (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <XCircle className="size-3.5 shrink-0" />
                      <span className="text-xs">Inactivo</span>
                    </div>
                  ) : esCritico ? (
                    <div className="flex items-center gap-1.5 text-destructive">
                      <TrendingDown className="size-3.5 shrink-0" />
                      <span className="text-xs font-medium">Stock crítico</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="size-3.5 shrink-0" />
                      <span className="text-xs">OK</span>
                    </div>
                  )}
                </TableCell>

                {/* Acciones */}
                <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      title="Entrada"
                      disabled={esInactivo}
                      onClick={() => onEntrada(articulo)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                      title="Salida"
                      disabled={esInactivo || articulo.stock_total === 0}
                      onClick={() => onSalida(articulo)}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                      title="Traslado"
                      disabled={esInactivo || articulo.stock_total === 0}
                      onClick={() => onTraslado(articulo)}
                    >
                      <ArrowRightLeft className="size-3.5" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-0.5" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground"
                      title="Ver detalle"
                      onClick={() => onVerDetalle(articulo)}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    {onEditar && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        title="Editar"
                        onClick={() => onEditar(articulo)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
