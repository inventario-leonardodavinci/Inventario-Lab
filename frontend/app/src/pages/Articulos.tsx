/**
 * Página de artículos del inventario con CRUD completo.
 * Requisitos: 3.6, 3.7, 3.8, 10.3, 10.5
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GuardRol } from '@/components/auth/GuardRol'
import { useArticulos, useCategorias, useCrearArticulo, useDesactivarArticulo } from '@/hooks/queries'
import { Search } from 'lucide-react'
import { toast } from 'sonner'

type FiltroActivo = 'todos' | 'activo' | 'inactivo'

interface FormNuevoArticulo {
  nombre: string
  codigo: string
  descripcion: string
  categoria_id: string
  unidad: string
}

const formVacio: FormNuevoArticulo = {
  nombre: '',
  codigo: '',
  descripcion: '',
  categoria_id: '',
  unidad: '',
}

export default function Articulos() {
  const [search, setSearch] = useState('')
  const [searchActivo, setSearchActivo] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>('todos')
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [form, setForm] = useState<FormNuevoArticulo>(formVacio)

  const filtros = {
    search: searchActivo,
    ...(filtroActivo !== 'todos' ? { activo: filtroActivo === 'activo' } : {}),
  }

  const { data, isFetching } = useArticulos(filtros)
  const { data: categoriasData } = useCategorias()
  const crearMutation = useCrearArticulo()
  const desactivarMutation = useDesactivarArticulo()

  const rows = data?.data ?? []
  const categorias = categoriasData?.data ?? []

  const onBuscar = () => setSearchActivo(search)

  const onGuardar = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre del artículo es obligatorio')
      return
    }
    try {
      await crearMutation.mutateAsync({
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim() || undefined,
        descripcion: form.descripcion.trim() || undefined,
        categoria_id: form.categoria_id ? Number(form.categoria_id) : 0,
        unidad: form.unidad.trim() || undefined,
      })
      toast.success('Artículo creado correctamente')
      setDialogAbierto(false)
      setForm(formVacio)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el artículo')
    }
  }

  const onDesactivar = async (id: number, nombre: string) => {
    try {
      await desactivarMutation.mutateAsync(id)
      toast.success(`Artículo "${nombre}" desactivado`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desactivar el artículo')
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Artículos</h2>
          <p className="text-sm text-muted-foreground">
            Gestión de artículos del inventario del laboratorio.
          </p>
        </div>
        <GuardRol roles={['administrador', 'profesor']}>
          <Button onClick={() => setDialogAbierto(true)}>Nuevo artículo</Button>
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
            <Input
              className="pl-9"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onBuscar() }}
            />
          </div>
          <Select
            value={filtroActivo}
            onValueChange={(v) => setFiltroActivo(v as FiltroActivo)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
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
          <CardDescription>
            {rows.length} artículo{rows.length !== 1 ? 's' : ''} encontrado{rows.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Stock total</TableHead>
                <TableHead>Estado stock</TableHead>
                <TableHead>Activo</TableHead>
                <GuardRol roles={['administrador']}>
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
                <TableRow
                  key={row.id}
                  className={!row.activo ? 'opacity-50' : undefined}
                >
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
                    {row.activo
                      ? <Badge variant="secondary">Activo</Badge>
                      : <Badge variant="outline">Inactivo</Badge>
                    }
                  </TableCell>
                  <GuardRol roles={['administrador']}>
                    <TableCell className="text-right">
                      {row.activo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void onDesactivar(row.id, row.nombre)}
                          disabled={desactivarMutation.isPending}
                        >
                          Desactivar
                        </Button>
                      )}
                    </TableCell>
                  </GuardRol>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Nuevo artículo */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nuevo artículo</DialogTitle>
            <DialogDescription>
              Completa los datos para registrar un nuevo artículo en el inventario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="art-nombre"
                placeholder="Ej. Guantes de nitrilo"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-codigo">Código (opcional)</Label>
              <Input
                id="art-codigo"
                placeholder="Ej. GN-001"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-descripcion">Descripción (opcional)</Label>
              <Input
                id="art-descripcion"
                placeholder="Descripción breve del artículo"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-categoria">Categoría (opcional)</Label>
              <Select
                value={form.categoria_id}
                onValueChange={(v) => setForm((f) => ({ ...f, categoria_id: v }))}
              >
                <SelectTrigger id="art-categoria">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="art-unidad">Unidad (opcional)</Label>
              <Input
                id="art-unidad"
                placeholder="Ej. uds, kg, L"
                value={form.unidad}
                onChange={(e) => setForm((f) => ({ ...f, unidad: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogAbierto(false); setForm(formVacio) }}>
              Cancelar
            </Button>
            <Button onClick={onGuardar} disabled={crearMutation.isPending}>
              {crearMutation.isPending ? 'Guardando...' : 'Guardar artículo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
