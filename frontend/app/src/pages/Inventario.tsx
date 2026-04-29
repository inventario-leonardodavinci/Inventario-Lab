import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/ContextoAutenticacion";
import { useInventario } from "@/hooks/queries";
import { Search } from "lucide-react";

export default function Inventario() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [searchActivo, setSearchActivo] = useState("");

  const { data, isFetching, refetch } = useInventario(user?.authUserId, searchActivo);
  const rows = data?.data ?? [];

  const onBuscar = () => setSearchActivo(search);

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
          <CardTitle>Busqueda y filtros</CardTitle>
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
              onKeyDown={(e) => { if (e.key === "Enter") onBuscar(); }}
            />
          </div>
          <Button variant="outline" onClick={onBuscar}>Buscar</Button>
          <Button variant="outline" onClick={() => void refetch()}>
            {isFetching ? "Cargando..." : "Refrescar"}
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
                <TableHead>Item</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.code ?? "-"}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.category ?? "-"}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{row.stock}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "critical" ? "destructive" : "secondary"}>
                      {row.status === "critical" ? "Crítico" : "Estable"}
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
