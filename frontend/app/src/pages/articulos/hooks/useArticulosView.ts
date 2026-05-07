import { useState, useCallback, useMemo } from 'react'
import type { Articulo, TipoMovimiento } from '@/types'

type FiltroVista = 'todos' | 'critico' | 'inactivos' | 'alertas'
type VistaModo = 'grid' | 'lista'

export function useArticulosView() {
  const [filtro, setFiltro] = useState<FiltroVista>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [ubicacionId, setUbicacionId] = useState<string | null>(null)
  
  const [modo, setModo] = useState<VistaModo>('grid')
  
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
    setFiltro('todos')
    setBusqueda('')
    setCategoriaId(null)
    setUbicacionId(null)
  }, [])
  
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
