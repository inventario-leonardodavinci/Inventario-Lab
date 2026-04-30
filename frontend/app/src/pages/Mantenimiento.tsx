import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMantenimiento, useCrearActivo } from '@/hooks/queries'
import { toast } from 'sonner'
import type { ActivoMantenimiento } from '@/types'

// Re-exportamos el tipo para compatibilidad con código que lo importa desde aquí
export type { ActivoMantenimiento }

export default function Mantenimiento() {
  const [assetCode, setAssetCode] = useState('')

  const { data, isFetching } = useMantenimiento()
  const assets = (data?.data ?? []) as ActivoMantenimiento[]

  const crearMutation = useCrearActivo()

  const createAsset = async () => {
    if (!assetCode.trim()) return
    try {
      await crearMutation.mutateAsync({ codigo_activo: assetCode.trim() })
      toast.success('Activo creado')
      setAssetCode('')
    } catch {
      toast.error('No se pudo crear activo')
    }
  }

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
            onKeyDown={(e) => { if (e.key === 'Enter') void createAsset() }}
          />
          <Button onClick={createAsset} disabled={crearMutation.isPending || !assetCode.trim()}>
            {crearMutation.isPending ? 'Creando...' : 'Crear'}
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
                  <TableCell>{asset.codigo_activo}</TableCell>
                  <TableCell>{asset.estado}</TableCell>
                  <TableCell>{asset.articulo?.nombre ?? asset.articulo_id ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
