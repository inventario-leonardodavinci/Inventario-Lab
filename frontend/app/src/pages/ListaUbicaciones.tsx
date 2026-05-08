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
import { GuardRol } from '@/components/auth/GuardRol'
import { useUbicaciones, useCrearUbicacion } from '@/hooks/queries'
import { formatearTipoUbicacion } from '@/utils/formatters'
import type { TipoUbicacion } from '@/types'
import { toast } from 'sonner'
import { SkeletonUbicaciones } from '@/components/ui/PageSkeleton'
import { MapPin, Refrigerator, Archive, Layers, Eye, Box, HelpCircle } from 'lucide-react'

// Icono por tipo de ubicación
const ICONO_TIPO: Record<TipoUbicacion, React.ElementType> = {
  armario: Archive,
  nevera: Refrigerator,
  estanteria: Layers,
  cajon: Box,
  vitrina: Eye,
  otro: HelpCircle,
}

const COLOR_TIPO: Record<TipoUbicacion, string> = {
  armario: 'bg-amber-500/10 text-amber-600',
  nevera: 'bg-blue-500/10 text-blue-600',
  estanteria: 'bg-green-500/10 text-green-600',
  cajon: 'bg-purple-500/10 text-purple-600',
  vitrina: 'bg-pink-500/10 text-pink-600',
  otro: 'bg-muted text-muted-foreground',
}

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

  if (isLoading) return <SkeletonUbicaciones />

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
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="page-section flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Ubicaciones</h2>
          <p className="text-sm text-muted-foreground">
            Lugares físicos donde se almacenan los artículos del laboratorio.
          </p>
        </div>
        <GuardRol roles={['profesor']}>
          <Button onClick={() => setDialogAbierto(true)}>Nueva ubicación</Button>
        </GuardRol>
      </div>

      <Card className="page-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <MapPin className="size-4 text-primary" />
            </div>
            Listado de ubicaciones
          </CardTitle>
          <CardDescription>
            {ubicaciones.length} ubicación{ubicaciones.length !== 1 ? 'es' : ''} registrada{ubicaciones.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ubicaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <MapPin className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Sin ubicaciones</p>
                <p className="text-xs text-muted-foreground mt-1">Registra el primer lugar de almacenamiento.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {ubicaciones.map((ub) => {
                const Icono = ICONO_TIPO[ub.tipo] ?? HelpCircle
                const colorClase = COLOR_TIPO[ub.tipo] ?? 'bg-muted text-muted-foreground'
                return (
                  <div key={ub.id} className="flex items-center gap-3 py-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colorClase}`}>
                      <Icono className="size-4" />
                    </div>
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="font-medium text-sm">{ub.nombre}</span>
                      {ub.descripcion && (
                        <span className="text-xs text-muted-foreground truncate">{ub.descripcion}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {formatearTipoUbicacion(ub.tipo)}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
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
