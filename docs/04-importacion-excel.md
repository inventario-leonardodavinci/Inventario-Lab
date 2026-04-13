# Importacion inicial de Excel

## Archivos fuente

- `Inventario Material fungible laboratorio.xlsx`
- `Medios cultivo L201.xlsx`

## Estrategia

1. Mapear columnas de origen a campos destino.
2. Normalizar categorias y ubicaciones.
3. Validar filas obligatorias.
4. Cargar en base de datos.
5. Registrar errores y resumen de importacion.

## Plantilla de mapeo recomendada

### Estructura detectada en `Inventario Material fungible laboratorio.xlsx`

- `Item`
- `Material`
- `Capacidad (ml)`
- `Numero`
- `Armario`
- `Observaciones`

### Mapeo recomendado a BD

- `Item` -> `items.name`
- `Material` -> `items.material_type`
- `Capacidad (ml)` -> `items.capacity_ml`
- `Numero` -> `stock_levels.quantity`
- `Armario` -> `locations.name` mediante tabla de equivalencias
- `Observaciones` -> `items.notes`
- Categoria fija en este Excel -> `categories.name = 'Fungibles'`

### Equivalencias iniciales de ubicacion (propuesta)

- `Armario = 1` -> `Armario bajo 1`
- `Armario = 2` -> `Armario bajo 2`
- `Armario = 3` -> `Armario bajo 3`
- `Armario = 4` -> `Armario bajo 4`

## Reglas de validacion minimas

- `Item` obligatorio.
- `Material` opcional pero recomendado.
- `Capacidad (ml)` numerica cuando exista valor.
- `Numero` numerica y mayor o igual a 0.
- `Armario` debe poder mapearse a una ubicacion valida.

## Resultado esperado

- Items creados y stock inicial por ubicacion.
- Reporte con filas importadas y rechazadas.
