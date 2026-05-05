import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useResumenHoy, useAuditoria, useUsuarios } from '@/hooks/queries'
import { formatearFechaHora } from '@/utils/formatters'
import { SkeletonTabla } from '@/components/ui/PageSkeleton'
import { ChevronLeft, ChevronRight, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, Users } from 'lucide-react'

const ENTIDADES = ['articulos', 'movimientos', 'alertas', 'categorias', 'ubicaciones', 'usuarios_app'] as const
const OPERACIONES = ['INSERT', 'UPDATE', 'DELETE'] as const

const ETIQUETA_ENTIDAD: Record<string, string> = {
  articulos: 'Artículos',
  movimientos: 'Movimientos',
  alertas: 'Alertas',
  categorias: 'Categorías',
  ubicaciones: 'Ubicaciones',
  usuarios_app: 'Usuarios',
}

const ETIQUETA_OPERACION: Record<string, string> = {
  INSERT: 'Creación',
  UPDATE: 'Modificación',
  DELETE: 'Eliminación',
}

type FiltroEntidad = typeof ENTIDADES[number] | ''
type FiltroOperacion = typeof OPERACIONES[number] | ''

function varianteOperacion(op: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (op === 'INSERT') return 'default'
  if (op === 'UPDATE') return 'secondary'
  if (op === 'DELETE') return 'destructive'
  return 'outline'
}

export default function Informes() {
  const [entidadTipo, setEntidadTipo] = useState<FiltroEntidad>('')
  const [tipoEvento, setTipoEvento] = useState<FiltroOperacion>('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)

  const [filtrosAplicados, setFiltrosAplicados] = useState<{
    entidad_tipo?: string
    tipo_evento?: string
    desde?: string
    hasta?: string
    pagina: number
  }>({ pagina: 1 })

  const { data: resumen, isLoading: cargandoResumen } = useResumenHoy()
  const { data: usuariosData, isLoading: cargandoUsuarios } = useUsuarios()
  const { data: auditoriaData, isLoading: cargandoAuditoria } = useAuditoria(filtrosAplicados)

  const registros = auditoriaData?.data ?? []
  const meta = auditoriaData?.meta
  const totalUsuarios = usuariosData?.data?.length ?? 0

  const eventosHoy = (resumen?.entradas_hoy ?? 0) + (resumen?.salidas_hoy ?? 0)
  const ajustesHoy = resumen?.ajustes_hoy ?? 0
  const trasladosHoy = resumen?.traslados_hoy ?? 0

  const aplicarFiltros = () => {
    const f: typeof filtrosAplicados = { pagina: 1 }
    if (entidadTipo) f.entidad_tipo = entidadTipo
    if (tipoEvento) f.tipo_evento = tipoEvento
    if (desde) f.desde = desde
    if (hasta) f.hasta = hasta
    setPagina(1)
    setFiltrosAplicados(f)
  }

  const limpiarFiltros = () => {
    setEntidadTipo('')
    setTipoEvento('')
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
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Informes y Auditoría</h2>
        <p className="text-sm text-muted-foreground">
          Trazabilidad completa de todos los cambios del inventario.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex flex-col gap-1">
              <CardDescription>Entradas hoy</CardDescription>
              <CardTitle className="text-3xl">{cargandoResumen ? '…' : (resumen?.entradas_hoy ?? 0)}</CardTitle>
            </div>
            <div className="rounded-lg bg-green-500/10 p-2">
              <ArrowDownToLine className="size-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Movimientos de entrada registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex flex-col gap-1">
              <CardDescription>Salidas hoy</CardDescription>
              <CardTitle className="text-3xl">{cargandoResumen ? '…' : (resumen?.salidas_hoy ?? 0)}</CardTitle>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <ArrowUpFromLine className="size-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Movimientos de salida registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex flex-col gap-1">
              <CardDescription>Ajustes y traslados</CardDescription>
              <CardTitle className="text-3xl">{cargandoResumen ? '…' : ajustesHoy + trasladosHoy}</CardTitle>
            </div>
            <div className="rounded-lg bg-primary/10 p-2">
              <SlidersHorizontal className="size-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {cargandoResumen ? '' : `${ajustesHoy} ajuste${ajustesHoy !== 1 ? 's' : ''} · ${trasladosHoy} traslado${trasladosHoy !== 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex flex-col gap-1">
              <CardDescription>Usuarios registrados</CardDescription>
              <CardTitle className="text-3xl">{cargandoUsuarios ? '…' : totalUsuarios}</CardTitle>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="size-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {cargandoResumen ? '' : `${eventosHoy} movimiento${eventosHoy !== 1 ? 's' : ''} en total hoy`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de auditoría</CardTitle>
          <CardDescription>Acota los registros por entidad, operación o rango de fechas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-entidad">Entidad</Label>
            <Select value={entidadTipo || 'todas'} onValueChange={(v) => setEntidadTipo(v === 'todas' ? '' : v as FiltroEntidad)}>
              <SelectTrigger id="filtro-entidad">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ENTIDADES.map((e) => (
                  <SelectItem key={e} value={e}>{ETIQUETA_ENTIDAD[e] ?? e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-op">Operación</Label>
            <Select value={tipoEvento || 'todas'} onValueChange={(v) => setTipoEvento(v === 'todas' ? '' : v as FiltroOperacion)}>
              <SelectTrigger id="filtro-op">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {OPERACIONES.map((o) => (
                  <SelectItem key={o} value={o}>{ETIQUETA_OPERACION[o] ?? o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-desde">Desde</Label>
            <Input id="filtro-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-hasta">Hasta</Label>
            <Input id="filtro-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
          <div className="flex items-end justify-end gap-2 md:col-span-4">
            <Button variant="outline" onClick={limpiarFiltros}>Limpiar</Button>
            <Button onClick={aplicarFiltros}>Aplicar filtros</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Log de auditoría</CardTitle>
            <CardDescription>
              {meta ? `${meta.total} registro${meta.total !== 1 ? 's' : ''} · página ${meta.current_page} de ${meta.last_page}` : 'Trazabilidad completa de cambios.'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {cargandoAuditoria ? (
            <SkeletonTabla cols={['w-16', 'w-28', 'w-24', 'w-28', 'flex-1']} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Operación</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay registros con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  )}
                  {registros.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium text-muted-foreground">#{reg.id}</TableCell>
                      <TableCell>
                        <Badge variant={varianteOperacion(reg.tipo_evento)}>
                          {ETIQUETA_OPERACION[reg.tipo_evento] ?? reg.tipo_evento}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{ETIQUETA_ENTIDAD[reg.entidad_tipo] ?? reg.entidad_tipo}</TableCell>
                      <TableCell className="text-muted-foreground">#{reg.entidad_id ?? '—'}</TableCell>
                      <TableCell>{reg.usuario?.nombre_visible ?? <span className="text-muted-foreground italic">sistema</span>}</TableCell>
                      <TableCell className="text-muted-foreground">{formatearFechaHora(reg.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => irPagina(pagina - 1)}
                    disabled={pagina <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {pagina} / {meta.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => irPagina(pagina + 1)}
                    disabled={pagina >= meta.last_page}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
