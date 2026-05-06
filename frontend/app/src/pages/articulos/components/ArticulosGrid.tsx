import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArticuloCard } from './ArticuloCard'
import { cn } from '@/lib/utils'
import type { Articulo } from '@/types'

interface ArticulosGridProps {
  articulos: Articulo[]
  modo: 'grid' | 'lista'
  onEntrada: (articulo: Articulo) => void
  onSalida: (articulo: Articulo) => void
  onTraslado: (articulo: Articulo) => void
  onVerDetalle: (articulo: Articulo) => void
  onEditar: (articulo: Articulo) => void
  onCrear: () => void
}

export function ArticulosGrid({
  articulos,
  modo,
  onEntrada,
  onSalida,
  onTraslado,
  onVerDetalle,
  onEditar,
  onCrear,
}: ArticulosGridProps) {
  if (articulos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Package className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-medium">No hay artículos</p>
          <p className="text-sm text-muted-foreground mt-1">
            Comienza creando el primer artículo del inventario.
          </p>
        </div>
        <Button onClick={onCrear}>
          <Plus className="size-4 mr-2" />
          Crear artículo
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "grid gap-4",
        modo === 'grid' 
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" 
          : "grid-cols-1"
      )}
    >
      {articulos.map((articulo) => (
        <ArticuloCard
          key={articulo.id}
          articulo={articulo}
          onEntrada={onEntrada}
          onSalida={onSalida}
          onTraslado={onTraslado}
          onVerDetalle={onVerDetalle}
          onEditar={onEditar}
        />
      ))}
    </div>
  )
}
