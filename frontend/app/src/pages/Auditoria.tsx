/**
 * Página de auditoría del sistema (solo profesor).
 * Requisitos: 8.5, 8.6
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/ContextoAutenticacion'
import { useAuditoria } from '@/hooks/queries'
import { formatearFechaHora } from '@/utils/formatters'
import { Shield, ChevronDown, ChevronRight, ChevronLeft, FileSearch, PlusCircle, RefreshCw, Trash2, Activity, User, Calendar, Hash, ArrowRight, Globe, Monitor, Link2 } from 'lucide-react'
import { SkeletonAuditoria } from '@/components/ui/PageSkeleton'
import type { RegistroAuditoria } from '@/types'

type FiltroOperacion = 'todos' | 'INSERT' | 'UPDATE' | 'DELETE'

function parsearAgente(ua: string | null): { navegador: string; so: string } {
  if (!ua) return { navegador: 'Desconocido', so: 'Desconocido' }
  const navegador =
    ua.includes('Firefox') ? 'Firefox' :
    ua.includes('Edg') ? 'Edge' :
    ua.includes('Chrome') ? 'Chrome' :
    ua.includes('Safari') ? 'Safari' :
    ua.includes('Opera') || ua.includes('OPR') ? 'Opera' :
    ua.includes('curl') ? 'curl' :
    ua.includes('Postman') ? 'Postman' : 'Otro'
  const so =
    ua.includes('Windows') ? 'Windows' :
    ua.includes('Mac') ? 'macOS' :
    ua.includes('Linux') ? 'Linux' :
    ua.includes('Android') ? 'Android' :
    ua.includes('iOS') || ua.includes('iPhone') ? 'iOS' : 'Otro'
  return { navegador, so }
}

function ModalDetalleLog({
  registro,
  onCerrar,
}: {
  registro: RegistroAuditoria | null
  onCerrar: () => void
}) {
  if (!registro) return null

  const lineas = generarLineasResumen(registro.tipo_evento, registro.antes_json, registro.despues_json)
  const { navegador, so } = parsearAgente(registro.user_agent)

  const colorOp = {
    INSERT: 'bg-green-500/10 text-green-700 dark:text-green-400',
    UPDATE: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    DELETE: 'bg-destructive/10 text-destructive',
  }[registro.tipo_evento] ?? 'bg-muted text-foreground'

  return (
    <Dialog open={!!registro} onOpenChange={(open) => !open && onCerrar()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${colorOp}`}>
              {registro.tipo_evento === 'INSERT' && <PlusCircle className="size-4" />}
              {registro.tipo_evento === 'UPDATE' && <RefreshCw className="size-4" />}
              {registro.tipo_evento === 'DELETE' && <Trash2 className="size-4" />}
            </div>
            {etiquetaOperacion(registro.tipo_evento)} — {etiquetaTabla(registro.entidad_tipo)}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Hash className="size-3" /> Registro {registro.id}
            <span className="text-muted-foreground/50">·</span>
            <Calendar className="size-3" /> {formatearFechaHora(registro.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[65vh]">
          <div className="flex flex-col gap-4">

            {/* ── Quién, cuándo y desde dónde ── */}
            <div className="rounded-lg border bg-muted/30 divide-y text-sm">
              {/* Usuario */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                  <User className="size-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0">
                  <span className="text-xs text-muted-foreground">Usuario</span>
                  <span className="font-medium">
                    {registro.usuario?.nombre_visible
                      ? registro.usuario.nombre_visible
                      : <span className="italic text-muted-foreground">Sistema / trigger automático</span>}
                  </span>
                </div>
                <div className="ml-auto">
                  <Badge variant={varianteOperacion(registro.tipo_evento)}>
                    {etiquetaOperacion(registro.tipo_evento)}
                  </Badge>
                </div>
              </div>

              {/* Entidad */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Hash className="size-3.5 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0">
                  <span className="text-xs text-muted-foreground">Entidad afectada</span>
                  <span className="font-medium">
                    {etiquetaTabla(registro.entidad_tipo)}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">#{registro.entidad_id}</span>
                  </span>
                </div>
              </div>

              {/* IP */}
              {registro.ip_address && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Globe className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-0">
                    <span className="text-xs text-muted-foreground">Dirección IP</span>
                    <span className="font-mono text-sm">{registro.ip_address}</span>
                  </div>
                </div>
              )}

              {/* Navegador/SO */}
              {registro.user_agent && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Monitor className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">Dispositivo</span>
                    <span className="font-medium text-sm">{navegador} · {so}</span>
                    <span className="text-xs text-muted-foreground break-all leading-relaxed">{registro.user_agent}</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Detalle de cambios ── */}
            {lineas.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold">Campos modificados ({lineas.length})</p>
                <Separator />
                <div className="flex flex-col gap-0 rounded-lg border overflow-hidden">
                  {lineas.map((l, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors
                        border-b last:border-b-0"
                    >
                      <span className="w-40 shrink-0 font-medium text-foreground pt-0.5">{l.campo}</span>
                      {l.tipo === 'cambio' ? (
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive line-through break-all">{l.antes}</span>
                          <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                          <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400 break-all">{l.despues}</span>
                        </div>
                      ) : l.tipo === 'nuevo' ? (
                        <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-700 dark:text-green-400 break-all">{l.despues}</span>
                      ) : (
                        <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive line-through break-all">{l.antes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── JSON raw completo — siempre visible ── */}
            {(registro.antes_json || registro.despues_json) && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Link2 className="size-3.5" />
                  {registro.tipo_evento === 'UPDATE' ? 'Estado antes / después' : 'Datos completos del registro'}
                </p>
                <Separator />
                {registro.tipo_evento === 'UPDATE' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Antes</p>
                      <pre className="rounded-lg bg-destructive/5 border border-destructive/10 p-3 text-xs overflow-x-auto leading-relaxed">
                        {JSON.stringify(registro.antes_json, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Después</p>
                      <pre className="rounded-lg bg-green-500/5 border border-green-500/10 p-3 text-xs overflow-x-auto leading-relaxed">
                        {JSON.stringify(registro.despues_json, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <pre className="rounded-lg bg-muted/50 border p-3 text-xs overflow-x-auto leading-relaxed">
                    {JSON.stringify(registro.despues_json ?? registro.antes_json, null, 2)}
                  </pre>
                )}
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Traducción de nombres de campos técnicos a legibles
const ETIQUETAS_CAMPO: Record<string, string> = {
  id: 'ID',
  nombre: 'Nombre',
  nombre_visible: 'Nombre visible',
  activo: 'Activo',
  auth_user_id: 'ID de autenticación',
  created_at: 'Creado el',
  updated_at: 'Actualizado el',
  codigo: 'Código',
  descripcion: 'Descripción',
  categoria_id: 'Categoría',
  unidad: 'Unidad',
  stock_total: 'Stock total',
  tipo: 'Tipo',
  motivo: 'Motivo',
  usuario_id: 'Usuario',
  ubicacion_origen_id: 'Ubicación origen',
  ubicacion_destino_id: 'Ubicación destino',
  estado: 'Estado',
  severidad: 'Severidad',
  nombre_completo: 'Nombre completo',
}

// Campos a ignorar en el resumen (técnicos/irrelevantes)
const CAMPOS_IGNORAR = new Set(['created_at', 'updated_at', 'id', 'auth_user_id'])

function etiqueta(campo: string): string {
  return ETIQUETAS_CAMPO[campo] ?? campo.replace(/_/g, ' ')
}

function formatearValor(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') return val ? 'Sí' : 'No'
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(val))
  }
  return String(val)
}

function varianteOperacion(op: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (op.toUpperCase()) {
    case 'INSERT': return 'secondary'
    case 'UPDATE': return 'default'
    case 'DELETE': return 'destructive'
    default: return 'outline'
  }
}

function claseOperacion(op: string): string {
  switch (op.toUpperCase()) {
    case 'INSERT': return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
    case 'UPDATE': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
    case 'DELETE': return 'bg-destructive/10 text-destructive border-destructive/20'
    default: return 'bg-muted text-muted-foreground border-border'
  }
}

function iconoOperacion(op: string) {
  switch (op.toUpperCase()) {
    case 'INSERT': return PlusCircle
    case 'UPDATE': return RefreshCw
    case 'DELETE': return Trash2
    default: return Activity
  }
}

function etiquetaOperacion(op: string): string {
  switch (op.toUpperCase()) {
    case 'INSERT': return 'Creación'
    case 'UPDATE': return 'Modificación'
    case 'DELETE': return 'Eliminación'
    default: return op
  }
}

function etiquetaTabla(tabla: string): string {
  const map: Record<string, string> = {
    articulos: 'Artículos',
    categorias: 'Categorías',
    ubicaciones: 'Ubicaciones',
    movimientos: 'Movimientos',
    alertas: 'Alertas',
    usuarios_app: 'Usuarios',
  }
  return map[tabla] ?? tabla
}

/**
 * Genera líneas de resumen legibles según el tipo de operación.
 */
function generarLineasResumen(
  op: string,
  antes: Record<string, unknown> | null,
  despues: Record<string, unknown> | null,
): { campo: string; antes?: string; despues?: string; tipo: 'nuevo' | 'cambio' | 'eliminado' }[] {
  const lineas: { campo: string; antes?: string; despues?: string; tipo: 'nuevo' | 'cambio' | 'eliminado' }[] = []

  if (op === 'INSERT' && despues) {
    const camposRelevantes = Object.entries(despues)
      .filter(([k, v]) => !CAMPOS_IGNORAR.has(k) && v !== null && v !== '' && v !== undefined)
    for (const [k, v] of camposRelevantes) {
      lineas.push({ campo: etiqueta(k), despues: formatearValor(v), tipo: 'nuevo' })
    }
  } else if (op === 'UPDATE' && antes && despues) {
    const camposCambiados = Object.keys(despues).filter(
      (k) => !CAMPOS_IGNORAR.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(despues[k])
    )
    for (const k of camposCambiados) {
      lineas.push({
        campo: etiqueta(k),
        antes: formatearValor(antes[k]),
        despues: formatearValor(despues[k]),
        tipo: 'cambio',
      })
    }
  } else if (op === 'DELETE' && antes) {
    const camposRelevantes = Object.entries(antes)
      .filter(([k, v]) => !CAMPOS_IGNORAR.has(k) && v !== null && v !== '' && v !== undefined)
    for (const [k, v] of camposRelevantes) {
      lineas.push({ campo: etiqueta(k), antes: formatearValor(v), tipo: 'eliminado' })
    }
  }

  return lineas
}

function ResumenCambio({
  op,
  antes,
  despues,
}: {
  op: string
  antes: Record<string, unknown> | null
  despues: Record<string, unknown> | null
}) {
  const [expandido, setExpandido] = useState(false)
  const lineas = generarLineasResumen(op, antes, despues)

  if (lineas.length === 0) return <span className="text-muted-foreground">Sin cambios relevantes</span>

  const visibles = expandido ? lineas : lineas.slice(0, 2)
  const hayMas = lineas.length > 2

  return (
    <div className="flex flex-col gap-1">
      {visibles.map((l, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1 text-xs">
          <span className="font-medium text-foreground">{l.campo}:</span>
          {l.tipo === 'cambio' ? (
            <>
              <span className="line-through text-muted-foreground">{l.antes}</span>
              <span className="text-muted-foreground">→</span>
              <span className="text-foreground font-medium">{l.despues}</span>
            </>
          ) : l.tipo === 'nuevo' ? (
            <span className="text-foreground">{l.despues}</span>
          ) : (
            <span className="line-through text-muted-foreground">{l.antes}</span>
          )}
        </div>
      ))}
      {hayMas && (
        <button
          className="flex items-center gap-0.5 text-xs text-primary hover:underline w-fit"
          onClick={() => setExpandido(!expandido)}
        >
          {expandido
            ? <><ChevronDown className="size-3" /> Ver menos</>
            : <><ChevronRight className="size-3" /> {lineas.length - 2} campo{lineas.length - 2 > 1 ? 's' : ''} más</>
          }
        </button>
      )}
    </div>
  )
}

export default function Auditoria() {
  const { user } = useAuth()

  const [entidadTipo, setEntidadTipo] = useState('')
  const [filtroOperacion, setFiltroOperacion] = useState<FiltroOperacion>('todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)
  const [logSeleccionado, setLogSeleccionado] = useState<RegistroAuditoria | null>(null)
  const [filtrosAplicados, setFiltrosAplicados] = useState<{
    entidad_tipo?: string
    tipo_evento?: string
    desde?: string
    hasta?: string
    pagina?: number
  }>({ pagina: 1 })

  const { data, isLoading, isFetching } = useAuditoria(filtrosAplicados)
  const registros = data?.data ?? []
  const meta = data?.meta

  const totalRegistros = meta?.total ?? registros.length
  const totalInserts = registros.filter(r => r.tipo_evento === 'INSERT').length
  const totalUpdates = registros.filter(r => r.tipo_evento === 'UPDATE').length
  const totalDeletes = registros.filter(r => r.tipo_evento === 'DELETE').length

  const esProfesor = user?.role === 'profesor'

  if (isLoading) return <SkeletonAuditoria />

  if (!esProfesor) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-muted/20 p-4 lg:p-6">
        <Card className="w-full max-w-sm text-center shadow-sm">
          <CardHeader className="pb-3">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="size-7 text-destructive" />
            </div>
            <CardTitle>Acceso restringido</CardTitle>
            <CardDescription>
              Esta sección solo está disponible para profesores del sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  const onAplicarFiltros = () => {
    const f: typeof filtrosAplicados = { pagina: 1 }
    if (entidadTipo.trim()) f.entidad_tipo = entidadTipo.trim()
    if (filtroOperacion !== 'todos') f.tipo_evento = filtroOperacion
    if (desde) f.desde = desde
    if (hasta) f.hasta = hasta
    setPagina(1)
    setFiltrosAplicados(f)
  }

  const onLimpiarFiltros = () => {
    setEntidadTipo('')
    setFiltroOperacion('todos')
    setDesde('')
    setHasta('')
    setPagina(1)
    setFiltrosAplicados({ pagina: 1 })
  }

  const irPagina = (nueva: number) => {
    setPagina(nueva)
    setFiltrosAplicados((prev) => ({ ...prev, pagina: nueva }))
  }

  return (
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="page-section flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Auditoría</h2>
          <p className="text-sm text-muted-foreground">
            Trazabilidad completa de cambios del sistema. Solo visible para profesores.
          </p>
        </div>
        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Actualizando…
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="page-section grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="stat-card stagger-row">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardDescription>Total registros</CardDescription>
              <CardTitle className="text-3xl mt-1">{totalRegistros.toLocaleString('es-ES')}</CardTitle>
            </div>
            <div className="rounded-lg p-2 bg-primary/10">
              <Activity className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {filtrosAplicados.entidad_tipo || filtrosAplicados.tipo_evento || filtrosAplicados.desde
                ? 'Con filtros aplicados'
                : 'Todos los cambios del sistema'}
            </p>
          </CardContent>
        </Card>
        <Card className="stat-card stagger-row">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardDescription>Creaciones</CardDescription>
              <CardTitle className="text-3xl mt-1 text-green-600 dark:text-green-400">{totalInserts}</CardTitle>
            </div>
            <div className="rounded-lg p-2 bg-green-500/10">
              <PlusCircle className="size-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Registros nuevos añadidos</p>
          </CardContent>
        </Card>
        <Card className="stat-card stagger-row">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardDescription>Modificaciones</CardDescription>
              <CardTitle className="text-3xl mt-1 text-amber-600 dark:text-amber-400">{totalUpdates}</CardTitle>
            </div>
            <div className="rounded-lg p-2 bg-amber-500/10">
              <RefreshCw className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Cambios sobre registros existentes</p>
          </CardContent>
        </Card>
        <Card className="stat-card stagger-row">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div>
              <CardDescription>Eliminaciones</CardDescription>
              <CardTitle className="text-3xl mt-1 text-destructive">{totalDeletes}</CardTitle>
            </div>
            <div className="rounded-lg p-2 bg-destructive/10">
              <Trash2 className="size-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Registros eliminados del sistema</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros — toolbar compacta */}
      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-3 pt-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filtro-entidad" className="text-xs text-muted-foreground">Entidad</Label>
            <Select value={entidadTipo || '_todos'} onValueChange={(v) => setEntidadTipo(v === '_todos' ? '' : v)}>
              <SelectTrigger id="filtro-entidad" className="h-9 w-[160px] text-sm">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_todos">Todas las entidades</SelectItem>
                <SelectItem value="articulos">Artículos</SelectItem>
                <SelectItem value="categorias">Categorías</SelectItem>
                <SelectItem value="ubicaciones">Ubicaciones</SelectItem>
                <SelectItem value="movimientos">Movimientos</SelectItem>
                <SelectItem value="alertas">Alertas</SelectItem>
                <SelectItem value="usuarios_app">Usuarios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filtro-operacion" className="text-xs text-muted-foreground">Operación</Label>
            <Select value={filtroOperacion} onValueChange={(v) => setFiltroOperacion(v as FiltroOperacion)}>
              <SelectTrigger id="filtro-operacion" className="h-9 w-[150px] text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="INSERT">Creación</SelectItem>
                <SelectItem value="UPDATE">Modificación</SelectItem>
                <SelectItem value="DELETE">Eliminación</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filtro-desde" className="text-xs text-muted-foreground">Desde</Label>
            <Input id="filtro-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 w-[148px] text-sm" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filtro-hasta" className="text-xs text-muted-foreground">Hasta</Label>
            <Input id="filtro-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 w-[148px] text-sm" />
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onLimpiarFiltros} className="h-9">Limpiar</Button>
            <Button size="sm" onClick={onAplicarFiltros} disabled={isLoading} className="h-9 gap-1.5">
              <Activity className="size-3.5" />
              Aplicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <FileSearch className="size-4 text-primary" />
            </div>
            Registros de auditoría
          </CardTitle>
          <CardDescription>
            {meta
              ? `${meta.total} registro${meta.total !== 1 ? 's' : ''} · página ${meta.current_page} de ${meta.last_page}`
              : `${registros.length} registro${registros.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFetching && !isLoading ? (
            <div className="space-y-0 divide-y">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-start gap-4 py-3.5">
                  <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="flex-1 h-4 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entidad</TableHead>
                <TableHead>Operación</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Detalle del cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        <FileSearch className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No hay registros con los filtros seleccionados.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {registros.map((reg) => {
                const IconOp = iconoOperacion(reg.tipo_evento)
                const claseOp = claseOperacion(reg.tipo_evento)
                return (
                  <TableRow
                    key={reg.id}
                    className="group align-top cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setLogSeleccionado(reg)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${claseOp}`}>
                          <IconOp className="size-3.5" />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{etiquetaTabla(reg.entidad_tipo)}</span>
                          <span className="block text-xs text-muted-foreground font-mono">#{reg.entidad_id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${claseOp}`}>
                        {etiquetaOperacion(reg.tipo_evento)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {reg.usuario?.nombre_visible
                        ? <span className="text-sm">{reg.usuario.nombre_visible}</span>
                        : <span className="text-xs text-muted-foreground italic">Sistema</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                      {formatearFechaHora(reg.created_at)}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <ResumenCambio
                        op={reg.tipo_evento}
                        antes={reg.antes_json}
                        despues={reg.despues_json}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          )}

          {/* Paginación */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between gap-2 pt-4 border-t">
              <span className="text-xs text-muted-foreground">
                {meta.total.toLocaleString('es-ES')} registros totales
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => irPagina(pagina - 1)}
                  disabled={pagina <= 1 || isFetching}
                  className="size-8 p-0"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-[80px] text-center text-sm text-muted-foreground tabular-nums">
                  {pagina} / {meta.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => irPagina(pagina + 1)}
                  disabled={pagina >= meta.last_page || isFetching}
                  className="size-8 p-0"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ModalDetalleLog
        registro={logSeleccionado}
        onCerrar={() => setLogSeleccionado(null)}
      />
    </main>
  )
}
