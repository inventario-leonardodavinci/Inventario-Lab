/**
 * Componente de sincronización de rol
 * 
 * Este componente utiliza useUserRole (con caché de TanStack Query)
 * para obtener el rol del usuario y sincronizarlo con el store de Zustand.
 * 
 * Esto asegura que:
 * 1. Solo se hace UNA petición al backend para obtener el rol
 * 2. El rol se cachea por 5 minutos (staleTime)
 * 3. El rol se persiste en localStorage para sobrevivir recargas
 * 4. Si hay un rol cacheado en Zustand, se usa mientras carga el nuevo
 */

import { useEffect, useRef } from 'react'
import { useUserRole } from '@/hooks/queries'
import { useSesionStore } from '@/stores/useSesionStore'

export function UserRoleSync() {
  const { data: rolBackend, isLoading, error } = useUserRole()
  const setRol = useSesionStore((state) => state.setRol)
  const rolPersistido = useSesionStore((state) => state.rol)
  
  // Ref para evitar actualizaciones innecesarias
  const ultimoRol = useRef<string | null>(rolPersistido)

  useEffect(() => {
    // Si hay un rol nuevo del backend y es diferente al último conocido
    if (rolBackend && typeof rolBackend === 'string') {
      if (rolBackend !== ultimoRol.current) {
        console.log('[UserRoleSync] Actualizando rol:', rolBackend)
        ultimoRol.current = rolBackend
        setRol(rolBackend)
      }
    }
  }, [rolBackend, setRol])

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

  // Este componente no renderiza nada visual
  return null
}
