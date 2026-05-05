/**
 * Página de movimientos de stock.
 * Requisitos: 6.8, 6.9
 */
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/ContextoAutenticacion'
import { useMovimientos, useCrearMovimiento, useUbicaciones, useArticulos } from '@/hooks/queries'
import { formatearTipoMovimiento, formatearFechaHora } from '@/utils/formatters'
import { esquemaMovimiento, type EntradaMovimientoForm } from '@/schemas'
import type { TipoMovimiento } from '@/types'
import { toast } from 'sonner'
import { SkeletonMovimientos } from '@/components/ui/PageSkeleton'

type FiltroTipo = TipoMovimiento | 'todos'

export default function Movimientos() {
  const { user } = useAuth()

  // ─── Formulario con react-hook-form + zod ─────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntradaMovimientoForm>({
    resolver: zodResolver(esquemaMovimiento),
    defaultValues: { tipo: 'entrada', articulo_id: '', cantidad: 1 },
  })

  const tipoActual = watch('tipo')
  const mostrarOrigen = tipoActual === 'salida' || tipoActual === 'traslado'
  const mostrarDestino = tipoActual === 'entrada' || tipoActual === 'traslado'

  // ─── Filtro del historial ─────────────────────────────────────────────────
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')

  const filtros = filtroTipo !== 'todos' ? { tipo: filtroTipo } : undefined
  const { data, isFetching, isLoading, refetch } = useMovimientos(filtros)
  const { data: ubicacionesData } = useUbicaciones()
  const { data: articulosData } = useArticulos({ activo: true })
  const rows = data?.data ?? []
  const ubicaciones = ubicacionesData?.data ?? []
  const articulos = articulosData?.data ?? []

  const crearMutation = useCrearMovimiento()

  if (isLoading) return <SkeletonMovimientos />

  const onSubmit = async (valores: EntradaMovimientoForm) => {
    try {
      await crearMutation.mutateAsync({
        tipo: valores.tipo,
        motivo: valores.motivo || undefined,
        ubicacion_origen_id: valores.ubicacion_origen_id ? Number(valores.ubicacion_origen_id) : undefined,
        ubicacion_destino_id: valores.ubicacion_destino_id ? Number(valores.ubicacion_destino_id) : undefined,
        lineas: [{ articulo_id: Number(valores.articulo_id), cantidad: valores.cantidad }],
      })
      toast.success('Movimiento guardado')
      reset({ tipo: valores.tipo, articulo_id: '', cantidad: 1, motivo: '', ubicacion_origen_id: '', ubicacion_destino_id: '' })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Movimientos</h2>
        <p className="text-sm text-muted-foreground">
          Registro de entradas, salidas, traslados y ajustes de stock.
        </p>
      </div>

      {/* Formulario de nuevo movimiento */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar nuevo movimiento</CardTitle>
          <CardDescription>Completa los datos para mantener trazabilidad y auditoría.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="movement-type">Tipo de movimiento</Label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="movement-type">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="salida">Salida</SelectItem>
                      <SelectItem value="traslado">Traslado</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="movement-item">Artículo</Label>
              <Controller
                name="articulo_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="movement-item" aria-invalid={!!errors.articulo_id}>
                      <SelectValue placeholder="Seleccionar artículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {articulos.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          {a.nombre}{a.codigo ? ` (${a.codigo})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.articulo_id && (
                <p className="text-xs text-destructive">{errors.articulo_id.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="movement-quantity">Cantidad</Label>
              <Input
                id="movement-quantity"
                type="number"
                min="1"
                placeholder="Ej. 24"
                aria-invalid={!!errors.cantidad}
                {...register('cantidad', { valueAsNumber: true })}
              />
              {errors.cantidad && (
                <p className="text-xs text-destructive">{errors.cantidad.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Responsable</Label>
              <Input value={user?.displayName ?? '-'} disabled />
            </div>

            {/* Ubicación origen (salida / traslado) */}
            {mostrarOrigen && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement-origen">Ubicación origen</Label>
                <Controller
                  name="ubicacion_origen_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id="movement-origen">
                        <SelectValue placeholder="Seleccionar ubicación origen" />
                      </SelectTrigger>
                      <SelectContent>
                        {ubicaciones.map((ub) => (
                          <SelectItem key={ub.id} value={String(ub.id)}>
                            {ub.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Ubicación destino (entrada / traslado) */}
            {mostrarDestino && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="movement-destino">Ubicación destino</Label>
                <Controller
                  name="ubicacion_destino_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger id="movement-destino">
                        <SelectValue placeholder="Seleccionar ubicación destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {ubicaciones.map((ub) => (
                          <SelectItem key={ub.id} value={String(ub.id)}>
                            {ub.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="movement-note">Observaciones</Label>
              <Input
                id="movement-note"
                placeholder="Lote, motivo, destino, etc."
                {...register('motivo')}
              />
              {errors.motivo && (
                <p className="text-xs text-destructive">{errors.motivo.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
                {isFetching ? 'Cargando...' : 'Refrescar'}
              </Button>
              <Button type="submit" disabled={isSubmitting || crearMutation.isPending}>
                {isSubmitting || crearMutation.isPending ? 'Guardando...' : 'Guardar movimiento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Historial con filtros */}
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Historial de movimientos</CardTitle>
            <CardDescription>Registro completo de movimientos del inventario.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="filtro-tipo" className="shrink-0 text-sm">Filtrar por tipo:</Label>
            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)}>
              <SelectTrigger id="filtro-tipo" className="w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
                <SelectItem value="traslado">Traslado</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => {
                const origenNombre = row.ubicacion_origen_id
                  ? (ubicaciones.find((u) => u.id === row.ubicacion_origen_id)?.nombre ?? `#${row.ubicacion_origen_id}`)
                  : '-'
                const destinoNombre = row.ubicacion_destino_id
                  ? (ubicaciones.find((u) => u.id === row.ubicacion_destino_id)?.nombre ?? `#${row.ubicacion_destino_id}`)
                  : '-'

                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">MOV-{row.id}</TableCell>
                    <TableCell>
                      <Badge variant={row.tipo === 'salida' ? 'destructive' : 'secondary'}>
                        {formatearTipoMovimiento(row.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.lineas?.[0]?.articulo ?? row.lineas?.[0]?.articulo_id ?? '-'}</TableCell>
                    <TableCell>{row.lineas?.[0]?.cantidad ?? '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{origenNombre}</TableCell>
                    <TableCell className="text-muted-foreground">{destinoNombre}</TableCell>
                    <TableCell>{row.usuario?.nombre_visible ?? '-'}</TableCell>
                    <TableCell>{formatearFechaHora(row.created_at)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
