import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { CardPremium, EmptyStatePremium } from '@/components/ui/card-premium'
import { PageHeader, PageSection } from '@/components/ui/page-header'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GuardRol } from '@/components/auth/GuardRol'
import {
  useUbicaciones,
  useCrearUbicacion,
  useActualizarUbicacion,
} from '@/hooks/queries'
import { formatearTipoUbicacion } from '@/utils/formatters'
import { TarjetaUbicacion } from './ubicaciones/TarjetaUbicacion'
import type { TipoUbicacion, Ubicacion } from '@/types'
import { toast } from 'sonner'
import { SkeletonUbicaciones } from '@/components/ui/PageSkeleton'
import { MapPin } from 'lucide-react'

const TIPOS_UBICACION: TipoUbicacion[] = ['armario', 'nevera', 'estanteria', 'cajon', 'vitrina', 'otro']

function agruparUbicaciones(ubicaciones: Ubicacion[]) {
  const altos = ubicaciones.filter(u => u.nombre.toLowerCase().startsWith('armario alto'))
  const bajos = ubicaciones.filter(u => u.nombre.toLowerCase().startsWith('armario bajo'))
  const otros = ubicaciones.filter(u => !u.nombre.toLowerCase().startsWith('armario'))
  return [
    { label: 'Armarios altos', items: altos },
    { label: 'Armarios bajos', items: bajos },
    { label: 'Otras ubicaciones', items: otros },
  ].filter(g => g.items.length > 0)
}

interface FormUbicacion {
  nombre: string
  tipo: TipoUbicacion | ''
  descripcion: string
}

const formVacio: FormUbicacion = { nombre: '', tipo: '', descripcion: '' }

export default function ListaUbicaciones() {
  const [crearDialog, setCrearDialog] = useState(false)
  const [editarUb, setEditarUb] = useState<Ubicacion | null>(null)
  const [form, setForm] = useState<FormUbicacion>(formVacio)

  const { data, isLoading } = useUbicaciones()
  const crearMutation = useCrearUbicacion()
  const actualizarMutation = useActualizarUbicacion()

  const ubicaciones = data?.data ?? []

  const resetForm = useCallback(() => setForm(formVacio), [])

  const abrirCrear = () => {
    resetForm()
    setCrearDialog(true)
  }

  const abrirEditar = (ub: Ubicacion) => {
    setForm({ nombre: ub.nombre, tipo: ub.tipo, descripcion: ub.descripcion ?? '' })
    setEditarUb(ub)
  }

  const onGuardarCrear = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre de la ubicación es obligatorio'); return }
    if (!form.tipo) { toast.error('El tipo de ubicación es obligatorio'); return }
    try {
      await crearMutation.mutateAsync({
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        descripcion: form.descripcion.trim() || undefined,
      })
      toast.success('Ubicación creada correctamente')
      setCrearDialog(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear la ubicación')
    }
  }

  const onGuardarEditar = async () => {
    if (!editarUb) return
    if (!form.nombre.trim()) { toast.error('El nombre de la ubicación es obligatorio'); return }
    if (!form.tipo) { toast.error('El tipo de ubicación es obligatorio'); return }
    try {
      await actualizarMutation.mutateAsync({
        id: editarUb.id,
        datos: {
          nombre: form.nombre.trim(),
          tipo: form.tipo,
          descripcion: form.descripcion.trim() || undefined,
        },
      })
      toast.success('Ubicación actualizada correctamente')
      setEditarUb(null)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la ubicación')
    }
  }

  if (isLoading) return <SkeletonUbicaciones />

  const grupos = agruparUbicaciones(ubicaciones)

  return (
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <PageHeader
        title="Ubicaciones"
        description="Lugares físicos donde se almacenan los artículos del laboratorio."
        icon={<MapPin className="size-5" />}
        iconColor="bg-gradient-to-br from-emerald-500 to-teal-400 text-white"
        action={
          <GuardRol roles={['profesor']}>
            <Button className="btn-shine" onClick={abrirCrear}>Nueva ubicación</Button>
          </GuardRol>
        }
      />

      {ubicaciones.length === 0 ? (
        <PageSection delay={0.1}>
          <CardPremium variant="elevated" delay={0}>
            <div className="p-8">
              <EmptyStatePremium
                icon={<MapPin className="size-6 text-muted-foreground" />}
                title="Sin ubicaciones"
                description="Registra el primer lugar de almacenamiento."
              />
            </div>
          </CardPremium>
        </PageSection>
      ) : (
        <div className="flex flex-col gap-6">
          {grupos.map((grupo, gi) => (
            <PageSection key={grupo.label} delay={0.1 + gi * 0.05}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-foreground">{grupo.label}</h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {grupo.items.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {grupo.items.map(ub => (
                  <TarjetaUbicacion key={ub.id} ub={ub} onEdit={abrirEditar} />
                ))}
              </div>
            </PageSection>
          ))}
        </div>
      )}

      {/* Dialog: Nueva ubicación */}
      <Dialog open={crearDialog} onOpenChange={(open) => { if (!open) { setCrearDialog(false); resetForm() } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Nueva ubicación</DialogTitle>
            <DialogDescription>Registra un nuevo lugar de almacenamiento en el laboratorio.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ub-nombre">Nombre <span className="text-destructive">*</span></Label>
              <Input id="ub-nombre" placeholder="Ej. Armario A1"
                value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ub-tipo">Tipo <span className="text-destructive">*</span></Label>
              <Select value={form.tipo} onValueChange={(v) => setForm(f => ({ ...f, tipo: v as TipoUbicacion }))}>
                <SelectTrigger id="ub-tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_UBICACION.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{formatearTipoUbicacion(tipo)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ub-descripcion">Descripción (opcional)</Label>
              <Input id="ub-descripcion" placeholder="Descripción o notas adicionales"
                value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCrearDialog(false); resetForm() }}>Cancelar</Button>
            <Button onClick={onGuardarCrear} disabled={crearMutation.isPending}>
              {crearMutation.isPending ? 'Guardando...' : 'Guardar ubicación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar ubicación */}
      <Dialog open={!!editarUb} onOpenChange={(open) => { if (!open) { setEditarUb(null); resetForm() } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Editar ubicación</DialogTitle>
            <DialogDescription>Modifica los datos de la ubicación.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-ub-nombre">Nombre <span className="text-destructive">*</span></Label>
              <Input id="edit-ub-nombre" placeholder="Ej. Armario A1"
                value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-ub-tipo">Tipo <span className="text-destructive">*</span></Label>
              <Select value={form.tipo} onValueChange={(v) => setForm(f => ({ ...f, tipo: v as TipoUbicacion }))}>
                <SelectTrigger id="edit-ub-tipo">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_UBICACION.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{formatearTipoUbicacion(tipo)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-ub-descripcion">Descripción (opcional)</Label>
              <Input id="edit-ub-descripcion" placeholder="Descripción o notas adicionales"
                value={form.descripcion} onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditarUb(null); resetForm() }}>Cancelar</Button>
            <Button onClick={onGuardarEditar} disabled={actualizarMutation.isPending}>
              {actualizarMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
