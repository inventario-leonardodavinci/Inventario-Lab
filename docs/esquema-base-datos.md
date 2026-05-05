# Esquema de base de datos

PostgreSQL gestionado en Insforge. El esquema se aplica mediante migraciones Laravel (`php artisan migrate`).

## Tablas activas

### `usuarios_app`
Perfil de aplicación vinculado al usuario de Insforge Auth.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `auth_user_id` | text UNIQUE | ID del usuario en Insforge Auth |
| `nombre_visible` | varchar(120) | Nullable |
| `activo` | boolean | Default `true` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `categorias`
Catálogo cerrado de categorías de artículos.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `nombre` | varchar(100) UNIQUE | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Valores iniciales: `Medios de cultivo`, `Fungibles`, `Reactivos químicos`, `Inventariables`.

---

### `ubicaciones`
Catálogo de ubicaciones físicas del laboratorio.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `nombre` | varchar(100) UNIQUE | |
| `descripcion` | text | Nullable |
| `tipo` | varchar(30) | Nullable. CHECK: `armario`, `nevera`, `estanteria`, `cajon`, `vitrina`, `otro` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `articulos`
Entidad principal del inventario.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `codigo` | varchar(100) UNIQUE | Nullable |
| `numero_serie` | varchar(120) | Nullable. Índice único parcial (solo cuando no es NULL) |
| `nombre` | varchar(180) | |
| `descripcion` | text | Nullable |
| `material_type` | varchar(60) | Nullable |
| `capacity_ml` | decimal(10,2) | Nullable |
| `expiration_date` | date | Nullable |
| `categoria_id` | bigint FK → `categorias` | |
| `unidad` | varchar(40) | Nullable |
| `notas` | text | Nullable |
| `activo` | boolean | Default `true` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Índices: `idx_items_category` (categoria_id), `idx_items_name` (nombre).  
Unique compuesto: `(nombre, material_type, capacity_ml, categoria_id)`.

---

### `niveles_stock`
Stock actual de un artículo en una ubicación.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `articulo_id` | bigint FK → `articulos` | |
| `ubicacion_id` | bigint FK → `ubicaciones` | |
| `cantidad` | decimal(12,2) | Default `0`. CHECK `>= 0` |
| `cantidad_minima` | decimal(12,2) | Nullable. Umbral para alertas de stock bajo |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Unique: `(articulo_id, ubicacion_id)`.

---

### `movimientos`
Cabecera de una operación de inventario.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `tipo` | varchar(20) | CHECK: `entrada`, `salida`, `traslado`, `ajuste` |
| `motivo` | varchar(255) | Nullable |
| `ubicacion_origen_id` | bigint FK → `ubicaciones` | Nullable |
| `ubicacion_destino_id` | bigint FK → `ubicaciones` | Nullable |
| `usuario_id` | bigint FK → `usuarios_app` | |
| `created_at` | timestamptz | |

---

### `lineas_movimiento`
Líneas de detalle de un movimiento (un artículo por línea).

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `movimiento_id` | bigint FK → `movimientos` CASCADE DELETE | |
| `articulo_id` | bigint FK → `articulos` | |
| `batch_id` | bigint FK → `lotes` | Nullable |
| `cantidad` | decimal(12,2) | CHECK `> 0` |
| `created_at` | timestamptz | |

---

### `activos_mantenimiento`
Activos físicos sujetos a mantenimiento periódico.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `articulo_id` | bigint FK → `articulos` | Nullable |
| `codigo_activo` | varchar(100) UNIQUE | |
| `numero_serie` | varchar(120) | Nullable. Índice único parcial |
| `estado` | varchar(30) | Default `operativo`. CHECK: `operativo`, `mantenimiento_pendiente`, `en_mantenimiento`, `fuera_servicio`, `retirado` |
| `manufacturer` | varchar(120) | Nullable |
| `model` | varchar(120) | Nullable |
| `purchase_date` | date | Nullable |
| `warranty_end_date` | date | Nullable |
| `last_service_date` | date | Nullable |
| `next_service_due_date` | date | Nullable |
| `ubicacion_actual_id` | bigint FK → `ubicaciones` | Nullable |
| `notas` | text | Nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

---

### `alertas`
Eventos de alerta generados por el sistema.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `tipo` | varchar(30) | CHECK: `stock_bajo`, `caducidad`, `mantenimiento`, `inactividad` |
| `severidad` | varchar(20) | CHECK: `baja`, `media`, `alta`, `critica` |
| `estado` | varchar(20) | Default `abierta`. CHECK: `abierta`, `confirmada`, `resuelta`, `ignorada` |
| `articulo_id` | bigint FK → `articulos` | Nullable |
| `ubicacion_id` | bigint FK → `ubicaciones` | Nullable |
| `activo_id` | bigint FK → `activos_mantenimiento` | Nullable |
| `datos_json` | jsonb | Nullable. Payload del evento que disparó la alerta |
| `generada_en` | timestamptz | |
| `confirmada_por_id` | bigint FK → `usuarios_app` | Nullable |
| `confirmada_en` | timestamptz | Nullable |
| `resuelta_por_id` | bigint FK → `usuarios_app` | Nullable |
| `resuelta_en` | timestamptz | Nullable |
| `notas_resolucion` | text | Nullable |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Índices: `idx_alertas_generada_en`, `idx_alertas_estado`, `idx_alertas_estado_generada_en`.

---

### `registros_auditoria`
Bitácora de cambios en tablas críticas, poblada por triggers PostgreSQL.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `usuario_id` | bigint FK → `usuarios_app` | Nullable (sistema/tests = NULL) |
| `tipo_evento` | varchar(80) | `INSERT`, `UPDATE`, `DELETE` |
| `entidad_tipo` | varchar(80) | Nombre de la tabla afectada |
| `entidad_id` | bigint | ID del registro afectado |
| `antes_json` | jsonb | Nullable. Estado anterior (UPDATE/DELETE) |
| `despues_json` | jsonb | Nullable. Estado posterior (INSERT/UPDATE) |
| `payload_json` | jsonb | Nullable. Metadatos adicionales |
| `ip_address` | inet | Nullable |
| `user_agent` | text | Nullable |
| `created_at` | timestamptz | |

Índices: `idx_registros_auditoria_created_at`, `idx_registros_auditoria_entidad_fecha`.

Tablas con trigger activo: `articulos`, `ubicaciones`, `categorias`, `movimientos`, `alertas`, `usuarios_app`, `niveles_stock`, `lineas_movimiento`, `activos_mantenimiento`.

---

### `historial_sesiones`
Registro de eventos de autenticación por usuario.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigint PK | |
| `usuario_id` | bigint FK → `usuarios_app` CASCADE DELETE | |
| `ip_address` | inet | Nullable |
| `user_agent` | text | Nullable |
| `dispositivo` | varchar(60) | Nullable |
| `navegador` | varchar(80) | Nullable |
| `sistema_operativo` | varchar(80) | Nullable |
| `pais` | varchar(80) | Nullable |
| `ciudad` | varchar(80) | Nullable |
| `tipo_evento` | varchar(30) | Default `login`. CHECK: `login`, `logout`, `refresh`, `oauth` |
| `exitoso` | boolean | Default `true` |
| `iniciada_en` | timestamptz | |

---

## Tablas de permisos (Spatie)

Gestionadas por `spatie/laravel-permission`. Prefijo `spatie_`.

| Tabla | Descripción |
|---|---|
| `spatie_permissions` | Permisos individuales |
| `spatie_roles` | Roles (`administrador`, `profesor`, `consultor`) |
| `spatie_model_has_permissions` | Permisos directos por modelo |
| `spatie_model_has_roles` | Roles asignados a `UsuarioApp` |
| `spatie_role_has_permissions` | Permisos asignados a roles |

---

## Tablas heredadas (sin uso activo)

Existen en la BD pero no tienen modelo ni controlador activo. No borrar sin diagnóstico previo.

| Tabla | Descripción |
|---|---|
| `lotes` | Lotes de artículos con proveedor y coste unitario |
| `suppliers` | Proveedores |
| `maintenance_plans` | Planes de mantenimiento periódico |
| `maintenance_events` | Eventos de mantenimiento ejecutados |
| `alert_rules` | Reglas configurables de generación de alertas |
| `alert_notifications` | Notificaciones enviadas por alerta |

---

## Función y triggers de auditoría

```sql
-- Función: fn_auditoria()
-- Lee app.current_user_id de la sesión PostgreSQL (establecido por ResolverUsuarioApp middleware).
-- Valor 0 o ausente → usuario_id = NULL (sistema/tests).
-- Inserta en registros_auditoria con before/after en JSON.

-- Triggers activos (AFTER INSERT OR UPDATE OR DELETE):
trg_auditoria_articulos
trg_auditoria_ubicaciones
trg_auditoria_categorias
trg_auditoria_movimientos
trg_auditoria_alertas
trg_auditoria_usuarios_app
```

---

## Diagrama de relaciones (simplificado)

```
usuarios_app ──< movimientos >── ubicaciones
                    │
                    └──< lineas_movimiento >── articulos >── categorias
                                                   │
                                              niveles_stock >── ubicaciones
                                                   │
                                              activos_mantenimiento
                                                   │
                                                alertas
```
