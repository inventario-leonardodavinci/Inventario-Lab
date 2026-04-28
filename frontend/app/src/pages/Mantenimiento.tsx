import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/ContextoAutenticacion";
import { apiClient } from "@/services/clienteApi";
import { toast } from "sonner";

type ActivoMantenimiento = {
  id: number;
  asset_code: string;
  status: string;
  item_id: number | null;
};

export default function Mantenimiento() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<ActivoMantenimiento[]>([]);
  const [assetCode, setAssetCode] = useState("");

  const loadAssets = async () => {
    if (!user) return;
    try {
      const response = await apiClient<{ data: ActivoMantenimiento[] }>(
        "/mantenimiento/activos",
        {},
        { authUserId: user.authUserId },
      );
      setAssets(response.data ?? []);
    } catch {
      toast.error("No se pudieron cargar activos");
    }
  };

  useEffect(() => {
    void loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createAsset = async () => {
    if (!user || !assetCode) return;
    try {
      await apiClient(
        "/mantenimiento/activos",
        {
          method: "POST",
          body: JSON.stringify({
            asset_code: assetCode,
            status: "operational",
          }),
        },
        { authUserId: user.authUserId },
      );
      toast.success("Activo creado");
      setAssetCode("");
      await loadAssets();
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
            onChange={(event) => setAssetCode(event.target.value)}
          />
          <Button onClick={createAsset}>Crear</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Activos registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Articulo relacionado</TableHead>
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
