# Documentación Técnica: API de Movimientos

## Resumen del Problema Reportado

**Usuario reporta:** _"los botones del frontend como entrada y demas Se requiere ubicación destino para una entrada"_

**Causa raíz:** El backend (MovimientoService.php) REQUIERE obligatoriamente `ubicacion_destino_id` para movimientos de tipo `entrada`. Si no se envía, lanza RuntimeException.

---

## 1. Endpoints de Movimientos

### 1.1 Crear Movimiento

```
POST /api/movimientos
Authorization: Bearer {token}
```

#### Request Body

```json
{
  "tipo": "entrada|salida|traslado|ajuste",
  "motivo": "string opcional (max 255 chars)",
  "ubicacion_origen_id": "integer|null - REQUERIDO para salida",
  "ubicacion_destino_id": "integer|null - REQUERIDO para entrada/ajuste",
  "lineas": [
    {
      "articulo_id": "integer - REQUERIDO",
      "cantidad": "number - REQUERIDO, > 0"
    }
  ]
}
```

#### Response 201 (Creado)

```json
{
  "data": {
    "id": 123,
    "tipo": "entrada",
    "motivo": "Compra proveedor",
    "ubicacion_origen_id": null,
    "ubicacion_destino_id": 1,
    "usuario_id": 5,
    "created_at": "2026-05-06T14:30:00Z",
    "lineas": [
      {
        "id": 456,
        "articulo_id": 78,
        "articulo": "Guantes de nitrilo",
        "cantidad": 100
      }
    ]
  }
}
```

#### Response 422 (Validación fallida)

```json
{
  "message": "Se requiere ubicación destino para una entrada."
}
```

### 1.2 Listar Movimientos

```
GET /api/movimientos?per_page=20
Authorization: Bearer {token}
```

#### Response 200

```json
{
  "data": [
    {
      "id": 123,
      "tipo": "entrada",
      "motivo": "Compra proveedor",
      "ubicacion_origen_id": null,
      "ubicacion_destino_id": 1,
      "usuario_id": 5,
      "usuario": "Juan Pérez",
      "lineas": [
        {
          "id": 456,
          "articulo_id": 78,
          "articulo": "Guantes de nitrilo",
          "cantidad": 100
        }
      ],
      "created_at": "2026-05-06T14:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "total": 95
  }
}
```

### 1.3 Resumen de Hoy

```
GET /api/movimientos/resumen-hoy
Authorization: Bearer {token}
```

#### Response 200

```json
{
  "entradas_hoy": 15,
  "salidas_hoy": 8,
  "ajustes_hoy": 2,
  "traslados_hoy": 3
}
```

---

## 2. Reglas de Negocio por Tipo de Movimiento

### 2.1 ENTRADA

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `tipo` | SÍ | Valor fijo: `"entrada"` |
| `ubicacion_destino_id` | **SÍ** | Dónde se almacena la mercancía |
| `ubicacion_origen_id` | NO | Siempre `null` |
| `lineas[].articulo_id` | SÍ | ID del artículo |
| `lineas[].cantidad` | SÍ | Cantidad > 0 |

**Lógica backend:**
```php
private function manejarEntrada(int $articuloId, float $cantidad, ?int $destinoId): void
{
    if ($destinoId === null) {
        throw new RuntimeException('Se requiere ubicación destino para una entrada.');
    }
    $this->incrementarStock($articuloId, $destinoId, $cantidad);
}
```

**Flujo de stock:**
- Busca registro en `niveles_stock` con (articulo_id + ubicacion_id)
- Si existe: incrementa cantidad
- Si no existe: crea nuevo registro con cantidad = entrada

---

### 2.2 SALIDA

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `tipo` | SÍ | Valor fijo: `"salida"` |
| `ubicacion_origen_id` | **SÍ** | De dónde se saca la mercancía |
| `ubicacion_destino_id` | NO | Siempre `null` |
| `lineas[].articulo_id` | SÍ | ID del artículo |
| `lineas[].cantidad` | SÍ | Cantidad > 0 |

**Lógica backend:**
```php
private function manejarSalida(int $articuloId, float $cantidad, ?int $origenId): void
{
    if ($origenId === null) {
        throw new RuntimeException('Se requiere ubicación origen para una salida.');
    }
    $this->decrementarStock($articuloId, $origenId, $cantidad);
}
```

**Flujo de stock:**
- Busca registro en `niveles_stock`
- Si no existe o cantidad < salida: lanza "Stock insuficiente"
- Si existe: decrementa cantidad

---

### 2.3 TRASLADO

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `tipo` | SÍ | Valor fijo: `"traslado"` |
| `ubicacion_origen_id` | **SÍ** | Ubicación origen |
| `ubicacion_destino_id` | **SÍ** | Ubicación destino |
| `lineas[].articulo_id` | SÍ | ID del artículo |
| `lineas[].cantidad` | SÍ | Cantidad > 0 |

**Lógica backend:**
```php
private function manejarTraslado(int $articuloId, float $cantidad, ?int $origenId, ?int $destinoId): void
{
    if ($origenId === null || $destinoId === null) {
        throw new RuntimeException('Se requieren ubicación origen y destino para un traslado.');
    }
    $this->decrementarStock($articuloId, $origenId, $cantidad);
    $this->incrementarStock($articuloId, $destinoId, $cantidad);
}
```

---

### 2.4 AJUSTE

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `tipo` | SÍ | Valor fijo: `"ajuste"` |
| `ubicacion_destino_id` | **SÍ** | Ubicación a ajustar |
| `ubicacion_origen_id` | NO | Siempre `null` |
| `lineas[].articulo_id` | SÍ | ID del artículo |
| `lineas[].cantidad` | SÍ | Nueva cantidad (no delta) |

**Lógica backend:**
```php
private function manejarAjuste(int $articuloId, float $cantidad, ?int $destinoId): void
{
    if ($destinoId === null) {
        throw new RuntimeException('Se requiere ubicación destino para un ajuste.');
    }
    if ($cantidad < 0) {
        throw new RuntimeException('La cantidad de stock no puede ser negativa.');
    }
    $this->establecerStock($articuloId, $destinoId, $cantidad);
}
```

**Nota:** El ajuste ESTABLECE la cantidad (no la incrementa). Ej: si cantidad=50, el stock pasa a ser 50.

---

## 3. Estructura de Base de Datos

### 3.1 Tabla: movimientos

```sql
CREATE TABLE movimientos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('entrada', 'salida', 'traslado', 'ajuste') NOT NULL,
    motivo VARCHAR(255) NULL,
    ubicacion_origen_id BIGINT UNSIGNED NULL,
    ubicacion_destino_id BIGINT UNSIGNED NULL,
    usuario_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ubicacion_origen_id) REFERENCES ubicaciones(id),
    FOREIGN KEY (ubicacion_destino_id) REFERENCES ubicaciones(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios_app(id)
);
```

### 3.2 Tabla: lineas_movimiento

```sql
CREATE TABLE lineas_movimiento (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    movimiento_id BIGINT UNSIGNED NOT NULL,
    articulo_id BIGINT UNSIGNED NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (movimiento_id) REFERENCES movimientos(id) ON DELETE CASCADE,
    FOREIGN KEY (articulo_id) REFERENCES articulos(id)
);
```

### 3.3 Tabla: niveles_stock (Stock por ubicación)

```sql
CREATE TABLE niveles_stock (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    articulo_id BIGINT UNSIGNED NOT NULL,
    ubicacion_id BIGINT UNSIGNED NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL DEFAULT 0,
    cantidad_minima DECIMAL(10,2) NOT NULL DEFAULT 0,
    UNIQUE KEY unique_stock (articulo_id, ubicacion_id),
    FOREIGN KEY (articulo_id) REFERENCES articulos(id),
    FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id)
);
```

---

## 4. Lógica del Frontend (Flujo Actual)

### 4.1 Flujo de Entrada

```
1. Usuario hace click en [+] (Entrada) en una tarjeta
2. Se abre PanelAccionRapida con artículo seleccionado
3. Usuario selecciona tipo: "entrada"
4. Si hay múltiples ubicaciones → muestra selector
5. Usuario ingresa cantidad
6. Click "Confirmar"
7. POST /api/movimientos con:
   {
     "tipo": "entrada",
     "ubicacion_destino_id": 1,  // ← REQUERIDO por backend
     "lineas": [{"articulo_id": 5, "cantidad": 10}]
   }
```

**Problema identificado:** Si el artículo existe en múltiples ubicaciones, el frontend debe preguntar cuál es el destino. Si no hay ubicaciones configuradas, falla.

### 4.2 Solución Recomendada

El frontend debe:

1. **Para Entrada:**
   - Si hay 1 ubicación: usarla automáticamente
   - Si hay 0 ubicaciones: mostrar error "Configure ubicaciones primero"
   - Si hay 2+ ubicaciones: selector obligatorio

2. **Para Salida:**
   - Buscar niveles_stock del artículo
   - Solo mostrar ubicaciones donde cantidad > 0
   - Si hay 1 con stock: usarla
   - Si hay 0 con stock: deshabilitar botón salida
   - Si hay 2+ con stock: selector

3. **Para Traslado:**
   - Origen: solo ubicaciones con stock > 0
   - Destino: todas las ubicaciones excepto origen

---

## 5. Validaciones y Mensajes de Error

### 5.1 Errores del Backend (RuntimeException)

| Escenario | Mensaje | Código HTTP |
|-----------|---------|-------------|
| Entrada sin ubicación_destino_id | "Se requiere ubicación destino para una entrada." | 422 |
| Salida sin ubicacion_origen_id | "Se requiere ubicación origen para una salida." | 422 |
| Traslado sin ambas ubicaciones | "Se requieren ubicación origen y destino para un traslado." | 422 |
| Ajuste sin ubicación_destino_id | "Se requiere ubicación destino para un ajuste." | 422 |
| Cantidad ≤ 0 | "La cantidad de la línea debe ser mayor que cero." | 422 |
| Stock insuficiente | "Stock insuficiente para este movimiento." | 422 |
| Cantidad negativa en ajuste | "La cantidad de stock no puede ser negativa." | 422 |

### 5.2 Validaciones del Request (Laravel)

| Campo | Reglas |
|-------|--------|
| `tipo` | `required`, `string`, `in:entrada,salida,traslado,ajuste` |
| `motivo` | `nullable`, `string`, `max:255` |
| `ubicacion_origen_id` | `nullable`, `integer`, `exists:ubicaciones,id` |
| `ubicacion_destino_id` | `nullable`, `integer`, `exists:ubicaciones,id` |
| `lineas` | `required`, `array`, `min:1` |
| `lineas.*.articulo_id` | `required`, `integer`, `exists:articulos,id` |
| `lineas.*.cantidad` | `required`, `numeric`, `gt:0` |

---

## 6. Ejemplos de Uso

### 6.1 Entrada Simple (1 ubicación disponible)

```bash
curl -X POST https://api.ejemplo.com/movimientos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "entrada",
    "ubicacion_destino_id": 1,
    "motivo": "Compra proveedor XYZ",
    "lineas": [
      {"articulo_id": 5, "cantidad": 100}
    ]
  }'
```

### 6.2 Salida desde Ubicación Específica

```bash
curl -X POST https://api.ejemplo.com/movimientos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "salida",
    "ubicacion_origen_id": 2,
    "motivo": "Uso laboratorio",
    "lineas": [
      {"articulo_id": 5, "cantidad": 10}
    ]
  }'
```

### 6.3 Traslado entre Almacenes

```bash
curl -X POST https://api.ejemplo.com/movimientos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "traslado",
    "ubicacion_origen_id": 1,
    "ubicacion_destino_id": 3,
    "motivo": "Reabastecimiento almacén B",
    "lineas": [
      {"articulo_id": 5, "cantidad": 25}
    ]
  }'
```

---

## 7. Diagrama de Flujo de Decisión (Frontend)

```
                            ┌─────────────────┐
                            │ Usuario selecciona│
                            │ tipo de movimiento│
                            └────────┬────────┘
                                     │
                                     ▼
                         ┌─────────────────────┐
                         │   TIPO = ENTRADA    │
                         └─────────┬───────────┘
                                   │
                                   ▼
                    ┌────────────────────────────┐
                    │ ¿Cuántas ubicaciones hay?  │
                    └────────────┬───────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
     ┌──────────┐          ┌──────────┐          ┌──────────┐
     │    0     │          │    1     │          │   2+     │
     └────┬─────┘          └────┬─────┘          └────┬─────┘
          │                     │                    │
          ▼                     ▼                    ▼
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │ Mostrar error│      │ Usar la única│      │ Mostrar      │
   │ "Configure   │      │ ubicación    │      │ selector de  │
   │ ubicaciones" │      │ automáticamen│      │ ubicaciones  │
   └──────────────┘      └──────────────┘      └──────────────┘
```

---

## 8. Archivos Relevantes

### Backend (API Laravel)

| Archivo | Descripción |
|---------|-------------|
| `MovimientoController.php` | Endpoints REST |
| `MovimientoService.php` | Lógica de negocio y stock |
| `MovimientoRequest.php` | Validación de entrada |
| `MovimientoData.php` | DTO (Data Transfer Object) |
| `Movimiento.php` | Modelo Eloquent |
| `LineaMovimiento.php` | Modelo líneas |
| `NivelStock.php` | Modelo stock por ubicación |

### Frontend (React + TypeScript)

| Archivo | Descripción |
|---------|-------------|
| `Articulos.tsx` | Página principal |
| `PanelAccionRapida.tsx` | Panel inferior para movimientos |
| `ArticuloDrawer.tsx` | Detalle del artículo |
| `queries.ts` | Hooks de TanStack Query |
| `types/index.ts` | Interfaces TypeScript |

---

## 9. Recomendaciones de Implementación

### Para el Frontend:

1. **Pre-cargar ubicaciones** al montar el componente Articulos
2. **Cachear niveles_stock** por artículo para saber dónde hay stock
3. **Deshabilitar acciones** cuando no hay ubicaciones configuradas
4. **Mostrar selector visual** de ubicaciones con stock disponible
5. **Feedback inmediato** con toast al completar movimiento

### Para el Backend (mejoras futuras):

1. **Ubicación por defecto:** Permitir marcar una ubicación como "principal"
2. **Entrada sin ubicación:** Crear automáticamente en ubicación principal
3. **Salida automática:** Salir de la ubicación con más stock si no se especifica

---

## 10. Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200 | OK | Listar movimientos exitosamente |
| 201 | Created | Movimiento creado correctamente |
| 401 | Unauthorized | Token inválido o expirado |
| 422 | Unprocessable Entity | Validación fallida (datos inválidos) |
| 500 | Server Error | Error interno (database, etc) |

---

**Documento generado:** 6 de mayo de 2026  
**Versión:** 1.0  
**Autor:** Sistema de Documentación Técnica
