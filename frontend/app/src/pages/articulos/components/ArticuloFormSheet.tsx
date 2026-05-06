import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { Articulo, Categoria } from '@/types'

const UNIDADES = [
  { valor: 'uds', etiqueta: 'Unidades (uds)' },
  { valor: 'L', etiqueta: 'Litros (L)' },
  { valor: 'mL', etiqueta: 'Mililitros (mL)' },
  { valor: 'kg', etiqueta: 'Kilogramos (kg)' },
  { valor: 'g', etiqueta: 'Gramos (g)' },
  { valor: 'mg', etiqueta: 'Miligramos (mg)' },
  { valor: 'caja', etiqueta: 'Cajas' },
  { valor: 'bote', etiqueta: 'Botes' },
  { valor: 'frasco', etiqueta: 'Frascos' },
  { valor: 'rollo', etiqueta: 'Rollos' },
  { valor: 'par', etiqueta: 'Pares' },
  { valor: 'paquete', etiqueta: 'Paquetes' },
]

interface ArticuloFormSheetProps {
  articulo: Articulo | null
  categorias: Categoria[]
  open: boolean
  onClose: () => void
  onSubmit: (datos: {
    nombre: string
    codigo?: string
    descripcion?: string
    categoria_id: number
    unidad?: string
    notas?: string
  }) => void
}

export function ArticuloFormSheet({
  articulo,
  categorias,
  open,
  onClose,
  onSubmit,
}: ArticuloFormSheetProps) {
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [unidad, setUnidad] = useState('')
  const [notas, setNotas] = useState('')
  
  const esEditar = !!articulo
  
  useEffect(() => {
    if (articulo) {
      setNombre(articulo.nombre)
      setCodigo(articulo.codigo ?? '')
      setDescripcion(articulo.descripcion ?? '')
      setCategoriaId(String(articulo.categoria_id))
      setUnidad(articulo.unidad ?? '')
      setNotas(articulo.notas ?? '')
    } else {
      setNombre('')
      setCodigo('')
      setDescripcion('')
      setCategoriaId('')
      setUnidad('')
      setNotas('')
    }
  }, [articulo, open])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !categoriaId) return
    
    onSubmit({
      nombre: nombre.trim(),
      codigo: codigo.trim() || undefined,
      descripcion: descripcion.trim() || undefined,
      categoria_id: Number(categoriaId),
      unidad: unidad || undefined,
      notas: notas.trim() || undefined,
    })
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{esEditar ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
              <DialogDescription>
                {esEditar ? 'Modifica los datos del artículo.' : 'Completa los datos para registrar un artículo.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej. Guantes de nitrilo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              placeholder="Ej. GN-001 (opcional)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>
              Categoría <span className="text-destructive">*</span>
            </Label>
            <Select value={categoriaId} onValueChange={setCategoriaId} required>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Seleccionar categoría..." />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Unidad de medida</Label>
            <Select value={unidad} onValueChange={setUnidad}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Seleccionar unidad..." />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES.map((u) => (
                  <SelectItem key={u.valor} value={u.valor}>{u.etiqueta}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              placeholder="Descripción breve del artículo"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notas">Notas internas</Label>
            <textarea
              id="notas"
              placeholder="Notas, observaciones, etc."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {esEditar ? 'Guardar cambios' : 'Crear artículo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
