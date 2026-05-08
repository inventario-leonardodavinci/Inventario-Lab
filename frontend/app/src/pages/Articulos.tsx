/**
 * Página unificada de Artículos - Vista Kanban/Grid
 * Apple/Meta style: Todo integrado sin tabs, acciones rápidas, UI minimalista
 */
import { useMemo, useState, useEffect } from 'react'
import { Plus, ArrowRightLeft, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/ContextoAutenticacion'
import {
  useArticulos,
  useCategorias,
  useUbicaciones,
  useCrearArticulo,
  useActualizarArticulo,
  useDesactivarArticulo,
  useCrearMovimiento,
  useMovimientos,
  useArticulo,
  useAlertas,
} from '@/hooks/queries'
import { useArticulosView } from './articulos/hooks/useArticulosView'
import { FiltrosBar } from './articulos/components/FiltrosBar'
import type { TipoMovimiento } from '@/types'
import { ArticulosGrid } from './articulos/components/ArticulosGrid'
import { PanelAccionRapida } from './articulos/components/PanelAccionRapida'
import { ArticuloDrawer } from './articulos/components/ArticuloDrawer'
import { ArticuloFormSheet } from './articulos/components/ArticuloFormSheet'
import { validarMovimiento } from '@/services/movimientosApi'
import { toast } from 'sonner'
import { DEBOUNCE_DELAY_MS } from '@/constants'

// Hook personalizado para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  
  return debouncedValue
}

export default function Articulos() {
  const { user } = useAuth()
  const esProfesor = user?.role === 'profesor'
  const view = useArticulosView()
  
  // Debounce para la búsqueda
  const busquedaDebounced = useDebounce(view.busqueda, DEBOUNCE_DELAY_MS)
  
  // Queries - usar busquedaDebounced para evitar peticiones en cada tecla
  const { data: articulosData, isLoading, isFetching } = useArticulos({
    per_page: 200,
    ...(busquedaDebounced ? { search: busquedaDebounced } : {}),
    ...(view.categoriaId ? { categoria_id: Number(view.categoriaId) } : {}),
    ...(view.ubicacionId ? { ubicacion_id: Number(view.ubicacionId) } : {}),
    ...(view.filtro === 'critico' ? { estado_stock: 'critico' as const } : {}),
    ...(view.filtro === 'inactivos' ? { activo: false } : {}),
  })
  
  const { data: categoriasData, isLoading: _isLoadingCategorias } = useCategorias()
  const { data: ubicacionesData, isLoading: isLoadingUbicaciones } = useUbicaciones()
  const { data: alertasData, isLoading: _isLoadingAlertas } = useAlertas({ estado: 'abierta' })
  const { data: movimientosData } = useMovimientos({ per_page: 50 })
  const { data: articuloDetalle } = useArticulo(view.articuloDetalle?.id ?? 0)
  // Query para obtener stock del artículo seleccionado en panel de acción
  const { data: articuloPanelDetalle, isLoading: isLoadingPanelDetalle } = useArticulo(view.articuloSeleccionado?.id ?? 0)
  
  // Mutations
  const crearArticulo = useCrearArticulo()
  const actualizarArticulo = useActualizarArticulo()
  const desactivarArticulo = useDesactivarArticulo()
  const crearMovimiento = useCrearMovimiento()
  
  // Datos
  const articulos = articulosData?.data ?? []
  const categorias = categoriasData?.data ?? []
  const ubicaciones = ubicacionesData?.data ?? []
  const alertasAbiertas = alertasData?.data?.length ?? 0
  const movimientos = movimientosData?.data ?? []
  
  // Filtrado adicional para alertas
  const articulosFiltrados = useMemo(() => {
    if (view.filtro !== 'alertas') return articulos
    
    // Artículos que tienen alertas abiertas
    const alertas = alertasData?.data ?? []
    const articulosConAlerta = new Set(alertas.map((a) => a.articulo_id))
    return articulos.filter((a) => articulosConAlerta.has(a.id))
  }, [articulos, alertasData, view.filtro])
  
  // Contadores para filtros
  const contadores = useMemo(() => ({
    todos: articulosData?.meta?.total ?? articulos.length,
    critico: articulos.filter((a) => a.estado_stock === 'critico' && a.activo).length,
    alertas: alertasAbiertas,
    inactivos: articulos.filter((a) => !a.activo).length,
  }), [articulos, articulosData, alertasAbiertas])
  
  // Movimientos del artículo seleccionado
  const movimientosArticulo = useMemo(() => {
    if (!view.articuloDetalle) return []
    return movimientos.filter((m) => 
      m.lineas?.some((l) => l.articulo_id === view.articuloDetalle?.id)
    )
  }, [movimientos, view.articuloDetalle])
  
  // Handlers
  const handleCrearArticulo = async (datos: {
    nombre: string
    codigo?: string
    descripcion?: string
    categoria_id: number
    unidad?: string
    notas?: string
  }) => {
    try {
      await crearArticulo.mutateAsync(datos)
      toast.success('Artículo creado correctamente')
      view.cerrarForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear artículo')
    }
  }
  
  const handleActualizarArticulo = async (datos: {
    nombre: string
    codigo?: string
    descripcion?: string
    categoria_id: number
    unidad?: string
    notas?: string
  }) => {
    if (!view.articuloEditando) return
    try {
      await actualizarArticulo.mutateAsync({
        id: view.articuloEditando.id,
        datos,
      })
      toast.success('Artículo actualizado')
      view.cerrarForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar')
    }
  }
  
  const handleDesactivar = async () => {
    if (!view.articuloDetalle) return
    try {
      await desactivarArticulo.mutateAsync(view.articuloDetalle.id)
      toast.success('Artículo desactivado')
      view.cerrarDetalle()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al desactivar')
    }
  }
  
  const handleMovimiento = async (
    tipo: TipoMovimiento,
    cantidad: number,
    ubicacionOrigenId?: string,
    ubicacionDestinoId?: string
  ) => {
    if (!view.articuloSeleccionado) return
    
    // Construir objeto de movimiento
    const datosMovimiento = {
      tipo,
      lineas: [{ 
        articulo_id: view.articuloSeleccionado.id, 
        cantidad 
      }],
      // ENTRADA requiere ubicacion_destino_id
      ...(tipo === 'entrada' && ubicacionDestinoId 
        ? { ubicacion_destino_id: Number(ubicacionDestinoId) } 
        : {}),
      // SALIDA requiere ubicacion_origen_id
      ...(tipo === 'salida' && ubicacionOrigenId 
        ? { ubicacion_origen_id: Number(ubicacionOrigenId) } 
        : {}),
      // TRASLADO requiere ambas
      ...(tipo === 'traslado' && ubicacionOrigenId && ubicacionDestinoId
        ? { 
            ubicacion_origen_id: Number(ubicacionOrigenId),
            ubicacion_destino_id: Number(ubicacionDestinoId)
          } 
        : {}),
    }
    
    // Validar antes de enviar
    const errorValidacion = validarMovimiento(datosMovimiento)
    if (errorValidacion) {
      toast.error(errorValidacion)
      return
    }
    
    try {
      await crearMovimiento.mutateAsync(datosMovimiento)
      
      toast.success(`${view.articuloSeleccionado.nombre}: ${tipo} de ${cantidad} unidades`)
      view.setMostrarPanelAccion(false)
      view.setCantidad(1)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar movimiento')
    }
  }
  
  const SKELETON_COUNT = 10

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 md:gap-6 bg-muted/20 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-9 w-32 bg-muted animate-pulse rounded hidden sm:block" />
        </div>
        <div className="h-20 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </main>
    )
  }
  
  return (
    <main className="flex flex-1 flex-col gap-4 md:gap-6 bg-muted/20 p-3 sm:p-4 lg:p-6">
      {/* Header - mejorado para responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">Inventario</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {articulos.length} artículos · {alertasAbiertas} alertas
            </p>
          </div>
          {/* Indicador sutil de carga */}
          {isFetching && !isLoading && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Actualizando...</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {esProfesor && (
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              <ArrowRightLeft className="size-4 mr-2" />
              Historial
            </Button>
          )}
          {alertasAbiertas > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive border-destructive/50"
              onClick={() => view.setFiltro('alertas')}
            >
              <Bell className="size-4 mr-2" />
              <span className="hidden sm:inline">{alertasAbiertas} alertas</span>
              <span className="sm:hidden">{alertasAbiertas}</span>
            </Button>
          )}
          {esProfesor && (
            <Button size="sm" onClick={view.abrirCrear} className="ml-auto sm:ml-0">
              <Plus className="size-4 mr-2" />
              <span className="hidden sm:inline">Nuevo artículo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          )}
        </div>
      </div>
      
      <FiltrosBar
        filtro={view.filtro}
        busqueda={view.busqueda}
        categoriaId={view.categoriaId}
        ubicacionId={view.ubicacionId}
        modo={view.modo}
        filtrosActivos={!!view.filtrosActivos}
        contadores={contadores}
        categorias={categorias}
        ubicaciones={ubicaciones}
        onFiltroChange={view.setFiltro}
        onBusquedaChange={view.setBusqueda}
        onCategoriaChange={view.setCategoriaId}
        onUbicacionChange={view.setUbicacionId}
        onModoChange={view.setModo}
        onLimpiar={view.limpiarFiltros}
      />
      
      <ArticulosGrid
        articulos={articulosFiltrados}
        modo={view.modo}
        esProfesor={esProfesor}
        onEntrada={(art) => {
          view.seleccionarArticulo(art, 'entrada')
          view.setTipoMovimiento('entrada')
        }}
        onSalida={(art) => {
          view.seleccionarArticulo(art, 'salida')
          view.setTipoMovimiento('salida')
        }}
        onTraslado={(art) => {
          view.seleccionarArticulo(art, 'traslado')
          view.setTipoMovimiento('traslado')
        }}
        onVerDetalle={view.abrirDetalle}
        onCrear={view.abrirCrear}
      />
      
      {esProfesor && view.mostrarPanelAccion && view.articuloSeleccionado && (
        <PanelAccionRapida
          open={view.mostrarPanelAccion}
          articulo={view.articuloSeleccionado}
          tipo={view.tipoMovimiento}
          cantidad={view.cantidad}
          ubicaciones={ubicaciones}
          nivelesStock={articuloPanelDetalle?.data?.niveles_stock ?? []}
          isLoadingUbicaciones={isLoadingUbicaciones}
          isLoadingStock={isLoadingPanelDetalle}
          onCantidadChange={view.setCantidad}
          onSubmit={handleMovimiento}
          onCancel={() => view.setMostrarPanelAccion(false)}
        />
      )}
      
      <ArticuloDrawer
        articulo={view.articuloDetalle}
        movimientos={movimientosArticulo}
        nivelesStock={articuloDetalle?.data?.niveles_stock ?? []}
        open={view.drawerAbierto}
        onClose={view.cerrarDetalle}
        onEditar={esProfesor ? () => {
          if (view.articuloDetalle) {
            view.abrirEditar(view.articuloDetalle)
            view.cerrarDetalle()
          }
        } : undefined}
        onDesactivar={esProfesor ? handleDesactivar : undefined}
        onMovimiento={esProfesor ? (tipo) => {
          if (view.articuloDetalle) {
            view.seleccionarArticulo(view.articuloDetalle, tipo)
            view.setTipoMovimiento(tipo)
            view.cerrarDetalle()
          }
        } : undefined}
      />
      
      {esProfesor && (
        <ArticuloFormSheet
          articulo={view.articuloEditando}
          categorias={categorias}
          ubicaciones={ubicaciones}
          open={view.formAbierto}
          onClose={view.cerrarForm}
          onSubmit={view.articuloEditando ? handleActualizarArticulo : handleCrearArticulo}
        />
      )}
    </main>
  )
}
