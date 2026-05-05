/**
 * Página unificada: Artículos + Movimientos + Alertas
 */
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GuardRol } from '@/components/auth/GuardRol'
import { useAuth } from '@/context/ContextoAutenticacion'
import {
  useArticulos, useCategorias, useUbicaciones,
  useCrearArticulo, useActualizarArticulo, useDesactivarArticulo,
  useMovimientos, useCrearMovimiento,
  useAlertas, useConfirmarAlerta, useResolverAlerta,
} from '@/hooks/queries'
import { Pencil, Trash2, Search, Package, ArrowDownToLine, ArrowUpFromLine, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import type { Articulo, TipoMovimiento, TipoAlerta, Severidad, EstadoAlerta } from '@/types'
import { SkeletonArticulos, SkeletonMovimientos, SkeletonAlertas } from '@/components/ui/PageSkeleton'
import {
  formatearTipoMovimiento, formatearFechaHora,
  formatearTipoAlerta, formatearSeveridad, formatearEstadoAlerta, formatearFechaRelativa,
} from '@/utils/formatters'
import { esquemaMovimiento, type EntradaMovimientoForm } from '@/schemas'

type FiltroActivo = 'todos' | 'activo' | 'inactivo'

const UNIDADES = [
  { valor: 'uds', etiqueta: 'Unidades (uds)' },
  { valor: 'L', etiqueta: 'Litros (L)' },
  { valor: 'mL', etiqueta: 'Mililitros (mL)' },
  { valor: 'kg', etiqueta: 'Kilogramos (kg)' },
  { valor: 'g', etiqueta: 'Gramos (g)' },
  { valor: 'mg', etiqueta: 'Miligramos (mg)' },
  { valor: 'caja', etiqueta: 'Cajas' },
  { valor: 'bote', etiqueta: 'Botes' },
  { valor: 'frasco', etiqueta: 'Frascos' },
  { valor: 'rollo', etiqueta: 'Rollos' },
  { valor: 'par', etiqueta: 'Pares' },
  { valor: 'paquete', etiqueta: 'Paquetes' },
]

interface FormArticulo {
  nombre: string
  codigo: string
  descripcion: string
  categoria_id: string
  unidad: string
  stock_inicial: string
  stock_minimo: string
  ubicacion_id: string
}

const formVacio: FormArticulo = {
  nombre: '', codigo: '', descripcion: '',
  categoria_id: '', unidad: '',
  stock_inicial: '', stock_minimo: '', ubicacion_id: '',
}

function articuloAForm(a: Articulo): FormArticulo {
  return {
    nombre: a.nombre,
    codigo: a.codigo ?? '',
    descripcion: (a as unknown as { descripcion?: string }).descripcion ?? '',
    categoria_id: a.categoria_id ? String(a.categoria_id) : '',
    unidad: a.unidad ?? '',
    stock_inicial: '',
    stock_minimo: '',
    ubicacion_id: '',
  }
}

// ─── Helpers alertas ─────────────────────────────────────────────────────────

type FiltroTipoAlerta = TipoAlerta | 'todos'
type FiltroSeveridad = Severidad | 'todas'
type FiltroEstado = EstadoAlerta | 'todos'
type FiltroTipoMov = TipoMovimiento | 'todos'

function varianteSeveridad(sev: Severidad): 'secondary' | 'outline' | 'default' | 'destructive' {
  switch (sev) {
    case 'baja': return 'secondary'
    case 'media': return 'outline'
    case 'alta': return 'default'
    case 'critica': return 'destructive'
  }
}

// ─── Tab Artículos ────────────────────────────────────────────────────────────

function TabArticulos() {
  const [search, setSearch] = useState('')
  const [searchActivo, setSearchActivo] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>('todos')

  // Dialog crear/editar
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [editando, setEditando] = useState<Articulo | null>(null)
  const [form, setForm] = useState<FormArticulo>(formVacio)

  // Dialog confirmar borrado
  const [confirmarBorrar, setConfirmarBorrar] = useState<Articulo | null>(null)

  const filtros = {
    search: searchActivo,
    ...(filtroActivo !== 'todos' ? { activo: filtroActivo === 'activo' } : {}),
  }

  const { data, isFetching, isLoading } = useArticulos(filtros)
  const { data: categoriasData } = useCategorias()
  const { data: ubicacionesData } = useUbicaciones()
  const crearMutation = useCrearArticulo()
  const actualizarMutation = useActualizarArticulo()
  const desactivarMutation = useDesactivarArticulo()

  const rows = data?.data ?? []
  const categorias = categoriasData?.data ?? []
  const ubicaciones = ubicacionesData?.data ?? []

  const onBuscar = () => setSearchActivo(search)

  if (isLoading) return <SkeletonArticulos />

  const abrirCrear = () => {
    setEditando(null)
    setForm(formVacio)
    setDialogAbierto(true)
  }

  const abrirEditar = (articulo: Articulo) => {
    setEditando(articulo)
    setForm(articuloAForm(articulo))
    setDialogAbierto(true)
  }

  const onGuardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!form.categoria_id) { toast.error('La categoría es obligatoria'); return }

    try {
      if (editando) {
        await actualizarMutation.mutateAsync({
          id: editando.id,
          datos: {
            nombre: form.nombre.trim(),
            codigo: form.codigo.trim() || undefined,
            descripcion: form.descripcion.trim() || undefined,
            categoria_id: Number(form.categoria_id),
            unidad: form.unidad || undefined,
          },
        })
        toast.success('Artículo actualizado')
      } else {
        await crearMutation.mutateAsync({
          nombre: form.nombre.trim(),
          codigo: form.codigo.trim() || undefined,
          descripcion: form.descripcion.trim() || undefined,
          categoria_id: Number(form.categoria_id),
          unidad: form.unidad || undefined,
          stock_inicial: form.stock_inicial ? Number(form.stock_inicial) : undefined,
          stock_minimo: form.stock_minimo ? Number(form.stock_minimo) : undefined,
          ubicacion_id: form.ubicacion_id ? Number(form.ubicacion_id) : undefined,
        })
        toast.success('Artículo creado correctamente')
      }
      setDialogAbierto(false)
      setForm(formVacio)
      setEditando(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar el artículo')
    }
  }

  const onConfirmarBorrar = async () => {
    if (!confirmarBorrar) return
    try {
      await desactivarMutation.mutateAsync(confirmarBorrar.id)
      toast.success(`"${confirmarBorrar.nombre}" desactivado`)
      setConfirmarBorrar(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desactivar')
    }
  }

  const isPending = crearMutation.isPending || actualizarMutation.isPending

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Artículos</h2>
          <p className="text-sm text-muted-foreground">Gestión de artículos del inventario del laboratorio.</p>
        </div>
        <GuardRol roles={['administrador', 'profesor']}>
          <Button onClick={abrirCrear}>Nuevo artículo</Button>
        </GuardRol>
      </div>

      {/* Filtros inline */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onBuscar() }}
          />
        </div>
        <Select value={filtroActivo} onValueChange={(v) => setFiltroActivo(v as FiltroActivo)}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Solo activos</SelectItem>
            <SelectItem value="inactivo">Solo inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onBuscar} disabled={isFetching} className="gap-1.5 shrink-0">
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">
              {rows.length} artículo{rows.length !== 1 ? 's' : ''} encontrado{rows.length !== 1 ? 's' : ''}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Package className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Sin artículos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchActivo ? 'No hay resultados para esa búsqueda.' : 'Crea el primer artículo del inventario.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoría</TableHead>
                    <TableHead className="hidden md:table-cell">Unidad</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Estado</TableHead>
                    <GuardRol roles={['administrador', 'profesor']}>
                      <TableHead className="text-right">Acciones</TableHead>
                    </GuardRol>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className={!row.activo ? 'opacity-50' : undefined}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{row.nombre}</span>
                          {row.codigo && (
                            <span className="text-xs text-muted-foreground font-mono">{row.codigo}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {row.categoria ?? '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {row.unidad ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.stock_total}
                      </TableCell>
                      <TableCell>
                        {!row.activo ? (
                          <Badge variant="outline">Inactivo</Badge>
                        ) : row.estado_stock === 'critico' ? (
                          <Badge variant="destructive">Crítico</Badge>
                        ) : (
                          <Badge variant="secondary">Estable</Badge>
                        )}
                      </TableCell>
                      <GuardRol roles={['administrador', 'profesor']}>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => abrirEditar(row)} title="Editar artículo">
                              <Pencil className="size-4" />
                            </Button>
                            <GuardRol roles={['administrador']}>
                              {row.activo && (
                                <Button
                                  variant="ghost" size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={() => setConfirmarBorrar(row)}
                                  disabled={desactivarMutation.isPending}
                                  title="Desactivar artículo"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              )}
                            </GuardRol>
                          </div>
                        </TableCell>
                      </GuardRol>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Crear / Editar artículo */}
      <Dialog open={dialogAbierto} onOpenChange={(open) => { if (!open) { setDialogAbierto(false); setEditando(null); setForm(formVacio) } }}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
            <DialogDescription>
              {editando ? 'Modifica los datos del artículo.' : 'Completa los datos para registrar un nuevo artículo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-nombre">Nombre <span className="text-destructive">*</span></Label>
              <Input id="art-nombre" placeholder="Ej. Guantes de nitrilo" value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-codigo">Código <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input id="art-codigo" placeholder="Ej. GN-001" value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-categoria">Categoría <span className="text-destructive">*</span></Label>
              <Select value={form.categoria_id} onValueChange={(v) => setForm((f) => ({ ...f, categoria_id: v }))}>
                <SelectTrigger id="art-categoria"><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-unidad">Unidad de medida <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Select value={form.unidad} onValueChange={(v) => setForm((f) => ({ ...f, unidad: v }))}>
                <SelectTrigger id="art-unidad"><SelectValue placeholder="Seleccionar unidad" /></SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u.valor} value={u.valor}>{u.etiqueta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-descripcion">Descripción <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input id="art-descripcion" placeholder="Descripción breve" value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>

            {/* Stock solo al crear */}
            {!editando && (
              <>
                <Separator />
                <p className="text-sm font-medium">Stock inicial <span className="text-muted-foreground font-normal text-xs">(opcional)</span></p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="art-ubicacion">Ubicación</Label>
                  <Select value={form.ubicacion_id} onValueChange={(v) => setForm((f) => ({ ...f, ubicacion_id: v }))}>
                    <SelectTrigger id="art-ubicacion"><SelectValue placeholder="Seleccionar ubicación" /></SelectTrigger>
                    <SelectContent>
                      {ubicaciones.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="art-stock">Cantidad actual</Label>
                    <Input id="art-stock" type="number" min="0" step="0.01" placeholder="0"
                      value={form.stock_inicial} disabled={!form.ubicacion_id}
                      onChange={(e) => setForm((f) => ({ ...f, stock_inicial: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="art-stock-min">Stock mínimo <span className="text-xs text-muted-foreground">(alerta)</span></Label>
                    <Input id="art-stock-min" type="number" min="0" step="0.01" placeholder="0"
                      value={form.stock_minimo} disabled={!form.ubicacion_id}
                      onChange={(e) => setForm((f) => ({ ...f, stock_minimo: e.target.value }))} />
                  </div>
                </div>
                {!form.ubicacion_id && (
                  <p className="text-xs text-muted-foreground -mt-2">Selecciona una ubicación para registrar el stock.</p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogAbierto(false); setEditando(null); setForm(formVacio) }}>Cancelar</Button>
            <Button onClick={onGuardar} disabled={isPending}>
              {isPending ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear artículo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar desactivar */}
      <Dialog open={!!confirmarBorrar} onOpenChange={(open) => { if (!open) setConfirmarBorrar(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Desactivar artículo</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres desactivar <strong>{confirmarBorrar?.nombre}</strong>? El artículo dejará de aparecer en el inventario activo pero no se eliminará.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarBorrar(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={onConfirmarBorrar} disabled={desactivarMutation.isPending}>
              {desactivarMutation.isPending ? 'Desactivando...' : 'Desactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Tab Movimientos ──────────────────────────────────────────────────────────

function TabMovimientos() {
  const { user } = useAuth()
  const {
    control, register, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaMovimientoForm>({
    resolver: zodResolver(esquemaMovimiento),
    defaultValues: { tipo: 'entrada', articulo_id: '', cantidad: 1 },
  })

  const tipoActual = watch('tipo')
  const mostrarOrigen = tipoActual === 'salida' || tipoActual === 'traslado'
  const mostrarDestino = tipoActual === 'entrada' || tipoActual === 'traslado'

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoMov>('todos')
  const filtros = filtroTipo !== 'todos' ? { tipo: filtroTipo } : undefined

  const { data, isFetching, isLoading, refetch } = useMovimientos(filtros)
  const { data: ubicacionesData } = useUbicaciones()
  const { data: articulosData } = useArticulos({ activo: true })
  const rows = data?.data ?? []
  const ubicaciones = ubicacionesData?.data ?? []
  const articulos = articulosData?.data ?? []
  const crearMutation = useCrearMovimiento()

  if (isLoading) return <SkeletonMovimientos />

  const onSubmit = async (valores: EntradaMovimientoForm) => {
    try {
      await crearMutation.mutateAsync({
        tipo: valores.tipo,
        motivo: valores.motivo || undefined,
        ubicacion_origen_id: valores.ubicacion_origen_id ? Number(valores.ubicacion_origen_id) : undefined,
        ubicacion_destino_id: valores.ubicacion_destino_id ? Number(valores.ubicacion_destino_id) : undefined,
        lineas: [{ articulo_id: Number(valores.articulo_id), cantidad: valores.cantidad }],
      })
      toast.success('Movimiento guardado')
      reset({ tipo: valores.tipo, articulo_id: '', cantidad: 1, motivo: '', ubicacion_origen_id: '', ubicacion_destino_id: '' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar nuevo movimiento</CardTitle>
          <CardDescription>Completa los datos para mantener trazabilidad y auditoría.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Tipo de movimiento</Label>
              <Controller name="tipo" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="salida">Salida</SelectItem>
                    <SelectItem value="traslado">Traslado</SelectItem>
                    <SelectItem value="ajuste">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Artículo</Label>
              <Controller name="articulo_id" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={!!errors.articulo_id}><SelectValue placeholder="Seleccionar artículo" /></SelectTrigger>
                  <SelectContent>
                    {articulos.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.nombre}{a.codigo ? ` (${a.codigo})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.articulo_id && <p className="text-xs text-destructive">{errors.articulo_id.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Cantidad</Label>
              <Input type="number" min="1" placeholder="Ej. 24" aria-invalid={!!errors.cantidad}
                {...register('cantidad', { valueAsNumber: true })} />
              {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label>Responsable</Label>
              <Input value={user?.displayName ?? '-'} disabled />
            </div>
            {mostrarOrigen && (
              <div className="flex flex-col gap-2">
                <Label>Ubicación origen</Label>
                <Controller name="ubicacion_origen_id" control={control} render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar origen" /></SelectTrigger>
                    <SelectContent>
                      {ubicaciones.map((ub) => <SelectItem key={ub.id} value={String(ub.id)}>{ub.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            )}
            {mostrarDestino && (
              <div className="flex flex-col gap-2">
                <Label>Ubicación destino</Label>
                <Controller name="ubicacion_destino_id" control={control} render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar destino" /></SelectTrigger>
                    <SelectContent>
                      {ubicaciones.map((ub) => <SelectItem key={ub.id} value={String(ub.id)}>{ub.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
            )}
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label>Observaciones</Label>
              <Input placeholder="Lote, motivo, destino, etc." {...register('motivo')} />
            </div>
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
                {isFetching ? 'Cargando...' : 'Refrescar'}
              </Button>
              <Button type="submit" disabled={isSubmitting || crearMutation.isPending}>
                {isSubmitting || crearMutation.isPending ? 'Guardando...' : 'Guardar movimiento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Historial de movimientos</CardTitle>
            <CardDescription>Registro completo de movimientos del inventario.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipoMov)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="traslado">Traslado</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <ArrowDownToLine className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No hay movimientos registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="hidden sm:table-cell">Origen → Destino</TableHead>
                    <TableHead className="hidden md:table-cell">Responsable</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const origenNombre = row.ubicacion_origen_id
                      ? (ubicaciones.find((u) => u.id === row.ubicacion_origen_id)?.nombre ?? `#${row.ubicacion_origen_id}`)
                      : null
                    const destinoNombre = row.ubicacion_destino_id
                      ? (ubicaciones.find((u) => u.id === row.ubicacion_destino_id)?.nombre ?? `#${row.ubicacion_destino_id}`)
                      : null
                    const varianteTipo = row.tipo === 'salida' ? 'destructive'
                      : row.tipo === 'entrada' ? 'secondary'
                      : 'outline'
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Badge variant={varianteTipo}>
                            {formatearTipoMovimiento(row.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {row.lineas?.[0]?.articulo ?? (row.lineas?.[0]?.articulo_id ? `#${row.lineas[0].articulo_id}` : '—')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.lineas?.[0]?.cantidad ?? '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                          {origenNombre && destinoNombre
                            ? `${origenNombre} → ${destinoNombre}`
                            : origenNombre ?? destinoNombre ?? '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {row.usuario?.nombre_visible ?? '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right text-muted-foreground text-xs whitespace-nowrap">
                          {formatearFechaHora(row.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Tab Alertas ──────────────────────────────────────────────────────────────

function TabAlertas() {
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoAlerta>('todos')
  const [filtroSeveridad, setFiltroSeveridad] = useState<FiltroSeveridad>('todas')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')

  const filtros = {
    ...(filtroTipo !== 'todos' ? { tipo: filtroTipo } : {}),
    ...(filtroSeveridad !== 'todas' ? { severidad: filtroSeveridad } : {}),
    ...(filtroEstado !== 'todos' ? { estado: filtroEstado } : {}),
  }

  const { data, isLoading } = useAlertas(filtros)
  const confirmarMutation = useConfirmarAlerta()
  const resolverMutation = useResolverAlerta()
  const alertas = data?.data ?? []

  if (isLoading) return <SkeletonAlertas />

  const onConfirmar = async (id: number) => {
    try {
      await confirmarMutation.mutateAsync(id)
      toast.success('Alerta confirmada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo confirmar la alerta')
    }
  }

  const onResolver = async (id: number) => {
    try {
      await resolverMutation.mutateAsync(id)
      toast.success('Alerta resuelta')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo resolver la alerta')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros inline */}
      <div className="flex flex-wrap gap-2">
        <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipoAlerta)}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="stock_bajo">Stock bajo</SelectItem>
            <SelectItem value="caducidad">Caducidad</SelectItem>
            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            <SelectItem value="inactividad">Inactividad</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroSeveridad} onValueChange={(v) => setFiltroSeveridad(v as FiltroSeveridad)}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Severidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Toda severidad</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as FiltroEstado)}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="abierta">Abierta</SelectItem>
            <SelectItem value="confirmada">Confirmada</SelectItem>
            <SelectItem value="resuelta">Resuelta</SelectItem>
            <SelectItem value="ignorada">Ignorada</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto self-center text-xs text-muted-foreground">
          {alertas.length} alerta{alertas.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-green-500/10">
                <ArrowUpFromLine className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Sin alertas activas</p>
                <p className="text-xs text-muted-foreground mt-1">Todo el inventario está en orden.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                    <TableHead>Severidad</TableHead>
                    <TableHead className="hidden md:table-cell">Estado</TableHead>
                    <TableHead className="hidden sm:table-cell">Generada</TableHead>
                    <GuardRol roles={['administrador', 'profesor']}>
                      <TableHead className="text-right">Acción</TableHead>
                    </GuardRol>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((alerta) => (
                    <TableRow key={alerta.id}>
                      <TableCell className="font-medium text-sm">
                        {alerta.articulo?.nombre ?? '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {formatearTipoAlerta(alerta.tipo)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={varianteSeveridad(alerta.severidad)}>
                          {formatearSeveridad(alerta.severidad)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{formatearEstadoAlerta(alerta.estado)}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                        {formatearFechaRelativa(alerta.generada_en)}
                      </TableCell>
                      <GuardRol roles={['administrador', 'profesor']}>
                        <TableCell className="text-right">
                          {alerta.estado === 'abierta' && (
                            <Button variant="outline" size="sm"
                              onClick={() => void onConfirmar(alerta.id)}
                              disabled={confirmarMutation.isPending}>
                              Confirmar
                            </Button>
                          )}
                          {alerta.estado === 'confirmada' && (
                            <Button variant="outline" size="sm"
                              onClick={() => void onResolver(alerta.id)}
                              disabled={resolverMutation.isPending}>
                              Resolver
                            </Button>
                          )}
                        </TableCell>
                      </GuardRol>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Página principal con tabs ────────────────────────────────────────────────

export default function Articulos() {
  const { data: alertasData } = useAlertas({ estado: 'abierta' })
  const alertasAbiertas = alertasData?.data?.length ?? 0

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Inventario</h2>
        <p className="text-sm text-muted-foreground">
          Artículos, movimientos de stock y alertas del laboratorio.
        </p>
      </div>

      <Tabs defaultValue="articulos" className="flex flex-col gap-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="articulos" className="flex-1 sm:flex-none gap-1.5">
            Artículos
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="flex-1 sm:flex-none gap-1.5">
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex-1 sm:flex-none gap-1.5 relative">
            Alertas
            {alertasAbiertas > 0 && (
              <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {alertasAbiertas > 9 ? '9+' : alertasAbiertas}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articulos">
          <TabArticulos />
        </TabsContent>

        <TabsContent value="movimientos">
          <TabMovimientos />
        </TabsContent>

        <TabsContent value="alertas">
          <TabAlertas />
        </TabsContent>
      </Tabs>
    </main>
  )
}
