/**
 * Página de listado de categorías.
 * Requisitos: 5.4, 5.5, 10.3, 10.5
 */
import { useState } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GuardRol } from '@/components/auth/GuardRol'
import { useCategorias, useCrearCategoria } from '@/hooks/queries'
import { toast } from 'sonner'

export default function ListaCategorias() {
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [nombre, setNombre] = useState('')

  const { data, isLoading } = useCategorias()
  const crearMutation = useCrearCategoria()

  const categorias = data?.data ?? []

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
          <CardTitle>Listado de categorías</CardTitle>
          <CardDescription>
            {isLoading ? 'Cargando...' : `${categorias.length} categoría${categorias.length !== 1 ? 's' : ''} registrada${categorias.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Artículos activos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorias.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                    No hay categorías registradas.
                  </TableCell>
                </TableRow>
              )}
              {categorias.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.nombre}</TableCell>
                  <TableCell className="text-right">{cat.total_articulos}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
    </main>
  )
}
