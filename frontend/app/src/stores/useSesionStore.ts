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
  rol: string | null
  setUsuario: (u: SesionUsuario | null) => void
  setRol: (rol: string | null) => void
  actualizarUsuario: (cambios: Partial<SesionUsuario>) => void
  limpiar: () => void
}

export const useSesionStore = create<SesionStore>()(
  persist(
    (set) => ({
      usuario: null,
      rol: null,

      setUsuario: (u) => set({ usuario: u }),
      setRol: (rol) => set({ rol }),

      actualizarUsuario: (cambios) =>
        set((state) =>
          state.usuario ? { usuario: { ...state.usuario, ...cambios } } : state,
        ),

      limpiar: () => set({ usuario: null, rol: null }),
    }),
    {
      name: 'inventario-sesion',
      partialize: (state) => ({ usuario: state.usuario, rol: state.rol }),
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
