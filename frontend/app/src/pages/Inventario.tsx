import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useArticulos } from '@/hooks/queries'
import { Search } from 'lucide-react'

export default function Inventario() {
  const [search, setSearch] = useState('')
  const [searchActivo, setSearchActivo] = useState('')

  const { data, isFetching, refetch } = useArticulos({ search: searchActivo })
  const rows = data?.data ?? []

  const onBuscar = () => setSearchActivo(search)

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Catálogo de Inventario</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de materiales, equipos y reactivos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y filtros</CardTitle>
          <CardDescription>Consulta rápida por código, nombre o categoría.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-[6px] text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onBuscar() }}
            />
          </div>
          <Button variant="outline" onClick={onBuscar}>Buscar</Button>
          <Button variant="outline" onClick={() => void refetch()}>
            {isFetching ? 'Cargando...' : 'Refrescar'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado general</CardTitle>
          <CardDescription>Inventario unificado del laboratorio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Activo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={!row.activo ? 'opacity-50' : undefined}
                >
                  <TableCell className="font-medium">{row.codigo ?? '-'}</TableCell>
                  <TableCell>{row.nombre}</TableCell>
                  <TableCell>{row.categoria ?? '-'}</TableCell>
                  <TableCell>{row.stock_total}</TableCell>
                  <TableCell>
                    <Badge variant={row.estado_stock === 'critico' ? 'destructive' : 'secondary'}>
                      {row.estado_stock === 'critico' ? 'Crítico' : 'Estable'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.activo
                      ? <Badge variant="secondary">Activo</Badge>
                      : <Badge variant="outline">Inactivo</Badge>
                    }
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
