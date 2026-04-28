import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const movementRows = [
  {
    id: "MOV-2026-184",
    type: "Salida",
    item: "Placas Petri 90mm",
    quantity: "18",
    responsible: "Carlos M.",
    date: "28/04/2026 12:47",
  },
  {
    id: "MOV-2026-183",
    type: "Entrada",
    item: "Agar nutritivo",
    quantity: "60",
    responsible: "Marta R.",
    date: "28/04/2026 12:31",
  },
  {
    id: "MOV-2026-182",
    type: "Salida",
    item: "Guantes nitrilo M",
    quantity: "25",
    responsible: "Ana V.",
    date: "28/04/2026 11:54",
  },
];

export default function Movements() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Movimientos</h2>
        <p className="text-sm text-muted-foreground">
          Registro de entradas, salidas y traslados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar nuevo movimiento</CardTitle>
          <CardDescription>Completa los datos para mantener trazabilidad y auditoría.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-type">Tipo de movimiento</Label>
            <Select>
              <SelectTrigger id="movement-type">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entrada</SelectItem>
                <SelectItem value="exit">Salida</SelectItem>
                <SelectItem value="transfer">Traslado interno</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-item">Item</Label>
            <Input id="movement-item" placeholder="Ej. Placas Petri 90mm" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-quantity">Cantidad</Label>
            <Input id="movement-quantity" placeholder="Ej. 24" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-responsible">Responsable</Label>
            <Input id="movement-responsible" placeholder="Nombre y apellido" />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="movement-note">Observaciones</Label>
            <Input id="movement-note" placeholder="Lote, motivo, destino, etc." />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button variant="outline">Limpiar</Button>
            <Button>Guardar movimiento</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial reciente</CardTitle>
          <CardDescription>Ultimos movimientos registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movementRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>
                    <Badge variant={row.type === "Salida" ? "destructive" : "secondary"}>{row.type}</Badge>
                  </TableCell>
                  <TableCell>{row.item}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.responsible}</TableCell>
                  <TableCell>{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
