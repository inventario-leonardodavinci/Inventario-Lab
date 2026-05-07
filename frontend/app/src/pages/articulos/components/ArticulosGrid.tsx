import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ArticuloCard } from './ArticuloCard'
import { ArticulosTabla } from './ArticulosTabla'
import type { Articulo } from '@/types'

interface ArticulosGridProps {
  articulos: Articulo[]
  modo: 'grid' | 'lista'
  onEntrada: (articulo: Articulo) => void
  onSalida: (articulo: Articulo) => void
  onTraslado: (articulo: Articulo) => void
  onVerDetalle: (articulo: Articulo) => void
  onEditar?: (articulo: Articulo) => void
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
      <div className="animate-fade-in-up flex flex-col items-center justify-center gap-4 py-16 text-center">
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

  if (modo === 'lista') {
    return (
      <ArticulosTabla
        articulos={articulos}
        onEntrada={onEntrada}
        onSalida={onSalida}
        onTraslado={onTraslado}
        onVerDetalle={onVerDetalle}
        onEditar={onEditar}
      />
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {articulos.map((articulo) => (
        <div key={articulo.id} className="stagger-row">
          <ArticuloCard
            articulo={articulo}
            onEntrada={onEntrada}
            onSalida={onSalida}
            onTraslado={onTraslado}
            onVerDetalle={onVerDetalle}
            onEditar={onEditar}
          />
        </div>
      ))}
    </div>
  )
}
