/**
 * Componente de control de acceso por rol.
 * Renderiza children solo si el usuario autenticado tiene uno de los roles permitidos.
 * Si el usuario no tiene el rol requerido, no renderiza nada (null).
 *
 * Uso:
 *   <GuardRol roles={['administrador']}>
 *     <EnlaceAdministracion />
 *   </GuardRol>
 */
import { useAuth } from '@/context/ContextoAutenticacion'
import type { Rol } from '@/types'

interface GuardRolProps {
  /** Roles que tienen permiso para ver el contenido */
  roles: Rol[]
  /** Contenido a mostrar si el usuario tiene el rol */
  children: React.ReactNode
  /** Contenido alternativo si el usuario no tiene el rol (por defecto: null) */
  fallback?: React.ReactNode
}

export function GuardRol({ roles, children, fallback = null }: GuardRolProps) {
  const { user } = useAuth()

  if (!user) return <>{fallback}</>

  const tieneRol = roles.includes(user.role)

  if (!tieneRol) return <>{fallback}</>

  return <>{children}</>
}
