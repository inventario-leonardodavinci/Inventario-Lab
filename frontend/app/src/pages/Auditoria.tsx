/**
 * Página de auditoría del sistema (solo administrador).
 * Requisitos: 8.5, 8.6
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/ContextoAutenticacion'
import { useAuditoria } from '@/hooks/queries'
import { formatearFechaHora } from '@/utils/formatters'
import { Shield, ChevronDown, ChevronRight, ChevronLeft, FileSearch } from 'lucide-react'
import { SkeletonAuditoria } from '@/components/ui/PageSkeleton'

type FiltroOperacion = 'todos' | 'INSERT' | 'UPDATE' | 'DELETE'

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
  const [filtrosAplicados, setFiltrosAplicados] = useState<{
    entidad_tipo?: string
    tipo_evento?: string
    desde?: string
    hasta?: string
    pagina?: number
  }>({ pagina: 1 })

  const { data, isLoading } = useAuditoria(filtrosAplicados)
  const registros = data?.data ?? []
  const meta = data?.meta

  const esAdmin = user?.role === 'admin' || (user?.role as string) === 'administrador'

  if (isLoading) return <SkeletonAuditoria />

  if (!esAdmin) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-muted/20 p-4 lg:p-6">
        <Shield className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acceso restringido</h2>
        <p className="text-sm text-muted-foreground">
          Esta sección solo está disponible para administradores del sistema.
        </p>
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
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Auditoría</h2>
        <p className="text-sm text-muted-foreground">
          Registro de cambios del sistema. Solo visible para administradores.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra el log de auditoría por entidad, operación y rango de fechas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-entidad">Tabla / Entidad</Label>
            <Select value={entidadTipo || '_todos'} onValueChange={(v) => setEntidadTipo(v === '_todos' ? '' : v)}>
              <SelectTrigger id="filtro-entidad" className="w-[180px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_todos">Todas</SelectItem>
                <SelectItem value="articulos">Artículos</SelectItem>
                <SelectItem value="categorias">Categorías</SelectItem>
                <SelectItem value="ubicaciones">Ubicaciones</SelectItem>
                <SelectItem value="movimientos">Movimientos</SelectItem>
                <SelectItem value="alertas">Alertas</SelectItem>
                <SelectItem value="usuarios_app">Usuarios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-operacion">Operación</Label>
            <Select value={filtroOperacion} onValueChange={(v) => setFiltroOperacion(v as FiltroOperacion)}>
              <SelectTrigger id="filtro-operacion" className="w-[160px]">
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-desde">Desde</Label>
            <Input id="filtro-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-[160px]" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-hasta">Hasta</Label>
            <Input id="filtro-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-[160px]" />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={onAplicarFiltros} disabled={isLoading}>Aplicar filtros</Button>
            <Button variant="outline" onClick={onLimpiarFiltros}>Limpiar</Button>
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
              {registros.map((reg) => (
                <TableRow key={reg.id} className="align-top">
                  <TableCell className="font-medium">
                    {etiquetaTabla(reg.entidad_tipo)}
                    <span className="block text-xs text-muted-foreground font-mono">#{reg.entidad_id}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={varianteOperacion(reg.tipo_evento)}>
                      {etiquetaOperacion(reg.tipo_evento)}
                    </Badge>
                  </TableCell>
                  <TableCell>{reg.usuario?.nombre_visible ?? <span className="text-muted-foreground italic">Sistema</span>}</TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatearFechaHora(reg.created_at)}
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <ResumenCambio
                      op={reg.tipo_evento}
                      antes={reg.antes_json}
                      despues={reg.despues_json}
                    />
                  </TableCell>
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
                disabled={pagina <= 1 || isLoading}
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
                disabled={pagina >= meta.last_page || isLoading}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
