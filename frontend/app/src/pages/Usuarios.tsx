/**
 * Página de gestión de usuarios (solo administrador).
 * Requisitos: 9.4, 9.5, 9.6
 */
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/ContextoAutenticacion'
import { useUsuarios, useActualizarRolUsuario, usePerfil } from '@/hooks/queries'
import { formatearRol, formatearFecha } from '@/utils/formatters'
import type { Rol } from '@/types'
import { Shield } from 'lucide-react'
import { toast } from 'sonner'
import { SkeletonUsuarios } from '@/components/ui/PageSkeleton'

const ROLES: Rol[] = ['administrador', 'profesor', 'consultor']

function badgeVarianteRol(rol: Rol): 'default' | 'secondary' | 'outline' {
  switch (rol) {
    case 'administrador': return 'default'
    case 'profesor': return 'secondary'
    case 'consultor': return 'outline'
  }
}

/**
 * Extrae el rol principal del array de roles del usuario.
 * Prioriza 'administrador' > 'profesor' > 'consultor'.
 */
function extraerRol(roles: Array<{ id: number; name: string }>): Rol {
  const nombres = roles.map((r) => r.name)
  if (nombres.includes('administrador')) return 'administrador'
  if (nombres.includes('profesor')) return 'profesor'
  return 'consultor'
}

export default function Usuarios() {
  const { user } = useAuth()
  const { data: perfilData } = usePerfil()
  const { data, isLoading } = useUsuarios()
  const actualizarRolMutation = useActualizarRolUsuario()

  const usuarios = data?.data ?? []
  const perfilActual = perfilData?.data

  const esAdmin = user?.role === 'admin' || (user?.role as string) === 'administrador'

  if (isLoading) return <SkeletonUsuarios />

  if (!esAdmin) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-muted/20 p-4 lg:p-6">
        <Shield className="size-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Acceso restringido</h2>
        <p className="text-sm text-muted-foreground">
          Esta sección solo está disponible para administradores del sistema.
        </p>
      </main>
    )
  }

  const onCambiarRol = async (usuarioId: number, nuevoRol: Rol) => {
    try {
      await actualizarRolMutation.mutateAsync({ usuarioId, rol: nuevoRol })
      toast.success('Rol actualizado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el rol')
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Usuarios</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de usuarios y roles del sistema.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de usuarios</CardTitle>
          <CardDescription>
            {isLoading ? 'Cargando...' : `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''} registrado${usuarios.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre visible</TableHead>
                <TableHead>Rol actual</TableHead>
                <TableHead>Fecha de registro</TableHead>
                <TableHead className="text-right">Cambiar rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              )}
              {usuarios.map((usuario) => {
                const rolActual = extraerRol(usuario.roles)
                // No mostrar selector de rol para el propio usuario autenticado
                const esPropioUsuario = perfilActual?.id === usuario.id

                return (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      {usuario.nombre_visible ?? '-'}
                      {esPropioUsuario && (
                        <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeVarianteRol(rolActual)}>
                        {formatearRol(rolActual)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatearFecha(usuario.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!esPropioUsuario ? (
                        <Select
                          value={rolActual}
                          onValueChange={(v) => void onCambiarRol(usuario.id, v as Rol)}
                          disabled={actualizarRolMutation.isPending}
                        >
                          <SelectTrigger className="w-[160px] ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((rol) => (
                              <SelectItem key={rol} value={rol}>
                                {formatearRol(rol)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">No modificable</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
