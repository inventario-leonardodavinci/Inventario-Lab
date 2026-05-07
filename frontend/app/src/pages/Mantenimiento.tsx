import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMantenimiento, useCrearActivo } from '@/hooks/queries'
import { GuardRol } from '@/components/auth/GuardRol'
import { toast } from 'sonner'
import type { ActivoMantenimiento } from '@/types'
import { SkeletonMantenimiento } from '@/components/ui/PageSkeleton'
import { Wrench, Plus } from 'lucide-react'
import { formatearEstadoActivo } from '@/utils/formatters'

// Re-exportamos el tipo para compatibilidad con código que lo importa desde aquí
export type { ActivoMantenimiento }

const varianteEstado: Record<string, 'secondary' | 'outline' | 'default' | 'destructive'> = {
  operativo: 'secondary',
  mantenimiento_pendiente: 'default',
  en_mantenimiento: 'default',
  fuera_servicio: 'destructive',
  retirado: 'outline',
}

export default function Mantenimiento() {
  const [assetCode, setAssetCode] = useState('')

  const { data, isFetching, isLoading } = useMantenimiento()
  const assets = (data?.data ?? []) as ActivoMantenimiento[]

  const crearMutation = useCrearActivo()

  if (isLoading) return <SkeletonMantenimiento />

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
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="page-section flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold tracking-tight">Mantenimiento</h2>
          <p className="text-sm text-muted-foreground">Gestión de activos y estado operativo del laboratorio.</p>
        </div>
        {isFetching && (
          <span className="text-xs text-muted-foreground animate-pulse">Actualizando…</span>
        )}
      </div>

      {/* Alta rápida — solo administrador y profesor */}
      <GuardRol roles={['administrador', 'profesor']}>
        <Card className="page-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="size-4 text-primary" />
              </div>
              Alta rápida de activo
            </CardTitle>
            <CardDescription>Registra un nuevo activo con su código identificador.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Código de activo (ej. EQ-001)"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void createAsset() }}
              className="max-w-sm"
            />
            <Button onClick={createAsset} disabled={crearMutation.isPending || !assetCode.trim()} className="gap-1.5">
              <Plus className="size-4" />
              {crearMutation.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </CardContent>
        </Card>
      </GuardRol>

      {/* Tabla de activos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Wrench className="size-4 text-primary" />
            </div>
            Activos registrados
          </CardTitle>
          <CardDescription>
            {assets.length} activo{assets.length !== 1 ? 's' : ''} en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Wrench className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Sin activos registrados</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Usa el formulario de arriba para registrar el primer activo.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Artículo relacionado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium font-mono">{asset.codigo_activo}</TableCell>
                    <TableCell>
                      <Badge variant={varianteEstado[asset.estado] ?? 'outline'}>
                        {formatearEstadoActivo(asset.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.articulo?.nombre ?? (asset.articulo_id ? `#${asset.articulo_id}` : '—')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
