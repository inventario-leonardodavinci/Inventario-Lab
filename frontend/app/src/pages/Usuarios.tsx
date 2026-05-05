/**
 * Página de gestión de usuarios (solo administrador).
 */
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/ContextoAutenticacion'
import {
  useUsuarios,
  useActualizarRolUsuario,
  useActualizarEstadoUsuario,
  useEliminarUsuario,
  usePerfil,
} from '@/hooks/queries'
import { formatearRol, formatearFecha, formatearFechaRelativa } from '@/utils/formatters'
import type { Rol, UsuarioApp } from '@/types'
import {
  Shield,
  MoreHorizontal,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Crown,
} from 'lucide-react'
import { toast } from 'sonner'
import { SkeletonUsuarios } from '@/components/ui/PageSkeleton'

const ROLES: Rol[] = ['administrador', 'profesor', 'consultor']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extraerRol(roles: Array<{ id: number; name: string }>): Rol {
  const nombres = roles.map((r) => r.name)
  if (nombres.includes('administrador')) return 'administrador'
  if (nombres.includes('profesor')) return 'profesor'
  return 'consultor'
}

function badgeVarianteRol(rol: Rol): 'default' | 'secondary' | 'outline' {
  if (rol === 'administrador') return 'default'
  if (rol === 'profesor') return 'secondary'
  return 'outline'
}

function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '?'
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Componente avatar ────────────────────────────────────────────────────────

function AvatarUsuario({
  usuario,
  size = 'md',
}: {
  usuario: UsuarioApp
  size?: 'sm' | 'md' | 'lg'
}) {
  const clases = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-16 text-lg',
  }[size]

  return (
    <Avatar className={clases}>
      {usuario.avatar_url && (
        <AvatarImage src={usuario.avatar_url} alt={usuario.nombre_visible ?? 'Usuario'} />
      )}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {iniciales(usuario.nombre_visible)}
      </AvatarFallback>
    </Avatar>
  )
}

// ─── Modal de detalle ─────────────────────────────────────────────────────────

function ModalDetalleUsuario({
  usuario,
  esPropioUsuario,
  onCerrar,
  onCambiarRol,
  onToggleEstado,
  onEliminar,
  pendiente,
}: {
  usuario: UsuarioApp
  esPropioUsuario: boolean
  onCerrar: () => void
  onCambiarRol: (rol: Rol) => void
  onToggleEstado: () => void
  onEliminar: () => void
  pendiente: boolean
}) {
  const rolActual = extraerRol(usuario.roles)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  return (
    <Dialog open onOpenChange={onCerrar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalle del usuario</DialogTitle>
          <DialogDescription>
            Información y acciones disponibles para este usuario.
          </DialogDescription>
        </DialogHeader>

        {/* Cabecera con avatar y nombre */}
        <div className="flex items-center gap-4 py-2">
          <AvatarUsuario usuario={usuario} size="lg" />
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base truncate">
                {usuario.nombre_visible ?? <span className="text-muted-foreground italic">Sin nombre</span>}
              </span>
              {esPropioUsuario && (
                <Badge variant="outline" className="text-xs shrink-0">Tú</Badge>
              )}
              {!usuario.activo && (
                <Badge variant="destructive" className="text-xs shrink-0">Desactivado</Badge>
              )}
            </div>
            <Badge variant={badgeVarianteRol(rolActual)} className="w-fit">
              {rolActual === 'administrador' && <Crown className="size-3 mr-1" />}
              {formatearRol(rolActual)}
            </Badge>
          </div>
        </div>

        {/* Datos */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border rounded-lg p-3 bg-muted/30">
          <span className="text-muted-foreground">ID interno</span>
          <span className="font-mono text-xs">{usuario.id}</span>

          <span className="text-muted-foreground">Auth ID</span>
          <span className="font-mono text-xs truncate" title={usuario.auth_user_id}>
            {usuario.auth_user_id.slice(0, 16)}…
          </span>

          <span className="text-muted-foreground">Registrado</span>
          <span>{formatearFecha(usuario.created_at)}</span>

          <span className="text-muted-foreground">Última actividad</span>
          <span>{formatearFechaRelativa(usuario.updated_at ?? usuario.created_at)}</span>

          <span className="text-muted-foreground">Estado</span>
          <span className={usuario.activo ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
            {usuario.activo ? 'Activo' : 'Desactivado'}
          </span>
        </div>

        {/* Acciones (solo si no es el propio usuario) */}
        {!esPropioUsuario && (
          <div className="flex flex-col gap-3 pt-1">
            {/* Cambiar rol */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Rol</span>
              <Select
                value={rolActual}
                onValueChange={(v) => onCambiarRol(v as Rol)}
                disabled={pendiente}
              >
                <SelectTrigger className="w-[180px]">
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
            </div>

            {/* Activar / Desactivar */}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEstado}
              disabled={pendiente}
              className="w-full justify-start gap-2"
            >
              {usuario.activo ? (
                <><UserX className="size-4 text-amber-500" /> Desactivar cuenta</>
              ) : (
                <><UserCheck className="size-4 text-green-600" /> Activar cuenta</>
              )}
            </Button>

            {/* Eliminar */}
            {!confirmarEliminar ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmarEliminar(true)}
                disabled={pendiente}
                className="w-full justify-start gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                <Trash2 className="size-4" /> Eliminar usuario
              </Button>
            ) : (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex flex-col gap-2">
                <p className="text-sm text-destructive font-medium">
                  ¿Eliminar permanentemente a {usuario.nombre_visible ?? 'este usuario'}?
                </p>
                <p className="text-xs text-muted-foreground">
                  Se eliminarán sus datos de sesión. Los movimientos y auditoría se conservan.
                </p>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onEliminar}
                    disabled={pendiente}
                    className="flex-1"
                  >
                    Sí, eliminar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmarEliminar(false)}
                    disabled={pendiente}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCerrar}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Usuarios() {
  const { user } = useAuth()
  const { data: perfilData } = usePerfil()
  const { data, isLoading } = useUsuarios()
  const actualizarRolMutation = useActualizarRolUsuario()
  const actualizarEstadoMutation = useActualizarEstadoUsuario()
  const eliminarMutation = useEliminarUsuario()

  const [usuarioDetalle, setUsuarioDetalle] = useState<UsuarioApp | null>(null)

  const usuarios = data?.data ?? []
  const perfilActual = perfilData?.data
  const cargandoPerfil = perfilData === undefined

  const esAdmin = user?.role === 'admin' || (user?.role as string) === 'administrador'
  const pendiente =
    actualizarRolMutation.isPending ||
    actualizarEstadoMutation.isPending ||
    eliminarMutation.isPending

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

  const handleCambiarRol = async (usuarioId: number, nuevoRol: Rol) => {
    try {
      await actualizarRolMutation.mutateAsync({ usuarioId, rol: nuevoRol })
      toast.success('Rol actualizado correctamente')
      // Actualizar el usuario en el modal si está abierto
      if (usuarioDetalle?.id === usuarioId) {
        setUsuarioDetalle((prev) =>
          prev ? { ...prev, roles: [{ id: 0, name: nuevoRol }] } : prev,
        )
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el rol')
    }
  }

  const handleToggleEstado = async (usuario: UsuarioApp) => {
    try {
      await actualizarEstadoMutation.mutateAsync({
        usuarioId: usuario.id,
        activo: !usuario.activo,
      })
      toast.success(usuario.activo ? 'Usuario desactivado' : 'Usuario activado')
      setUsuarioDetalle((prev) =>
        prev?.id === usuario.id ? { ...prev, activo: !usuario.activo } : prev,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado')
    }
  }

  const handleEliminar = async (usuario: UsuarioApp) => {
    try {
      await eliminarMutation.mutateAsync(usuario.id)
      toast.success(`Usuario "${usuario.nombre_visible ?? 'sin nombre'}" eliminado`)
      setUsuarioDetalle(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar el usuario')
    }
  }

  const activos = usuarios.filter((u) => u.activo).length
  const admins = usuarios.filter((u) => extraerRol(u.roles) === 'administrador').length

  return (
    <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      {/* Cabecera */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold tracking-tight">Usuarios</h2>
        <p className="text-sm text-muted-foreground">
          Gestión de usuarios y roles del sistema.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usuarios.length}</p>
              <p className="text-xs text-muted-foreground">Total usuarios</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <UserCheck className="size-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activos}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Crown className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{admins}</p>
              <p className="text-xs text-muted-foreground">Administradores</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de usuarios</CardTitle>
          <CardDescription>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {usuarios.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Users className="size-8" />
              <p className="text-sm">No hay usuarios registrados.</p>
            </div>
          ) : (
            <div className="divide-y">
              {usuarios.map((usuario) => {
                const rolActual = extraerRol(usuario.roles)
                const esPropioUsuario = !cargandoPerfil && perfilActual?.id === usuario.id

                return (
                  <div
                    key={usuario.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    {/* Avatar */}
                    <button
                      type="button"
                      onClick={() => setUsuarioDetalle(usuario)}
                      className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`Ver detalle de ${usuario.nombre_visible ?? 'usuario'}`}
                    >
                      <AvatarUsuario usuario={usuario} size="md" />
                    </button>

                    {/* Nombre y estado */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-medium text-sm truncate ${!usuario.activo ? 'text-muted-foreground line-through' : ''}`}
                        >
                          {usuario.nombre_visible ?? (
                            <span className="italic text-muted-foreground">Sin nombre</span>
                          )}
                        </span>
                        {esPropioUsuario && (
                          <Badge variant="outline" className="text-xs shrink-0">Tú</Badge>
                        )}
                        {!usuario.activo && (
                          <Badge variant="destructive" className="text-xs shrink-0">Desactivado</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={badgeVarianteRol(rolActual)} className="text-xs">
                          {rolActual === 'administrador' && <Crown className="size-2.5 mr-1" />}
                          {formatearRol(rolActual)}
                        </Badge>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Desde {formatearFecha(usuario.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Selector de rol rápido (solo en desktop, no para sí mismo) */}
                    {!esPropioUsuario && (
                      <div className="hidden md:block shrink-0">
                        <Select
                          value={rolActual}
                          onValueChange={(v) => void handleCambiarRol(usuario.id, v as Rol)}
                          disabled={pendiente || cargandoPerfil}
                        >
                          <SelectTrigger className="w-[150px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((rol) => (
                              <SelectItem key={rol} value={rol} className="text-xs">
                                {formatearRol(rol)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Menú de acciones */}
                    {!esPropioUsuario ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0"
                            disabled={pendiente || cargandoPerfil}
                            aria-label="Más acciones"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setUsuarioDetalle(usuario)}>
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => void handleToggleEstado(usuario)}
                          >
                            {usuario.activo ? (
                              <><UserX className="size-4 mr-2 text-amber-500" /> Desactivar</>
                            ) : (
                              <><UserCheck className="size-4 mr-2 text-green-600" /> Activar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setUsuarioDetalle(usuario)}
                          >
                            <Trash2 className="size-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="size-8 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      {usuarioDetalle && (
        <ModalDetalleUsuario
          usuario={usuarioDetalle}
          esPropioUsuario={!cargandoPerfil && perfilActual?.id === usuarioDetalle.id}
          onCerrar={() => setUsuarioDetalle(null)}
          onCambiarRol={(rol) => void handleCambiarRol(usuarioDetalle.id, rol)}
          onToggleEstado={() => void handleToggleEstado(usuarioDetalle)}
          onEliminar={() => void handleEliminar(usuarioDetalle)}
          pendiente={pendiente}
        />
      )}
    </main>
  )
}
