import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, X, LayoutGrid, List, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Categoria, Ubicacion } from '@/types'

type FiltroVista = 'todos' | 'critico' | 'inactivos' | 'alertas'

interface FiltrosBarProps {
  filtro: FiltroVista
  busqueda: string
  categoriaId: string | null
  ubicacionId: string | null
  modo: 'grid' | 'lista'
  filtrosActivos: boolean
  isFetching?: boolean
  contadores: {
    todos: number
    critico: number
    inactivos: number
    alertas: number
  }
  categorias: Categoria[]
  ubicaciones: Ubicacion[]
  onFiltroChange: (filtro: FiltroVista) => void
  onBusquedaChange: (busqueda: string) => void
  onCategoriaChange: (id: string | null) => void
  onUbicacionChange: (id: string | null) => void
  onModoChange: (modo: 'grid' | 'lista') => void
  onLimpiar: () => void
}

const FILTROS_RAPIDOS = [
  { key: 'todos', label: 'Todos' },
  { key: 'critico', label: 'Stock crítico' },
  { key: 'inactivos', label: 'Inactivos' },
] as const

export function FiltrosBar({
  filtro,
  busqueda,
  categoriaId,
  ubicacionId,
  modo,
  filtrosActivos,
  isFetching,
  contadores,
  categorias,
  ubicaciones,
  onFiltroChange,
  onBusquedaChange,
  onCategoriaChange,
  onUbicacionChange,
  onModoChange,
  onLimpiar,
}: FiltrosBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-3">

      {/* ── Fila principal: controles responsive ── */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:flex-wrap">

        {/* Buscador — responsive width */}
        <div className="relative w-full sm:w-64 lg:w-72 shrink-0">
          <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
            {isFetching && busqueda ? (
              <Loader2 className="size-3.5 text-muted-foreground animate-spin" />
            ) : (
              <Search className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <Input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-label="Buscar artículos"
            placeholder="Buscar artículos..."
            className="h-9 pl-8 pr-8 text-sm w-full"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && onBusquedaChange('')}
          />
          {busqueda && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0.5 top-1/2 -translate-y-1/2 size-8 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
              onClick={() => { onBusquedaChange(''); inputRef.current?.focus() }}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Filtro por categoría */}
        {categorias.length > 0 && (
          <Select
            value={categoriaId ?? 'todas'}
            onValueChange={(val) => onCategoriaChange(val === 'todas' ? null : val)}
          >
            <SelectTrigger className="h-9 w-full sm:w-40 lg:w-48 text-sm">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Filtro por ubicación */}
        {ubicaciones.length > 0 && (
          <Select
            value={ubicacionId ?? 'todas'}
            onValueChange={(val) => onUbicacionChange(val === 'todas' ? null : val)}
          >
            <SelectTrigger className="h-9 w-full sm:w-40 lg:w-48 text-sm">
              <SelectValue placeholder="Ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las ubicaciones</SelectItem>
              {ubicaciones.map((ub) => (
                <SelectItem key={ub.id} value={String(ub.id)}>{ub.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Separador visual */}
        <div className="h-5 w-px bg-border shrink-0" />

        {/* Toggle modo vista */}
        <div className="flex rounded-md border overflow-hidden shrink-0" role="group" aria-label="Modo de vista">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-none h-9 w-9 border-0",
              modo === 'grid' && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            )}
            aria-label="Vista cuadrícula"
            aria-pressed={modo === 'grid'}
            onClick={() => onModoChange('grid')}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-none h-9 w-9 border-0 border-l",
              modo === 'lista' && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            )}
            aria-label="Vista lista"
            aria-pressed={modo === 'lista'}
            onClick={() => onModoChange('lista')}
          >
            <List className="size-4" />
          </Button>
        </div>

        {/* Limpiar filtros — mismo h-9 que el resto */}
        {filtrosActivos && (
          <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={onLimpiar}>
            <X className="size-3.5 mr-1.5" />
            Limpiar
          </Button>
        )}
      </div>

      {/* ── Chips de filtro rápido ── */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros rápidos">
        {FILTROS_RAPIDOS.map((f) => (
          <motion.button
            key={f.key}
            onClick={() => onFiltroChange(f.key)}
            aria-pressed={filtro === f.key}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition-colors",
              filtro === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            <Badge
              variant={filtro === f.key ? "secondary" : "outline"}
              className="h-4 min-w-4 px-1 text-[10px]"
            >
              {contadores[f.key]}
            </Badge>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
