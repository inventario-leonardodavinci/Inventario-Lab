# Tareas semana — Inventario Salud Ambiental

> Periodo: 29 abril – 5 mayo 2026
> Estado de partida: infraestructura lista, backend funcional, frontend con datos hardcodeados y formularios incompletos.

---

## Día 1 — Lunes 29 abr · Panel principal real

- [x] Añadir endpoint `GET /v1/movimientos/resumen-hoy` que devuelva entradas y salidas del día actual
- [x] Conectar los KPIs "Entradas hoy" y "Salidas hoy" del `PanelPrincipal` a ese endpoint
- [x] Reemplazar el feed de actividad hardcodeado por los últimos 5 movimientos reales (`GET /v1/movimientos?per_page=5`)
- [x] Verificar que los KPIs de stock total y críticos ya usan datos reales (están parcialmente conectados)

---

## Día 2 — Martes 30 abr · Formularios con selectores reales

- [ ] Añadir endpoint `GET /v1/ubicaciones` que devuelva todas las ubicaciones
- [ ] Añadir endpoint `GET /v1/categorias` que devuelva todas las categorías
- [ ] En `Movimientos`: reemplazar los campos de texto de `item_id`, `source_location_id` y `target_location_id` por `<Select>` con datos de la API
- [ ] En `Inventario` (alta): reemplazar el campo `category_id` por `<Select>` con categorías reales
- [ ] Mostrar la columna "Ubicación" en la tabla de inventario (actualmente siempre muestra "-")

---

## Día 3 — Miércoles 1 may · Página de Alertas

- [ ] Crear página `Alertas.tsx` con tabla que consuma `GET /v1/alertas`
- [ ] Añadir filtro por estado (`open` / `acknowledged`)
- [ ] Implementar botón "Confirmar" que llame a `POST /v1/alertas/{id}/confirmar`
- [ ] Añadir la ruta `/alertas` en `App.tsx` y el enlace en `BarraLateralAplicacion`
- [ ] Mostrar badge con conteo de alertas abiertas en el menú lateral

---

## Día 4 — Jueves 2 may · Informes con datos reales

- [ ] Añadir endpoint `GET /v1/informes/resumen` que calcule: eventos hoy, ajustes manuales del mes, usuarios activos
- [ ] Conectar las 3 tarjetas de estadísticas de `Informes.tsx` a ese endpoint (actualmente muestran 64, 11, 9 hardcodeados)
- [ ] Implementar el filtrado por fecha en el log de auditoría (pasar `from` y `to` como query params al endpoint de notificaciones)
- [ ] Implementar el filtrado por módulo en el log de auditoría

---

## Día 5 — Viernes 3 may · Mantenimiento completo

- [ ] Añadir endpoints `GET /v1/mantenimiento/planes` y `POST /v1/mantenimiento/planes`
- [ ] Añadir endpoint `POST /v1/mantenimiento/activos/{id}/eventos` para registrar eventos de mantenimiento
- [ ] Ampliar la página `Mantenimiento.tsx` con una sección de planes y otra de historial de eventos por activo
- [ ] Mostrar el próximo mantenimiento programado por activo en la tabla

---

## Día 6 — Sábado 4 may · Notificaciones Novu + datos de prueba

- [ ] Crear workflow `stock-critico` en Novu (in-app) que se dispare cuando `status = critical`
- [ ] Disparar ese workflow desde el backend cuando un movimiento deja stock por debajo del mínimo
- [ ] Poblar la BD con datos de prueba realistas: categorías, ubicaciones, artículos, stock inicial
- [ ] Verificar que el `<Inbox />` muestra las notificaciones correctamente en el header

---

## Día 7 — Domingo 5 may · Calidad y cierre

- [ ] Ejecutar `npm run build` sin errores en el frontend
- [ ] Ejecutar `php artisan test` y corregir los tests que fallen
- [ ] Revisar todos los formularios: mensajes de error visibles, estados de carga, feedback de éxito
- [ ] Actualizar la matriz `docs/11-matriz-endpoints-pantallas.md` con el estado final
- [ ] Probar el flujo completo de extremo a extremo: login → inventario → movimiento → alerta → notificación Novu

---

## Resumen de endpoints nuevos necesarios

| Endpoint | Método | Descripción |
|---|---|---|
| `/v1/movimientos/resumen-hoy` | GET | Entradas y salidas del día |
| `/v1/ubicaciones` | GET | Lista de ubicaciones |
| `/v1/categorias` | GET | Lista de categorías |
| `/v1/informes/resumen` | GET | Estadísticas para la página de informes |
| `/v1/mantenimiento/planes` | GET / POST | Planes de mantenimiento |
| `/v1/mantenimiento/activos/{id}/eventos` | POST | Registrar evento de mantenimiento |

## Lo que ya funciona y no hay que tocar

- Autenticación y roles
- Listado e inventario con búsqueda y paginación
- Creación de movimientos con control de stock negativo
- Integración Novu workflow `user-login`
- Apache + PHP 8.3 sirviendo la API en puerto 8000
- BD PostgreSQL remota conectada

---

## Completado fuera del plan semanal

### Calidad y arquitectura

- [x] Corregir bug crítico: `MovimientoController::store` llamaba `createMovement()` (inexistente) en lugar de `crearMovimiento()`
- [x] Corregir bug crítico: `MovimientoService::aplicarDeltaStock` casteaba `null` a `0` silenciosamente — ahora lanza excepción con mensaje claro
- [x] Eliminar `source_location_id: 1` y `target_location_id: 1` hardcodeados en `Movimientos.tsx`
- [x] Eliminar `category_id: 1` hardcodeado en `Inventario.tsx` (botón de creación rápida eliminado)
- [x] Añadir `.catch()` en `Informes.tsx` para que un fallo de notificaciones no rompa la página
- [x] Reusar `RespuestaMovimientos["data"]` en lugar de tipo inline en `Movimientos.tsx`
- [x] Migrar todo el fetching de datos a **TanStack Query** (`@tanstack/react-query`):
  - `usePanelData`: reducer manual de 60 líneas → 20 líneas con query hooks
  - `Inventario.tsx`, `Movimientos.tsx`, `Mantenimiento.tsx`, `Informes.tsx`, `Perfil.tsx`
  - Caché automático, invalidación tras mutaciones, estados de loading/error integrados

### Autenticación

- [x] Implementar flujo completo de registro con verificación de email por código OTP (6 dígitos)
- [x] Implementar recuperación de contraseña por código OTP (2 pasos)
- [x] Añadir OAuth Google y Apple (aparecen dinámicamente según config de Insforge)
- [x] Consultar config real de Insforge (`/api/auth/public-config`) para adaptar la UI
- [x] Crear `UsuarioApp` automáticamente en el primer login OAuth (middleware `ResolverUsuarioApp`)
- [x] Sincronizar `display_name` real con el backend Laravel en cada login
- [x] Corregir extracción del nombre para usuarios OAuth (filtra emails, usa `full_name`/`name` de metadatos)

### Perfil de usuario

- [x] Dropdown de usuario en el header con avatar de iniciales, badge de rol, acceso a perfil y cerrar sesión
- [x] Footer de la barra lateral con nombre, rol y enlace a `/perfil`
- [x] Página `/perfil` con dos tabs: Información (editar nombre, actividad reciente) y Seguridad (cambio de contraseña)
- [x] Actualización de nombre en tiempo real sin recarga de página (`actualizarUsuario` en contexto)
- [x] Añadir `PATCH /v1/perfil` en el backend para actualizar `display_name`
- [x] Añadir `VITE_NOVU_APPLICATION_IDENTIFIER` al `.env` para corregir error 422 de Novu

### Tests

- [x] Tests PHPUnit para `resumen-hoy`: ejemplos + propiedad (50 iteraciones)
- [x] Tests fast-check para `traducirTipoMovimiento` y `formatearKpi` (100 iteraciones)
- [x] Tests de componente para `PanelPrincipal` con TanStack Query (18 tests en verde)
- [x] Corregir bug en `traducirTipoMovimiento`: `??` vulnerable a `__proto__` → `Object.hasOwn`
