# Plan de Reestructuración — Inventario Salud Ambiental

> Generado: 29 abril 2026  
> Horizonte: 1 mes con desarrollo asistido por IA

---

## 1. Análisis del esquema actual

### Tablas existentes (activas en producción)

| Tabla | Propósito | ¿Conservar? |
|---|---|---|
| `roles` | Roles de usuario | ✅ Sí, renombrar columnas a español |
| `app_users` | Usuarios de la app (vinculados a Insforge) | ✅ Sí |
| `app_user_roles` | Relación usuario-rol | ✅ Sí |
| `categories` | Categorías de artículos | ✅ Sí, renombrar a español |
| `locations` | Ubicaciones de almacenamiento | ✅ Sí, renombrar a español |
| `items` | Artículos del inventario | ✅ Sí, renombrar a español |
| `stock_levels` | Stock por artículo y ubicación | ✅ Sí, renombrar a español |
| `movements` | Movimientos de inventario | ✅ Sí, renombrar a español |
| `movement_lines` | Líneas de cada movimiento | ✅ Sí, renombrar a español |
| `maintenance_assets` | Activos de mantenimiento | ✅ Sí, simplificado |
| `alert_events` | Eventos de alerta | ✅ Sí, renombrar a español |
| `audit_logs` | Log de auditoría (trigger automático) | ✅ Sí |

### Tablas de la migración inicial que NO están activas (sobreescritas)

Las migraciones `140000` y `160000` crean las mismas tablas — la `160000` es la versión simplificada y activa. Las siguientes tablas de la `140000` **no existen en producción**:

- `batches` (lotes) — eliminada en la versión simplificada
- `suppliers` (proveedores) — eliminada
- `alert_rules` (reglas de alerta) — eliminada
- `alert_notifications` — eliminada
- `maintenance_plans` — eliminada
- `maintenance_events` — eliminada

### Problemas identificados

1. **Todo en inglés** — tablas, columnas, valores de enums. Confuso para el equipo.
2. **Dos migraciones duplicadas** — `140000` y `160000` crean las mismas tablas. Hay que limpiar.
3. **`batches`, `suppliers`, `alert_rules`** — diseñadas pero nunca implementadas. Añaden complejidad sin valor actual.
4. **`maintenance_assets`** muy simplificado — solo `asset_code`, `status`, `notes`. Suficiente para el MVP.
5. **Sin campo `email` en `app_users`** — el email está en Insforge, no en la BD local. Correcto.
6. **Roles hardcodeados en inglés** — `admin`, `tecnico`, `consulta`. Deben ser en español.
7. **`audit_logs` con trigger automático** — bien diseñado, conservar.
8. **Sin tabla de notificaciones propias** — se usa Novu externamente. Correcto.

---

## 2. Esquema objetivo (en español)

### Tablas a renombrar/reestructurar

```
roles                → roles (columna name en español: 'administrador', 'profesor', 'consultor')
app_users            → usuarios_app (display_name → nombre_visible, is_active → activo)
app_user_roles       → usuario_roles
categories           → categorias (name → nombre)
locations            → ubicaciones (name → nombre, añadir: descripcion, tipo)
items                → articulos (name → nombre, code → codigo, unit → unidad, notes → notas,
                        is_active → activo, añadir: descripcion)
stock_levels         → niveles_stock (quantity → cantidad, min_quantity → cantidad_minima)
movements            → movimientos (movement_type → tipo, reason → motivo,
                        source_location_id → ubicacion_origen_id,
                        target_location_id → ubicacion_destino_id,
                        app_user_id → usuario_id)
movement_lines       → lineas_movimiento (movement_id → movimiento_id, quantity → cantidad)
maintenance_assets   → activos_mantenimiento (asset_code → codigo_activo, status → estado,
                        current_location_id → ubicacion_actual_id)
alert_events         → alertas (alert_type → tipo, severity → severidad, status → estado,
                        trigger_payload_json → datos_json,
                        triggered_at → generada_en,
                        acknowledged_by_user_id → confirmada_por_id,
                        acknowledged_at → confirmada_en)
audit_logs           → registros_auditoria (actor_user_id → usuario_id,
                        event_type → tipo_evento, entity_type → entidad_tipo,
                        entity_id → entidad_id)
```

### Valores de enums en español

```
movimientos.tipo:     'entrada', 'salida', 'traslado', 'ajuste'
alertas.tipo:         'stock_bajo', 'caducidad', 'mantenimiento', 'inactividad'
alertas.severidad:    'baja', 'media', 'alta', 'critica'
alertas.estado:       'abierta', 'confirmada', 'resuelta', 'ignorada'
activos.estado:       'operativo', 'mantenimiento_pendiente', 'en_mantenimiento',
                      'fuera_servicio', 'retirado'
roles.nombre:         'administrador', 'profesor', 'consultor'
```

---

## 3. Roles y permisos

| Rol | Descripción | Permisos |
|---|---|---|
| `administrador` | Gestión total del sistema | Todo: usuarios, roles, inventario, alertas, configuración |
| `profesor` | Usuario avanzado (docente/técnico de lab) | Crear/editar inventario, movimientos, confirmar alertas, ver todo |
| `consultor` | Usuario de solo lectura (estudiante/visitante) | Ver inventario, ver movimientos propios, ver alertas |

**Flujo de registro:**
- Nuevo usuario → rol `consultor` por defecto
- Solo `administrador` puede cambiar roles
- Solo `administrador` y `profesor` pueden crear/editar artículos y movimientos

---

## 4. Funcionalidades objetivo (1 mes)

### Semana 1 — Base sólida
- [ ] Migración de renombrado (inglés → español, nuevos enums)
- [ ] Seeders con datos de prueba realistas (categorías, ubicaciones, artículos, stock)
- [ ] Formularios con selectores reales (categorías, ubicaciones, artículos)
- [ ] CRUD completo de artículos (crear, ver, editar, desactivar)
- [ ] CRUD completo de ubicaciones

### Semana 2 — Movimientos e inventario
- [ ] Formulario de movimiento con selector de artículo real (búsqueda)
- [ ] Selector de ubicación origen/destino según tipo de movimiento
- [ ] Historial de movimientos con filtros (tipo, fecha, usuario)
- [ ] Vista de stock por ubicación
- [ ] Exportar inventario a CSV/PDF

### Semana 3 — Alertas y auditoría
- [ ] Página de alertas con filtros y confirmación
- [ ] Generación automática de alertas por stock bajo (trigger o job)
- [ ] Página de auditoría con log de cambios
- [ ] Notificaciones Novu para alertas críticas
- [ ] Panel de estadísticas mejorado

### Semana 4 — Usuarios, roles y pulido
- [ ] Página de gestión de usuarios (solo administrador)
- [ ] Asignación/cambio de roles
- [ ] Perfil de usuario completo
- [ ] Mantenimiento de activos básico
- [ ] Tests E2E con Playwright
- [ ] Build de producción limpia y deploy

---

## 5. Arquitectura técnica

### Backend (Laravel)
```
app/
  Http/Controllers/Api/
    ArticuloController.php       ← CRUD artículos
    UbicacionController.php      ← CRUD ubicaciones
    CategoriaController.php      ← CRUD categorías
    MovimientoController.php     ← movimientos + resumen
    AlertaController.php         ← alertas + confirmar
    UsuarioController.php        ← gestión usuarios (admin)
    AuditoriaController.php      ← log de auditoría
    MantenimientoController.php  ← activos
  Models/
    (renombrados en español)
  Services/
    MovimientoService.php        ← lógica de stock
    AlertaService.php            ← generación de alertas
  Jobs/
    VerificarStockBajo.php        ← job programado
```

### Frontend (React + TanStack Query)
```
src/
  pages/
    PanelPrincipal.tsx
    Inventario/
      ListaArticulos.tsx
      FormularioArticulo.tsx
      DetalleArticulo.tsx
    Movimientos/
      ListaMovimientos.tsx
      FormularioMovimiento.tsx
    Ubicaciones/
      ListaUbicaciones.tsx
      FormularioUbicacion.tsx
    Alertas.tsx
    Auditoria.tsx
    Mantenimiento.tsx
    Usuarios.tsx          ← solo admin
    Perfil.tsx
  hooks/
    queries.ts            ← todos los useQuery/useMutation
  utils/
    panelUtils.ts
    formatters.ts         ← fechas, números, enums → español
```

---

## 6. Decisiones de diseño

1. **Sin `batches` ni `suppliers` en el MVP** — añadir en v2 si se necesita trazabilidad de lotes
2. **`audit_logs` via trigger PostgreSQL** — automático, no requiere código en Laravel
3. **Alertas generadas por job programado** — `php artisan schedule:run` cada hora
4. **Novu solo para notificaciones in-app** — no email en MVP
5. **TanStack Query en frontend** — caché, invalidación automática, sin `useEffect` manual
6. **Roles en BD, no en Insforge** — Insforge gestiona autenticación, la BD gestiona autorización
7. **Español en todo** — tablas, columnas, enums, UI, mensajes de error

---

## 7. Prompt para modo plan

```
Eres un asistente de desarrollo para el proyecto "Inventario Salud Ambiental".

CONTEXTO DEL PROYECTO:
- Sistema de inventario para un laboratorio de salud ambiental
- Backend: Laravel 11 + PostgreSQL (en Inventario-SaludAmbiental/backend/api/)
- Frontend: React 19 + TypeScript + TanStack Query + shadcn/ui (en Inventario-SaludAmbiental/frontend/app/)
- Autenticación: Insforge (OAuth Google/Apple + email/contraseña con OTP)
- Notificaciones: Novu (in-app)
- Tests: PHPUnit (backend) + Vitest + fast-check (frontend)

ESTADO ACTUAL:
- Esquema de BD en inglés, hay que migrar a español
- Tablas activas: roles, app_users, app_user_roles, categories, locations, items,
  stock_levels, movements, movement_lines, maintenance_assets, alert_events, audit_logs
- Panel principal conectado a datos reales
- Auth completa (login, registro, OAuth, recuperación contraseña)
- TanStack Query instalado y funcionando
- Build limpia, 18 tests en verde

OBJETIVO:
Reestructurar y completar el sistema en 1 mes. Prioridades:

1. MIGRACIÓN BD: Renombrar tablas y columnas a español, actualizar enums a español
   (entry→entrada, exit→salida, etc.), actualizar todos los modelos y controladores Laravel

2. ROLES: 3 roles en español: 'administrador', 'profesor', 'consultor'
   - Nuevo usuario → consultor por defecto (ya implementado en middleware)
   - Solo administrador puede cambiar roles
   - Middleware de autorización por rol en rutas sensibles

3. CRUD COMPLETO:
   - Artículos: crear, ver, editar, desactivar (con categoría y ubicación reales)
   - Ubicaciones: crear, ver, editar (con tipo: armario, nevera, estantería, etc.)
   - Categorías: crear, ver, editar

4. MOVIMIENTOS: Formulario con selector de artículo (búsqueda), selector de
   ubicación según tipo de movimiento, validación de stock suficiente

5. ALERTAS: Página con filtros, confirmación, generación automática por stock bajo

6. AUDITORÍA: Página de log de cambios (ya hay trigger en PostgreSQL)

7. GESTIÓN DE USUARIOS: Solo administrador puede ver/editar usuarios y cambiar roles

REGLAS TÉCNICAS:
- Todo en español: nombres de tablas, columnas, enums, mensajes de error, UI
- Backend: controladores delgados, lógica en Services
- Frontend: lógica de datos en hooks/queries.ts, componentes solo presentación
- Usar skills disponibles en .agents/skills/ (clean-code, frontend-design, insforge)
- Buscar skills adicionales con `npx skills find` antes de implementar
- Tests para cada endpoint nuevo (PHPUnit) y componente crítico (Vitest)
- Commits atómicos por funcionalidad

ARCHIVOS CLAVE:
- Migraciones: backend/api/database/migrations/
- Modelos: backend/api/app/Models/
- Controladores: backend/api/app/Http/Controllers/Api/
- Rutas: backend/api/routes/api.php
- Hooks: frontend/app/src/hooks/queries.ts
- Páginas: frontend/app/src/pages/
```

---

## 8. Roadmap v2 — Pendientes para futuras iteraciones

### Autenticación independiente con Laravel Socialite

**Objetivo:** eliminar la dependencia de Insforge para la autenticación OAuth.

**Propuesta:**
- Instalar `laravel/socialite` + drivers de Google y Apple
- Crear `AuthController` con rutas `/auth/google`, `/auth/google/callback`, `/auth/apple`, `/auth/apple/callback`
- Al completar el callback OAuth, crear o recuperar el `UsuarioApp` en la BD local y emitir un token JWT (con `laravel/sanctum` o `tymon/jwt-auth`)
- El frontend intercambia el token JWT en cada request en lugar del header `X-Auth-User-Id`
- Los datos de usuario (email, nombre) se guardan en `usuarios_app`, sin depender de la BD de Insforge
- Insforge quedaría solo como proveedor de infraestructura (PostgreSQL, hosting), no de autenticación

**Ventajas:**
- Control total sobre usuarios, sesiones y tokens
- Sin vendor lock-in en autenticación
- Posibilidad de añadir más providers (GitHub, Microsoft) sin cambiar de plataforma

**Estimación:** 1 semana de desarrollo
