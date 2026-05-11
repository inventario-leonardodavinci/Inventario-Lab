import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardPremium } from '@/components/ui/card-premium'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BadgePremium } from '@/components/ui/badge-premium'
import { useCrearSubUbicacion, useActualizarSubUbicacion, useEliminarSubUbicacion, useSubUbicacionesPorUbicacion } from '@/hooks/queries'
import { formatearTipoUbicacion } from '@/utils/formatters'
import type { Ubicacion, SubUbicacion } from '@/types'
import { GuardRol } from '@/components/auth/GuardRol'
import { toast } from 'sonner'
import { Archive, Refrigerator, Layers, Box, Eye, HelpCircle, Pencil, Trash2, Plus } from 'lucide-react'

const ICONO_TIPO = {
  armario: Archive,
  nevera: Refrigerator,
  estanteria: Layers,
  cajon: Box,
  vitrina: Eye,
  otro: HelpCircle,
} as const

const COLOR_TIPO: Record<string, string> = {
  armario: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  nevera: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  estanteria: 'bg-green-500/10 text-green-600 border-green-500/20',
  cajon: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  vitrina: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  otro: 'bg-muted text-muted-foreground border-border',
}

interface TarjetaUbicacionProps {
  ub: Ubicacion
  onEdit: (ub: Ubicacion) => void
}

export function TarjetaUbicacion({ ub, onEdit }: TarjetaUbicacionProps) {
  const [crearSubDialog, setCrearSubDialog] = useState(false)
  const [editarSub, setEditarSub] = useState<SubUbicacion | null>(null)
  const [eliminarSub, setEliminarSub] = useState<SubUbicacion | null>(null)
  const [subNombre, setSubNombre] = useState('')
  const [subDescripcion, setSubDescripcion] = useState('')

  const { data: subData } = useSubUbicacionesPorUbicacion(ub.id)
  const crearSubMutation = useCrearSubUbicacion()
  const actualizarSubMutation = useActualizarSubUbicacion()
  const eliminarSubMutation = useEliminarSubUbicacion()

  const subUbicaciones = subData?.data ?? []

  const Icono = ICONO_TIPO[ub.tipo] ?? HelpCircle
  const colorClase = COLOR_TIPO[ub.tipo] ?? 'bg-muted text-muted-foreground'

  const handleCrearSub = async () => {
    if (!subNombre.trim()) { toast.error('El nombre es obligatorio'); return }
    try {
      await crearSubMutation.mutateAsync({
        ubicacion_id: ub.id,
        nombre: subNombre.trim(),
        descripcion: subDescripcion.trim() || undefined,
      })
      toast.success('Sub-ubicación creada')
      setCrearSubDialog(false)
      setSubNombre('')
      setSubDescripcion('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear sub-ubicación')
    }
  }

  const handleActualizarSub = async () => {
    if (!editarSub) return
    if (!subNombre.trim()) { toast.error('El nombre es obligatorio'); return }
    try {
      await actualizarSubMutation.mutateAsync({
        id: editarSub.id,
        datos: { nombre: subNombre.trim(), descripcion: subDescripcion.trim() || undefined },
      })
      toast.success('Sub-ubicación actualizada')
      setEditarSub(null)
      setSubNombre('')
      setSubDescripcion('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar sub-ubicación')
    }
  }

  const handleEliminarSub = async () => {
    if (!eliminarSub) return
    try {
      await eliminarSubMutation.mutateAsync(eliminarSub.id)
      toast.success('Sub-ubicación eliminada')
      setEliminarSub(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar sub-ubicación')
    }
  }

  return (
    <>
      <CardPremium variant="elevated" delay={0} className="group relative">
        <div className="flex flex-col gap-3 p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${colorClase}`}>
              <Icono className="size-4" />
            </div>
            <div className="flex flex-1 flex-col min-w-0 gap-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{ub.nombre}</span>
                <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                  {formatearTipoUbicacion(ub.tipo)}
                </Badge>
              </div>
              {ub.descripcion && (
                <span className="text-xs text-muted-foreground truncate">{ub.descripcion}</span>
              )}
            </div>
            <GuardRol roles={['profesor']}>
              <Button variant="ghost" size="icon" className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onEdit(ub)} aria-label="Editar ubicación">
                <Pencil className="size-3.5" />
              </Button>
            </GuardRol>
          </div>

          {/* Sub-ubicaciones */}
          {subUbicaciones.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {subUbicaciones.map((sub) => (
                <BadgePremium key={sub.id} variant="soft" size="sm">
                  <span className="text-xs">{sub.nombre}</span>
                  <GuardRol roles={['profesor']}>
                    <button onClick={() => { setEditarSub(sub); setSubNombre(sub.nombre); setSubDescripcion(sub.descripcion ?? '') }}
                      className="ml-0.5 rounded p-0.5 hover:bg-foreground/10 transition-colors" aria-label="Editar sub-ubicación">
                      <Pencil className="size-2.5" />
                    </button>
                    <button onClick={() => setEliminarSub(sub)}
                      className="rounded p-0.5 hover:bg-destructive/20 text-destructive/60 hover:text-destructive transition-colors" aria-label="Eliminar sub-ubicación">
                      <Trash2 className="size-2.5" />
                    </button>
                  </GuardRol>
                </BadgePremium>
              ))}
            </div>
          )}

          {/* Add sub-ubicacion button */}
          <GuardRol roles={['profesor']}>
            <button onClick={() => { setCrearSubDialog(true); setSubNombre(''); setSubDescripcion('') }}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors self-start">
              <Plus className="size-3" /> Añadir sub-ubicación
            </button>
          </GuardRol>
        </div>
      </CardPremium>

      {/* Dialog: Crear sub-ubicación */}
      <Dialog open={crearSubDialog} onOpenChange={setCrearSubDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nueva sub-ubicación</DialogTitle>
            <DialogDescription>Agrega una balda, estante o compartimento a {ub.nombre}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-nombre">Nombre <span className="text-destructive">*</span></Label>
              <Input id="sub-nombre" placeholder="Ej. Balda 1" value={subNombre}
                onChange={(e) => setSubNombre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="sub-descripcion">Descripción (opcional)</Label>
              <Input id="sub-descripcion" placeholder="Descripción adicional" value={subDescripcion}
                onChange={(e) => setSubDescripcion(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCrearSubDialog(false)}>Cancelar</Button>
            <Button onClick={handleCrearSub} disabled={crearSubMutation.isPending}>
              {crearSubMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar sub-ubicación */}
      <Dialog open={!!editarSub} onOpenChange={(open) => { if (!open) setEditarSub(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar sub-ubicación</DialogTitle>
            <DialogDescription>Modifica los datos de la sub-ubicación.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-sub-nombre">Nombre <span className="text-destructive">*</span></Label>
              <Input id="edit-sub-nombre" placeholder="Ej. Balda 1" value={subNombre}
                onChange={(e) => setSubNombre(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-sub-descripcion">Descripción (opcional)</Label>
              <Input id="edit-sub-descripcion" placeholder="Descripción adicional" value={subDescripcion}
                onChange={(e) => setSubDescripcion(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditarSub(null)}>Cancelar</Button>
            <Button onClick={handleActualizarSub} disabled={actualizarSubMutation.isPending}>
              {actualizarSubMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar eliminación sub-ubicación */}
      <Dialog open={!!eliminarSub} onOpenChange={(open) => { if (!open) setEliminarSub(null) }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>¿Eliminar sub-ubicación?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente <strong>{eliminarSub?.nombre}</strong>. Los artículos asociados quedarán sin sub-ubicación.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminarSub(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminarSub} disabled={eliminarSubMutation.isPending}>
              {eliminarSubMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
