import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/ContextoAutenticacion";
import { useMovimientos, useCrearMovimiento } from "@/hooks/queries";
import { traducirTipoMovimiento } from "@/utils/panelUtils";
import { toast } from "sonner";

export default function Movimientos() {
  const { user } = useAuth();
  const [movementType, setMovementType] = useState<"entry" | "exit" | "transfer" | "adjustment">("entry");
  const [itemId, setItemId] = useState("1");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const { data, isFetching, refetch } = useMovimientos(user?.authUserId);
  const rows = data?.data ?? [];

  const crearMutation = useCrearMovimiento(user?.authUserId ?? "");

  const onSubmit = async () => {
    if (!user) return;
    try {
      await crearMutation.mutateAsync({
        movement_type: movementType,
        reason,
        lines: [{ item_id: Number(itemId), quantity: Number(quantity) }],
      });
      toast.success("Movimiento guardado");
      setReason("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar");
    }
  };

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
            <Select value={movementType} onValueChange={(v) => setMovementType(v as typeof movementType)}>
              <SelectTrigger id="movement-type">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entrada</SelectItem>
                <SelectItem value="exit">Salida</SelectItem>
                <SelectItem value="transfer">Traslado interno</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-item">Artículo (ID)</Label>
            <Input id="movement-item" placeholder="Ej. 1" value={itemId} onChange={(e) => setItemId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-quantity">Cantidad</Label>
            <Input id="movement-quantity" placeholder="Ej. 24" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Responsable</Label>
            <Input value={user?.displayName ?? "-"} disabled />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="movement-note">Observaciones</Label>
            <Input id="movement-note" placeholder="Lote, motivo, destino, etc." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
              {isFetching ? "Cargando..." : "Refrescar"}
            </Button>
            <Button onClick={onSubmit} disabled={crearMutation.isPending}>
              {crearMutation.isPending ? "Guardando..." : "Guardar movimiento"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial reciente</CardTitle>
          <CardDescription>Últimos movimientos registrados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">MOV-{row.id}</TableCell>
                  <TableCell>
                    <Badge variant={row.movement_type === "exit" ? "destructive" : "secondary"}>
                      {traducirTipoMovimiento(row.movement_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.lines?.[0]?.item_id ?? "-"}</TableCell>
                  <TableCell>{row.lines?.[0]?.quantity ?? "-"}</TableCell>
                  <TableCell>{row.user?.display_name ?? "-"}</TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleString("es-ES")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
