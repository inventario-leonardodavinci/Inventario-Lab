import { useState } from 'react'
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
import { GuardRol } from '@/components/auth/GuardRol'
import {
  useArticulos, useCategorias, useUbicaciones,
  useCrearArticulo, useActualizarArticulo, useDesactivarArticulo,
} from '@/hooks/queries'
import { Pencil, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { Articulo } from '@/types'
import { SkeletonArticulos } from '@/components/ui/PageSkeleton'

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

export default function Articulos() {
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
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Artículos</h2>
          <p className="text-sm text-muted-foreground">Gestión de artículos del inventario del laboratorio.</p>
        </div>
        <GuardRol roles={['administrador', 'profesor']}>
          <Button onClick={abrirCrear}>Nuevo artículo</Button>
        </GuardRol>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y filtros</CardTitle>
          <CardDescription>Filtra por nombre, código o estado.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-[6px] text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por código o nombre..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onBuscar() }} />
          </div>
          <Select value={filtroActivo} onValueChange={(v) => setFiltroActivo(v as FiltroActivo)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Solo activos</SelectItem>
              <SelectItem value="inactivo">Solo inactivos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onBuscar} disabled={isFetching}>
            {isFetching ? 'Buscando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de artículos</CardTitle>
          <CardDescription>{rows.length} artículo{rows.length !== 1 ? 's' : ''} encontrado{rows.length !== 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Activo</TableHead>
                <GuardRol roles={['administrador', 'profesor']}>
                  <TableHead className="text-right">Acciones</TableHead>
                </GuardRol>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No se encontraron artículos.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.id} className={!row.activo ? 'opacity-50' : undefined}>
                  <TableCell className="font-medium">{row.codigo ?? '-'}</TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>{row.categoria ?? '-'}</TableCell>
                  <TableCell>{row.unidad ?? '-'}</TableCell>
                  <TableCell>{row.stock_total}</TableCell>
                  <TableCell>
                    <Badge variant={row.estado_stock === 'critico' ? 'destructive' : 'secondary'}>
                      {row.estado_stock === 'critico' ? 'Crítico' : 'Estable'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.activo ? <Badge variant="secondary">Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}
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
    </main>
  )
}
