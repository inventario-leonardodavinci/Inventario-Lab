/**
 * Página de Alertas - Rediseño Industrial
 * Tarjetas visuales, flujo claro, filtros intuitivos
 */
import { useState, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Package,
  RefreshCw,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAlertas, useConfirmarAlerta, useResolverAlerta, queryKeys } from '@/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import type { Alerta } from '@/types'
import { cn } from '@/lib/utils'
import { formatearFechaRelativa } from '@/utils/formatters'

// Badge de severidad con colores e iconos
function SeveridadBadge({ severidad }: { severidad: string }) {
  const configs: Record<string, { icon: typeof AlertCircle; label: string; className: string }> = {
    critica: { icon: AlertCircle, label: 'Crítica', className: 'bg-destructive/15 text-destructive border-destructive/20' },
    alta: { icon: AlertTriangle, label: 'Alta', className: 'bg-orange-500/15 text-orange-600 border-orange-500/20' },
    media: { icon: AlertTriangle, label: 'Media', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20' },
    baja: { icon: Clock, label: 'Baja', className: 'bg-blue-500/15 text-blue-600 border-blue-500/20' },
  }
  const config = configs[severidad] || configs.baja
  const Icon = config.icon
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', config.className)}>
      <Icon className="size-3" />
      {config.label}
    </Badge>
  )
}

// Badge de estado
function EstadoBadge({ estado }: { estado: string }) {
  if (estado === 'resuelta') {
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
        <CheckCircle2 className="size-3" />
        Resuelta
      </Badge>
    )
  }
  if (estado === 'confirmada') {
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
        <Check className="size-3" />
        Confirmada
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
      <Bell className="size-3" />
      Pendiente
    </Badge>
  )
}

// Tarjeta de alerta individual
function AlertaCard({
  alerta,
  onVer,
  onConfirmar,
  onResolver,
}: {
  alerta: Alerta
  onVer: (alerta: Alerta) => void
  onConfirmar: (id: number) => void
  onResolver: (id: number) => void
}) {
  const articulo = alerta.articulo
  const isResuelta = alerta.estado === 'resuelta'
  const isConfirmada = alerta.estado === 'confirmada'
  const isPendiente = alerta.estado === 'abierta'

  // Extraer datos de stock del JSON
  const datosStock = alerta.datos_json as { stock_actual?: number; umbral?: number } | undefined
  const stockActual = datosStock?.stock_actual ?? 0
  const umbral = datosStock?.umbral ?? 1
  const porcentajeStock = Math.min(100, Math.round((stockActual / umbral) * 100))

  // Determinar color de la barra según severidad
  const getColorBarra = () => {
    if (alerta.severidad === 'critica') return 'bg-destructive'
    if (alerta.severidad === 'alta') return 'bg-orange-500'
    if (alerta.severidad === 'media') return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <Card className={cn(
      'group transition-all duration-200 hover:shadow-md',
      isResuelta && 'opacity-60',
      isPendiente && 'border-l-4 border-l-destructive',
      isConfirmada && 'border-l-4 border-l-primary'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icono de severidad */}
          <div className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-xl',
            alerta.severidad === 'critica' && 'bg-destructive/15 text-destructive',
            alerta.severidad === 'alta' && 'bg-orange-500/15 text-orange-600',
            alerta.severidad === 'media' && 'bg-yellow-500/15 text-yellow-600',
            alerta.severidad === 'baja' && 'bg-blue-500/15 text-blue-600'
          )}>
            <Package className="size-6" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Header: Nombre + Badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-base leading-tight">
                  {articulo?.nombre || 'Artículo no disponible'}
                </h3>
                 <div className="flex items-center gap-2 mt-1">
                  {(articulo as unknown as { categoria?: { nombre: string } })?.categoria?.nombre && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {(articulo as unknown as { categoria?: { nombre: string } }).categoria!.nombre}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {alerta.generada_en ? formatearFechaRelativa(alerta.generada_en) : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <SeveridadBadge severidad={alerta.severidad} />
                <EstadoBadge estado={alerta.estado} />
              </div>
            </div>

            {/* Barra de stock visual */}
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stock disponible</span>
                <span className="font-semibold">
                  {stockActual} <span className="text-muted-foreground font-normal">/ {umbral} unidades</span>
                </span>
              </div>
              <div className="h-2.5 bg-background rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', getColorBarra())}
                  style={{ width: `${porcentajeStock}%` }}
                />
              </div>
              <p className="text-xs">
                {porcentajeStock < 30 ? (
                  <span className="text-destructive font-medium">Stock crítico - Requiere reposición urgente</span>
                ) : porcentajeStock < 70 ? (
                  <span className="text-orange-600 font-medium">Stock bajo - Considerar reposición</span>
                ) : isPendiente ? (
                  <span className="text-green-600 font-medium">Stock ya repuesto - Resolver alerta</span>
                ) : (
                  <span className="text-muted-foreground">Stock normalizado</span>
                )}
              </p>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 pt-2">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onVer(alerta)}>
                <Eye className="size-3.5" />
                Ver detalle
              </Button>
              {isPendiente && (
                <>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onConfirmar(alerta.id)}>
                    <Check className="size-3.5" />
                    Confirmar
                  </Button>
                  <Button variant="default" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onResolver(alerta.id)}>
                    <CheckCircle2 className="size-3.5" />
                    Resolver
                  </Button>
                </>
              )}
              {isConfirmada && (
                <Button variant="default" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onResolver(alerta.id)}>
                  <CheckCircle2 className="size-3.5" />
                  Marcar resuelta
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Alertas() {
  const queryClient = useQueryClient()
  const [tabActiva, setTabActiva] = useState<'todas' | 'pendientes' | 'confirmadas' | 'resueltas'>('pendientes')
  const [busqueda, setBusqueda] = useState('')
  const [alertaDetalle, setAlertaDetalle] = useState<Alerta | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)

  const { data: alertasData, isLoading } = useAlertas({})
  const confirmarMutation = useConfirmarAlerta()
  const resolverMutation = useResolverAlerta()

  const alertas = alertasData?.data || []

  const alertasFiltradas = useMemo(() => {
    return alertas.filter((alerta: Alerta) => {
      if (tabActiva === 'pendientes' && alerta.estado !== 'abierta') return false
      if (tabActiva === 'confirmadas' && alerta.estado !== 'confirmada') return false
      if (tabActiva === 'resueltas' && alerta.estado !== 'resuelta') return false
      if (busqueda) {
        const termino = busqueda.toLowerCase()
        const nombreMatch = alerta.articulo?.nombre?.toLowerCase().includes(termino)
        const codigoMatch = false
        if (!nombreMatch && !codigoMatch) return false
      }
      return true
    })
  }, [alertas, tabActiva, busqueda])

  const stats = useMemo(() => {
    const total = alertas.length
    const pendientes = alertas.filter((a: Alerta) => a.estado === 'abierta').length
    const confirmadas = alertas.filter((a: Alerta) => a.estado === 'confirmada').length
    const resueltas = alertas.filter((a: Alerta) => a.estado === 'resuelta').length
    const criticas = alertas.filter((a: Alerta) => a.severidad === 'critica' && a.estado !== 'resuelta').length
    return { total, pendientes, confirmadas, resueltas, criticas }
  }, [alertas])

  const handleVer = (alerta: Alerta) => {
    setAlertaDetalle(alerta)
    setDialogoAbierto(true)
  }

  const handleConfirmar = async (id: number) => {
    await confirmarMutation.mutateAsync(id)
    void queryClient.invalidateQueries({ queryKey: queryKeys.alertas() })
  }

  const handleResolver = async (id: number) => {
    await resolverMutation.mutateAsync({ id })
    void queryClient.invalidateQueries({ queryKey: queryKeys.alertas() })
    setDialogoAbierto(false)
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Alertas</h2>
        <p className="text-sm text-muted-foreground">Gestión de alertas de stock, caducidad y mantenimiento.</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={cn('border-l-4', stats.pendientes > 0 ? 'border-l-destructive' : 'border-l-muted')}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-2xl font-bold">{stats.pendientes}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Confirmadas</p>
            <p className="text-2xl font-bold">{stats.confirmadas}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Resueltas</p>
            <p className="text-2xl font-bold">{stats.resueltas}</p>
          </CardContent>
        </Card>
        <Card className={cn('border-l-4', stats.criticas > 0 ? 'border-l-destructive bg-destructive/5' : 'border-l-muted')}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Críticas</p>
            <p className={cn('text-2xl font-bold', stats.criticas > 0 && 'text-destructive')}>{stats.criticas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por artículo o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: queryKeys.alertas() })}>
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tabActiva} onValueChange={(v) => setTabActiva(v as typeof tabActiva)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="todas">
            Todas <Badge variant="secondary" className="ml-1.5">{stats.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pendientes">
            Pendientes {stats.pendientes > 0 && <Badge variant="destructive" className="ml-1.5">{stats.pendientes}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="confirmadas">
            Confirmadas {stats.confirmadas > 0 && <Badge variant="secondary" className="ml-1.5">{stats.confirmadas}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="resueltas">
            Resueltas {stats.resueltas > 0 && <Badge variant="secondary" className="ml-1.5">{stats.resueltas}</Badge>}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : alertasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg">No hay alertas</h3>
          <p className="text-muted-foreground">{busqueda ? 'No se encontraron alertas con la búsqueda' : 'Todas las alertas han sido resueltas'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alertasFiltradas.map((alerta: Alerta) => (
            <AlertaCard
              key={alerta.id}
              alerta={alerta}
              onVer={handleVer}
              onConfirmar={handleConfirmar}
              onResolver={handleResolver}
            />
          ))}
        </div>
      )}

      {/* Dialog detalle */}
      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="size-5 text-primary" />
              Detalle de Alerta
            </DialogTitle>
            <DialogDescription>Información completa de la alerta</DialogDescription>
          </DialogHeader>
          {alertaDetalle && (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{alertaDetalle.articulo?.nombre}</h3>
                  <p className="text-sm text-muted-foreground">Artículo ID: {alertaDetalle.articulo?.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <SeveridadBadge severidad={alertaDetalle.severidad} />
                <EstadoBadge estado={alertaDetalle.estado} />
              </div>
              <p className="text-sm text-muted-foreground">
                {(alertaDetalle.datos_json as { mensaje?: string } | undefined)?.mensaje || `Alerta de ${alertaDetalle.tipo}`}
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Tipo de alerta</p>
                  <p className="font-semibold capitalize">{alertaDetalle.tipo.replace('_', ' ')}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Generada</p>
                  <p className="font-semibold">{formatearFechaRelativa(alertaDetalle.generada_en)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
