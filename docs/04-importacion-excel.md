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

- `nombre_item` -> `items.name`
- `categoria` -> `categories.name`
- `ubicacion` -> `locations.name`
- `cantidad` -> `stock_levels.quantity`
- `unidad` -> `items.unit`
- `codigo` -> `items.code` (opcional)
- `caducidad` -> `batches.expiration_date` (si aplica)
- `observaciones` -> `items.notes` (opcional)

## Reglas de validacion minimas

- `nombre_item` obligatorio.
- `categoria` debe existir en catalogo cerrado.
- `ubicacion` debe existir en catalogo cerrado.
- `cantidad` numerica y mayor o igual a 0.

## Resultado esperado

- Items creados y stock inicial por ubicacion.
- Reporte con filas importadas y rechazadas.
