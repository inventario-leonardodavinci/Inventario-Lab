/**
 * Store global de sesión con zustand + persist.
 * Permite acceder al usuario autenticado fuera del árbol de React
 * (p.ej. interceptores de API, workers) sin pasar por el contexto.
 *
 * El ContextoAutenticacion sigue siendo la fuente de verdad para la
 * lógica de login/logout — este store se sincroniza desde él.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SesionUsuario } from '@/services/authApi'

type SesionStore = {
  usuario: SesionUsuario | null
  setUsuario: (u: SesionUsuario | null) => void
  actualizarUsuario: (cambios: Partial<SesionUsuario>) => void
  limpiar: () => void
}

export const useSesionStore = create<SesionStore>()(
  persist(
    (set) => ({
      usuario: null,

      setUsuario: (u) => set({ usuario: u }),

      actualizarUsuario: (cambios) =>
        set((state) =>
          state.usuario ? { usuario: { ...state.usuario, ...cambios } } : state,
        ),

      limpiar: () => set({ usuario: null }),
    }),
    {
      name: 'inventario-sesion',
      partialize: (state) => ({ usuario: state.usuario }),
    },
  ),
)

/**
 * Acceso directo al usuario fuera de componentes React.
 * Útil para interceptores de fetch o lógica de servicio.
 */
export function getSesionActual(): SesionUsuario | null {
  return useSesionStore.getState().usuario
}
