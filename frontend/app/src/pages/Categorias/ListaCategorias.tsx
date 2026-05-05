import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { GuardRol } from '@/components/auth/GuardRol'
import { useCategorias, useCrearCategoria, useEliminarCategoria } from '@/hooks/queries'
import { FolderOpen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SkeletonCategorias } from '@/components/ui/PageSkeleton'

export default function ListaCategorias() {
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState<{ id: number; nombre: string } | null>(null)

  const { data, isLoading } = useCategorias()
  const crearMutation = useCrearCategoria()
  const eliminarMutation = useEliminarCategoria()

  const categorias = data?.data ?? []

  if (isLoading) return <SkeletonCategorias />

  const onGuardar = async () => {
    if (!nombre.trim()) {
      toast.error('El nombre de la categoría es obligatorio')
      return
    }
    try {
      await crearMutation.mutateAsync({ nombre: nombre.trim() })
      toast.success('Categoría creada correctamente')
      setDialogAbierto(false)
      setNombre('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la categoría')
    }
  }

  const onEliminar = async () => {
    if (!confirmarEliminar) return
    try {
      await eliminarMutation.mutateAsync(confirmarEliminar.id)
      toast.success(`Categoría "${confirmarEliminar.nombre}" eliminada`)
      setConfirmarEliminar(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la categoría')
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Categorías</h2>
          <p className="text-sm text-muted-foreground">
            Clasificación temática de los artículos del inventario.
          </p>
        </div>
        <GuardRol roles={['administrador']}>
          <Button onClick={() => setDialogAbierto(true)}>Nueva categoría</Button>
        </GuardRol>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="size-4 text-primary" />
            </div>
            Listado de categorías
          </CardTitle>
          <CardDescription>
            {categorias.length} categoría{categorias.length !== 1 ? 's' : ''} registrada{categorias.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Sin categorías</p>
                <p className="text-xs text-muted-foreground mt-1">Crea la primera categoría para clasificar los artículos.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Artículos activos</TableHead>
                  <GuardRol roles={['administrador']}>
                    <TableHead className="text-right">Acciones</TableHead>
                  </GuardRol>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.nombre}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={cat.total_articulos > 0 ? 'secondary' : 'outline'}>
                        {cat.total_articulos}
                      </Badge>
                    </TableCell>
                    <GuardRol roles={['administrador']}>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setConfirmarEliminar({ id: cat.id, nombre: cat.nombre })}
                          disabled={cat.total_articulos > 0}
                          title={cat.total_articulos > 0 ? 'Tiene artículos asociados' : 'Eliminar categoría'}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </GuardRol>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nueva categoría */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
            <DialogDescription>
              Crea una nueva categoría para clasificar los artículos del inventario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cat-nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-nombre"
                placeholder="Ej. Reactivos químicos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void onGuardar() }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogAbierto(false); setNombre('') }}>
              Cancelar
            </Button>
            <Button onClick={onGuardar} disabled={crearMutation.isPending}>
              {crearMutation.isPending ? 'Guardando...' : 'Guardar categoría'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={!!confirmarEliminar} onOpenChange={(open) => { if (!open) setConfirmarEliminar(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar categoría</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres eliminar <strong>{confirmarEliminar?.nombre}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onEliminar} disabled={eliminarMutation.isPending}>
              {eliminarMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
