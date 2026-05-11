/**
 * Store de preferencias UI con persistencia en localStorage.
 * Guarda estados de la interfaz: sidebar, modos de vista, etc.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type VistaModo = 'grid' | 'lista'
export type SidebarState = 'expanded' | 'collapsed'

type UIPreferencesStore = {
  // Sidebar state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // View modes por página
  modosVista: {
    articulos: VistaModo
    categorias: VistaModo
    ubicaciones: VistaModo
    usuarios: VistaModo
    auditoria: VistaModo
  }
  setModoVista: (pagina: keyof UIPreferencesStore['modosVista'], modo: VistaModo) => void

  // Tamaños de página (items por página)
  pageSize: number
  setPageSize: (size: number) => void

  // Columnas visibles (para tablas premium)
  columnasVisibles: Record<string, string[]>
  setColumnasVisibles: (tabla: string, columnas: string[]) => void

  // Filtros guardados (pero no los valores, solo si están expandidos)
  filtrosExpandidos: Record<string, boolean>
  setFiltroExpandido: (pagina: string, expandido: boolean) => void
}

export const useUIPreferencesStore = create<UIPreferencesStore>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      // Modos de vista por defecto
      modosVista: {
        articulos: 'grid',
        categorias: 'lista',
        ubicaciones: 'lista',
        usuarios: 'lista',
        auditoria: 'lista',
      },
      setModoVista: (pagina, modo) =>
        set((state) => ({
          modosVista: { ...state.modosVista, [pagina]: modo },
        })),

      // Items por página (default 20)
      pageSize: 20,
      setPageSize: (size) => set({ pageSize: size }),

      // Columnas visibles por tabla
      columnasVisibles: {},
      setColumnasVisibles: (tabla, columnas) =>
        set((state) => ({
          columnasVisibles: { ...state.columnasVisibles, [tabla]: columnas },
        })),

      // Filtros expandidos por página
      filtrosExpandidos: {},
      setFiltroExpandido: (pagina, expandido) =>
        set((state) => ({
          filtrosExpandidos: { ...state.filtrosExpandidos, [pagina]: expandido },
        })),
    }),
    {
      name: 'inventario-ui-preferences',
      // Solo persistimos las preferencias de UI, no estados temporales
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        modosVista: state.modosVista,
        pageSize: state.pageSize,
        columnasVisibles: state.columnasVisibles,
        filtrosExpandidos: state.filtrosExpandidos,
      }),
    },
  ),
)

/**
 * Helper para obtener preferencias fuera de componentes React.
 */
export function getUIPreferences(): Pick<
  UIPreferencesStore,
  'sidebarOpen' | 'modosVista' | 'pageSize'
> {
  return {
    sidebarOpen: useUIPreferencesStore.getState().sidebarOpen,
    modosVista: useUIPreferencesStore.getState().modosVista,
    pageSize: useUIPreferencesStore.getState().pageSize,
  }
}
