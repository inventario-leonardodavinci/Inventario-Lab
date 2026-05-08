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
  esProfesor?: boolean
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
  esProfesor = false,
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
        {esProfesor && (
          <Button onClick={onCrear}>
            <Plus className="size-4 mr-2" />
            Crear artículo
          </Button>
        )}
      </div>
    )
  }

  if (modo === 'lista') {
    return (
      <ArticulosTabla
        articulos={articulos}
        onEntrada={esProfesor ? onEntrada : undefined}
        onSalida={esProfesor ? onSalida : undefined}
        onTraslado={esProfesor ? onTraslado : undefined}
        onVerDetalle={onVerDetalle}
        onEditar={esProfesor ? onEditar : undefined}
      />
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {articulos.map((articulo, index) => (
        <div 
          key={articulo.id} 
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
        >
          <ArticuloCard
            articulo={articulo}
            onEntrada={esProfesor ? onEntrada : undefined}
            onSalida={esProfesor ? onSalida : undefined}
            onTraslado={esProfesor ? onTraslado : undefined}
            onVerDetalle={onVerDetalle}
            onEditar={esProfesor ? onEditar : undefined}
          />
        </div>
      ))}
    </div>
  )
}
