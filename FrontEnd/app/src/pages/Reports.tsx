import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const reportRows = [
  {
    id: "AUD-9812",
    event: "Ajuste manual de stock",
    user: "Supervisor: Elena P.",
    module: "Inventario",
    timestamp: "28/04/2026 10:13",
  },
  {
    id: "AUD-9811",
    event: "Salida aprobada",
    user: "Carlos M.",
    module: "Movimientos",
    timestamp: "28/04/2026 09:57",
  },
  {
    id: "AUD-9808",
    event: "Ingreso de lote L-2331",
    user: "Marta R.",
    module: "Movimientos",
    timestamp: "28/04/2026 08:42",
  },
];

export default function Reports() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Informes y Auditoría</h2>
        <p className="text-sm text-muted-foreground">
          Historial detallado de todos los cambios en el inventario.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de informe</CardTitle>
          <CardDescription>Acota los resultados por rango, módulo o responsable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="from-date">Fecha desde</Label>
            <Input id="from-date" type="date" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="to-date">Fecha hasta</Label>
            <Input id="to-date" type="date" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="module-filter">Módulo</Label>
            <Select>
              <SelectTrigger id="module-filter">
                <SelectValue placeholder="Todos los módulos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="inventory">Inventario</SelectItem>
                <SelectItem value="movements">Movimientos</SelectItem>
                <SelectItem value="reports">Reportes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="responsible-filter">Responsable</Label>
            <Input id="responsible-filter" placeholder="Ej. Marta R." />
          </div>
          <div className="flex items-end justify-end gap-2 md:col-span-4">
            <Button variant="outline">Limpiar filtros</Button>
            <Button>Generar informe</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Eventos hoy</CardDescription>
            <CardTitle className="text-3xl">64</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Ajustes manuales</CardDescription>
            <CardTitle className="text-3xl">11</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Usuarios activos</CardDescription>
            <CardTitle className="text-3xl">9</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log de auditoría</CardTitle>
          <CardDescription>Trazabilidad completa de cambios y aprobaciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>{row.event}</TableCell>
                  <TableCell>{row.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.module}</Badge>
                  </TableCell>
                  <TableCell>{row.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
