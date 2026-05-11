import { useState, useMemo, useEffect, useRef } from 'react'
import { Plus, Minus, ArrowRightLeft, RotateCcw, Package, AlertCircle, Loader2, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Articulo, TipoMovimiento, NivelStock } from '@/types'

interface PanelAccionRapidaProps {
  articulo: Articulo | null
  tipo: TipoMovimiento | null
  cantidad: number
  ubicaciones: { id: number; nombre: string; sub_ubicaciones?: Array<{id: number; nombre: string}> }[]
  nivelesStock: NivelStock[] // Stock del artículo por ubicación
  isLoadingUbicaciones?: boolean
  isLoadingStock?: boolean
  isPending?: boolean
  open: boolean
  onCantidadChange: (cantidad: number) => void
  onSubmit: (tipo: TipoMovimiento, cantidad: number, ubicacionOrigenId?: string, ubicacionDestinoId?: string, subUbicacionOrigenId?: string, subUbicacionDestinoId?: string) => void
  onSuccess?: () => void
  onCancel: () => void
}

export function PanelAccionRapida({
  articulo,
  tipo,
  cantidad,
  ubicaciones,
  nivelesStock,
  isLoadingUbicaciones = false,
  isLoadingStock = false,
  isPending = false,
  open,
  onCantidadChange,
  onSubmit,
  onSuccess,
  onCancel,
}: PanelAccionRapidaProps) {
  const [isInicializando, setIsInicializando] = useState(true)
  const isLoading = isLoadingUbicaciones || isLoadingStock || isInicializando
  const [ubicacionOrigen, setUbicacionOrigen] = useState('')
  const [ubicacionDestino, setUbicacionDestino] = useState('')
  const [subUbicacionOrigen, setSubUbicacionOrigen] = useState('')
  const [subUbicacionDestino, setSubUbicacionDestino] = useState('')
  const [step, setStep] = useState<'tipo' | 'cantidad' | 'ubicacion'>('tipo')

  // Stock agrupado por ubicación y sección para mostrar en selectores
  const stockPorUbicacion = useMemo(() => {
    const resultado: Record<number, {
      ubicacion: typeof ubicaciones[0],
      stockTotal: number,
      secciones: Array<{ id: number | null; nombre: string; cantidad: number; stockId: number }>
    }> = {}

    // Agrupar nivelesStock por ubicación
    nivelesStock.forEach(nivel => {
      const ubId = nivel.ubicacion_id
      if (!resultado[ubId]) {
        resultado[ubId] = {
          ubicacion: ubicaciones.find(u => u.id === ubId)!,
          stockTotal: 0,
          secciones: []
        }
      }

      const seccionNombre = nivel.sub_ubicacion || 'Sin sección específica'
      resultado[ubId].secciones.push({
        id: nivel.sub_ubicacion_id,
        nombre: seccionNombre,
        cantidad: nivel.cantidad,
        stockId: nivel.id
      })
      resultado[ubId].stockTotal += nivel.cantidad
    })

    return resultado
  }, [nivelesStock, ubicaciones])

  // Ubicaciones con stock > 0
  const ubicacionesConStock = useMemo(() => {
    return Object.values(stockPorUbicacion)
      .filter(item => item.stockTotal > 0)
      .map(item => item.ubicacion)
  }, [stockPorUbicacion])

  const reset = () => {
    setStep('tipo')
    setUbicacionOrigen('')
    setUbicacionDestino('')
    setSubUbicacionOrigen('')
    setSubUbicacionDestino('')
  }

  // Forzar estado de carga inicial visible durante 300ms
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsInicializando(true)
    const timer = setTimeout(() => setIsInicializando(false), 300)
    return () => clearTimeout(timer)
  }, [articulo?.id])

  // Cuando isPending pasa de true → false: la petición terminó
  // El reset del step lo maneja el useEffect de tipo/open (tipo=null → step='tipo')
  // Aqui solo notificamos al padre vía onSuccess
  const prevIsPendingRef = useRef(false)
  useEffect(() => {
    if (prevIsPendingRef.current && !isPending) {
      onSuccess?.()
    }
    prevIsPendingRef.current = isPending
  }, [isPending, onSuccess])

  // Resetear selecciones cuando cambia el artículo o se abre/cierra el modal
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUbicacionOrigen('')
    setUbicacionDestino('')
    setSubUbicacionOrigen('')
    setSubUbicacionDestino('')

    // Si el tipo ya viene preseleccionado, saltar al paso correspondiente
    if (tipo && open) {
      if (tipo === 'entrada') {
        if (ubicaciones.length === 1) {
          setUbicacionDestino(String(ubicaciones[0].id))
          setStep('cantidad')
        } else {
          setStep('ubicacion')
        }
      } else if (tipo === 'salida') {
        if (ubicacionesConStock.length === 1) {
          const ubId = ubicacionesConStock[0].id
          const secciones = stockPorUbicacion[ubId]?.secciones?.filter(s => s.cantidad > 0) || []
          setUbicacionOrigen(String(ubId))
          if (secciones.length === 1) {
            setSubUbicacionOrigen(secciones[0].id !== null ? String(secciones[0].id) : '')
            setStep('cantidad')
          } else {
            setStep('ubicacion')
          }
        } else {
          setStep('ubicacion')
        }
      } else if (tipo === 'traslado') {
        setStep('ubicacion')
      }
    } else {
      setStep('tipo')
    }
  }, [articulo?.id, tipo, open, ubicaciones, ubicacionesConStock])

  if (!articulo) return null

  // Handler de selección de tipo
  const handleTipoSelect = (t: TipoMovimiento) => {
    // Para entrada: si hay 1 ubicación, auto-seleccionar destino
    if (t === 'entrada') {
      if (ubicaciones.length === 1) {
        setUbicacionDestino(String(ubicaciones[0].id))
        setStep('cantidad')
      } else if (ubicaciones.length === 0) {
        // No hay ubicaciones - no permitir
        return
      } else {
        // Múltiples ubicaciones - mostrar selector
        setStep('ubicacion')
      }
    }
    // Para salida: siempre mostrar selector de origen (con stock)
    else if (t === 'salida') {
      if (ubicacionesConStock.length === 1) {
        const ubId = ubicacionesConStock[0].id
        const secciones = stockPorUbicacion[ubId]?.secciones?.filter(s => s.cantidad > 0) || []
        setUbicacionOrigen(String(ubId))
        if (secciones.length === 1) {
          setSubUbicacionOrigen(secciones[0].id !== null ? String(secciones[0].id) : '')
          setStep('cantidad')
        } else {
          setStep('ubicacion')
        }
      } else {
        setStep('ubicacion')
      }
    }
    // Para traslado: mostrar ambos selectores
    else if (t === 'traslado') {
      setStep('ubicacion')
    }
  }
  
  // Submit según tipo
  const handleSubmit = () => {
    const tipoFinal = tipo || 'entrada'
    
    if (tipoFinal === 'entrada') {
      onSubmit(tipoFinal, cantidad, undefined, ubicacionDestino, undefined, subUbicacionDestino || undefined)
    } else if (tipoFinal === 'salida') {
      onSubmit(tipoFinal, cantidad, ubicacionOrigen, undefined, subUbicacionOrigen || undefined, undefined)
    } else if (tipoFinal === 'traslado') {
      onSubmit(tipoFinal, cantidad, ubicacionOrigen, ubicacionDestino, subUbicacionOrigen || undefined, subUbicacionDestino || undefined)
    }
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">{articulo.nombre}</DialogTitle>
              <DialogDescription className="text-xs flex items-center gap-1">
                Stock actual:{" "}
                {isLoadingStock ? (
                  <span className="inline-block h-3.5 w-10 rounded bg-muted animate-pulse align-middle" />
                ) : (
                  <span className="font-mono font-medium">{articulo.stock_total}</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido según paso */}
        <div className="space-y-4">
        {step === 'tipo' && (
          <div className="animate-fade-in-up flex gap-2">
            <Button
              variant={tipo === 'entrada' ? 'default' : 'outline'}
              className="flex-1 h-12 gap-2"
              onClick={() => handleTipoSelect('entrada')}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {isPending ? 'Cargando...' : 'Entrada'}
            </Button>
            <Button
              variant={tipo === 'salida' ? 'default' : 'outline'}
              className="flex-1 h-12 gap-2"
              onClick={() => handleTipoSelect('salida')}
              disabled={articulo.stock_total === 0 || isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Minus className="size-4" />}
              {isPending ? 'Cargando...' : 'Salida'}
            </Button>
            <Button
              variant={tipo === 'traslado' ? 'default' : 'outline'}
              className="flex-1 h-12 gap-2"
              onClick={() => handleTipoSelect('traslado')}
              disabled={articulo.stock_total === 0 || isPending}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRightLeft className="size-4" />}
              {isPending ? 'Cargando...' : 'Traslado'}
            </Button>
          </div>
        )}
        
        {step === 'cantidad' && (
          <div className="animate-fade-in-up space-y-4">
            <div>
              <Label className="text-xs mb-2 font-medium">Cantidad</Label>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-border hover:bg-muted transition-colors"
                  onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
                  disabled={isPending}
                >
                  <Minus className="size-5 stroke-[2.5]" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-12 w-28 text-center font-mono text-xl font-semibold bg-background border-border"
                  disabled={isPending}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-border hover:bg-muted transition-colors"
                  onClick={() => onCantidadChange(cantidad + 1)}
                  disabled={isPending}
                >
                  <Plus className="size-5 stroke-[2.5]" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('tipo')} disabled={isPending}>
                <RotateCcw className="size-4 mr-1" />
                Cambiar
              </Button>
              <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : (
                  <>{tipo === 'entrada' && <Plus className="size-4" />}{tipo === 'salida' && <Minus className="size-4" />}</>
                )}
                {isPending ? 'Procesando...' : `Confirmar ${tipo}`}
              </Button>
            </div>
          </div>
        )}
        
        {step === 'ubicacion' && (
          <div className="animate-fade-in-up space-y-3">
            {/* Selector según tipo */}
            {tipo === 'entrada' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 font-medium block">
                    Ubicación destino <span className="text-destructive">*</span>
                  </Label>
                  <Select value={ubicacionDestino} onValueChange={setUbicacionDestino} disabled={isLoadingUbicaciones || isPending}>
                    <SelectTrigger className="w-full h-11">
                      {isLoadingUbicaciones ? (
                        <span className="h-4 w-32 rounded bg-muted animate-pulse" />
                      ) : (
                        <SelectValue placeholder="Seleccionar almacén..." />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {ubicaciones.map((ub) => {
                        const nivel = nivelesStock.find(n => n.ubicacion_id === ub.id)
                        const cantidad = nivel?.cantidad ?? 0
                        return (
                          <SelectItem key={ub.id} value={String(ub.id)}>
                            <span className="font-medium">{ub.nombre}</span>
                            {cantidad > 0 && (
                              <span className="ml-2 text-muted-foreground">(Stock: {cantidad})</span>
                            )}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {ubicaciones.length === 0 && (
                    <p className="text-xs text-destructive mt-2">
                      <AlertCircle className="size-3 inline mr-1" />
                      No hay ubicaciones configuradas
                    </p>
                  )}
                </div>

                {/* Selector de sección para entrada */}
                {ubicacionDestino && (
                  <div>
                    <Label className="text-sm mb-2 font-medium block">
                      <Grid3X3 className="size-3 inline mr-1" />
                      Sección destino (opcional)
                    </Label>
                    <Select
                      value={subUbicacionDestino || 'none'}
                      onValueChange={(val) => setSubUbicacionDestino(val === 'none' ? '' : val)}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Seleccionar sección..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="italic">Sin sección específica</span>
                        </SelectItem>
                        {stockPorUbicacion[Number(ubicacionDestino)]?.secciones
                          .filter(s => s.id !== null)
                          .map((seccion) => (
                            <SelectItem key={seccion.id} value={String(seccion.id)}>
                              {seccion.nombre} (actual: {seccion.cantidad})
                            </SelectItem>
                          ))}
                        {/* Si no hay secciones con stock, mostrar todas las secciones disponibles */}
                        {(!stockPorUbicacion[Number(ubicacionDestino)]?.secciones.some(s => s.id !== null)) &&
                          ubicaciones.find(u => String(u.id) === ubicacionDestino)?.sub_ubicaciones?.map((sub) => (
                            <SelectItem key={sub.id} value={String(sub.id)}>
                              {sub.nombre}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Cantidad para entrada */}
                <div>
                  <Label className="text-sm mb-2 font-medium block">Cantidad</Label>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
                      disabled={isPending}
                    >
                      <Minus className="size-4 stroke-[2.5]" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 w-24 text-center font-mono text-lg font-semibold bg-background border-border"
                      disabled={isPending}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(cantidad + 1)}
                      disabled={isPending}
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={isPending}>
                    <RotateCcw className="size-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!ubicacionDestino || isPending}
                    className="flex-1 gap-2"
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    {isPending ? 'Procesando...' : 'Confirmar entrada'}
                  </Button>
                </div>
              </div>
            )}

            {tipo === 'salida' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 font-medium block">
                    <Grid3X3 className="size-3 inline mr-1" />
                    Seleccionar ubicación y sección <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={ubicacionOrigen ? `${ubicacionOrigen}:${subUbicacionOrigen || 'none'}` : ''}
                    onValueChange={(val) => {
                      if (!val) return
                      const [ubId, seccionId] = val.split(':')
                      setUbicacionOrigen(ubId)
                      setSubUbicacionOrigen(seccionId === 'none' ? '' : seccionId)
                    }}
                    disabled={isLoading || isPending}
                  >
                    <SelectTrigger className="w-full h-11">
                      {isLoading ? (
                        <span className="h-4 w-32 rounded bg-muted animate-pulse" />
                      ) : (
                        <SelectValue placeholder="Seleccionar ubicación y sección..." />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(stockPorUbicacion)
                        .filter(item => item.stockTotal > 0)
                        .map(({ ubicacion, secciones }) => (
                          <div key={ubicacion.id}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                              {ubicacion.nombre} (Total: {secciones.reduce((sum, s) => sum + s.cantidad, 0)})
                            </div>
                            {secciones.map((seccion) => (
                              <SelectItem
                                key={`${ubicacion.id}:${seccion.id || 'none'}`}
                                value={`${ubicacion.id}:${seccion.id || 'none'}`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span>{seccion.nombre}</span>
                                  <span className="ml-4 text-xs text-muted-foreground font-mono">
                                    {seccion.cantidad} disp.
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                    </SelectContent>
                  </Select>
                  {ubicacionesConStock.length === 0 && (
                    <p className="text-xs text-destructive mt-2">
                      <AlertCircle className="size-3 inline mr-1" />
                      No hay stock disponible en ninguna ubicación
                    </p>
                  )}
                  {ubicacionOrigen && stockPorUbicacion[Number(ubicacionOrigen)] && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Stock disponible: {stockPorUbicacion[Number(ubicacionOrigen)]?.secciones
                        .filter(s => (subUbicacionOrigen ? String(s.id) === subUbicacionOrigen : s.id === null))
                        .reduce((sum, s) => sum + s.cantidad, 0)} unidades
                    </p>
                  )}
                </div>

                {/* Cantidad para salida */}
                <div>
                  <Label className="text-sm mb-2 font-medium block">Cantidad</Label>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
                      disabled={isPending}
                    >
                      <Minus className="size-4 stroke-[2.5]" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 w-24 text-center font-mono text-lg font-semibold bg-background border-border"
                      disabled={isPending}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(cantidad + 1)}
                      disabled={isPending}
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={isPending}>
                    <RotateCcw className="size-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!ubicacionOrigen || isPending}
                    className="flex-1 gap-2"
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Minus className="size-4" />}
                    {isPending ? 'Procesando...' : 'Confirmar salida'}
                  </Button>
                </div>
              </div>
            )}

            {tipo === 'traslado' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-sm mb-2 font-medium block">
                      <Grid3X3 className="size-3 inline mr-1" />
                      Origen (ubicación + sección) <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={ubicacionOrigen ? `${ubicacionOrigen}:${subUbicacionOrigen || 'none'}` : ''}
                      onValueChange={(val) => {
                        if (!val) return
                        const [ubId, seccionId] = val.split(':')
                        setUbicacionOrigen(ubId)
                        setSubUbicacionOrigen(seccionId === 'none' ? '' : seccionId)
                        if (ubicacionDestino === ubId) {
                          setUbicacionDestino('')
                          setSubUbicacionDestino('')
                        }
                      }}
                      disabled={isLoading || isPending}
                    >
                      <SelectTrigger className="w-full h-11">
                        {isLoading ? (
                          <span className="h-4 w-32 rounded bg-muted animate-pulse" />
                        ) : (
                          <SelectValue placeholder="Seleccionar origen..." />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(stockPorUbicacion)
                          .filter(item => item.stockTotal > 0)
                          .map(({ ubicacion, secciones }) => (
                            <div key={ubicacion.id}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                {ubicacion.nombre}
                              </div>
                              {secciones.filter(s => s.cantidad > 0).map((seccion) => (
                                <SelectItem
                                  key={`${ubicacion.id}:${seccion.id || 'none'}`}
                                  value={`${ubicacion.id}:${seccion.id || 'none'}`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{seccion.nombre}</span>
                                    <span className="ml-4 text-xs text-muted-foreground font-mono">
                                      {seccion.cantidad} disp.
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm mb-2 font-medium block">
                      <Grid3X3 className="size-3 inline mr-1" />
                      Destino (ubicación + sección) <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={ubicacionDestino ? `${ubicacionDestino}:${subUbicacionDestino || 'none'}` : ''}
                      onValueChange={(val) => {
                        if (!val) return
                        const [ubId, seccionId] = val.split(':')
                        setUbicacionDestino(ubId)
                        setSubUbicacionDestino(seccionId === 'none' ? '' : seccionId)
                      }}
                      disabled={isLoading || isPending || !ubicacionOrigen}
                    >
                      <SelectTrigger className="w-full h-11">
                        {isLoading ? (
                          <span className="h-4 w-32 rounded bg-muted animate-pulse" />
                        ) : !ubicacionOrigen ? (
                          <span className="text-muted-foreground">Primero selecciona origen...</span>
                        ) : (
                          <SelectValue placeholder="Seleccionar destino..." />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {ubicaciones
                          .filter((ub) => String(ub.id) !== ubicacionOrigen)
                          .map((ub) => (
                            <div key={ub.id}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                {ub.nombre}
                              </div>
                              {/* Opción: Sin sección específica */}
                              <SelectItem value={`${ub.id}:none`}>
                                <span className="italic">Sin sección específica</span>
                              </SelectItem>
                              {/* Secciones disponibles */}
                              {ub.sub_ubicaciones?.map((sub) => (
                                <SelectItem key={`${ub.id}:${sub.id}`} value={`${ub.id}:${sub.id}`}>
                                  {sub.nombre}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cantidad para traslado */}
                <div>
                  <Label className="text-sm mb-2 font-medium block">Cantidad</Label>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
                      disabled={isPending}
                    >
                      <Minus className="size-4 stroke-[2.5]" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 w-24 text-center font-mono text-lg font-semibold bg-background border-border"
                      disabled={isPending}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(cantidad + 1)}
                      disabled={isPending}
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={isPending}>
                    <RotateCcw className="size-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!ubicacionOrigen || !ubicacionDestino || isPending}
                    className="flex-1 gap-2"
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRightLeft className="size-4" />}
                    {isPending ? 'Procesando...' : 'Confirmar traslado'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
