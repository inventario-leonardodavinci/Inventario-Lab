import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { CardPremium, StatCardPremium, EmptyStatePremium } from "@/components/ui/card-premium"
import { StatusBadge, BadgePremium } from "@/components/ui/badge-premium"
import { TablePremium, TableHeaderPremium, TableHeadPremium, TableRowPremium, TableCellPremium, TableBodyPremium, TableLoading } from "@/components/ui/table-premium"
import { PageHeader, PageSection, StatsGrid } from "@/components/ui/page-header"
import { useArticulos, useCategorias, useUbicaciones, useMovimientos } from "@/hooks/queries"
import {
  PackageCheck, TriangleAlert, Plus, MapPin, Layers,
  TrendingDown, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine,
  SlidersHorizontal, BellRing, ChevronRight, Activity
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Articulo } from "@/types"

function formatearFechaRelativa(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Ahora mismo'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

function IconoMovimiento({ tipo }: { tipo: string }) {
  const t = tipo.toLowerCase()
  if (t === 'entrada') return <ArrowDownToLine className="size-3.5 text-green-600 dark:text-green-400" />
  if (t === 'salida') return <ArrowUpFromLine className="size-3.5 text-amber-600 dark:text-amber-400" />
  if (t === 'traslado') return <ArrowRightLeft className="size-3.5 text-blue-600 dark:text-blue-400" />
  if (t === 'ajuste') return <SlidersHorizontal className="size-3.5 text-purple-600 dark:text-purple-400" />
  return <BellRing className="size-3.5 text-muted-foreground" />
}

function colorFondo(tipo: string): string {
  const t = tipo.toLowerCase()
  if (t === 'entrada') return 'bg-green-500/10'
  if (t === 'salida') return 'bg-amber-500/10'
  if (t === 'traslado') return 'bg-blue-500/10'
  if (t === 'ajuste') return 'bg-purple-500/10'
  return 'bg-muted'
}

function pctCritico(criticos: number, total: number) {
  if (total === 0) return 0
  return Math.round((criticos / total) * 100)
}

export default function PanelPrincipal() {
  const navigate = useNavigate()

  const { data: articulosData, isLoading: loadingArt } = useArticulos({ per_page: 500 })
  const { data: artCriticosData, isLoading: loadingCrit } = useArticulos({ per_page: 200, estado_stock: 'critico' })
  const { data: categoriasData, isLoading: loadingCat } = useCategorias()
  const { data: ubicacionesData, isLoading: loadingUbic } = useUbicaciones()
  const { data: movimientosData, isLoading: loadingMov } = useMovimientos({ per_page: 8 })

  const cargando = loadingArt || loadingCrit || loadingCat || loadingUbic

  const articulos = useMemo<Articulo[]>(() => articulosData?.data ?? [], [articulosData])
  const criticos = useMemo<Articulo[]>(() => artCriticosData?.data ?? [], [artCriticosData])
  const categorias = useMemo(() => categoriasData?.data ?? [], [categoriasData])
  const ubicaciones = useMemo(() => ubicacionesData?.data ?? [], [ubicacionesData])
  const movimientos = useMemo(() => movimientosData?.data ?? [], [movimientosData])

  const totalArticulos = articulosData?.meta?.total ?? articulos.length
  const totalCriticos = artCriticosData?.meta?.total ?? criticos.length
  const pctCrit = pctCritico(totalCriticos, totalArticulos)

  // Distribución por categoría calculada desde artículos
  const porCategoria = useMemo(() => {
    const map = new Map<string, { total: number; criticos: number }>()
    for (const cat of categorias) map.set(cat.nombre, { total: 0, criticos: 0 })
    for (const a of articulos) {
      if (!a.categoria) continue
      const entry = map.get(a.categoria) ?? { total: 0, criticos: 0 }
      entry.total++
      map.set(a.categoria, entry)
    }
    for (const a of criticos) {
      if (!a.categoria) continue
      const entry = map.get(a.categoria)
      if (entry) { entry.criticos++; map.set(a.categoria, entry) }
    }
    return Array.from(map.entries())
      .reduce<{ nombre: string; total: number; criticos: number }[]>((acc, [nombre, v]) => {
        if (v.total > 0) acc.push({ nombre, ...v })
        return acc
      }, [])
      .sort((a, b) => b.total - a.total)
  }, [articulos, criticos, categorias])

  const maxCatTotal = Math.max(...porCategoria.map(c => c.total), 1)

  return (
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">

      {/* ── Cabecera Premium ── */}
      <PageHeader
        title="Panel de Control"
        description="Monitoreo central del inventario — Laboratorio de salud ambiental"
        icon={<Activity className="size-5" />}
        iconColor="bg-gradient-to-br from-blue-500 to-cyan-400 text-white"
        secondaryAction={
          <Button variant="outline" size="sm" onClick={() => navigate('/articulos')}>
            Ver inventario
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
        }
        action={
          <Button size="sm" className="gap-1.5 btn-shine" onClick={() => navigate('/articulos')}>
            <Plus className="size-4" />
            Nuevo artículo
          </Button>
        }
      />

      {/* ── KPI cards Premium ── */}
      <StatsGrid>
        <StatCardPremium
          title="Artículos registrados"
          value={cargando ? "—" : totalArticulos}
          description={`${categorias.length} categorías · ${ubicaciones.length} ubicaciones`}
          icon={<PackageCheck className="size-5" />}
          iconColor="bg-gradient-to-br from-blue-500 to-cyan-400 text-white"
          loading={cargando}
          delay={0}
        />

        <StatCardPremium
          title="Stock crítico"
          value={cargando ? "—" : totalCriticos}
          description={`${pctCrit}% del inventario bajo mínimos`}
          icon={<TriangleAlert className="size-5" />}
          iconColor={totalCriticos > 0 && !cargando 
            ? "bg-gradient-to-br from-red-500 to-orange-400 text-white" 
            : "bg-gradient-to-br from-green-500 to-emerald-400 text-white"
          }
          loading={cargando}
          delay={0.05}
          trend={!cargando ? {
            value: pctCrit,
            label: totalCriticos > 0 ? "Requiere atención" : "Todo en orden",
            positive: totalCriticos === 0
          } : undefined}
        />

        <StatCardPremium
          title="Categorías activas"
          value={cargando ? "—" : categorias.length}
          description={porCategoria[0] ? `Mayor: ${porCategoria[0].nombre}` : 'Sin datos'}
          icon={<Layers className="size-5" />}
          iconColor="bg-gradient-to-br from-violet-500 to-purple-400 text-white"
          loading={cargando}
          delay={0.1}
        />

        <StatCardPremium
          title="Ubicaciones"
          value={cargando ? "—" : ubicaciones.length}
          description="Armarios, neveras y zonas de almacenaje"
          icon={<MapPin className="size-5" />}
          iconColor="bg-gradient-to-br from-emerald-500 to-teal-400 text-white"
          loading={cargando}
          delay={0.15}
        />
      </StatsGrid>

      {/* ── Fila 2: distribución por categoría + artículos críticos ── */}
      <PageSection delay={0.2}>
        <div className="grid gap-4 xl:grid-cols-3">
          {/* Distribución por categoría — barras CSS */}
          <CardPremium variant="elevated" delay={0}>
            <div className="p-4 border-b">
              <h3 className="font-semibold text-base">Por categoría</h3>
              <p className="text-sm text-muted-foreground">Artículos totales y críticos por categoría</p>
            </div>
            <div className="p-4 space-y-4">
              {cargando
                ? [1, 2, 3].map(i => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                      <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                    </div>
                  ))
                : porCategoria.map((cat) => (
                    <div key={cat.nombre} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{cat.nombre}</span>
                        <span className="tabular-nums text-muted-foreground shrink-0 ml-2 flex items-center gap-1">
                          {cat.total}
                          {cat.criticos > 0 && (
                            <StatusBadge status="error" size="sm">
                              {cat.criticos}
                            </StatusBadge>
                          )}
                        </span>
                      </div>
                      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary/60 transition-all group-hover:bg-primary/70"
                          style={{ width: `${Math.round((cat.total / maxCatTotal) * 100)}%` }}
                        />
                        {cat.criticos > 0 && (
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-destructive/70 transition-all"
                            style={{ width: `${Math.round((cat.criticos / maxCatTotal) * 100)}%` }}
                          />
                        )}
                      </div>
                    </div>
                  ))
              }
            </div>
          </CardPremium>

          {/* Artículos con stock crítico */}
          <CardPremium variant="elevated" delay={0.05} className="xl:col-span-2 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Stock crítico</h3>
                <p className="text-sm text-muted-foreground">Artículos bajo el mínimo definido</p>
              </div>
              {totalCriticos > 10 && (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/articulos')}>
                  Ver todos <ChevronRight className="size-3.5 ml-0.5" />
                </Button>
              )}
            </div>
            <div className="p-0">
              {cargando ? (
                <TableLoading rows={4} cols={4} showHeader={false} asTable={true} />
              ) : criticos.length === 0 ? (
                <EmptyStatePremium
                  icon={<PackageCheck className="size-6 text-green-600" />}
                  title="Todo el stock está en orden"
                  description="No hay artículos con stock crítico"
                />
              ) : (
                <TablePremium hoverable={false} animate={false}>
                  <TableHeaderPremium>
                    <tr>
                      <TableHeadPremium align="left">Artículo</TableHeadPremium>
                      <TableHeadPremium align="left">Categoría</TableHeadPremium>
                      <TableHeadPremium align="right">Stock</TableHeadPremium>
                      <TableHeadPremium align="right">Estado</TableHeadPremium>
                    </tr>
                  </TableHeaderPremium>
                  <TableBodyPremium>
                    {criticos.slice(0, 10).map((art, i) => (
                      <TableRowPremium
                        key={art.id}
                        className="cursor-pointer"
                        onClick={() => navigate('/articulos')}
                        delay={i * 0.03}
                      >
                        <TableCellPremium>
                          <div>
                            <p className="text-sm font-medium">{art.nombre}</p>
                            {art.codigo && <p className="text-xs text-muted-foreground font-mono">{art.codigo}</p>}
                          </div>
                        </TableCellPremium>
                        <TableCellPremium>
                          {art.categoria && (
                            <BadgePremium variant="outline" size="sm">{art.categoria}</BadgePremium>
                          )}
                        </TableCellPremium>
                        <TableCellPremium align="right">
                          <span className="text-sm font-mono font-semibold text-destructive tabular-nums">
                            {art.stock_total}
                          </span>
                        </TableCellPremium>
                        <TableCellPremium align="right">
                          <div className="flex items-center justify-end gap-1 text-destructive">
                            <TrendingDown className="size-3.5" />
                            <span className="text-xs font-medium">Crítico</span>
                          </div>
                        </TableCellPremium>
                      </TableRowPremium>
                    ))}
                  </TableBodyPremium>
                </TablePremium>
              )}
            </div>
          </CardPremium>
        </div>
      </PageSection>

      {/* ── Fila 3: actividad reciente ── */}
      <PageSection delay={0.3}>
        <CardPremium variant="elevated" delay={0} className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base">Actividad reciente</h3>
              <p className="text-sm text-muted-foreground">Últimos movimientos en el inventario</p>
            </div>
            {movimientos.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/movimientos')}>
                Ver todos <ChevronRight className="size-3.5" />
              </Button>
            )}
          </div>
          <div className="p-0">
            {loadingMov ? (
              <div className="flex flex-col divide-y">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3.5">
                    <div className="size-8 shrink-0 rounded-lg bg-muted animate-pulse" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-3 w-14 rounded bg-muted animate-pulse shrink-0" />
                  </div>
                ))}
              </div>
            ) : movimientos.length === 0 ? (
              <EmptyStatePremium
                icon={<BellRing className="size-6 text-muted-foreground" />}
                title="Sin movimientos aún"
                description="Los movimientos aparecerán aquí al registrarlos."
                action={
                  <Button size="sm" variant="outline" onClick={() => navigate('/articulos')}>
                    Ir al inventario
                  </Button>
                }
              />
            ) : (
              <div className="flex flex-col divide-y">
                {movimientos.map((mov, i) => {
                  const ETIQUETAS: Record<string, string> = {
                    entrada: 'Entrada de stock',
                    salida: 'Salida de stock',
                    traslado: 'Traslado',
                    ajuste: 'Ajuste de inventario',
                  }
                  const etiqueta = mov.tipo ? (ETIQUETAS[mov.tipo.toLowerCase()] ?? mov.tipo) : ''
                  return (
                    <div
                      key={mov.id}
                      className="group flex items-center gap-3 px-6 py-3.5 hover:bg-accent/50 transition-all cursor-pointer stagger-row"
                      onClick={() => navigate('/movimientos')}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110", mov.tipo ? colorFondo(mov.tipo) : 'bg-muted')}>
                        <IconoMovimiento tipo={mov.tipo ?? ''} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{etiqueta}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {mov.motivo ? mov.motivo : `Ref. #${mov.id}`}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {formatearFechaRelativa(mov.created_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardPremium>
      </PageSection>
    </main>
  )
}
