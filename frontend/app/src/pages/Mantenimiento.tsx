import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/ContextoAutenticacion";
import { useMantenimiento, useCrearActivo } from "@/hooks/queries";
import { toast } from "sonner";

export type ActivoMantenimiento = {
  id: number;
  asset_code: string;
  status: string;
  item_id: number | null;
};

export default function Mantenimiento() {
  const { user } = useAuth();
  const [assetCode, setAssetCode] = useState("");

  const { data, isFetching } = useMantenimiento(user?.authUserId);
  const assets = data?.data ?? [];

  const crearMutation = useCrearActivo(user?.authUserId ?? "");

  const createAsset = async () => {
    if (!assetCode.trim()) return;
    try {
      await crearMutation.mutateAsync({ asset_code: assetCode.trim(), status: "operational" });
      toast.success("Activo creado");
      setAssetCode("");
    } catch {
      toast.error("No se pudo crear activo");
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Mantenimiento</h2>
        <p className="text-sm text-muted-foreground">Gestión de activos y estado operativo.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alta rápida de activo</CardTitle>
          <CardDescription>Registro base para plan de mantenimiento.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Código de activo (ej. EQ-001)"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void createAsset(); }}
          />
          <Button onClick={createAsset} disabled={crearMutation.isPending || !assetCode.trim()}>
            {crearMutation.isPending ? "Creando..." : "Crear"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activos registrados</CardTitle>
          {isFetching && <p className="text-xs text-muted-foreground animate-pulse">Actualizando...</p>}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Artículo relacionado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.id}</TableCell>
                  <TableCell>{asset.asset_code}</TableCell>
                  <TableCell>{asset.status}</TableCell>
                  <TableCell>{asset.item_id ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
