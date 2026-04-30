/**
 * Página de alertas del sistema.
 * Requisitos: 7.6, 7.7, 7.8
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { GuardRol } from '@/components/auth/GuardRol'
import { useAlertas, useConfirmarAlerta, useResolverAlerta } from '@/hooks/queries'
import {
  formatearTipoAlerta, formatearSeveridad, formatearEstadoAlerta, formatearFechaRelativa,
} from '@/utils/formatters'
import type { TipoAlerta, Severidad, EstadoAlerta } from '@/types'
import { toast } from 'sonner'
import { SkeletonAlertas } from '@/components/ui/PageSkeleton'

type FiltroTipo = TipoAlerta | 'todos'
type FiltroSeveridad = Severidad | 'todas'
type FiltroEstado = EstadoAlerta | 'todos'

function varianteSeveridad(sev: Severidad): 'secondary' | 'outline' | 'default' | 'destructive' {
  switch (sev) {
    case 'baja': return 'secondary'
    case 'media': return 'outline'
    case 'alta': return 'default'
    case 'critica': return 'destructive'
  }
}

export default function Alertas() {
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [filtroSeveridad, setFiltroSeveridad] = useState<FiltroSeveridad>('todas')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')

  const filtros = {
    ...(filtroTipo !== 'todos' ? { tipo: filtroTipo } : {}),
    ...(filtroSeveridad !== 'todas' ? { severidad: filtroSeveridad } : {}),
    ...(filtroEstado !== 'todos' ? { estado: filtroEstado } : {}),
  }

  const { data, isLoading } = useAlertas(filtros)
  const confirmarMutation = useConfirmarAlerta()
  const resolverMutation = useResolverAlerta()

  const alertas = data?.data ?? []

  if (isLoading) return <SkeletonAlertas />

  const onConfirmar = async (id: number) => {
    try {
      await confirmarMutation.mutateAsync(id)
      toast.success('Alerta confirmada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo confirmar la alerta')
    }
  }

  const onResolver = async (id: number) => {
    try {
      await resolverMutation.mutateAsync(id)
      toast.success('Alerta resuelta')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo resolver la alerta')
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Alertas</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de alertas de stock, caducidad y mantenimiento.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra las alertas por tipo, severidad y estado.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-tipo-alerta">Tipo</Label>
            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as FiltroTipo)}>
              <SelectTrigger id="filtro-tipo-alerta" className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="stock_bajo">Stock bajo</SelectItem>
                <SelectItem value="caducidad">Caducidad</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="inactividad">Inactividad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-severidad">Severidad</Label>
            <Select value={filtroSeveridad} onValueChange={(v) => setFiltroSeveridad(v as FiltroSeveridad)}>
              <SelectTrigger id="filtro-severidad" className="w-[160px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-estado">Estado</Label>
            <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as FiltroEstado)}>
              <SelectTrigger id="filtro-estado" className="w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="abierta">Abierta</SelectItem>
                <SelectItem value="confirmada">Confirmada</SelectItem>
                <SelectItem value="resuelta">Resuelta</SelectItem>
                <SelectItem value="ignorada">Ignorada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de alertas</CardTitle>
          <CardDescription>
            {isLoading ? 'Cargando...' : `${alertas.length} alerta${alertas.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artículo afectado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Generada</TableHead>
                <GuardRol roles={['administrador', 'profesor']}>
                  <TableHead className="text-right">Acciones</TableHead>
                </GuardRol>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertas.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay alertas con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
              {alertas.map((alerta) => (
                <TableRow key={alerta.id}>
                  <TableCell className="font-medium">
                    {alerta.articulo?.nombre ?? '-'}
                  </TableCell>
                  <TableCell>{formatearTipoAlerta(alerta.tipo)}</TableCell>
                  <TableCell>
                    <Badge variant={varianteSeveridad(alerta.severidad)}>
                      {formatearSeveridad(alerta.severidad)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatearEstadoAlerta(alerta.estado)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatearFechaRelativa(alerta.generada_en)}
                  </TableCell>
                  <GuardRol roles={['administrador', 'profesor']}>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {alerta.estado === 'abierta' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void onConfirmar(alerta.id)}
                            disabled={confirmarMutation.isPending}
                          >
                            Confirmar
                          </Button>
                        )}
                        {alerta.estado === 'confirmada' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void onResolver(alerta.id)}
                            disabled={resolverMutation.isPending}
                          >
                            Resolver
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </GuardRol>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
