import { useState, useEffect } from 'react'
import { Package, Layers, MapPin, FlaskConical, FileText, Loader2 } from 'lucide-react'
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
import type { Articulo, Categoria, Ubicacion } from '@/types'

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

// Unidades de volumen/masa que tienen sentido para el campo "capacidad"
const UNIDAD_CAPACIDAD: Record<string, string> = {
  mL: 'mL',
  L:  'L',
  kg: 'kg',
  g:  'g',
  mg: 'mg',
}

const TIPOS_MATERIAL = [
  { valor: 'plastico', etiqueta: 'Plástico' },
  { valor: 'vidrio', etiqueta: 'Vidrio' },
  { valor: 'metal', etiqueta: 'Metal' },
  { valor: 'latex', etiqueta: 'Látex' },
  { valor: 'nitrilo', etiqueta: 'Nitrilo' },
  { valor: 'vinilo', etiqueta: 'Vinilo' },
  { valor: 'tela', etiqueta: 'Tela / Tejido' },
  { valor: 'papel', etiqueta: 'Papel / Cartón' },
  { valor: 'polipropileno', etiqueta: 'Polipropileno (PP)' },
  { valor: 'polietileno', etiqueta: 'Polietileno (PE)' },
  { valor: 'acero_inox', etiqueta: 'Acero inoxidable' },
  { valor: 'aluminio', etiqueta: 'Aluminio' },
  { valor: 'otro', etiqueta: 'Otro' },
]

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5" />
      <span>{label}</span>
    </div>
  )
}

export type DatosFormArticulo = {
  nombre: string
  codigo?: string
  descripcion?: string
  categoria_id: number
  unidad?: string
  notas?: string
  stock_inicial?: number
  stock_minimo?: number
  ubicacion_id?: number
  serial_number?: string
  material_type?: string
  capacity_ml?: number
  expiration_date?: string
}

interface ArticuloFormSheetProps {
  articulo: Articulo | null
  categorias: Categoria[]
  ubicaciones: Ubicacion[]
  open: boolean
  isPending?: boolean
  onClose: () => void
  onSubmit: (datos: DatosFormArticulo) => void
}

export function ArticuloFormSheet({
  articulo,
  categorias,
  ubicaciones,
  open,
  isPending = false,
  onClose,
  onSubmit,
}: ArticuloFormSheetProps) {
  // Identificación
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // Clasificación
  const [categoriaId, setCategoriaId] = useState('')
  const [unidad, setUnidad] = useState('')

  // Stock inicial
  const [stockInicial, setStockInicial] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [ubicacionId, setUbicacionId] = useState('')

  // Detalles físicos / químicos
  const [materialType, setMaterialType] = useState('')
  const [capacityMl, setCapacityMl] = useState('')
  const [expirationDate, setExpirationDate] = useState('')

  // Notas
  const [notas, setNotas] = useState('')

  const esEditar = !!articulo

  useEffect(() => {
    if (articulo) {
      setNombre(articulo.nombre)
      setCodigo(articulo.codigo ?? '')
      setSerialNumber(articulo.numero_serie ?? '')
      setDescripcion(articulo.descripcion ?? '')
      setCategoriaId(String(articulo.categoria_id))
      setUnidad(articulo.unidad ?? '')
      setStockInicial('')
      setUbicacionId('')
      setMaterialType(articulo.tipo_material ?? '')
      setCapacityMl(articulo.capacidad_ml != null ? String(articulo.capacidad_ml) : '')
      setExpirationDate(articulo.fecha_caducidad ?? '')
      setNotas(articulo.notas ?? '')
      setStockMinimo(articulo.stock_minimo != null ? String(articulo.stock_minimo) : '')
    } else {
      setNombre('')
      setCodigo('')
      setSerialNumber('')
      setDescripcion('')
      setCategoriaId('')
      setUnidad('')
      setStockInicial('')
      setStockMinimo('')
      setUbicacionId('')
      setMaterialType('')
      setCapacityMl('')
      setExpirationDate('')
      setNotas('')
    }
  }, [articulo, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !categoriaId) return

    const datos: DatosFormArticulo = {
      nombre: nombre.trim(),
      codigo: codigo.trim() || undefined,
      descripcion: descripcion.trim() || undefined,
      categoria_id: Number(categoriaId),
      unidad: unidad || undefined,
      notas: notas.trim() || undefined,
      serial_number: serialNumber.trim() || undefined,
      material_type: materialType || undefined,
      capacity_ml: capacityMl !== '' ? Number(capacityMl) : undefined,
      expiration_date: expirationDate || undefined,
    }

    if (stockMinimo !== '') datos.stock_minimo = Number(stockMinimo)

    if (!esEditar) {
      if (stockInicial !== '') datos.stock_inicial = Number(stockInicial)
      if (ubicacionId !== '') datos.ubicacion_id = Number(ubicacionId)
    }

    onSubmit(datos)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Package className="size-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{esEditar ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
              <DialogDescription>
                {esEditar
                  ? 'Modifica los datos del artículo.'
                  : 'Registra un artículo con toda la información disponible.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50"
        >
          {/* ── Identificación ── */}
          <div className="space-y-4">
            <SectionTitle icon={Package} label="Identificación" />

            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej. Guantes de nitrilo talla M"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código interno</Label>
                <Input
                  id="codigo"
                  placeholder="Ej. GN-001"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Nº de serie</Label>
                <Input
                  id="serialNumber"
                  placeholder="Ej. SN-20240501"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                placeholder="Descripción breve del artículo"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* ── Clasificación ── */}
          <div className="space-y-4">
            <SectionTitle icon={Layers} label="Clasificación" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>
                  Categoría <span className="text-destructive">*</span>
                </Label>
                <Select value={categoriaId} onValueChange={setCategoriaId} required>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unidad de medida</Label>
                <Select value={unidad} onValueChange={setUnidad}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u.valor} value={u.valor}>
                        {u.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Detalles físicos / químicos ── */}
          <div className="space-y-4">
            <SectionTitle icon={FlaskConical} label="Características físicas" />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo de material</Label>
                <Select value={materialType} onValueChange={setMaterialType}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MATERIAL.map((m) => (
                      <SelectItem key={m.valor} value={m.valor}>
                        {m.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacityMl">
                  Capacidad{unidad && UNIDAD_CAPACIDAD[unidad] ? ` (${UNIDAD_CAPACIDAD[unidad]})` : ' / volumen'}
                </Label>
                <Input
                  id="capacityMl"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={unidad && UNIDAD_CAPACIDAD[unidad] ? `Ej. 500 ${UNIDAD_CAPACIDAD[unidad]}` : 'Ej. 500'}
                  value={capacityMl}
                  onChange={(e) => setCapacityMl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Fecha de caducidad</Label>
              <Input
                id="expirationDate"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* ── Stock ── */}
          <div className="space-y-4">
            <SectionTitle icon={MapPin} label={esEditar ? 'Stock' : 'Stock inicial y ubicación'} />

            {!esEditar && (
              <p className="text-xs text-muted-foreground -mt-2">
                Puedes registrar la cantidad actual y dónde se encuentra. Se creará el nivel de stock automáticamente.
              </p>
            )}

            <div className={esEditar ? 'space-y-2' : 'grid grid-cols-2 gap-3'}>
              {!esEditar && (
                <div className="space-y-2">
                  <Label htmlFor="stockInicial">Cantidad actual</Label>
                  <Input
                    id="stockInicial"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej. 50"
                    value={stockInicial}
                    onChange={(e) => setStockInicial(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="stockMinimo">Stock mínimo</Label>
                <Input
                  id="stockMinimo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 10"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                />
              </div>
            </div>

            {!esEditar && (
              <div className="space-y-2">
                <Label>Ubicación inicial</Label>
                <Select value={ubicacionId} onValueChange={setUbicacionId}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Seleccionar ubicación..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ubicaciones.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.nombre}
                        {u.tipo ? ` · ${u.tipo}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Notas ── */}
          <div className="space-y-4">
            <SectionTitle icon={FileText} label="Notas internas" />
            <textarea
              id="notas"
              placeholder="Observaciones, instrucciones de uso, proveedor habitual..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* ── Acciones ── */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="size-4 animate-spin" />{esEditar ? 'Guardando...' : 'Creando...'}</>
              ) : (
                esEditar ? 'Guardar cambios' : 'Crear artículo'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
