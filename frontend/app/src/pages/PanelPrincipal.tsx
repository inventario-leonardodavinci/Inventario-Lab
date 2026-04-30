import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/ContextoAutenticacion";
import { usePanelData } from "@/hooks/usePanelData";
import { formatearKpi } from "@/utils/panelUtils";
import { formatearFechaRelativa } from "@/utils/formatters";
import { ArrowDownToLine, ArrowUpFromLine, BellRing, PackageCheck, TriangleAlert } from "lucide-react";
import { SkeletonPanel } from "@/components/ui/PageSkeleton";

const kpiIconMap: Record<string, React.ElementType> = {
  PackageCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  TriangleAlert,
};

const kpiBadgeVariant: Record<string, "destructive" | "secondary"> = {
  Urgente: "destructive",
  Estable: "secondary",
  Operativo: "secondary",
  Control: "secondary",
};

export default function PanelPrincipal() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  const {
    inventoryCount,
    criticalCount,
    entradasHoy,
    salidasHoy,
    unreadNotifications,
    movimientosRecientes,
    errorMovimientos,
    lowStockItems,
    cargando,
  } = usePanelData();

  if (cargando) return <SkeletonPanel />;

  const kpiCards = [
    {
      title: "Articulos en inventario",
      value: formatearKpi(inventoryCount),
      delta: "Total registrados",
      badge: "Estable" as const,
      icon: "PackageCheck" as const,
    },
    {
      title: "Entradas hoy",
      value: formatearKpi(entradasHoy),
      delta: "Movimientos registrados hoy",
      badge: "Operativo" as const,
      icon: "ArrowDownToLine" as const,
    },
    {
      title: "Salidas hoy",
      value: formatearKpi(salidasHoy),
      delta: "Movimientos registrados hoy",
      badge: "Control" as const,
      icon: "ArrowUpFromLine" as const,
    },
    {
      title: "Stock crítico",
      value: formatearKpi(criticalCount),
      delta: `${unreadNotifications} notificaciones abiertas`,
      badge: "Urgente" as const,
      icon: "TriangleAlert" as const,
    },
  ];

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
          {cargando && (
            <span className="text-xs text-muted-foreground animate-pulse">Cargando datos…</span>
          )}
          <Button variant="outline">Exportar resumen</Button>
          <Button onClick={() => navigate('/movimientos')}>Registrar movimiento</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpiIconMap[kpi.icon];
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex flex-col gap-1">
                  <CardDescription>{kpi.title}</CardDescription>
                  <CardTitle className="text-3xl">{kpi.value}</CardTitle>
                </div>
                <div className="rounded-md bg-muted p-2 text-muted-foreground">
                  <Icon />
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{kpi.delta}</p>
                <Badge variant={kpiBadgeVariant[kpi.badge]}>{kpi.badge}</Badge>
              </CardContent>
            </Card>
          );
        })}
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
                  <TableHead>Artículo</TableHead>
                  <TableHead>Stock actual</TableHead>
                  <TableHead>Stock mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Sin artículos en estado crítico.
                    </TableCell>
                  </TableRow>
                )}
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
            {movimientosRecientes === null && (
              <p className="text-sm text-muted-foreground animate-pulse">Cargando actividad…</p>
            )}

            {errorMovimientos && (
              <p className="text-sm text-destructive">
                No se pudo cargar la actividad reciente.
              </p>
            )}

            {movimientosRecientes !== null && movimientosRecientes.length === 0 && !errorMovimientos && (
              <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
            )}

            {movimientosRecientes !== null && movimientosRecientes.length > 0 &&
              movimientosRecientes.map((mov, idx) => (
                <div key={mov.id}>
                  <div className="flex items-start gap-3">
                    <BellRing className="mt-0.5 text-muted-foreground" />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{mov.tipo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatearFechaRelativa(mov.fechaHora)} — Responsable: {mov.responsable}
                      </p>
                    </div>
                  </div>
                  {idx < movimientosRecientes.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
