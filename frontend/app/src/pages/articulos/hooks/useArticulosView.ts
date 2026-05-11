import { useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Articulo, TipoMovimiento } from '@/types'
import { useUIPreferencesStore } from '@/stores/useUIPreferencesStore'

type FiltroVista = 'todos' | 'critico'
type VistaModo = 'grid' | 'lista'

const VALID_FILTROS: FiltroVista[] = ['todos', 'critico']

export function useArticulosView() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filtros persistidos en URL — sobreviven navegación y el botón Atrás
  const filtro = (VALID_FILTROS.includes(searchParams.get('f') as FiltroVista)
    ? searchParams.get('f')
    : 'todos') as FiltroVista
  const categoriaId = searchParams.get('cat')
  const ubicacionId = searchParams.get('ubic')

  // busqueda: estado local (se debouncea en el consumidor, no merece historial)
  const [busqueda, setBusqueda] = useState('')

  const setParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setFiltro = useCallback((v: FiltroVista) => {
    setParam('f', v === 'todos' ? null : v)
  }, [setParam])

  const setCategoriaId = useCallback((v: string | null) => {
    setParam('cat', v)
  }, [setParam])

  const setUbicacionId = useCallback((v: string | null) => {
    setParam('ubic', v)
  }, [setParam])

  // Usar el store para persistir el modo de vista
  const modo = useUIPreferencesStore((state) => state.modosVista.articulos)
  const setModoVista = useUIPreferencesStore((state) => state.setModoVista)
  
  // Handler estable que no cambia en cada render
  const setModo = useCallback((nuevoModo: VistaModo) => {
    setModoVista('articulos', nuevoModo)
  }, [setModoVista])
  
  const [articuloSeleccionado, setArticuloSeleccionado] = useState<Articulo | null>(null)
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimiento | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [mostrarPanelAccion, setMostrarPanelAccion] = useState(false)
  
  const [articuloDetalle, setArticuloDetalle] = useState<Articulo | null>(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  
  const [formAbierto, setFormAbierto] = useState(false)
  const [articuloEditando, setArticuloEditando] = useState<Articulo | null>(null)
  
  // Handlers
  const seleccionarArticulo = useCallback((articulo: Articulo, tipo: TipoMovimiento) => {
    setArticuloSeleccionado(articulo)
    setTipoMovimiento(tipo)
    setMostrarPanelAccion(true)
  }, [])
  
  const abrirDetalle = useCallback((articulo: Articulo) => {
    setArticuloDetalle(articulo)
    setDrawerAbierto(true)
  }, [])
  
  const cerrarDetalle = useCallback(() => {
    setDrawerAbierto(false)
    setTimeout(() => setArticuloDetalle(null), 200)
  }, [])
  
  const abrirCrear = useCallback(() => {
    setArticuloEditando(null)
    setFormAbierto(true)
  }, [])
  
  const abrirEditar = useCallback((articulo: Articulo) => {
    setArticuloEditando(articulo)
    setFormAbierto(true)
  }, [])
  
  const cerrarForm = useCallback(() => {
    setFormAbierto(false)
    setTimeout(() => setArticuloEditando(null), 200)
  }, [])
  
  const limpiarFiltros = useCallback(() => {
    setBusqueda('')
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.delete('f')
      next.delete('cat')
      next.delete('ubic')
      return next
    }, { replace: true })
  }, [setSearchParams])
  
  const filtrosActivos = useMemo(() => {
    return filtro !== 'todos' || busqueda || categoriaId || ubicacionId
  }, [filtro, busqueda, categoriaId, ubicacionId])
  
  return {
    // Estado
    filtro,
    busqueda,
    categoriaId,
    ubicacionId,
    modo,
    articuloSeleccionado,
    tipoMovimiento,
    cantidad,
    setCantidad,
    mostrarPanelAccion,
    setMostrarPanelAccion,
    articuloDetalle,
    drawerAbierto,
    formAbierto,
    articuloEditando,
    filtrosActivos,
    
    // Setters
    setFiltro,
    setBusqueda,
    setCategoriaId,
    setUbicacionId,
    setModo,
    setTipoMovimiento,
    
    // Actions
    seleccionarArticulo,
    abrirDetalle,
    cerrarDetalle,
    abrirCrear,
    abrirEditar,
    cerrarForm,
    limpiarFiltros,
  }
}
