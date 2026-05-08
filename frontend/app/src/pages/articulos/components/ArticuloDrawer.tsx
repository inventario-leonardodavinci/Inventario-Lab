import {
  Package, Pencil, Trash2, ArrowRightLeft, History, MapPin,
  TrendingUp, TrendingDown, Activity, Layers, FlaskConical,
  FileText, Hash, Barcode, CalendarClock, RefreshCw, AlertTriangle,
  ShoppingCart,
} from 'lucide-react'
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
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/animations'
import type { Articulo, Movimiento, NivelStock } from '@/types'

interface ArticuloDrawerProps {
  articulo: Articulo | null
  movimientos: Movimiento[]
  nivelesStock: NivelStock[]
  isLoadingStock?: boolean
  open: boolean
  onClose: () => void
  onEditar?: () => void
  onDesactivar?: () => void
  onMovimiento?: (tipo: 'entrada' | 'salida') => void
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5" />
      <span>{label}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}

function iconoMovimiento(tipo: string) {
  switch (tipo) {
    case 'entrada': return <TrendingUp className="size-3.5 text-green-600 dark:text-green-400 shrink-0" />
    case 'salida': return <TrendingDown className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
    case 'traslado': return <ArrowRightLeft className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
    case 'ajuste': return <Activity className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
    default: return <ArrowRightLeft className="size-3.5 shrink-0" />
  }
}

function etiquetaMovimiento(tipo: string) {
  const mapa: Record<string, string> = {
    entrada: 'Entrada', salida: 'Salida', traslado: 'Traslado', ajuste: 'Ajuste',
  }
  return mapa[tipo] ?? tipo
}

const ETIQUETAS_MATERIAL: Record<string, string> = {
  plastico: 'Plástico', vidrio: 'Vidrio', metal: 'Metal', latex: 'Látex',
  nitrilo: 'Nitrilo', vinilo: 'Vinilo', tela: 'Tela / Tejido', papel: 'Papel / Cartón',
  polipropileno: 'Polipropileno (PP)', polietileno: 'Polietileno (PE)',
  acero_inox: 'Acero inoxidable', aluminio: 'Aluminio', otro: 'Otro',
}

const UNIDAD_CAPACIDAD: Record<string, string> = {
  mL: 'mL', L: 'L', kg: 'kg', g: 'g', mg: 'mg',
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function proximaCaducidad(fecha: string): { texto: string; urgente: boolean } {
  const hoy = new Date()
  const cad = new Date(fecha)
  const dias = Math.ceil((cad.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  if (dias < 0) return { texto: `Caducado hace ${Math.abs(dias)} días`, urgente: true }
  if (dias === 0) return { texto: 'Caduca hoy', urgente: true }
  if (dias <= 30) return { texto: `Caduca en ${dias} días`, urgente: true }
  return { texto: formatFecha(fecha), urgente: false }
}

export function ArticuloDrawer({
  articulo,
  movimientos,
  nivelesStock,
  isLoadingStock = false,
  open,
  onClose,
  onEditar,
  onDesactivar,
  onMovimiento,
}: ArticuloDrawerProps) {
  if (!articulo) return null

  const esCritico = articulo.estado_stock === 'critico' && articulo.activo
  const esInactivo = !articulo.activo
  const caducidad = articulo.fecha_caducidad ? proximaCaducidad(articulo.fecha_caducidad) : null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 flex flex-col">

        {/* ── Cabecera ── */}
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex size-12 items-center justify-center rounded-xl shrink-0",
              esCritico ? "bg-destructive/10 text-destructive"
                : esInactivo ? "bg-muted/50 text-muted-foreground/50"
                : "bg-primary/10 text-primary"
            )}>
              <Package className="size-6" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base font-semibold leading-snug">
                {articulo.nombre}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {articulo.codigo && (
                    <span className="font-mono flex items-center gap-1">
                      <Hash className="size-3" />{articulo.codigo}
                    </span>
                  )}
                  {articulo.numero_serie && (
                    <span className="font-mono flex items-center gap-1">
                      <Barcode className="size-3" />{articulo.numero_serie}
                    </span>
                  )}
                </div>
              </DialogDescription>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {articulo.categoria && (
                  <Badge variant="secondary" className="text-xs">{articulo.categoria}</Badge>
                )}
                {articulo.unidad && (
                  <Badge variant="outline" className="text-xs">{articulo.unidad}</Badge>
                )}
                {esCritico && (
                  <Badge variant="destructive" className="text-xs">Stock crítico</Badge>
                )}
                {esInactivo && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Inactivo</Badge>
                )}
                {caducidad?.urgente && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <AlertTriangle className="size-3" />{caducidad.texto}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* ── Cuerpo scrollable ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50"
        >

          {/* ── Stock total + acciones ── */}
          <div className="space-y-3">
            <SectionTitle icon={Package} label="Stock" />

            <div className="rounded-lg border bg-muted/40 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Total disponible</p>
                <p className={cn(
                  "text-4xl font-bold font-mono tabular-nums leading-none",
                  esCritico ? "text-destructive" : "text-foreground"
                )}>
                  {articulo.stock_total}
                  <span className="text-lg font-normal text-muted-foreground ml-1.5">
                    {articulo.unidad ?? 'uds'}
                  </span>
                </p>
              </div>
              {onMovimiento && (
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 h-8 text-xs"
                    disabled={esInactivo}
                    onClick={() => onMovimiento('entrada')}
                  >
                    <TrendingUp className="size-3.5" /> Entrada
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 h-8 text-xs"
                    disabled={esInactivo || articulo.stock_total === 0}
                    onClick={() => onMovimiento('salida')}
                  >
                    <TrendingDown className="size-3.5" /> Salida
                  </Button>
                </div>
              )}
            </div>

            {/* Stock por ubicación */}
            {isLoadingStock && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <MapPin className="size-3" />Por ubicación
                </p>
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                      <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            )}
            {!isLoadingStock && nivelesStock.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <MapPin className="size-3" />Por ubicación
                </p>
                {nivelesStock.map((nivel) => {
                  const pct = nivel.cantidad_minima > 0
                    ? Math.min(100, Math.round((nivel.cantidad / (nivel.cantidad_minima * 2)) * 100))
                    : 100
                  const bajo = nivel.cantidad <= nivel.cantidad_minima

                  return (
                    <div key={nivel.id} className="rounded-md border p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">
                          {nivel.ubicacion ?? `Ubicación #${nivel.ubicacion_id}`}
                        </span>
                        <span className={cn("font-mono font-semibold tabular-nums", bajo && "text-destructive")}>
                          {nivel.cantidad}
                          {articulo.unidad && <span className="text-xs font-normal text-muted-foreground ml-1">{articulo.unidad}</span>}
                        </span>
                      </div>
                      {nivel.cantidad_minima != null && (
                        <>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all", bajo ? "bg-destructive" : "bg-green-500")}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground text-right">
                            Mín. {nivel.cantidad_minima} {articulo.unidad ?? ''}
                          </p>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* ── Identificación ── */}
          <div className="space-y-1">
            <SectionTitle icon={Layers} label="Identificación" />
            <div className="divide-y">
              {articulo.descripcion && (
                <div className="py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Descripción</p>
                  <p className="text-sm">{articulo.descripcion}</p>
                </div>
              )}
              {articulo.codigo && <InfoRow label="Código interno" value={<span className="font-mono">{articulo.codigo}</span>} />}
              {articulo.numero_serie && <InfoRow label="Nº de serie" value={<span className="font-mono">{articulo.numero_serie}</span>} />}
              <InfoRow label="Categoría" value={articulo.categoria ?? '—'} />
              {articulo.unidad && <InfoRow label="Unidad de medida" value={articulo.unidad} />}
            </div>
          </div>

          {/* ── Características físicas (solo si hay alguno) ── */}
          {(articulo.tipo_material || articulo.capacidad_ml != null || articulo.fecha_caducidad) && (
            <>
              <Separator />
              <div className="space-y-1">
                <SectionTitle icon={FlaskConical} label="Características físicas" />
                <div className="divide-y">
                  {articulo.tipo_material && (
                    <InfoRow label="Material" value={ETIQUETAS_MATERIAL[articulo.tipo_material] ?? articulo.tipo_material} />
                  )}
                  {articulo.capacidad_ml != null && (
                    <InfoRow
                      label="Capacidad"
                      value={`${articulo.capacidad_ml} ${articulo.unidad && UNIDAD_CAPACIDAD[articulo.unidad] ? articulo.unidad : 'mL'}`}
                    />
                  )}
                  {articulo.fecha_caducidad && (
                    <InfoRow
                      label="Fecha de caducidad"
                      value={
                        <span className={cn(caducidad?.urgente && "text-destructive font-medium")}>
                          {caducidad?.texto}
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Información de adquisición (solo si hay alguno) ── */}
          {(articulo.fecha_adquisicion || articulo.precio_compra != null || articulo.proveedor || articulo.numero_factura) && (
            <>
              <Separator />
              <div className="space-y-1">
                <SectionTitle icon={ShoppingCart} label="Información de adquisición" />
                <div className="divide-y">
                  {articulo.fecha_adquisicion && (
                    <InfoRow label="Fecha de adquisición" value={formatFecha(articulo.fecha_adquisicion)} />
                  )}
                  {articulo.precio_compra != null && (
                    <InfoRow label="Precio de compra" value={`${articulo.precio_compra.toFixed(2)} €`} />
                  )}
                  {articulo.proveedor && <InfoRow label="Proveedor" value={articulo.proveedor} />}
                  {articulo.numero_factura && (
                    <InfoRow label="Nº de factura" value={<span className="font-mono">{articulo.numero_factura}</span>} />
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Notas ── */}
          {articulo.notas && (
            <>
              <Separator />
              <div className="space-y-2">
                <SectionTitle icon={FileText} label="Notas internas" />
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{articulo.notas}</p>
              </div>
            </>
          )}

          {/* ── Historial de movimientos ── */}
          {movimientos.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <SectionTitle icon={History} label="Últimos movimientos" />
                <div className="space-y-1.5">
                  {movimientos.slice(0, 6).map((mov) => (
                    <div key={mov.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted/50 transition-colors">
                      {iconoMovimiento(mov.tipo)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{etiquetaMovimiento(mov.tipo)}</p>
                        {mov.motivo && (
                          <p className="text-xs text-muted-foreground truncate">{mov.motivo}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(mov.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          {mov.usuario?.nombre_visible && ` · ${mov.usuario.nombre_visible}`}
                        </p>
                      </div>
                      {mov.lineas?.[0] && (
                        <span className="text-sm font-mono font-semibold tabular-nums shrink-0">
                          {mov.tipo === 'salida' ? '−' : '+'}{mov.lineas[0].cantidad}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Auditoría ── */}
          <Separator />
          <div className="space-y-1">
            <SectionTitle icon={CalendarClock} label="Registro" />
            <div className="divide-y">
              <InfoRow label="Creado" value={formatFecha(articulo.created_at)} />
              <InfoRow
                label="Actualizado"
                value={
                  <span className="flex items-center gap-1">
                    <RefreshCw className="size-3 text-muted-foreground" />
                    {formatFecha(articulo.updated_at)}
                  </span>
                }
              />
            </div>
          </div>

          {/* ── Gestión ── */}
          {(onEditar || onDesactivar) && (
            <>
              <Separator />
              <div className="space-y-2 pb-1">
                <div className="flex gap-2">
                  {onEditar && (
                    <Button variant="outline" className="flex-1 gap-2" onClick={onEditar}>
                      <Pencil className="size-3.5" />
                      Editar artículo
                    </Button>
                  )}
                  {onDesactivar && !esInactivo && (
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
                      onClick={onDesactivar}
                    >
                      <Trash2 className="size-3.5" />
                      Desactivar
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
