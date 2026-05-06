import { useState, useMemo, useEffect } from 'react'
import { Plus, Minus, ArrowRightLeft, RotateCcw, Package, AlertCircle, Loader2 } from 'lucide-react'
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
  ubicaciones: { id: number; nombre: string }[]
  nivelesStock: NivelStock[] // Stock del artículo por ubicación
  isLoadingUbicaciones?: boolean
  isLoadingStock?: boolean
  open: boolean
  onCantidadChange: (cantidad: number) => void
  onSubmit: (tipo: TipoMovimiento, cantidad: number, ubicacionOrigenId?: string, ubicacionDestinoId?: string) => void
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
  open,
  onCantidadChange,
  onSubmit,
  onCancel,
}: PanelAccionRapidaProps) {
  const [isInicializando, setIsInicializando] = useState(true)
  const isLoading = isLoadingUbicaciones || isLoadingStock || isInicializando
  const [ubicacionOrigen, setUbicacionOrigen] = useState('')
  const [ubicacionDestino, setUbicacionDestino] = useState('')
  const [step, setStep] = useState<'tipo' | 'cantidad' | 'ubicacion'>('tipo')

  // Ubicaciones con stock > 0 para salidas y traslados origen
  const ubicacionesConStock = useMemo(() => {
    if (!articulo) return []
    return ubicaciones.filter(ub => {
      const nivel = nivelesStock.find(n => n.ubicacion_id === ub.id)
      return (nivel?.cantidad ?? 0) > 0
    })
  }, [ubicaciones, nivelesStock, articulo])

  // Forzar estado de carga inicial visible durante 300ms
  useEffect(() => {
    setIsInicializando(true)
    const timer = setTimeout(() => setIsInicializando(false), 300)
    return () => clearTimeout(timer)
  }, [articulo?.id])

  // Resetear selecciones cuando cambia el artículo o se abre/cierra el modal
  useEffect(() => {
    setUbicacionOrigen('')
    setUbicacionDestino('')

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
          setUbicacionOrigen(String(ubicacionesConStock[0].id))
          setStep('cantidad')
        } else {
          setStep('ubicacion')
        }
      } else if (tipo === 'traslado') {
        setStep('ubicacion')
      }
    } else {
      setStep('tipo')
    }
  }, [articulo?.id, tipo, open, ubicaciones.length, ubicacionesConStock.length])

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
        setUbicacionOrigen(String(ubicacionesConStock[0].id))
        setStep('cantidad')
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
      // Enviar ubicación destino
      onSubmit(tipoFinal, cantidad, undefined, ubicacionDestino)
    } else if (tipoFinal === 'salida') {
      // Enviar ubicación origen
      onSubmit(tipoFinal, cantidad, ubicacionOrigen, undefined)
    } else if (tipoFinal === 'traslado') {
      // Enviar ambas
      onSubmit(tipoFinal, cantidad, ubicacionOrigen, ubicacionDestino)
    }
    
    // Reset
    setStep('tipo')
    setUbicacionOrigen('')
    setUbicacionDestino('')
  }
  
  const reset = () => {
    setStep('tipo')
    setUbicacionOrigen('')
    setUbicacionDestino('')
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
                  <span className="flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Cargando...
                  </span>
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
          <div className="flex gap-2">
            <Button
              variant={tipo === 'entrada' ? 'default' : 'outline'}
              className="flex-1 h-12 gap-2"
              onClick={() => handleTipoSelect('entrada')}
            >
              <Plus className="size-4" />
              Entrada
            </Button>
            <Button
              variant={tipo === 'salida' ? 'default' : 'outline'}
              className="flex-1 h-12 gap-2"
              onClick={() => handleTipoSelect('salida')}
              disabled={articulo.stock_total === 0}
            >
              <Minus className="size-4" />
              Salida
            </Button>
            <Button
              variant={tipo === 'traslado' ? 'default' : 'outline'}
              className="flex-1 h-12 gap-2"
              onClick={() => handleTipoSelect('traslado')}
              disabled={articulo.stock_total === 0}
            >
              <ArrowRightLeft className="size-4" />
              Traslado
            </Button>
          </div>
        )}
        
        {step === 'cantidad' && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-2 font-medium">Cantidad</Label>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-border hover:bg-muted transition-colors"
                  onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
                >
                  <Minus className="size-5 stroke-[2.5]" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-12 w-28 text-center font-mono text-xl font-semibold bg-background border-border"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 border-border hover:bg-muted transition-colors"
                  onClick={() => onCantidadChange(cantidad + 1)}
                >
                  <Plus className="size-5 stroke-[2.5]" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('tipo')}>
                <RotateCcw className="size-4 mr-1" />
                Cambiar
              </Button>
              <Button onClick={handleSubmit} className="flex-1 gap-2">
                {tipo === 'entrada' && <Plus className="size-4" />}
                {tipo === 'salida' && <Minus className="size-4" />}
                Confirmar {tipo}
              </Button>
            </div>
          </div>
        )}
        
        {step === 'ubicacion' && (
          <div className="space-y-3">
            {/* Selector según tipo */}
            {tipo === 'entrada' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 font-medium block">
                    Ubicación destino <span className="text-destructive">*</span>
                  </Label>
                  <Select value={ubicacionDestino} onValueChange={setUbicacionDestino} disabled={isLoadingUbicaciones}>
                    <SelectTrigger className="w-full h-11">
                      {isLoadingUbicaciones ? (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Cargando ubicaciones...
                        </span>
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

                {/* Cantidad para entrada */}
                <div>
                  <Label className="text-sm mb-2 font-medium block">Cantidad</Label>
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(Math.max(1, cantidad - 1))}
                    >
                      <Minus className="size-4 stroke-[2.5]" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 w-24 text-center font-mono text-lg font-semibold bg-background border-border"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(cantidad + 1)}
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleCancel}>
                    <RotateCcw className="size-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!ubicacionDestino}
                    className="flex-1 gap-2"
                  >
                    <Plus className="size-4" />
                    Confirmar entrada
                  </Button>
                </div>
              </div>
            )}

            {tipo === 'salida' && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 font-medium block">
                    Ubicación origen <span className="text-destructive">*</span>
                  </Label>
                  <Select value={ubicacionOrigen} onValueChange={setUbicacionOrigen} disabled={isLoading}>
                    <SelectTrigger className="w-full h-11">
                      {isLoading ? (
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          Cargando...
                        </span>
                      ) : (
                        <SelectValue placeholder="Seleccionar almacén..." />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {ubicacionesConStock.map((ub) => {
                        const nivel = nivelesStock.find(n => n.ubicacion_id === ub.id)
                        const cantidad = nivel?.cantidad ?? 0
                        return (
                          <SelectItem key={ub.id} value={String(ub.id)}>
                            <span className="font-medium">{ub.nombre}</span>
                            <span className="ml-2 text-muted-foreground">({cantidad} disponibles)</span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  {ubicacionesConStock.length === 0 && (
                    <p className="text-xs text-destructive mt-2">
                      <AlertCircle className="size-3 inline mr-1" />
                      No hay stock disponible en ninguna ubicación
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
                    >
                      <Minus className="size-4 stroke-[2.5]" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 w-24 text-center font-mono text-lg font-semibold bg-background border-border"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(cantidad + 1)}
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleCancel}>
                    <RotateCcw className="size-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!ubicacionOrigen}
                    className="flex-1 gap-2"
                  >
                    <Minus className="size-4" />
                    Confirmar salida
                  </Button>
                </div>
              </div>
            )}

            {tipo === 'traslado' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm mb-2 font-medium block">
                      Origen <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={ubicacionOrigen}
                      onValueChange={(val) => {
                        setUbicacionOrigen(val)
                        if (ubicacionDestino === val) {
                          setUbicacionDestino('')
                        }
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full h-11">
                        {isLoading ? (
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Cargando...
                          </span>
                        ) : (
                          <SelectValue placeholder="Seleccionar..." />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {ubicacionesConStock.map((ub) => {
                          const nivel = nivelesStock.find(n => n.ubicacion_id === ub.id)
                          return (
                            <SelectItem key={ub.id} value={String(ub.id)}>
                              {ub.nombre} (Stock: {nivel?.cantidad ?? 0})
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 font-medium block">
                      Destino <span className="text-destructive">*</span>
                    </Label>
                    <Select value={ubicacionDestino} onValueChange={setUbicacionDestino} disabled={isLoading}>
                      <SelectTrigger className="w-full h-11">
                        {isLoading ? (
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            Cargando...
                          </span>
                        ) : (
                          <SelectValue placeholder="Seleccionar..." />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {ubicaciones
                          .filter((ub) => String(ub.id) !== ubicacionOrigen)
                          .map((ub) => {
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
                    >
                      <Minus className="size-4 stroke-[2.5]" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => onCantidadChange(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11 w-24 text-center font-mono text-lg font-semibold bg-background border-border"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 border-border hover:bg-muted transition-colors"
                      onClick={() => onCantidadChange(cantidad + 1)}
                    >
                      <Plus className="size-4 stroke-[2.5]" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleCancel}>
                    <RotateCcw className="size-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!ubicacionOrigen || !ubicacionDestino}
                    className="flex-1 gap-2"
                  >
                    <ArrowRightLeft className="size-4" />
                    Confirmar traslado
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
