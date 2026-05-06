import { Search, X, LayoutGrid, List } from 'lucide-react'
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

interface FiltrosBarProps {
  filtro: 'todos' | 'critico' | 'alertas' | 'inactivos'
  busqueda: string
  categoriaId: string | null
  ubicacionId: string | null
  modo: 'grid' | 'lista'
  filtrosActivos: boolean
  contadores: {
    todos: number
    critico: number
    alertas: number
    inactivos: number
  }
  categorias: Categoria[]
  ubicaciones: Ubicacion[]
  onFiltroChange: (filtro: 'todos' | 'critico' | 'alertas' | 'inactivos') => void
  onBusquedaChange: (busqueda: string) => void
  onCategoriaChange: (id: string | null) => void
  onUbicacionChange: (id: string | null) => void
  onModoChange: (modo: 'grid' | 'lista') => void
  onLimpiar: () => void
}

export function FiltrosBar({
  filtro,
  busqueda,
  categoriaId,
  ubicacionId,
  modo,
  filtrosActivos,
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
  const filtros = [
    { key: 'todos', label: 'Todos', count: contadores.todos },
    { key: 'critico', label: 'Stock crítico', count: contadores.critico },
    { key: 'alertas', label: 'Con alertas', count: contadores.alertas },
    { key: 'inactivos', label: 'Inactivos', count: contadores.inactivos },
  ] as const

  return (
    <div className="flex flex-col gap-3">
      {/* Búsqueda y controles */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artículos..."
            className="pl-9"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
          {busqueda && (
            <button
              onClick={() => onBusquedaChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Filtros adicionales - shadcn Select */}
          {categorias.length > 0 && (
            <Select
              value={categoriaId ?? 'todas'}
              onValueChange={(val) => onCategoriaChange(val === 'todas' ? null : val)}
            >
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {ubicaciones.length > 0 && (
            <Select
              value={ubicacionId ?? 'todas'}
              onValueChange={(val) => onUbicacionChange(val === 'todas' ? null : val)}
            >
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <SelectValue placeholder="Todas las ubicaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las ubicaciones</SelectItem>
                {ubicaciones.map((ub) => (
                  <SelectItem key={ub.id} value={String(ub.id)}>{ub.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Toggle modo vista */}
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => onModoChange('grid')}
              className={cn(
                "p-2 transition-colors",
                modo === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => onModoChange('lista')}
              className={cn(
                "p-2 transition-colors",
                modo === 'lista' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
              )}
            >
              <List className="size-4" />
            </button>
          </div>
          
          {filtrosActivos && (
            <Button variant="ghost" size="sm" onClick={onLimpiar}>
              <X className="size-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      </div>
      
      {/* Chips de filtro rápido */}
      <div className="flex flex-wrap gap-2">
        {filtros.map((f) => (
          <button
            key={f.key}
            onClick={() => onFiltroChange(f.key)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors",
              filtro === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
            <Badge 
              variant={filtro === f.key ? "secondary" : "outline"} 
              className="h-5 min-w-5 text-[10px]"
            >
              {f.count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  )
}
