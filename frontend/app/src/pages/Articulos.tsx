/**
 * Página unificada de Artículos - Vista Kanban/Grid
 * Apple/Meta style: Todo integrado sin tabs, acciones rápidas, UI minimalista
 */
import { useMemo } from 'react'
import { Plus, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/ContextoAutenticacion'
import { GuardRol } from '@/components/auth/GuardRol'
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
} from '@/hooks/queries'
import { useArticulosView } from './articulos/hooks/useArticulosView'
import { FiltrosBar } from './articulos/components/FiltrosBar'
import type { TipoMovimiento } from '@/types'
import { ArticulosGrid } from './articulos/components/ArticulosGrid'
import { PanelAccionRapida } from './articulos/components/PanelAccionRapida'
import { ArticuloDrawer } from './articulos/components/ArticuloDrawer'
import { ArticuloFormSheet, type DatosFormArticulo } from './articulos/components/ArticuloFormSheet'
import { validarMovimiento } from '@/services/movimientosApi'
import { toast } from 'sonner'
import { DEBOUNCE_DELAY_MS } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'

export default function Articulos() {
  const { user } = useAuth()
  const esEscritor = user?.role === 'administrador' || user?.role === 'profesor'
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
  const { data: movimientosData } = useMovimientos({ per_page: 50 })
  const { data: articuloDetalle, isLoading: isLoadingDetalle } = useArticulo(view.articuloDetalle?.id ?? 0)
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
  const movimientos = movimientosData?.data ?? []
  
  // Contadores para filtros
  const contadores = useMemo(() => ({
    todos: articulosData?.meta?.total ?? articulos.length,
    critico: articulos.filter((a) => a.estado_stock === 'critico' && a.activo).length,
    inactivos: articulos.filter((a) => !a.activo).length,
  }), [articulos, articulosData])
  
  // Movimientos del artículo seleccionado
  const movimientosArticulo = useMemo(() => {
    if (!view.articuloDetalle) return []
    return movimientos.filter((m) => 
      m.lineas?.some((l) => l.articulo_id === view.articuloDetalle?.id)
    )
  }, [movimientos, view.articuloDetalle])
  
  // Handlers
  const handleCrearArticulo = async (datos: DatosFormArticulo) => {
    try {
      await crearArticulo.mutateAsync(datos)
      toast.success('Artículo creado correctamente')
      view.cerrarForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear artículo')
    }
  }
  
  const handleActualizarArticulo = async (datos: DatosFormArticulo) => {
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
      view.setCantidad(1)
      view.setTipoMovimiento(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar movimiento')
    }
  }
  
  const SKELETON_COUNT = 10

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
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
    <main className="animate-page-enter flex flex-1 flex-col gap-6 bg-muted/20 p-4 lg:p-6">
      <div className="page-section flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
            <p className="text-sm text-muted-foreground">
              {articulos.length} artículos
            </p>
          </div>
          {/* Indicador sutil de carga (solo refetch, no carga inicial) */}
          {isFetching && !isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Actualizando...</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ArrowRightLeft className="size-4 mr-2" />
            Historial
          </Button>
          <GuardRol roles={['administrador', 'profesor']}>
            <Button size="sm" onClick={view.abrirCrear}>
              <Plus className="size-4 mr-2" />
              Nuevo artículo
            </Button>
          </GuardRol>
        </div>
      </div>
      
      <div className="page-section">
      <FiltrosBar
        filtro={view.filtro}
        busqueda={view.busqueda}
        categoriaId={view.categoriaId}
        ubicacionId={view.ubicacionId}
        modo={view.modo}
        filtrosActivos={!!view.filtrosActivos}
        isFetching={isFetching}
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
      </div>
      
      <div className="page-section">
      <ArticulosGrid
        articulos={articulos}
        modo={view.modo}
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
        onEditar={esEscritor ? view.abrirEditar : undefined}
        onCrear={view.abrirCrear}
      />
      </div>
      
      <PanelAccionRapida
        articulo={view.articuloSeleccionado}
        tipo={view.tipoMovimiento}
        cantidad={view.cantidad}
        ubicaciones={ubicaciones}
        nivelesStock={articuloPanelDetalle?.data?.niveles_stock ?? []}
        isLoadingUbicaciones={isLoadingUbicaciones}
        isLoadingStock={isLoadingPanelDetalle}
        isPending={crearMovimiento.isPending}
        open={view.mostrarPanelAccion && !!view.articuloSeleccionado}
        onCantidadChange={view.setCantidad}
        onSubmit={handleMovimiento}
        onCancel={() => view.setMostrarPanelAccion(false)}
      />
      
      <ArticuloDrawer
        articulo={view.articuloDetalle}
        movimientos={movimientosArticulo}
        nivelesStock={articuloDetalle?.data?.niveles_stock ?? []}
        isLoadingStock={isLoadingDetalle}
        open={view.drawerAbierto}
        onClose={view.cerrarDetalle}
        onEditar={() => {
          if (view.articuloDetalle) {
            view.abrirEditar(view.articuloDetalle)
            view.cerrarDetalle()
          }
        }}
        onDesactivar={handleDesactivar}
        onMovimiento={(tipo) => {
          if (view.articuloDetalle) {
            view.seleccionarArticulo(view.articuloDetalle, tipo)
            view.setTipoMovimiento(tipo)
            view.cerrarDetalle()
          }
        }}
      />
      
      <ArticuloFormSheet
        articulo={view.articuloEditando}
        categorias={categorias}
        ubicaciones={ubicaciones}
        open={view.formAbierto}
        isPending={view.articuloEditando ? actualizarArticulo.isPending : crearArticulo.isPending}
        onClose={view.cerrarForm}
        onSubmit={view.articuloEditando ? handleActualizarArticulo : handleCrearArticulo}
      />
    </main>
  )
}
