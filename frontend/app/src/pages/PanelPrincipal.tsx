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
import { ArrowDownToLine, ArrowUpFromLine, BellRing, PackageCheck, TriangleAlert, Plus, ArrowLeftRight, SlidersHorizontal } from "lucide-react";
import { SkeletonPanel } from "@/components/ui/PageSkeleton";

const kpiIconMap: Record<string, React.ElementType> = {
  PackageCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  TriangleAlert,
};

const kpiIconColor: Record<string, string> = {
  PackageCheck: "text-blue-600 bg-blue-500/10",
  ArrowDownToLine: "text-green-600 bg-green-500/10",
  ArrowUpFromLine: "text-amber-600 bg-amber-500/10",
  TriangleAlert: "text-destructive bg-destructive/10",
};

const kpiBadgeVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  Urgente: "destructive",
  Estable: "secondary",
  Operativo: "secondary",
  Control: "outline",
};

function IconoMovimiento({ tipo }: { tipo: string }) {
  const t = tipo.toLowerCase()
  if (t === 'entrada') return <ArrowDownToLine className="size-3.5 text-green-600" />
  if (t === 'salida') return <ArrowUpFromLine className="size-3.5 text-amber-600" />
  if (t === 'traslado') return <ArrowLeftRight className="size-3.5 text-blue-600" />
  if (t === 'ajuste') return <SlidersHorizontal className="size-3.5 text-purple-600" />
  return <BellRing className="size-3.5 text-muted-foreground" />
}

function colorFondoMovimiento(tipo: string): string {
  const t = tipo.toLowerCase()
  if (t === 'entrada') return 'bg-green-500/10'
  if (t === 'salida') return 'bg-amber-500/10'
  if (t === 'traslado') return 'bg-blue-500/10'
  if (t === 'ajuste') return 'bg-purple-500/10'
  return 'bg-muted'
}

export default function PanelPrincipal() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  if (!user) {
    navigate("/login");
    return null;
  }

  if (cargando) return <SkeletonPanel />;

  const kpiCards = [
    {
      title: "Artículos en inventario",
      value: formatearKpi(inventoryCount),
      delta: "Total registrados",
      badge: "Estable" as const,
      icon: "PackageCheck" as const,
    },
    {
      title: "Entradas hoy",
      value: formatearKpi(entradasHoy),
      delta: "Movimientos de entrada",
      badge: "Operativo" as const,
      icon: "ArrowDownToLine" as const,
    },
    {
      title: "Salidas hoy",
      value: formatearKpi(salidasHoy),
      delta: "Movimientos de salida",
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
          <Button variant="outline" size="sm">Exportar resumen</Button>
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/articulos')}>
            <Plus className="size-4" />
            Registrar movimiento
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpiIconMap[kpi.icon];
          const iconColor = kpiIconColor[kpi.icon];
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex flex-col gap-1">
                  <CardDescription>{kpi.title}</CardDescription>
                  <CardTitle className="text-3xl">{kpi.value}</CardTitle>
                </div>
                <div className={`rounded-lg p-2 ${iconColor}`}>
                  <Icon className="size-5" />
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
            <CardTitle>Artículos con stock crítico</CardTitle>
            <CardDescription>Requieren reposición o revisión urgente.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10">
                  <PackageCheck className="size-5 text-green-600" />
                </div>
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">Todo el stock está en orden</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artículo</TableHead>
                    <TableHead className="text-right">Stock actual</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((row) => (
                    <TableRow key={row.item}>
                      <TableCell className="font-medium">{row.item}</TableCell>
                      <TableCell className="text-right font-mono">{row.stock}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{row.min}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "Crítico" ? "destructive" : "outline"}>{row.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Últimos movimientos del turno actual.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {movimientosRecientes === null && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Cargando actividad…
              </div>
            )}

            {errorMovimientos && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                No se pudo cargar la actividad reciente.
              </div>
            )}

            {movimientosRecientes !== null && movimientosRecientes.length === 0 && !errorMovimientos && (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                  <BellRing className="size-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>
              </div>
            )}

            {movimientosRecientes !== null && movimientosRecientes.length > 0 &&
              movimientosRecientes.map((mov, idx) => (
                <div key={mov.id}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${colorFondoMovimiento(mov.tipo)}`}>
                      <IconoMovimiento tipo={mov.tipo} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-sm font-medium capitalize">{mov.tipo}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatearFechaRelativa(mov.fechaHora)} · {mov.responsable}
                      </p>
                    </div>
                  </div>
                  {idx < movimientosRecientes.length - 1 && <Separator className="mt-3" />}
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
