/**
 * Página unificada de Artículos - Vista Kanban/Grid
 * Apple/Meta style: Todo integrado sin tabs, acciones rápidas, UI minimalista
 */
import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/ContextoAutenticacion'
import {
  useArticulos,
  useCategorias,
  useUbicaciones,
  useCrearArticulo,
  useActualizarArticulo,
  useCrearMovimiento,
  useMovimientos,
  useArticulo,
  useActualizarNivelStock,
  useEliminarNivelStock,
} from '@/hooks/queries'
import { useArticulosView } from './articulos/hooks/useArticulosView'
import { FiltrosBar } from './articulos/components/FiltrosBar'
import type { TipoMovimiento } from '@/types'
import { ArticulosGrid } from './articulos/components/ArticulosGrid'
import { PanelAccionRapida } from './articulos/components/PanelAccionRapida'
import { ArticuloDrawer } from './articulos/components/ArticuloDrawer'
import { ArticuloFormSheet, type DatosFormArticulo } from './articulos/components/ArticuloFormSheet'
import { BotonExportar } from './articulos/components/BotonExportar'
import { validarMovimiento, type EntradaCrearMovimiento } from '@/services/movimientosApi'
import { toast } from 'sonner'
import { DEBOUNCE_DELAY_MS, SKELETON_COUNT, ARTICULOS_PER_PAGE } from '@/constants'
import { useDebounce } from '@/hooks/useDebounce'

export default function Articulos() {
  const { user } = useAuth()
  const esProfesor = user?.role === 'profesor'
  const view = useArticulosView()
  
  // Debounce para la búsqueda
  const busquedaDebounced = useDebounce(view.busqueda, DEBOUNCE_DELAY_MS)
  
  // Queries - usar busquedaDebounced para evitar peticiones en cada tecla
  const { data: articulosData, isLoading, isFetching } = useArticulos({
    per_page: ARTICULOS_PER_PAGE,
    ...(busquedaDebounced ? { search: busquedaDebounced } : {}),
    ...(view.categoriaId ? { categoria_id: Number(view.categoriaId) } : {}),
    ...(view.ubicacionId ? { ubicacion_id: Number(view.ubicacionId) } : {}),
    ...(view.filtro === 'critico' ? { estado_stock: 'critico' as const } : {}),
  })
  
  const { data: categoriasData } = useCategorias()
  const { data: ubicacionesData, isLoading: isLoadingUbicaciones } = useUbicaciones()
  const { data: movimientosData } = useMovimientos({ per_page: 50 })
  const { data: articuloDetalle, isLoading: isLoadingArticuloDetalle } = useArticulo(view.articuloDetalle?.id ?? 0)
  const { data: articuloEditandoDetalle } = useArticulo(view.articuloEditando?.id ?? 0)
  const { data: articuloPanelDetalle, isLoading: isLoadingPanelDetalle } = useArticulo(view.articuloSeleccionado?.id ?? 0)
  
  // Mutations
  const crearArticulo = useCrearArticulo()
  const actualizarArticulo = useActualizarArticulo()
  const crearMovimiento = useCrearMovimiento()
  const actualizarNivelStock = useActualizarNivelStock()
  const eliminarNivelStock = useEliminarNivelStock()
  
  // Datos
  const articulos = useMemo(() => articulosData?.data ?? [], [articulosData])
  const categorias = useMemo(() => categoriasData?.data ?? [], [categoriasData])
  const ubicaciones = useMemo(() => ubicacionesData?.data ?? [], [ubicacionesData])
  const movimientos = useMemo(() => movimientosData?.data ?? [], [movimientosData])
  const articuloFormulario = articuloEditandoDetalle?.data ?? view.articuloEditando
  
  // Contadores para filtros
  const contadores = useMemo(() => ({
    todos: articulosData?.meta?.total ?? articulos.length,
    critico: articulos.filter((a) => a.estado_stock === 'critico').length,
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
      toast.success(`Artículo "${datos.nombre}" creado correctamente`)
      view.cerrarForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear el artículo')
    }
  }
  
  const handleActualizarArticulo = async (datos: DatosFormArticulo) => {
    if (!view.articuloEditando) return
    try {
      await actualizarArticulo.mutateAsync({
        id: view.articuloEditando.id,
        datos,
      })
      toast.success(`Artículo "${datos.nombre}" actualizado correctamente`)
      view.cerrarForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el artículo')
    }
  }

  const handleUpdateNivelStock = async (nivelId: number, cantidadMinima: number) => {
    if (!view.articuloDetalle) return
    try {
      await actualizarNivelStock.mutateAsync({
        articuloId: view.articuloDetalle.id,
        nivelId,
        cantidadMinima,
      })
      toast.success('Stock mínimo actualizado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar el stock mínimo')
    }
  }

  const handleDeleteNivelStock = async (nivelId: number) => {
    if (!view.articuloDetalle) return
    try {
      await eliminarNivelStock.mutateAsync({
        articuloId: view.articuloDetalle.id,
        nivelId,
      })
      toast.success('Ubicación eliminada correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la ubicación')
    }
  }

  const handleMovimiento = async (
    tipo: TipoMovimiento,
    cantidad: number,
    ubicacionOrigenId?: string,
    ubicacionDestinoId?: string,
    subUbicacionOrigenId?: string,
    subUbicacionDestinoId?: string
  ) => {
    if (!view.articuloSeleccionado) return

    const datosMovimiento: EntradaCrearMovimiento = {
      tipo,
      lineas: [{
        articulo_id: view.articuloSeleccionado.id,
        cantidad,
      }],
    }

    if (tipo === 'entrada' && ubicacionDestinoId) {
      datosMovimiento.ubicacion_destino_id = Number(ubicacionDestinoId)
      if (subUbicacionDestinoId) {
        datosMovimiento.sub_ubicacion_destino_id = Number(subUbicacionDestinoId)
      }
    }

    if (tipo === 'salida' && ubicacionOrigenId) {
      datosMovimiento.ubicacion_origen_id = Number(ubicacionOrigenId)
      if (subUbicacionOrigenId) {
        datosMovimiento.sub_ubicacion_origen_id = Number(subUbicacionOrigenId)
      }
    }

    if (tipo === 'traslado' && ubicacionOrigenId && ubicacionDestinoId) {
      datosMovimiento.ubicacion_origen_id = Number(ubicacionOrigenId)
      datosMovimiento.ubicacion_destino_id = Number(ubicacionDestinoId)
      if (subUbicacionOrigenId) {
        datosMovimiento.sub_ubicacion_origen_id = Number(subUbicacionOrigenId)
      }
      if (subUbicacionDestinoId) {
        datosMovimiento.sub_ubicacion_destino_id = Number(subUbicacionDestinoId)
      }
    }

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

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col gap-4 md:gap-6 bg-muted/20 p-3 sm:p-4 lg:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-muted animate-pulse rounded hidden sm:block" />
            <div className="h-9 w-32 bg-muted animate-pulse rounded hidden sm:block" />
          </div>
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
              {articulosData?.meta?.total ?? articulos.length} artículos · {contadores.critico > 0 ? `${contadores.critico} con stock bajo` : 'todo en orden'}
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
          <BotonExportar 
            filtros={{
              search: busquedaDebounced || undefined,
              categoria_id: view.categoriaId ? Number(view.categoriaId) : undefined,
              ubicacion_id: view.ubicacionId ? Number(view.ubicacionId) : undefined,
              estado_stock: view.filtro === 'critico' ? 'critico' : undefined,
            }}
          />
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
        articulos={articulos}
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
        onEditar={esProfesor ? view.abrirEditar : undefined}
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
          isPending={crearMovimiento.isPending}
          onCantidadChange={view.setCantidad}
          onSubmit={handleMovimiento}
          onCancel={() => view.setMostrarPanelAccion(false)}
        />
      )}
      
      <ArticuloDrawer
        articulo={view.articuloDetalle}
        movimientos={movimientosArticulo}
        nivelesStock={articuloDetalle?.data?.niveles_stock ?? []}
        isLoadingStock={isLoadingArticuloDetalle}
        open={view.drawerAbierto}
        onClose={view.cerrarDetalle}
        onEditar={esProfesor ? () => {
          if (view.articuloDetalle) {
            view.abrirEditar(view.articuloDetalle)
            view.cerrarDetalle()
          }
        } : undefined}
        onMovimiento={esProfesor ? (tipo) => {
          if (view.articuloDetalle) {
            view.seleccionarArticulo(view.articuloDetalle, tipo)
            view.setTipoMovimiento(tipo)
            view.cerrarDetalle()
          }
        } : undefined}
        onUpdateNivelStock={esProfesor ? handleUpdateNivelStock : undefined}
        onDeleteNivelStock={esProfesor ? handleDeleteNivelStock : undefined}
      />
      
      {esProfesor && (
        <ArticuloFormSheet
          articulo={articuloFormulario}
          categorias={categorias}
          ubicaciones={ubicaciones}
          open={view.formAbierto}
          isPending={crearArticulo.isPending || actualizarArticulo.isPending}
          onClose={view.cerrarForm}
          onSubmit={view.articuloEditando ? handleActualizarArticulo : handleCrearArticulo}
        />
      )}
    </main>
  )
}
