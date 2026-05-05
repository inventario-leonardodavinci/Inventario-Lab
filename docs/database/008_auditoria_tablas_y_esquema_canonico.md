# Auditoría de tablas y esquema canónico

Este documento fija el estado esperado del esquema tras la reestructuración a español y separa tablas activas, heredadas, futuras e infraestructura.

## Criterio de clasificación

- **Canónica:** tabla usada por modelos, controladores, seeders, jobs, comandos o rutas actuales.
- **Infraestructura:** tabla mantenida por Laravel o paquetes y no perteneciente al dominio de inventario.
- **Histórica:** nombre antiguo o script previo que solo debe existir en instalaciones anteriores antes de migrar.
- **Futura:** tabla creada para un módulo previsto, pero sin uso real actual en la aplicación.
- **Candidata a retirada:** tabla que no debe existir en instalaciones nuevas o debe migrarse antes de eliminarse.

## Tablas canónicas de dominio

| Tabla | Estado | Uso actual | Decisión |
| --- | --- | --- | --- |
| `usuarios_app` | Canónica | Usuario interno asociado a Auth externa mediante `auth_user_id`. | Mantener. |
| `roles` | Canónica | Roles simples de aplicación: `administrador`, `profesor`, `consultor`. | Mantener como fuente de verdad actual. |
| `usuario_roles` | Canónica | Relación entre `usuarios_app` y `roles`. | Mantener mientras no se migre completamente a Spatie. |
| `categorias` | Canónica | Catálogo de categorías de artículos. | Mantener. |
| `ubicaciones` | Canónica | Ubicaciones físicas del inventario. | Mantener. |
| `articulos` | Canónica | Catálogo principal de artículos. | Mantener. |
| `niveles_stock` | Canónica | Stock por artículo y ubicación. | Mantener. |
| `movimientos` | Canónica | Cabecera de movimientos de inventario. | Mantener. |
| `lineas_movimiento` | Canónica | Detalle de artículos/cantidades por movimiento. | Mantener. |
| `alertas` | Canónica | Alertas generadas por stock bajo y gestionadas desde API. | Mantener. |
| `activos_mantenimiento` | Canónica | Activos inventariables del módulo de mantenimiento básico. | Mantener. |
| `registros_auditoria` | Canónica | Auditoría mediante triggers en tablas principales. | Mantener. |
| `historial_sesiones` | Canónica | Historial visible desde perfil/notificaciones. | Mantener. |

## Tablas de infraestructura

| Tabla | Estado | Uso actual | Decisión |
| --- | --- | --- | --- |
| `cache` | Infraestructura | Cache de Laravel. | Mantener si se usa driver de base de datos. |
| `cache_locks` | Infraestructura | Locks de cache Laravel. | Mantener si se usa driver de base de datos. |
| `jobs` | Infraestructura | Cola de Laravel. | Mantener si se usa queue database. |
| `job_batches` | Infraestructura | Lotes de jobs Laravel. | Mantener si se usa queue batching. |
| `failed_jobs` | Infraestructura | Fallos de cola Laravel. | Mantener. |
| `migrations` | Infraestructura | Control de migraciones. | Mantener. |

## Tablas Spatie no activas como fuente de verdad

| Tabla | Estado | Uso actual | Decisión |
| --- | --- | --- | --- |
| `spatie_roles` | Infraestructura no activa | Preparada por `spatie/laravel-permission`, pero las rutas usan `roles`/`usuario_roles`. | No usar como fuente de verdad hasta migración completa. |
| `spatie_permissions` | Infraestructura no activa | Sin middleware `permiso` usado por rutas actuales. | Mantener solo si se decide activar permisos granulares. |
| `spatie_model_has_roles` | Infraestructura no activa | No debe mezclarse con `usuario_roles`. | No poblar desde flujo actual. |
| `spatie_model_has_permissions` | Infraestructura no activa | Sin uso actual. | No poblar desde flujo actual. |
| `spatie_role_has_permissions` | Infraestructura no activa | Sin uso actual. | No poblar desde flujo actual. |

## Tablas futuras o no usadas por código actual

| Tabla | Estado | Uso actual | Decisión |
| --- | --- | --- | --- |
| `suppliers` | Futura | Sin modelo/controlador actual detectado. | Conservar solo si el módulo de proveedores se va a implementar; no referenciar desde UI actual. |
| `batches` | Futura | Creada históricamente para lotes, pero el servicio de movimientos actual no usa `batch_id`. | No eliminar sin diagnóstico de datos. |
| `maintenance_plans` | Futura | Sin modelo/controlador actual. | Posponer o documentar como módulo pendiente. |
| `maintenance_events` | Futura | Sin modelo/controlador actual. | Posponer o documentar como módulo pendiente. |
| `alert_rules` | Futura | El servicio actual genera alertas directamente sin reglas persistidas. | Posponer o eliminar de instalaciones nuevas cuando se confirme ausencia de datos. |
| `alert_notifications` | Futura | No hay flujo persistente de notificaciones sobre esta tabla. | Posponer o eliminar de instalaciones nuevas cuando se confirme ausencia de datos. |

## Nombres históricos en inglés

Estas tablas pertenecen al esquema anterior y no deben coexistir con sus equivalentes en español después de migrar correctamente:

| Histórica | Canónica |
| --- | --- |
| `app_users` | `usuarios_app` |
| `app_user_roles` | `usuario_roles` |
| `categories` | `categorias` |
| `locations` | `ubicaciones` |
| `items` | `articulos` |
| `stock_levels` | `niveles_stock` |
| `movements` | `movimientos` |
| `movement_lines` | `lineas_movimiento` |
| `maintenance_assets` | `activos_mantenimiento` |
| `alert_events` | `alertas` |
| `audit_logs` | `registros_auditoria` |

## Reglas de mantenimiento

- No crear nuevas tablas de dominio en inglés.
- No añadir lógica nueva sobre tablas futuras sin modelo/controlador/migración alineados en español.
- No mezclar `roles`/`usuario_roles` con tablas Spatie en el mismo flujo de autorización.
- Antes de borrar cualquier tabla futura o histórica, ejecutar el script de diagnóstico y conservar copia de seguridad.
