/**
 * Página de auditoría del sistema (solo administrador).
 * Requisitos: 8.5, 8.6
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
import { useAuditoria } from '@/hooks/queries'
import { formatearFechaHora } from '@/utils/formatters'
import { Shield } from 'lucide-react'

type FiltroOperacion = 'todos' | 'INSERT' | 'UPDATE' | 'DELETE'

function varianteOperacion(op: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (op.toUpperCase()) {
    case 'INSERT': return 'secondary'
    case 'UPDATE': return 'default'
    case 'DELETE': return 'destructive'
    default: return 'outline'
  }
}

/**
 * Genera un resumen legible de los cambios entre antes_json y despues_json.
 */
function resumirCambios(
  antes: Record<string, unknown> | null,
  despues: Record<string, unknown> | null,
): string {
  if (!antes && !despues) return '-'
  if (!antes && despues) {
    const claves = Object.keys(despues).slice(0, 3)
    return `Creado: ${claves.join(', ')}${Object.keys(despues).length > 3 ? '...' : ''}`
  }
  if (antes && !despues) return 'Registro eliminado'

  // Comparar claves que cambiaron
  const clavesAntes = Object.keys(antes ?? {})
  const clavesCambiadas = clavesAntes.filter(
    (k) => JSON.stringify(antes?.[k]) !== JSON.stringify(despues?.[k]),
  )
  if (clavesCambiadas.length === 0) return 'Sin cambios detectados'
  const resumen = clavesCambiadas.slice(0, 3).join(', ')
  return `Cambios en: ${resumen}${clavesCambiadas.length > 3 ? ` (+${clavesCambiadas.length - 3} más)` : ''}`
}

export default function Auditoria() {
  const { user } = useAuth()

  const [entidadTipo, setEntidadTipo] = useState('')
  const [filtroOperacion, setFiltroOperacion] = useState<FiltroOperacion>('todos')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [filtrosAplicados, setFiltrosAplicados] = useState({
    entidad_tipo: '',
    tipo_evento: '',
    desde: '',
    hasta: '',
  })

  const { data, isLoading } = useAuditoria(filtrosAplicados)
  const registros = data?.data ?? []

  // Verificar si el usuario es administrador (compatible con esquema anterior y nuevo)
  const esAdmin = user?.role === 'admin' || (user?.role as string) === 'administrador'

  if (!esAdmin) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-muted/20 p-4 lg:p-6">
        <Shield className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acceso restringido</h2>
        <p className="text-sm text-muted-foreground">
          Esta sección solo está disponible para administradores del sistema.
        </p>
      </main>
    )
  }

  const onAplicarFiltros = () => {
    setFiltrosAplicados({
      entidad_tipo: entidadTipo.trim(),
      tipo_evento: filtroOperacion !== 'todos' ? filtroOperacion : '',
      desde,
      hasta,
    })
  }

  const onLimpiarFiltros = () => {
    setEntidadTipo('')
    setFiltroOperacion('todos')
    setDesde('')
    setHasta('')
    setFiltrosAplicados({ entidad_tipo: '', tipo_evento: '', desde: '', hasta: '' })
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Auditoría</h2>
        <p className="text-sm text-muted-foreground">
          Registro de cambios del sistema. Solo visible para administradores.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra el log de auditoría por entidad, operación y rango de fechas.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-entidad">Tabla / Entidad</Label>
            <Input
              id="filtro-entidad"
              placeholder="Ej. articulos"
              value={entidadTipo}
              onChange={(e) => setEntidadTipo(e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-operacion">Operación</Label>
            <Select value={filtroOperacion} onValueChange={(v) => setFiltroOperacion(v as FiltroOperacion)}>
              <SelectTrigger id="filtro-operacion" className="w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="INSERT">INSERT</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-desde">Desde</Label>
            <Input
              id="filtro-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="filtro-hasta">Hasta</Label>
            <Input
              id="filtro-hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={onAplicarFiltros} disabled={isLoading}>
              Aplicar filtros
            </Button>
            <Button variant="outline" onClick={onLimpiarFiltros}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de auditoría</CardTitle>
          <CardDescription>
            {isLoading ? 'Cargando...' : `${registros.length} registro${registros.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabla afectada</TableHead>
                <TableHead>Operación</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Resumen del cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay registros de auditoría con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
              {registros.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    {reg.entidad_tipo}
                  </TableCell>
                  <TableCell>
                    <Badge variant={varianteOperacion(reg.tipo_evento)}>
                      {reg.tipo_evento}
                    </Badge>
                  </TableCell>
                  <TableCell>{reg.usuario?.nombre_visible ?? '-'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatearFechaHora(reg.created_at)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                    {resumirCambios(reg.antes_json, reg.despues_json)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
