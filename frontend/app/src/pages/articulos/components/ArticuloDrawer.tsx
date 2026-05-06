import { Package, Pencil, Trash2, ArrowRightLeft, History, MapPin, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Articulo, Movimiento, NivelStock } from '@/types'

interface ArticuloDrawerProps {
  articulo: Articulo | null
  movimientos: Movimiento[]
  nivelesStock: NivelStock[]
  open: boolean
  onClose: () => void
  onEditar: () => void
  onDesactivar: () => void
  onMovimiento: (tipo: 'entrada' | 'salida') => void
}

function iconoMovimiento(tipo: string) {
  switch (tipo) {
    case 'entrada': return <TrendingUp className="size-4 text-green-600" />
    case 'salida': return <TrendingDown className="size-4 text-amber-600" />
    case 'traslado': return <ArrowRightLeft className="size-4 text-blue-600" />
    case 'ajuste': return <Activity className="size-4 text-purple-600" />
    default: return <ArrowRightLeft className="size-4" />
  }
}

export function ArticuloDrawer({
  articulo,
  movimientos,
  nivelesStock,
  open,
  onClose,
  onEditar,
  onDesactivar,
  onMovimiento,
}: ArticuloDrawerProps) {
  if (!articulo) return null
  
  const esCritico = articulo.estado_stock === 'critico' && articulo.activo
  const esInactivo = !articulo.activo
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex size-12 items-center justify-center rounded-xl shrink-0",
              esCritico ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
            )}>
              <Package className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-tight">
                {articulo.nombre}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {articulo.codigo && (
                  <span className="font-mono text-xs">{articulo.codigo}</span>
                )}
              </DialogDescription>
              <div className="flex flex-wrap gap-2 mt-2">
                {articulo.categoria && (
                  <Badge variant="secondary">{articulo.categoria}</Badge>
                )}
                {esCritico && (
                  <Badge variant="destructive">Stock crítico</Badge>
                )}
                {esInactivo && (
                  <Badge variant="outline">Inactivo</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
            {/* Stock section */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Package className="size-4" />
                Stock
              </h3>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total disponible</span>
                  <span className={cn(
                    "text-3xl font-bold font-mono",
                    esCritico ? "text-destructive" : "text-foreground"
                  )}>
                    {articulo.stock_total}
                  </span>
                </div>
                
                {articulo.unidad && (
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {articulo.unidad}
                  </p>
                )}
              </div>
              
              {/* Stock por ubicación */}
              {nivelesStock.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    Por ubicación
                  </p>
                  {nivelesStock.map((nivel) => (
                    <div 
                      key={nivel.id} 
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="size-3.5 text-muted-foreground" />
                        <span className="text-sm">{nivel.ubicacion ?? `Ubicación #${nivel.ubicacion_id}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-mono",
                          nivel.cantidad <= nivel.cantidad_minima ? "text-destructive" : "text-foreground"
                        )}>
                          {nivel.cantidad}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          min: {nivel.cantidad_minima}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Acciones rápidas */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Acciones rápidas</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => onMovimiento('entrada')}
                  disabled={esInactivo}
                  className="gap-2"
                >
                  <TrendingUp className="size-4" />
                  Registrar entrada
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onMovimiento('salida')}
                  disabled={esInactivo || articulo.stock_total === 0}
                  className="gap-2"
                >
                  <TrendingDown className="size-4" />
                  Registrar salida
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Información general */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Información</h3>
              <dl className="space-y-2 text-sm">
                {articulo.descripcion && (
                  <div>
                    <dt className="text-muted-foreground">Descripción</dt>
                    <dd className="mt-0.5">{articulo.descripcion}</dd>
                  </div>
                )}
                {articulo.notas && (
                  <div>
                    <dt className="text-muted-foreground">Notas</dt>
                    <dd className="mt-0.5 text-muted-foreground">{articulo.notas}</dd>
                  </div>
                )}
                <div className="pt-2">
                  <dt className="text-muted-foreground">Registrado</dt>
                  <dd className="mt-0.5 text-xs">{new Date(articulo.created_at).toLocaleDateString('es-ES')}</dd>
                </div>
              </dl>
            </div>
            
            {/* Historial de movimientos */}
            {movimientos.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <History className="size-4" />
                    Últimos movimientos
                  </h3>
                  <div className="space-y-2">
                    {movimientos.slice(0, 5).map((mov) => (
                      <div 
                        key={mov.id} 
                        className="flex items-center gap-3 p-2 bg-muted/50 rounded-md text-sm"
                      >
                        {iconoMovimiento(mov.tipo)}
                        <div className="flex-1">
                          <p className="capitalize">{mov.tipo}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(mov.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <span className="font-mono">
                          {mov.lineas?.[0]?.cantidad ?? 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Gestión */}
            <Separator />
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Gestión</h3>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={onEditar}>
                  <Pencil className="size-4" />
                  Editar
                </Button>
                {!esInactivo && (
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2 text-destructive hover:text-destructive"
                    onClick={onDesactivar}
                  >
                    <Trash2 className="size-4" />
                    Desactivar
                  </Button>
                )}
              </div>
            </div>
          </div>
      </DialogContent>
    </Dialog>
  )
}
