import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/ContextoAutenticacion";
import { crearMovimiento, getMovimientos } from "@/services/movimientosApi";
import { toast } from "sonner";

export default function Movimientos() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Array<{
    id: number;
    movement_type: string;
    user?: { display_name: string | null };
    created_at: string;
    lines: Array<{ item_id: number; quantity: string }>;
  }>>([]);
  const [movementType, setMovementType] = useState<"entry" | "exit" | "transfer" | "adjustment">("entry");
  const [itemId, setItemId] = useState("1");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      const result = await getMovimientos(user.authUserId);
      setRows(result.data ?? []);
    } catch {
      toast.error("No se pudo cargar historial de movimientos.");
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async () => {
    if (!user) return;
    try {
      await crearMovimiento(user.authUserId, {
        movement_type: movementType,
        reason,
        source_location_id: movementType === "entry" ? undefined : 1,
        target_location_id: movementType === "exit" ? undefined : 1,
        lines: [{ item_id: Number(itemId), quantity: Number(quantity) }],
      });
      toast.success("Movimiento guardado");
      await loadData();
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
            <Select value={movementType} onValueChange={(value) => setMovementType(value as typeof movementType)}>
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
            <Label htmlFor="movement-item">Articulo</Label>
            <Input id="movement-item" placeholder="ID articulo (ej. 1)" value={itemId} onChange={(e) => setItemId(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-quantity">Cantidad</Label>
            <Input id="movement-quantity" placeholder="Ej. 24" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="movement-responsible">Responsable</Label>
            <Input id="movement-responsible" value={user?.displayName ?? "-"} disabled />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="movement-note">Observaciones</Label>
            <Input id="movement-note" placeholder="Lote, motivo, destino, etc." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button variant="outline" onClick={() => void loadData()}>Refrescar</Button>
            <Button onClick={onSubmit}>Guardar movimiento</Button>
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
                <TableHead>Articulo</TableHead>
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
                    <Badge variant={row.movement_type === "exit" ? "destructive" : "secondary"}>{row.movement_type}</Badge>
                  </TableCell>
                  <TableCell>{row.lines?.[0]?.item_id ?? "-"}</TableCell>
                  <TableCell>{row.lines?.[0]?.quantity ?? "-"}</TableCell>
                  <TableCell>{row.user?.display_name ?? "-"}</TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
