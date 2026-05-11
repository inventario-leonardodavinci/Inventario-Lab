import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMantenimiento, useCrearActivo, useActualizarActivo, useEliminarActivo } from '@/hooks/queries'
import { GuardRol } from '@/components/auth/GuardRol'
import { toast } from 'sonner'
import type { ActivoMantenimiento, Articulo, EstadoActivo } from '@/types'
import { SkeletonMantenimiento } from '@/components/ui/PageSkeleton'
import { ArticuloCombobox } from '@/components/ui/articulo-combobox'
import { DatePickerSimple } from '@/components/ui/date-picker'
import { 
  Wrench, Plus, Check, ChevronsUpDown, CalendarDays, Clock, Loader2, 
  Pencil, Trash2, AlertTriangle, CheckCircle2, Building2, Hash 
} from 'lucide-react'
import { formatearEstadoActivo, formatearFecha } from '@/utils/formatters'
import { cn } from '@/lib/utils'
import { addDays, format, parseISO } from 'date-fns'

// Re-exportamos el tipo para compatibilidad
export type { ActivoMantenimiento }

// ─── Constantes ───────────────────────────────────────────────────────────────

const varianteEstado: Record<EstadoActivo, 'secondary' | 'outline' | 'default' | 'destructive'> = {
  operativo: 'secondary',
  mantenimiento_pendiente: 'default',
  en_mantenimiento: 'default',
  fuera_servicio: 'destructive',
  retirado: 'outline',
}

const colorEstado: Record<EstadoActivo, string> = {
  operativo: 'bg-green-500/10 text-green-600 border-green-200',
  mantenimiento_pendiente: 'bg-amber-500/10 text-amber-600 border-amber-200',
  en_mantenimiento: 'bg-blue-500/10 text-blue-600 border-blue-200',
  fuera_servicio: 'bg-red-500/10 text-red-600 border-red-200',
  retirado: 'bg-gray-500/10 text-gray-600 border-gray-200',
}

export const frecuencias = [
  { value: 'semanal', label: 'Semanal', dias: 7 },
  { value: 'quincenal', label: 'Quincenal', dias: 15 },
  { value: 'mensual', label: 'Mensual', dias: 30 },
  { value: 'bimestral', label: 'Bimestral', dias: 60 },
  { value: 'trimestral', label: 'Trimestral', dias: 90 },
  { value: 'cuatrimestral', label: 'Cuatrimestral', dias: 120 },
  { value: 'semestral', label: 'Semestral', dias: 180 },
  { value: 'anual', label: 'Anual', dias: 365 },
] as const

export type FrecuenciaMantenimiento = typeof frecuencias[number]['value']

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcula la próxima fecha de mantenimiento basada en la frecuencia
 */
function calcularProximaFecha(frecuenciaValue: string, desdeFecha?: string): string {
  const frecuencia = frecuencias.find(f => f.value === frecuenciaValue)
  if (!frecuencia) return ''
  
  const baseDate = desdeFecha ? parseISO(desdeFecha) : new Date()
  const proxima = addDays(baseDate, frecuencia.dias)
  return format(proxima, 'yyyy-MM-dd')
}

/**
 * Extrae la frecuencia de mantenimiento de las notas
 */
function extraerFrecuenciaDeNotas(notes: string | null): FrecuenciaMantenimiento {
  if (!notes) return 'mensual'
  const match = notes.match(/frecuencia:(\w+)/)
  return (match?.[1] as FrecuenciaMantenimiento) || 'mensual'
}

/**
 * Crea las notas con la frecuencia y observaciones
 */
function crearNotas(frecuencia: FrecuenciaMantenimiento, observaciones?: string): string {
  const parts: string[] = [`frecuencia:${frecuencia}`]
  if (observaciones?.trim()) {
    parts.push(`observaciones:${observaciones.trim()}`)
  }
  return parts.join('|')
}

/**
 * Extrae las observaciones de las notas
 */
function extraerObservaciones(notes: string | null): string {
  if (!notes) return ''
  const match = notes.match(/observaciones:([^|]*)/)
  return match?.[1] || ''
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Mantenimiento() {
  // ─── Estado: Crear nuevo mantenimiento ────────────────────────────────────────
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null)
  const [selectedFrecuencia, setSelectedFrecuencia] = useState<FrecuenciaMantenimiento>('mensual')
  const [proximaFecha, setProximaFecha] = useState('')
  const [observacionesCrear, setObservacionesCrear] = useState('')
  const [numeroSerieCrear, setNumeroSerieCrear] = useState('')
  const [fabricanteCrear, setFabricanteCrear] = useState('')
  const [modeloCrear, setModeloCrear] = useState('')

  // ─── Estado: Edición ───────────────────────────────────────────────────────
  const [activoEditando, setActivoEditando] = useState<ActivoMantenimiento | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    estado: 'operativo' as EstadoActivo,
    next_service_due_date: '',
    frecuencia: 'mensual' as FrecuenciaMantenimiento,
    observaciones: '',
    completarAhora: false,
    numero_serie: '',
    manufacturer: '',
    model: '',
  })

  // ─── Estado: Eliminación ─────────────────────────────────────────────────────
  const [activoEliminando, setActivoEliminando] = useState<ActivoMantenimiento | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const { data, isFetching, isLoading } = useMantenimiento()
  const assets = (data?.data ?? []) as ActivoMantenimiento[]
  const crearActivo = useCrearActivo()
  const actualizarActivo = useActualizarActivo()
  const eliminarActivo = useEliminarActivo()

  if (isLoading) return <SkeletonMantenimiento />

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleEditar = (asset: ActivoMantenimiento) => {
    const frecuencia = extraerFrecuenciaDeNotas(asset.notes)
    const observaciones = extraerObservaciones(asset.notes)
    
    setActivoEditando(asset)
    setEditForm({
      estado: asset.estado,
      next_service_due_date: asset.next_service_due_date?.split('T')[0] || '',
      frecuencia: frecuencia,
      observaciones: observaciones,
      completarAhora: false,
      numero_serie: asset.numero_serie || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
    })
    setIsEditDialogOpen(true)
  }

  const handleGuardarEdicion = async () => {
    if (!activoEditando) return

    const hoy = format(new Date(), 'yyyy-MM-dd')
    
    // Si se marca como completado (operativo) y estaba en mantenimiento
    const esCompletado = editForm.estado === 'operativo' && 
      (activoEditando.estado === 'mantenimiento_pendiente' || activoEditando.estado === 'en_mantenimiento')
    
    // Calcular próxima fecha automáticamente si se completó
    const nuevaProximaFecha = esCompletado || editForm.completarAhora
      ? calcularProximaFecha(editForm.frecuencia, hoy)
      : editForm.next_service_due_date

    try {
      await actualizarActivo.mutateAsync({
        id: activoEditando.id,
        estado: editForm.estado,
        next_service_due_date: nuevaProximaFecha,
        last_service_date: esCompletado || editForm.completarAhora ? hoy : undefined,
        notes: crearNotas(editForm.frecuencia, editForm.observaciones),
        numero_serie: editForm.numero_serie || undefined,
        manufacturer: editForm.manufacturer || undefined,
        model: editForm.model || undefined,
      })
      
      toast.success(
        esCompletado || editForm.completarAhora
          ? `Mantenimiento completado. Próximo: ${formatearFecha(nuevaProximaFecha)}`
          : 'Mantenimiento actualizado correctamente'
      )
      setIsEditDialogOpen(false)
      setActivoEditando(null)
    } catch {
      toast.error('Error al actualizar el mantenimiento')
    }
  }

  const handleEliminarClick = (asset: ActivoMantenimiento) => {
    setActivoEliminando(asset)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!activoEliminando) return
    try {
      await eliminarActivo.mutateAsync(activoEliminando.id)
      toast.success('Activo de mantenimiento eliminado correctamente')
      setIsDeleteDialogOpen(false)
      setActivoEliminando(null)
    } catch {
      toast.error('Error al eliminar el activo')
    }
  }

  const programarMantenimiento = async () => {
    if (!selectedArticulo) {
      toast.error('Selecciona un artículo')
      return
    }
    if (!proximaFecha) {
      toast.error('Selecciona la próxima fecha de mantenimiento')
      return
    }
    
    // Generar código de activo único
    const codigoActivo = selectedArticulo.codigo 
      ? `EQ-${selectedArticulo.codigo}`
      : `EQ-${selectedArticulo.id}-${Date.now().toString().slice(-4)}`
    
    try {
      await crearActivo.mutateAsync({
        articulo_id: selectedArticulo.id,
        codigo_activo: codigoActivo,
        estado: 'mantenimiento_pendiente',
        notes: crearNotas(selectedFrecuencia, observacionesCrear),
        next_service_due_date: proximaFecha,
        numero_serie: numeroSerieCrear || undefined,
        manufacturer: fabricanteCrear || undefined,
        model: modeloCrear || undefined,
      })
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Mantenimiento programado</span>
          <span className="text-sm text-muted-foreground">
            {selectedArticulo.nombre} - Próximo: {formatearFecha(proximaFecha)}
          </span>
        </div>
      )
      
      // Reset form
      setSelectedArticulo(null)
      setProximaFecha('')
      setSelectedFrecuencia('mensual')
      setObservacionesCrear('')
      setNumeroSerieCrear('')
      setFabricanteCrear('')
      setModeloCrear('')
    } catch (error: unknown) {
      console.error('Error al crear mantenimiento:', error)
      const message = error instanceof Error ? error.message : 'Error al programar el mantenimiento'
      toast.error(message)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      {/* Header */}
      <div className="page-section flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Mantenimiento</h2>
          <p className="text-sm text-muted-foreground">
            Gestión de activos y mantenimientos programados del laboratorio.
          </p>
        </div>
        {isFetching && (
          <span className="text-xs text-muted-foreground animate-pulse">Actualizando...</span>
        )}
      </div>

      {/* ─── Card: Programar mantenimiento ────────────────────────────────────── */}
      <GuardRol roles={['profesor']}>
        <Card className="page-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="size-4 text-primary" />
              </div>
              Programar mantenimiento
            </CardTitle>
            <CardDescription>
              Registra un nuevo equipo para mantenimiento periódico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Artículo y Número de serie */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Equipo / Artículo</Label>
                <ArticuloCombobox
                  value={selectedArticulo}
                  onChange={setSelectedArticulo}
                  placeholder="Buscar equipo..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero-serie">Número de serie (opcional)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="numero-serie"
                    placeholder="Ej. SN123456789"
                    value={numeroSerieCrear}
                    onChange={(e) => setNumeroSerieCrear(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Fabricante y Modelo */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fabricante">Fabricante (opcional)</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="fabricante"
                    placeholder="Ej. Thermo Fisher"
                    value={fabricanteCrear}
                    onChange={(e) => setFabricanteCrear(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo (opcional)</Label>
                <Input
                  id="modelo"
                  placeholder="Ej. Centrifuge X1"
                  value={modeloCrear}
                  onChange={(e) => setModeloCrear(e.target.value)}
                />
              </div>
            </div>

            {/* Frecuencia y Próxima fecha */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Frecuencia de mantenimiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        {frecuencias.find(f => f.value === selectedFrecuencia)?.label}
                      </div>
                      <ChevronsUpDown className="size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {frecuencias.map((frecuencia) => (
                            <CommandItem
                              key={frecuencia.value}
                              value={frecuencia.value}
                              onSelect={() => setSelectedFrecuencia(frecuencia.value)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  selectedFrecuencia === frecuencia.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{frecuencia.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  Cada {frecuencia.dias} días
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Próximo mantenimiento</Label>
                <DatePickerSimple
                  value={proximaFecha}
                  onChange={(date) => setProximaFecha(date || '')}
                  placeholder="Seleccionar fecha"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones-crear">Observaciones (opcional)</Label>
              <Textarea
                id="observaciones-crear"
                placeholder="Notas adicionales sobre el mantenimiento programado..."
                value={observacionesCrear}
                onChange={(e) => setObservacionesCrear(e.target.value)}
                rows={2}
              />
            </div>

            <Button 
              onClick={programarMantenimiento}
              disabled={!selectedArticulo || !proximaFecha || crearActivo.isPending}
              className="w-full sm:w-auto"
            >
              {crearActivo.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Programar mantenimiento
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </GuardRol>

      {/* ─── Card: Lista de activos ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Wrench className="size-4 text-primary" />
            </div>
            Activos en mantenimiento
          </CardTitle>
          <CardDescription>
            {assets.length} activo{assets.length !== 1 ? 's' : ''} registrado{assets.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Wrench className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Sin mantenimientos programados</p>
                <GuardRol roles={['profesor']}>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usa el formulario de arriba para programar el primer mantenimiento.
                  </p>
                </GuardRol>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Artículo</TableHead>
                    <TableHead>Último servicio</TableHead>
                    <TableHead>Próximo mantenimiento</TableHead>
                    <TableHead className="w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => {
                    const frecuencia = extraerFrecuenciaDeNotas(asset.notes)
                    const frecuenciaLabel = frecuencias.find(f => f.value === frecuencia)?.label || 'Mensual'
                    
                    return (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm">{asset.codigo_activo}</span>
                            {asset.numero_serie && (
                              <span className="text-xs text-muted-foreground">SN: {asset.numero_serie}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={varianteEstado[asset.estado]} 
                            className={cn("border", colorEstado[asset.estado])}
                          >
                            {formatearEstadoActivo(asset.estado)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{asset.articulo || '—'}</span>
                            <span className="text-xs text-muted-foreground">{frecuenciaLabel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {asset.last_service_date ? (
                            <span className="text-sm">{formatearFecha(asset.last_service_date)}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {asset.next_service_due_date ? (
                            <div className="flex flex-col">
                              <span className={cn(
                                "text-sm",
                                new Date(asset.next_service_due_date) < new Date() && asset.estado !== 'retirado'
                                  ? "text-destructive font-medium"
                                  : ""
                              )}>
                                {formatearFecha(asset.next_service_due_date)}
                              </span>
                              {new Date(asset.next_service_due_date) < new Date() && asset.estado !== 'retirado' && (
                                <span className="text-xs text-destructive">Vencido</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditar(asset)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <GuardRol roles={['profesor']}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleEliminarClick(asset)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </GuardRol>
                          </div>
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

      {/* ─── Modal: Editar Mantenimiento ────────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Mantenimiento</DialogTitle>
            <DialogDescription>
              {activoEditando?.articulo}
              {activoEditando?.numero_serie && (
                <span className="block text-xs mt-1">SN: {activoEditando.numero_serie}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            {/* Estado */}
            <div className="grid gap-2">
              <Label>Estado del activo</Label>
              <Select 
                value={editForm.estado} 
                onValueChange={(value) => setEditForm({ ...editForm, estado: value as EstadoActivo })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operativo">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-green-500" />
                      Operativo
                    </div>
                  </SelectItem>
                  <SelectItem value="mantenimiento_pendiente">Mantenimiento pendiente</SelectItem>
                  <SelectItem value="en_mantenimiento">En mantenimiento</SelectItem>
                  <SelectItem value="fuera_servicio">Fuera de servicio</SelectItem>
                  <SelectItem value="retirado">Retirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checkbox: Completar ahora */}
            {(activoEditando?.estado === 'mantenimiento_pendiente' || activoEditando?.estado === 'en_mantenimiento') && (
              <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/50">
                <input
                  type="checkbox"
                  id="completar-ahora"
                  checked={editForm.completarAhora}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setEditForm({ 
                      ...editForm, 
                      completarAhora: checked,
                      // Si se marca, calcular la próxima fecha automáticamente
                      ...(checked && {
                        next_service_due_date: calcularProximaFecha(editForm.frecuencia)
                      })
                    })
                  }}
                  className="size-4 rounded border-primary"
                />
                <Label htmlFor="completar-ahora" className="cursor-pointer flex-1">
                  <span className="font-medium">Marcar mantenimiento como completado hoy</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Se registrará la fecha de hoy como último servicio y se calculará la próxima fecha automáticamente.
                  </p>
                </Label>
              </div>
            )}

            {/* Frecuencia */}
            <div className="grid gap-2">
              <Label>Frecuencia de mantenimiento</Label>
              <Select 
                value={editForm.frecuencia} 
                onValueChange={(value) => {
                  const newFrecuencia = value as FrecuenciaMantenimiento
                  setEditForm({ 
                    ...editForm, 
                    frecuencia: newFrecuencia,
                    // Si está completando ahora, recalcular fecha
                    ...(editForm.completarAhora && {
                      next_service_due_date: calcularProximaFecha(newFrecuencia)
                    })
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  {frecuencias.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      <div className="flex flex-col">
                        <span>{f.label}</span>
                        <span className="text-xs text-muted-foreground">Cada {f.dias} días</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Próxima fecha */}
            <div className="grid gap-2">
              <Label>
                {editForm.completarAhora 
                  ? 'Próximo mantenimiento (calculado automáticamente)'
                  : 'Próximo mantenimiento'
                }
              </Label>
              <DatePickerSimple
                value={editForm.next_service_due_date}
                onChange={(date) => setEditForm({ ...editForm, next_service_due_date: date || '' })}
                placeholder="Seleccionar fecha"
                disabled={editForm.completarAhora}
              />
              {editForm.completarAhora && editForm.next_service_due_date && (
                <p className="text-xs text-muted-foreground">
                  Próximo: {formatearFecha(editForm.next_service_due_date)} (dentro de {' '}
                  {frecuencias.find(f => f.value === editForm.frecuencia)?.label.toLowerCase()})
                </p>
              )}
            </div>

            {/* Número de serie */}
            <div className="grid gap-2">
              <Label htmlFor="edit-serie">Número de serie (opcional)</Label>
              <Input
                id="edit-serie"
                value={editForm.numero_serie}
                onChange={(e) => setEditForm({ ...editForm, numero_serie: e.target.value })}
                placeholder="Ej. SN123456789"
              />
            </div>

            {/* Fabricante y Modelo */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-fabricante">Fabricante</Label>
                <Input
                  id="edit-fabricante"
                  value={editForm.manufacturer}
                  onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                  placeholder="Ej. Thermo Fisher"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-modelo">Modelo</Label>
                <Input
                  id="edit-modelo"
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                  placeholder="Ej. Centrifuge X1"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className="grid gap-2">
              <Label htmlFor="edit-observaciones">Observaciones</Label>
              <Textarea
                id="edit-observaciones"
                value={editForm.observaciones}
                onChange={(e) => setEditForm({ ...editForm, observaciones: e.target.value })}
                placeholder="Notas sobre el mantenimiento realizado o pendiente..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGuardarEdicion}
              disabled={actualizarActivo.isPending}
            >
              {actualizarActivo.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : editForm.completarAhora ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completar y guardar
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal: Confirmar Eliminación ───────────────────────────────────────── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar Activo
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el activo{' '}
              <strong>{activoEliminando?.codigo_activo}</strong>
              {activoEliminando?.articulo && (
                <span> ({activoEliminando.articulo})</span>
              )}?
              <br /><br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmarEliminar}
              disabled={eliminarActivo.isPending}
            >
              {eliminarActivo.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
