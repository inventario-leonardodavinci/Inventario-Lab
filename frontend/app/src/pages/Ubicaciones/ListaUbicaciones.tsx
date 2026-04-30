/**
 * Página de listado de ubicaciones.
 * Requisitos: 4.5, 4.6, 10.3, 10.5
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
import { useUbicaciones, useCrearUbicacion } from '@/hooks/queries'
import { formatearTipoUbicacion } from '@/utils/formatters'
import type { TipoUbicacion } from '@/types'
import { toast } from 'sonner'

interface FormNuevaUbicacion {
  nombre: string
  tipo: TipoUbicacion | ''
  descripcion: string
}

const formVacio: FormNuevaUbicacion = {
  nombre: '',
  tipo: '',
  descripcion: '',
}

const TIPOS_UBICACION: TipoUbicacion[] = ['armario', 'nevera', 'estanteria', 'cajon', 'vitrina', 'otro']

export default function ListaUbicaciones() {
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [form, setForm] = useState<FormNuevaUbicacion>(formVacio)

  const { data, isLoading } = useUbicaciones()
  const crearMutation = useCrearUbicacion()

  const ubicaciones = data?.data ?? []

  const onGuardar = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre de la ubicación es obligatorio')
      return
    }
    if (!form.tipo) {
      toast.error('El tipo de ubicación es obligatorio')
      return
    }
    try {
      await crearMutation.mutateAsync({
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        descripcion: form.descripcion.trim() || undefined,
      })
      toast.success('Ubicación creada correctamente')
      setDialogAbierto(false)
      setForm(formVacio)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la ubicación')
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Ubicaciones</h2>
          <p className="text-sm text-muted-foreground">
            Lugares físicos donde se almacenan los artículos del laboratorio.
          </p>
        </div>
        <GuardRol roles={['administrador']}>
          <Button onClick={() => setDialogAbierto(true)}>Nueva ubicación</Button>
        </GuardRol>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de ubicaciones</CardTitle>
          <CardDescription>
            {isLoading ? 'Cargando...' : `${ubicaciones.length} ubicación${ubicaciones.length !== 1 ? 'es' : ''} registrada${ubicaciones.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ubicaciones.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No hay ubicaciones registradas.
                  </TableCell>
                </TableRow>
              )}
              {ubicaciones.map((ub) => (
                <TableRow key={ub.id}>
                  <TableCell className="font-medium">{ub.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatearTipoUbicacion(ub.tipo)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{ub.descripcion ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Nueva ubicación */}
      <Dialog open={dialogAbierto} onOpenChange={setDialogAbierto}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Nueva ubicación</DialogTitle>
            <DialogDescription>
              Registra un nuevo lugar de almacenamiento en el laboratorio.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ub-nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ub-nombre"
                placeholder="Ej. Armario A1"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ub-tipo">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.tipo}
                onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as TipoUbicacion }))}
              >
                <SelectTrigger id="ub-tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_UBICACION.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {formatearTipoUbicacion(tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ub-descripcion">Descripción (opcional)</Label>
              <Input
                id="ub-descripcion"
                placeholder="Descripción o notas adicionales"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogAbierto(false); setForm(formVacio) }}>
              Cancelar
            </Button>
            <Button onClick={onGuardar} disabled={crearMutation.isPending}>
              {crearMutation.isPending ? 'Guardando...' : 'Guardar ubicación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
