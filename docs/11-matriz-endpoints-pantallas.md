# Matriz endpoint ↔ pantalla ↔ estado

## Objetivo
Controlar la ejecucion semanal con un mapa unico entre interfaz, API, permisos y criterio de validacion.

## Matriz operativa

| Pantalla | Endpoint | Metodo | Rol minimo | Estado actual | Criterio de terminado |
|---|---|---|---|---|---|
| Inicio de sesion | `/notifications/login-event` | POST | consulta | Base implementada | Evento Novu disparado y aviso visual en interfaz |
| Cabecera / sesion | `/profile` | GET | consulta | Implementado | Muestra nombre y roles correctos |
| Panel KPIs | `/inventory` | GET | consulta | Implementado parcial | KPI total y criticos desde API real |
| Panel alertas | `/notifications` | GET | consulta | Implementado parcial | Bandeja en aplicacion con contador no leidas |
| Inventario listado | `/inventory` | GET | consulta | Implementado | Busqueda + paginacion en servidor |
| Inventario alta | `/inventory` | POST | tecnico | Implementado base | Alta validada y refresco de tabla |
| Movimientos historial | `/movements` | GET | consulta | Implementado | Lista ordenada por fecha |
| Movimiento crear | `/movements` | POST | tecnico | Implementado | Bloquea stock negativo y devuelve 409 |
| Alertas listado | `/alerts` | GET | consulta | Implementado backend | Tabla en interfaz con filtros por estado |
| Alertas confirmar | `/alerts/{id}/acknowledge` | POST | tecnico | Implementado backend | Estado pasa a `acknowledged` |
| Mantenimiento activos | `/maintenance/assets` | GET | consulta | Implementado base | Tabla de activos estable |
| Mantenimiento alta activo | `/maintenance/assets` | POST | tecnico | Implementado base | Alta válida con estados permitidos |

## Priorización diaria recomendada

1. Cerrar lo parcial del panel principal.
2. Completar interfaz de alertas (`/alerts` + acknowledge).
3. Endurecer formularios de inventario/movimientos (validaciones y mensajes).
4. Añadir pruebas E2E del flujo critico: inicio de sesion -> inventario -> movimiento -> notificacion.

## Lista rapida por tarea

- Contrato API actualizado en `docs/08-openapi-v1.yaml`.
- Validación backend (`php -l` / tests).
- Validación frontend (`npm run lint` y `npm run build`).
- Estado de la matriz actualizado.
