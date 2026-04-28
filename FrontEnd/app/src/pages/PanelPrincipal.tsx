import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/ContextoAutenticacion";
import { getInventario } from "@/services/inventarioApi";
import { getNotificaciones } from "@/services/notificacionesApi";
import { ArrowDownToLine, ArrowUpFromLine, BellRing, PackageCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function PanelPrincipal() {
  const { user } = useAuth();
  const [inventoryCount, setInventoryCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<Array<{ item: string; stock: string; min: string; status: string }>>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) return;
    getInventario(user.authUserId).then((result) => {
      setInventoryCount(result.meta.total);
      const low = result.data.filter((row) => row.status === "critical");
      setCriticalCount(low.length);
      setLowStockItems(
        low.slice(0, 6).map((row) => ({
          item: row.name,
          stock: String(row.stock),
          min: String(row.min_stock),
          status: "Crítico",
        })),
      );
    });

    getNotificaciones(user.authUserId).then((result) => {
      setUnreadNotifications(result.unread_count);
    });
  }, [user]);

  const kpiCards = useMemo(
    () => [
      {
        title: "Articulos en inventario",
        value: String(inventoryCount),
        delta: "Total registrados",
        badge: "Estable",
        icon: PackageCheck,
      },
      {
        title: "Entradas hoy",
        value: "-",
        delta: "Disponible desde historial",
        badge: "Operativo",
        icon: ArrowDownToLine,
      },
      {
        title: "Salidas hoy",
        value: "-",
        delta: "Disponible desde historial",
        badge: "Control",
        icon: ArrowUpFromLine,
      },
      {
        title: "Stock crítico",
        value: String(criticalCount),
        delta: `${unreadNotifications} notificaciones abiertas`,
        badge: "Urgente",
        icon: TriangleAlert,
      },
    ],
    [criticalCount, inventoryCount, unreadNotifications],
  );

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Panel</h2>
          <p className="text-sm text-muted-foreground">
            Monitoreo central del inventario del laboratorio de salud ambiental.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Exportar resumen</Button>
          <Button>Registrar movimiento</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex flex-col gap-1">
                <CardDescription>{kpi.title}</CardDescription>
                <CardTitle className="text-3xl">{kpi.value}</CardTitle>
              </div>
              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                <kpi.icon />
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{kpi.delta}</p>
              <Badge variant={kpi.badge === "Urgente" ? "destructive" : "secondary"}>{kpi.badge}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Alertas de stock y caducidad</CardTitle>
            <CardDescription>Articulos que requieren intervención durante las próximas 24 horas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Articulo</TableHead>
                  <TableHead>Stock actual</TableHead>
                  <TableHead>Stock minimo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((row) => (
                  <TableRow key={row.item}>
                    <TableCell className="font-medium">{row.item}</TableCell>
                    <TableCell>{row.stock}</TableCell>
                    <TableCell>{row.min}</TableCell>
                    <TableCell>
                      <Badge variant={row.status === "Crítico" ? "destructive" : "outline"}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Eventos relevantes del turno actual.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <BellRing className="mt-0.5 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Recepcion de lote de medios de cultivo</p>
                <p className="text-xs text-muted-foreground">Hace 12 minutos - Responsable: Marta R.</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Stock bajo en placas Petri</p>
                <p className="text-xs text-muted-foreground">Hace 21 minutos - Se recomienda reposicion.</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <ArrowUpFromLine className="mt-0.5 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Salida para analisis externo</p>
                <p className="text-xs text-muted-foreground">Hace 35 minutos - Orden MOV-2026-184.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
