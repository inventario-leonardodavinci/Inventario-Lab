/**
 * Página de movimientos de stock.
 * Requisitos: 6.8, 6.9
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/ContextoAutenticacion'
import { useMovimientos, useCrearMovimiento, useUbicaciones } from '@/hooks/queries'
import { formatearTipoMovimiento, formatearFechaHora } from '@/utils/formatters'
import type { TipoMovimiento } from '@/types'
import { toast } from 'sonner'
import { SkeletonMovimientos } from '@/components/ui/PageSkeleton'

type FiltroTipo = TipoMovimiento | 'todos'

export default function Movimientos() {
  const { user } = useAuth()

  // ─── Estado del formulario ────────────────────────────────────────────────
  const [tipo, setTipo] = useState<TipoMovimiento>('entrada')
  const [articuloId, setArticuloId] = useState('1')
  const [cantidad, setCantidad] = useState('1')
  const [motivo, setMotivo] = useState('')
  const [ubicacionOrigenId, setUbicacionOrigenId] = useState('')
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('')

  // ─── Filtro del historial ─────────────────────────────────────────────────
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')

  const filtros = filtroTipo !== 'todos' ? { tipo: filtroTipo } : undefined
  const { data, isFetching, isLoading, refetch } = useMovimientos(filtros)
  const { data: ubicacionesData } = useUbicaciones()
  const rows = data?.data ?? []
  const ubicaciones = ubicacionesData?.data ?? []

  const crearMutation = useCrearMovimiento()

  if (isLoading) return <SkeletonMovimientos />

  const onSubmit = async () => {
    if (!user) return
    try {
      await crearMutation.mutateAsync({
        tipo,
        motivo: motivo || undefined,
        ubicacion_origen_id: ubicacionOrigenId ? Number(ubicacionOrigenId) : undefined,
        ubicacion_destino_id: ubicacionDestinoId ? Number(ubicacionDestinoId) : undefined,
        lineas: [{ articulo_id: Number(articuloId), cantidad: Number(cantidad) }],
      })
      toast.success('Movimiento guardado')
      setMotivo('')
      setUbicacionOrigenId('')
      setUbicacionDestinoId('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar')
    }
  }

  // Determinar qué campos de ubicación mostrar según el tipo
  const mostrarOrigen = tipo === 'salida' || tipo === 'traslado'
  const mostrarDestino = tipo === 'entrada' || tipo === 'traslado'

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
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-type">Tipo de movimiento</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimiento)}>
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
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-item">Artículo (ID)</Label>
            <Input
              id="movement-item"
              placeholder="Ej. 1"
              value={articuloId}
              onChange={(e) => setArticuloId(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-quantity">Cantidad</Label>
            <Input
              id="movement-quantity"
              type="number"
              min="1"
              placeholder="Ej. 24"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Responsable</Label>
            <Input value={user?.displayName ?? '-'} disabled />
          </div>

          {/* Ubicación origen (salida / traslado) */}
          {mostrarOrigen && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="movement-origen">Ubicación origen</Label>
              <Select value={ubicacionOrigenId} onValueChange={setUbicacionOrigenId}>
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
            </div>
          )}

          {/* Ubicación destino (entrada / traslado) */}
          {mostrarDestino && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="movement-destino">Ubicación destino</Label>
              <Select value={ubicacionDestinoId} onValueChange={setUbicacionDestinoId}>
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
            </div>
          )}

          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="movement-note">Observaciones</Label>
            <Input
              id="movement-note"
              placeholder="Lote, motivo, destino, etc."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? 'Cargando...' : 'Refrescar'}
            </Button>
            <Button onClick={onSubmit} disabled={crearMutation.isPending}>
              {crearMutation.isPending ? 'Guardando...' : 'Guardar movimiento'}
            </Button>
          </div>
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
