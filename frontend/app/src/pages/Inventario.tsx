import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/ContextoAutenticacion";
import { crearArticuloInventario, getInventario, type FilaInventario } from "@/services/inventarioApi";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function Inventario() {
  const { user } = useAuth();
  const [rows, setRows] = useState<FilaInventario[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const criticalOnly = useMemo(() => rows.filter((row) => row.status === "critical"), [rows]);

  const loadRows = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getInventario(user.authUserId, search);
      setRows(result.data);
    } catch {
      toast.error("No se pudo cargar inventario.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreateQuickItem = async () => {
    if (!user) return;
    try {
      await crearArticuloInventario(user.authUserId, {
        code: `INV-${Date.now()}`,
        name: "Nuevo articulo rapido",
        category_id: 1,
        unit: "uds",
      });
      toast.success("Articulo creado");
      await loadRows();
    } catch {
      toast.error("No se pudo crear el articulo");
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Catálogo de Inventario</h2>
          <p className="text-sm text-muted-foreground">
            Gestión de materiales, equipos y reactivos.
          </p>
        </div>
        <Button onClick={handleCreateQuickItem}>
          <Plus data-icon="inline-start" />
          Nuevo articulo
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
            <Input
              className="pl-9"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void loadRows();
                }
              }}
            />
          </div>
          <Button variant="outline" onClick={() => setRows(criticalOnly)}>
            Solo stock bajo
          </Button>
          <Button variant="outline" onClick={() => void loadRows()}>
            {loading ? "Cargando..." : "Refrescar"}
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
                    <Badge
                      variant={
                        row.status === "critical"
                          ? "destructive"
                          : "secondary"
                      }
                    >
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
