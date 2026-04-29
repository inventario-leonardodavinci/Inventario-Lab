# Tareas semana — Inventario Salud Ambiental

> Periodo: 29 abril – 5 mayo 2026
> Estado de partida: infraestructura lista, backend funcional, frontend con datos hardcodeados y formularios incompletos.

---

## Día 1 — Lunes 29 abr · Panel principal real

- [ ] Añadir endpoint `GET /v1/movimientos/resumen-hoy` que devuelva entradas y salidas del día actual
- [ ] Conectar los KPIs "Entradas hoy" y "Salidas hoy" del `PanelPrincipal` a ese endpoint
- [ ] Reemplazar el feed de actividad hardcodeado por los últimos 5 movimientos reales (`GET /v1/movimientos?per_page=5`)
- [ ] Verificar que los KPIs de stock total y críticos ya usan datos reales (están parcialmente conectados)

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
