/**
 * Componente de sincronización de rol
 *
 * Obtiene el rol real desde el backend (vía TanStack Query con caché)
 * y lo sincroniza tanto en el store de Zustand como en el contexto de
 * autenticación (user.role). Así todos los checks de rol en el frontend
 * usan el valor actualizado de la BD, no el de la sesión cacheada.
 */

import { useEffect, useRef } from 'react'
import { useUserRole } from '@/hooks/queries'
import { useSesionStore } from '@/stores/useSesionStore'
import { useAuth } from '@/context/ContextoAutenticacion'
import type { SesionUsuario } from '@/services/authApi'

export function UserRoleSync() {
  const { data: rolBackend, isLoading, error } = useUserRole()
  const { actualizarUsuario } = useAuth()
  const setRol = useSesionStore((state) => state.setRol)
  const rolPersistido = useSesionStore((state) => state.rol)

  // Ref para evitar actualizaciones innecesarias
  const ultimoRol = useRef<string | null>(rolPersistido)

  useEffect(() => {
    if (rolBackend && typeof rolBackend === 'string') {
      if (rolBackend !== ultimoRol.current) {
        console.log('[UserRoleSync] Actualizando rol:', rolBackend)
        ultimoRol.current = rolBackend
        // Actualizar store persistido
        setRol(rolBackend)
        // Actualizar user.role en el contexto de autenticación
        // para que todos los checks de rol en la UI sean correctos
        actualizarUsuario({ role: rolBackend as SesionUsuario['role'] })
      }
    }
  }, [rolBackend, setRol, actualizarUsuario])

  // Log de debugging (solo en desarrollo)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[UserRoleSync] Estado:', {
        rolPersistido,
        rolBackend,
        isLoading,
        error: error?.message,
      })
    }
  }, [rolPersistido, rolBackend, isLoading, error])

  return null
}
