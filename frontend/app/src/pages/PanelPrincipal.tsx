import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useArticulos, useCategorias, useUbicaciones, useMovimientos } from "@/hooks/queries"
import {
  PackageCheck, TriangleAlert, Plus, MapPin, Layers,
  TrendingDown, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine,
  SlidersHorizontal, BellRing, ChevronRight,
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

  const articulos: Articulo[] = articulosData?.data ?? []
  const criticos: Articulo[] = artCriticosData?.data ?? []
  const categorias = categoriasData?.data ?? []
  const ubicaciones = ubicacionesData?.data ?? []
  const movimientos = movimientosData?.data ?? []

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
      .map(([nombre, v]) => ({ nombre, ...v }))
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [articulos, criticos, categorias])

  const maxCatTotal = Math.max(...porCategoria.map(c => c.total), 1)

  return (
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">

      {/* ── Cabecera ── */}
      <div className="page-section flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Panel</h2>
          <p className="text-sm text-muted-foreground">
            Monitoreo central del inventario — Laboratorio de salud ambiental
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/articulos')}>
            Ver inventario
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/articulos')}>
            <Plus className="size-4" />
            Nuevo artículo
          </Button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="page-section grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total artículos */}
        <Card className="stat-card stagger-row">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardDescription>Artículos registrados</CardDescription>
              <CardTitle className="text-3xl mt-1">
                {cargando ? <span className="animate-pulse text-muted-foreground">—</span> : totalArticulos}
              </CardTitle>
            </div>
            <div className="rounded-lg p-2 bg-blue-500/10">
              <PackageCheck className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{categorias.length} categorías · {ubicaciones.length} ubicaciones</p>
            <Badge variant="secondary">Inventario</Badge>
          </CardContent>
        </Card>

        {/* Stock crítico */}
        <Card className={cn("stat-card stagger-row", totalCriticos > 0 && !cargando && "border-destructive/30")}>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardDescription>Stock crítico</CardDescription>
              <CardTitle className={cn("text-3xl mt-1", totalCriticos > 0 && !cargando && "text-destructive")}>
                {cargando ? <span className="animate-pulse text-muted-foreground">—</span> : totalCriticos}
              </CardTitle>
            </div>
            <div className={cn("rounded-lg p-2", totalCriticos > 0 && !cargando ? "bg-destructive/10" : "bg-green-500/10")}>
              <TriangleAlert className={cn("size-5", totalCriticos > 0 && !cargando ? "text-destructive" : "text-green-600")} />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", pctCrit > 20 ? "bg-destructive" : pctCrit > 5 ? "bg-yellow-500" : "bg-green-500")}
                style={{ width: cargando ? "0%" : `${Math.min(pctCrit, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{pctCrit}% del inventario bajo mínimos</p>
              <Badge variant={totalCriticos > 0 ? "destructive" : "secondary"}>
                {totalCriticos > 0 ? "Urgente" : "OK"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Categorías */}
        <Card className="stat-card stagger-row">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardDescription>Categorías activas</CardDescription>
              <CardTitle className="text-3xl mt-1">
                {cargando ? <span className="animate-pulse text-muted-foreground">—</span> : categorias.length}
              </CardTitle>
            </div>
            <div className="rounded-lg p-2 bg-violet-500/10">
              <Layers className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {porCategoria[0] ? `Mayor: ${porCategoria[0].nombre} (${porCategoria[0].total})` : 'Sin datos'}
            </p>
          </CardContent>
        </Card>

        {/* Ubicaciones */}
        <Card className="stat-card stagger-row">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardDescription>Ubicaciones</CardDescription>
              <CardTitle className="text-3xl mt-1">
                {cargando ? <span className="animate-pulse text-muted-foreground">—</span> : ubicaciones.length}
              </CardTitle>
            </div>
            <div className="rounded-lg p-2 bg-emerald-500/10">
              <MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Armarios, neveras y zonas de almacenaje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Fila 2: distribución por categoría + artículos críticos ── */}
      <div className="page-section grid gap-4 xl:grid-cols-3">

        {/* Distribución por categoría — barras CSS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por categoría</CardTitle>
            <CardDescription>Artículos totales y críticos por categoría</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cargando
              ? [1, 2, 3].map(i => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                  </div>
                ))
              : porCategoria.map((cat) => (
                  <div key={cat.nombre} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{cat.nombre}</span>
                      <span className="tabular-nums text-muted-foreground shrink-0 ml-2">
                        {cat.total}
                        {cat.criticos > 0 && (
                          <span className="text-destructive ml-1">· {cat.criticos} ↓</span>
                        )}
                      </span>
                    </div>
                    <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-primary/60 transition-all"
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
          </CardContent>
        </Card>

        {/* Artículos con stock crítico */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Stock crítico</CardTitle>
              <CardDescription>Artículos bajo el mínimo definido</CardDescription>
            </div>
            {totalCriticos > 10 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate('/articulos')}>
                Ver todos <ChevronRight className="size-3.5 ml-0.5" />
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {cargando ? (
              <div className="space-y-0 divide-y">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between px-6 py-3">
                    <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : criticos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10">
                  <PackageCheck className="size-5 text-green-600" />
                </div>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Todo el stock está en orden</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Artículo</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right pr-6">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticos.slice(0, 10).map((art) => (
                    <TableRow
                      key={art.id}
                      className="cursor-pointer"
                      onClick={() => navigate('/articulos')}
                    >
                      <TableCell className="pl-6 py-2.5">
                        <div>
                          <p className="text-sm font-medium">{art.nombre}</p>
                          {art.codigo && <p className="text-xs text-muted-foreground font-mono">{art.codigo}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {art.categoria && (
                          <Badge variant="outline" className="text-xs font-normal">{art.categoria}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-mono font-semibold text-destructive tabular-nums">
                          {art.stock_total}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1 text-destructive">
                          <TrendingDown className="size-3.5" />
                          <span className="text-xs font-medium">Crítico</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Fila 3: actividad reciente ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Actividad reciente</CardTitle>
            <CardDescription>Últimos movimientos en el inventario</CardDescription>
          </div>
          {movimientos.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate('/movimientos')}>
              Ver todos <ChevronRight className="size-3.5" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
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
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <BellRing className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Sin movimientos aún</p>
                <p className="text-xs text-muted-foreground mt-0.5">Los movimientos aparecerán aquí al registrarlos.</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate('/articulos')}>
                Ir al inventario
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {movimientos.map((mov) => {
                const ETIQUETAS: Record<string, string> = {
                  entrada: 'Entrada de stock',
                  salida: 'Salida de stock',
                  traslado: 'Traslado',
                  ajuste: 'Ajuste de inventario',
                }
                const etiqueta = ETIQUETAS[mov.tipo.toLowerCase()] ?? mov.tipo
                return (
                  <div
                    key={mov.id}
                    className="group flex items-center gap-3 px-6 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => navigate('/movimientos')}
                  >
                    <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105", colorFondo(mov.tipo))}>
                      <IconoMovimiento tipo={mov.tipo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{etiqueta}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {mov.motivo
                          ? mov.motivo
                          : `Ref. #${mov.id}`
                        }
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
        </CardContent>
      </Card>

    </main>
  )
}
