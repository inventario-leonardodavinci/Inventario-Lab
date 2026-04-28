import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";

const inventoryRows = [
  {
    code: "INV-001",
    item: "Placas Petri 90mm",
    category: "Consumible",
    location: "Almacen A",
    stock: 12,
    status: "Crítico",
  },
  {
    code: "INV-034",
    item: "Agar nutritivo",
    category: "Reactivo",
    location: "Frio 2",
    stock: 46,
    status: "Estable",
  },
  {
    code: "INV-089",
    item: "Tubos Falcon 15ml",
    category: "Consumible",
    location: "Almacen B",
    stock: 74,
    status: "Bajo",
  },
  {
    code: "INV-142",
    item: "Bata desechable T-M",
    category: "EPP",
    location: "Vestuario",
    stock: 130,
    status: "Estable",
  },
];

export default function Inventory() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Catálogo de Inventario</h2>
          <p className="text-sm text-muted-foreground">
            Gestión de materiales, equipos y reactivos.
          </p>
        </div>
        <Button>
          <Plus data-icon="inline-start" />
          Nuevo item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Busqueda y filtros</CardTitle>
          <CardDescription>Consulta rápida por código, nombre o categoría.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-[6px] flex flex-wrap text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por código o nombre..." />
          </div>
          <Button variant="outline">Solo stock bajo</Button>
          <Button variant="outline">Exportar CSV</Button>
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
                <TableHead>Item</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryRows.map((row) => (
                <TableRow key={row.code}>
                  <TableCell className="font-medium">{row.code}</TableCell>
                  <TableCell>{row.item}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>{row.stock}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "Crítico"
                          ? "destructive"
                          : row.status === "Bajo"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
